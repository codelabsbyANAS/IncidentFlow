from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles

from app.models.user import User
from app.models.incident import Incident
from app.models.sla_policy import SLAPolicy
from app.models.sla_escalation import SLAEscalation

from app.schemas.sla_policy import (
    SLAPolicyCreate,
    SLAPolicyResponse
)
from app.schemas.sla_status import SLAStatusResponse
from app.schemas.sla_escalation import SLAEscalationResponse

from app.sla import evaluate_sla_escalations


router = APIRouter(
    tags=["SLA"]
)


# -------------------------------------------------
# CREATE SLA POLICY
# -------------------------------------------------

@router.post(
    "/sla-policies",
    response_model=SLAPolicyResponse,
    status_code=status.HTTP_201_CREATED
)
def create_sla_policy(
    policy_data: SLAPolicyCreate,
    current_user: User = Depends(
        require_roles("admin", "manager")
    ),
    db: Session = Depends(get_db)
):
    priority = policy_data.priority.lower()

    allowed_priorities = {
        "low",
        "medium",
        "high",
        "critical"
    }

    if priority not in allowed_priorities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Priority must be low, medium, high, or critical."
        )

    if policy_data.resolution_minutes < policy_data.response_minutes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolution time cannot be shorter than response time."
        )

    existing_policy = (
        db.query(SLAPolicy)
        .filter(
            SLAPolicy.organization_id == current_user.organization_id,
            SLAPolicy.priority == priority
        )
        .first()
    )

    if existing_policy:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An SLA policy already exists for this priority."
        )

    policy = SLAPolicy(
        organization_id=current_user.organization_id,
        priority=priority,
        response_minutes=policy_data.response_minutes,
        resolution_minutes=policy_data.resolution_minutes
    )

    db.add(policy)
    db.commit()
    db.refresh(policy)

    return policy


# -------------------------------------------------
# GET SLA POLICIES
# -------------------------------------------------

@router.get(
    "/sla-policies",
    response_model=list[SLAPolicyResponse]
)
def get_sla_policies(
    current_user: User = Depends(
        require_roles("admin", "manager")
    ),
    db: Session = Depends(get_db)
):
    policies = (
        db.query(SLAPolicy)
        .filter(
            SLAPolicy.organization_id == current_user.organization_id
        )
        .order_by(SLAPolicy.priority.asc())
        .all()
    )

    return policies


# -------------------------------------------------
# UPDATE SLA POLICY
# -------------------------------------------------

@router.patch(
    "/sla-policies/{policy_id}",
    response_model=SLAPolicyResponse
)
def update_sla_policy(
    policy_id: int,
    policy_data: SLAPolicyCreate,
    current_user: User = Depends(
        require_roles("admin", "manager")
    ),
    db: Session = Depends(get_db)
):
    policy = (
        db.query(SLAPolicy)
        .filter(
            SLAPolicy.id == policy_id,
            SLAPolicy.organization_id == current_user.organization_id
        )
        .first()
    )

    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SLA policy not found."
        )

    priority = policy_data.priority.lower()

    allowed_priorities = {
        "low",
        "medium",
        "high",
        "critical"
    }

    if priority not in allowed_priorities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Priority must be low, medium, high, or critical."
        )

    if policy_data.resolution_minutes < policy_data.response_minutes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resolution time cannot be shorter than response time."
        )

    duplicate_policy = (
        db.query(SLAPolicy)
        .filter(
            SLAPolicy.organization_id == current_user.organization_id,
            SLAPolicy.priority == priority,
            SLAPolicy.id != policy.id
        )
        .first()
    )

    if duplicate_policy:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An SLA policy already exists for this priority."
        )

    policy.priority = priority
    policy.response_minutes = policy_data.response_minutes
    policy.resolution_minutes = policy_data.resolution_minutes

    db.commit()
    db.refresh(policy)

    return policy


# -------------------------------------------------
# INCIDENT SLA STATUS
# -------------------------------------------------

@router.get(
    "/incidents/{incident_id}/sla-status",
    response_model=SLAStatusResponse
)
def get_incident_sla_status(
    incident_id: int,
    current_user: User = Depends(get_current_user),
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

    if (
        incident.sla_policy_id is None
        or incident.response_due_at is None
        or incident.resolution_due_at is None
    ):
        return {
            "incident_id": incident.id,
            "ticket_number": incident.ticket_number,
            "priority": incident.priority,
            "sla_policy_id": incident.sla_policy_id,
            "response_status": "not_configured",
            "resolution_status": "not_configured",
            "response_due_at": incident.response_due_at,
            "resolution_due_at": incident.resolution_due_at,
            "first_response_at": incident.first_response_at,
            "resolved_at": incident.resolved_at
        }

    now = datetime.now(timezone.utc)

    # Response SLA
    if incident.first_response_at:
        if incident.first_response_at <= incident.response_due_at:
            response_status = "met"
        else:
            response_status = "breached"
    else:
        if now <= incident.response_due_at:
            response_status = "pending"
        else:
            response_status = "breached"

    # Resolution SLA
    if incident.resolved_at:
        if incident.resolved_at <= incident.resolution_due_at:
            resolution_status = "met"
        else:
            resolution_status = "breached"
    else:
        if now <= incident.resolution_due_at:
            resolution_status = "pending"
        else:
            resolution_status = "breached"

    return {
        "incident_id": incident.id,
        "ticket_number": incident.ticket_number,
        "priority": incident.priority,
        "sla_policy_id": incident.sla_policy_id,
        "response_status": response_status,
        "resolution_status": resolution_status,
        "response_due_at": incident.response_due_at,
        "resolution_due_at": incident.resolution_due_at,
        "first_response_at": incident.first_response_at,
        "resolved_at": incident.resolved_at
    }


# -------------------------------------------------
# EVALUATE SLA ESCALATIONS
# -------------------------------------------------

@router.post(
    "/incidents/{incident_id}/evaluate-escalations",
    response_model=list[SLAEscalationResponse]
)
def evaluate_incident_escalations(
    incident_id: int,
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

    evaluate_sla_escalations(
        db=db,
        incident=incident
    )

    db.commit()

    escalations = (
        db.query(SLAEscalation)
        .filter(
            SLAEscalation.incident_id == incident.id,
            SLAEscalation.organization_id == current_user.organization_id
        )
        .order_by(SLAEscalation.escalation_level.asc())
        .all()
    )

    return escalations


# -------------------------------------------------
# GET INCIDENT ESCALATIONS
# -------------------------------------------------

@router.get(
    "/incidents/{incident_id}/escalations",
    response_model=list[SLAEscalationResponse]
)
def get_incident_escalations(
    incident_id: int,
    current_user: User = Depends(get_current_user),
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

    escalations = (
        db.query(SLAEscalation)
        .filter(
            SLAEscalation.incident_id == incident.id,
            SLAEscalation.organization_id == current_user.organization_id
        )
        .order_by(SLAEscalation.escalation_level.asc())
        .all()
    )

    return escalations