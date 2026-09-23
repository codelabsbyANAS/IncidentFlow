from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles

from app.models.user import User
from app.models.incident import Incident
from app.models.sla_escalation import SLAEscalation

from app.schemas.dashboard import DashboardSummaryResponse
from app.schemas.dashboard_analytics import DashboardAnalyticsResponse


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# -------------------------------------------------
# HELPER
# -------------------------------------------------

def as_utc(value):
    if value is None:
        return None

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


# -------------------------------------------------
# EXISTING DASHBOARD SUMMARY
# -------------------------------------------------

@router.get(
    "/summary",
    response_model=DashboardSummaryResponse
)
def get_dashboard_summary(
    current_user: User = Depends(
        require_roles("agent", "manager", "admin")
    ),
    db: Session = Depends(get_db)
):
    organization_id = current_user.organization_id

    total_incidents = (
        db.query(Incident)
        .filter(
            Incident.organization_id == organization_id
        )
        .count()
    )

    open_incidents = (
        db.query(Incident)
        .filter(
            Incident.organization_id == organization_id,
            Incident.status == "open"
        )
        .count()
    )

    assigned_incidents = (
        db.query(Incident)
        .filter(
            Incident.organization_id == organization_id,
            Incident.status == "assigned"
        )
        .count()
    )

    in_progress_incidents = (
        db.query(Incident)
        .filter(
            Incident.organization_id == organization_id,
            Incident.status == "in_progress"
        )
        .count()
    )

    resolved_incidents = (
        db.query(Incident)
        .filter(
            Incident.organization_id == organization_id,
            Incident.status == "resolved"
        )
        .count()
    )

    closed_incidents = (
        db.query(Incident)
        .filter(
            Incident.organization_id == organization_id,
            Incident.status == "closed"
        )
        .count()
    )

    critical_incidents = (
        db.query(Incident)
        .filter(
            Incident.organization_id == organization_id,
            Incident.priority == "critical"
        )
        .count()
    )

    active_escalations = (
        db.query(SLAEscalation)
        .filter(
            SLAEscalation.organization_id == organization_id,
            SLAEscalation.is_active == True
        )
        .count()
    )

    return {
        "total_incidents": total_incidents,
        "open_incidents": open_incidents,
        "assigned_incidents": assigned_incidents,
        "in_progress_incidents": in_progress_incidents,
        "resolved_incidents": resolved_incidents,
        "closed_incidents": closed_incidents,
        "critical_incidents": critical_incidents,
        "active_escalations": active_escalations
    }


# -------------------------------------------------
# OPERATIONS ANALYTICS
# Admin / Manager only
# -------------------------------------------------

