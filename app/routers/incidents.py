from datetime import datetime, timezone, timedelta

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status
)
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.incident_access import (
    build_incident_query,
    get_accessible_incident
)

from app.models.user import User
from app.models.incident import Incident
from app.models.sla_policy import SLAPolicy

from app.schemas.incident import (
    IncidentCreate,
    IncidentResponse,
    IncidentAssign,
    IncidentStatusUpdate
)

from app.history import record_incident_history
from app.notifications import create_notification
from app.sla import close_incident_escalations


router = APIRouter(
    tags=["Incidents"]
)


# -------------------------------------------------
# CREATE INCIDENT
# -------------------------------------------------

@router.post(
    "/incidents",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_incident(
    incident_data: IncidentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allowed_priorities = {
        "low",
        "medium",
        "high",
        "critical"
    }

    priority = incident_data.priority.lower()

    if priority not in allowed_priorities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Priority must be low, medium, high, or critical."
        )

    sla_policy = (
        db.query(SLAPolicy)
        .filter(
            SLAPolicy.organization_id == current_user.organization_id,
            SLAPolicy.priority == priority,
            SLAPolicy.is_active == True
        )
        .first()
    )

    incident = Incident(
        organization_id=current_user.organization_id,
        ticket_number="TEMP",
        title=incident_data.title,
        description=incident_data.description,
        priority=priority,
        status="open",
        category=incident_data.category,
        created_by=current_user.id,
        sla_policy_id=sla_policy.id if sla_policy else None
    )

    db.add(incident)
    db.flush()

    if sla_policy:
        incident.response_due_at = (
            incident.created_at
            + timedelta(minutes=sla_policy.response_minutes)
        )

        incident.resolution_due_at = (
            incident.created_at
            + timedelta(minutes=sla_policy.resolution_minutes)
        )

    incident.ticket_number = f"INC-{incident.id:06d}"

    record_incident_history(
        db=db,
        organization_id=current_user.organization_id,
        incident_id=incident.id,
        actor_id=current_user.id,
        event_type="incident_created",
        old_value=None,
        new_value=incident.ticket_number
    )

    db.commit()
    db.refresh(incident)

    return incident


# -------------------------------------------------
# LIST / SEARCH / FILTER INCIDENTS
# -------------------------------------------------

@router.get(
    "/incidents",
    response_model=list[IncidentResponse]
)
def get_incidents(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    status_filter: str | None = Query(
        default=None,
        alias="status"
    ),
    priority_filter: str | None = Query(
        default=None,
        alias="priority"
    ),
    search_filter: str | None = Query(
        default=None,
        alias="search"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = build_incident_query(
    db=db,
    current_user=current_user
    )

    if status_filter:
        incident_status = status_filter.lower()

        allowed_statuses = {
            "open",
            "assigned",
            "in_progress",
            "resolved",
            "closed"
        }

        if incident_status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Status must be open, assigned, "
                    "in_progress, resolved, or closed."
                )
            )

        query = query.filter(
            Incident.status == incident_status
        )

    if priority_filter:
        priority = priority_filter.lower()

        allowed_priorities = {
            "low",
            "medium",
            "high",
            "critical"
        }

        if priority not in allowed_priorities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Priority must be low, medium, "
                    "high, or critical."
                )
            )

        query = query.filter(
            Incident.priority == priority
        )

    if search_filter:
        search_term = search_filter.strip()

        if search_term:
            pattern = f"%{search_term}%"

            query = query.filter(
                or_(
                    Incident.ticket_number.ilike(pattern),
                    Incident.title.ilike(pattern),
                    Incident.category.ilike(pattern)
                )
            )

    incidents = (
        query
        .order_by(Incident.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return incidents


# -------------------------------------------------
# GET ONE INCIDENT
# -------------------------------------------------

@router.get(
    "/incidents/{incident_id}",
    response_model=IncidentResponse
)
def get_incident(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = get_accessible_incident(
        db=db,
        current_user=current_user,
        incident_id=incident_id
    )

    return incident

# -------------------------------------------------
# ASSIGN INCIDENT
# -------------------------------------------------

@router.patch(
    "/incidents/{incident_id}/assign",
    response_model=IncidentResponse
)
def assign_incident(
    incident_id: int,
    assignment: IncidentAssign,
    current_user: User = Depends(
        require_roles("admin", "manager")
    ),
    db: Session = Depends(get_db)
):
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id,
            Incident.organization_id == current_user.organization_id
        )
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found."
        )

    assignee = (
        db.query(User)
        .filter(
            User.id == assignment.assigned_to,
            User.organization_id == current_user.organization_id
        )
        .first()
    )

    if not assignee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignee not found."
        )

    if not assignee.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign incident to an inactive user."
        )

    if assignee.role not in {
        "agent",
        "manager",
        "admin"
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Incident can only be assigned to an "
                "agent, manager, or admin."
            )
        )

    old_assigned_to = incident.assigned_to
    old_status = incident.status

    incident.assigned_to = assignee.id

    record_incident_history(
        db=db,
        organization_id=current_user.organization_id,
        incident_id=incident.id,
        actor_id=current_user.id,
        event_type="incident_assigned",
        old_value=(
            str(old_assigned_to)
            if old_assigned_to
            else None
        ),
        new_value=str(assignee.id)
    )

    if incident.status == "open":
        incident.status = "assigned"

        record_incident_history(
            db=db,
            organization_id=current_user.organization_id,
            incident_id=incident.id,
            actor_id=current_user.id,
            event_type="status_changed",
            old_value=old_status,
            new_value="assigned"
        )

    if old_assigned_to != assignee.id:
        create_notification(
            db=db,
            organization_id=current_user.organization_id,
            user_id=assignee.id,
            incident_id=incident.id,
            notification_type="incident_assigned",
            message=(
                f"{incident.ticket_number} "
                "has been assigned to you."
            )
        )

    db.commit()
    db.refresh(incident)

    return incident


# -------------------------------------------------
# UPDATE INCIDENT STATUS
# -------------------------------------------------

@router.patch(
    "/incidents/{incident_id}/status",
    response_model=IncidentResponse
)
def update_incident_status(
    incident_id: int,
    status_update: IncidentStatusUpdate,
    current_user: User = Depends(
        require_roles("agent", "manager", "admin")
    ),
    db: Session = Depends(get_db)
):
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id,
            Incident.organization_id == current_user.organization_id
        )
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found."
        )

    # Agents can only update incidents assigned to themselves
    if (
        current_user.role == "agent"
        and incident.assigned_to != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update incidents assigned to you."
        )

    new_status = status_update.status.lower()

    allowed_transitions = {
        "assigned": {"in_progress"},
        "in_progress": {"resolved"},
        "resolved": {"closed"}
    }

    allowed_next_statuses = allowed_transitions.get(
        incident.status,
        set()
    )

    if new_status not in allowed_next_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot change status from "
                f"'{incident.status}' to '{new_status}'."
            )
        )

    old_status = incident.status

    incident.status = new_status

    record_incident_history(
        db=db,
        organization_id=current_user.organization_id,
        incident_id=incident.id,
        actor_id=current_user.id,
        event_type="status_changed",
        old_value=old_status,
        new_value=new_status
    )

    if new_status == "resolved":
        incident.resolved_at = datetime.now(timezone.utc)

    if new_status in {"resolved", "closed"}:
        close_incident_escalations(
            db=db,
            incident=incident
        )

    db.commit()
    db.refresh(incident)

    return incident