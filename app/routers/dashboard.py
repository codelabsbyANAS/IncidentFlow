from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models.user import User
from app.models.incident import Incident
from app.models.sla_escalation import SLAEscalation
from app.schemas.dashboard import DashboardSummaryResponse


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


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