@router.get(
    "/analytics",
    response_model=DashboardAnalyticsResponse
)
def get_dashboard_analytics(
    current_user: User = Depends(
        require_roles("admin", "manager")
    ),
    db: Session = Depends(get_db)
):
    organization_id = current_user.organization_id
    now = datetime.now(timezone.utc)

    incidents = (
        db.query(Incident)
        .filter(
            Incident.organization_id == organization_id
        )
        .all()
    )

    # -------------------------------------------------
    # BASIC COUNTS
    # -------------------------------------------------

    total_incidents = len(incidents)

    active_statuses = {
        "open",
        "assigned",
        "in_progress"
    }

    active_incidents = sum(
        1
        for incident in incidents
        if incident.status in active_statuses
    )

    # -------------------------------------------------
    # STATUS BREAKDOWN
    # -------------------------------------------------

    status_counts = Counter(
        incident.status
        for incident in incidents
    )

    status_order = [
        "open",
        "assigned",
        "in_progress",
        "resolved",
        "closed"
    ]

    incidents_by_status = [
        {
            "label": status_name,
            "count": status_counts.get(status_name, 0)
        }
        for status_name in status_order
    ]

    # -------------------------------------------------
    # PRIORITY BREAKDOWN
    # -------------------------------------------------

    priority_counts = Counter(
        incident.priority
        for incident in incidents
    )

    priority_order = [
        "critical",
        "high",
        "medium",
        "low"
    ]

    incidents_by_priority = [
        {
            "label": priority_name,
            "count": priority_counts.get(priority_name, 0)
        }
        for priority_name in priority_order
    ]

    # -------------------------------------------------
    # CATEGORY BREAKDOWN
    # -------------------------------------------------

    category_counts = Counter(
        (
            incident.category.strip()
            if incident.category
            and incident.category.strip()
            else "uncategorized"
        )
        for incident in incidents
    )

    incidents_by_category = [
        {
            "label": category_name,
            "count": count
        }
        for category_name, count in sorted(
            category_counts.items(),
            key=lambda item: (
                -item[1],
                item[0].lower()
            )
        )
    ]

    # -------------------------------------------------
    # SLA ANALYTICS
    # -------------------------------------------------

    breached_incidents = 0
    completed_sla_incidents = 0
    compliant_sla_incidents = 0

    for incident in incidents:
        response_due = as_utc(
            incident.response_due_at
        )

        resolution_due = as_utc(
            incident.resolution_due_at
        )

        first_response = as_utc(
            incident.first_response_at
        )

        resolved_at = as_utc(
            incident.resolved_at
        )

        response_breached = False
        resolution_breached = False

        if response_due is not None:
            if first_response is None:
                response_breached = now > response_due
            else:
                response_breached = (
                    first_response > response_due
                )

        if resolution_due is not None:
            if resolved_at is None:
                resolution_breached = (
                    now > resolution_due
                )
            else:
                resolution_breached = (
                    resolved_at > resolution_due
                )

        if response_breached or resolution_breached:
            breached_incidents += 1

        # SLA compliance is measured on completed incidents.
        if (
            response_due is not None
            and resolution_due is not None
            and resolved_at is not None
        ):
            completed_sla_incidents += 1

            response_met = (
                first_response is not None
                and first_response <= response_due
            )

            resolution_met = (
                resolved_at <= resolution_due
            )

            if response_met and resolution_met:
                compliant_sla_incidents += 1

    if completed_sla_incidents > 0:
        sla_compliance_percentage = round(
            (
                compliant_sla_incidents
                / completed_sla_incidents
            )
            * 100,
            2
        )
    else:
        sla_compliance_percentage = 0.0

    # -------------------------------------------------
    # AVERAGE RESOLUTION TIME
    # -------------------------------------------------

    resolution_times = []

    for incident in incidents:
        created_at = as_utc(
            incident.created_at
        )

        resolved_at = as_utc(
            incident.resolved_at
        )

        if created_at and resolved_at:
            minutes = (
                resolved_at - created_at
            ).total_seconds() / 60

            if minutes >= 0:
                resolution_times.append(minutes)

    if resolution_times:
        average_resolution_minutes = round(
            sum(resolution_times)
            / len(resolution_times),
            2
        )
    else:
        average_resolution_minutes = None

    # -------------------------------------------------
    # STAFF WORKLOAD
    # -------------------------------------------------

    staff_users = (
        db.query(User)
        .filter(
            User.organization_id == organization_id,
            User.is_active == True,
            User.role.in_([
                "agent",
                "manager",
                "admin"
            ])
        )
        .all()
    )

    workload_counts = Counter(
        incident.assigned_to
        for incident in incidents
        if (
            incident.assigned_to is not None
            and incident.status in {
                "assigned",
                "in_progress"
            }
        )
    )

    agent_workload = [
        {
            "user_id": user.id,
            "name": user.name,
            "role": user.role,
            "active_incidents": workload_counts.get(
                user.id,
                0
            )
        }
        for user in sorted(
            staff_users,
            key=lambda user: (
                -workload_counts.get(user.id, 0),
                user.name.lower()
            )
        )
    ]

    # -------------------------------------------------
    # LAST 7 DAYS INCIDENT TREND
    # -------------------------------------------------

    today = now.date()
    start_date = today - timedelta(days=6)

    daily_counts = Counter()

    for incident in incidents:
        created_at = as_utc(
            incident.created_at
        )

        if created_at is None:
            continue

        created_date = created_at.date()

        if start_date <= created_date <= today:
            daily_counts[created_date] += 1

    daily_incidents = []

    for offset in range(7):
        current_date = start_date + timedelta(
            days=offset
        )

        daily_incidents.append(
            {
                "date": current_date.isoformat(),
                "count": daily_counts.get(
                    current_date,
                    0
                )
            }
        )

    # -------------------------------------------------
    # RESPONSE
    # -------------------------------------------------

    return {
        "total_incidents": total_incidents,
        "active_incidents": active_incidents,

        "sla_compliance_percentage":
            sla_compliance_percentage,

        "breached_incidents":
            breached_incidents,

        "average_resolution_minutes":
            average_resolution_minutes,

        "incidents_by_status":
            incidents_by_status,

        "incidents_by_priority":
            incidents_by_priority,

        "incidents_by_category":
            incidents_by_category,

        "agent_workload":
            agent_workload,

        "daily_incidents":
            daily_incidents
    }