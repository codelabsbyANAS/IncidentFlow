from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.history import record_incident_history

from app.models.user import User
from app.models.incident import Incident
from app.models.incident_comment import IncidentComment

from app.schemas.incident_comment import (
    IncidentCommentCreate,
    IncidentCommentResponse
)


router = APIRouter(
    tags=["Comments"]
)


@router.post(
    "/incidents/{incident_id}/comments",
    response_model=IncidentCommentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_incident_comment(
    incident_id: int,
    comment_data: IncidentCommentCreate,
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

    if comment_data.is_internal and current_user.role == "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customers cannot create internal notes."
        )

    comment = IncidentComment(
        organization_id=current_user.organization_id,
        incident_id=incident.id,
        author_id=current_user.id,
        body=comment_data.body,
        is_internal=comment_data.is_internal
    )

    db.add(comment)

    # Record first public response from support staff
    if (
        current_user.role in {"agent", "manager", "admin"}
        and not comment_data.is_internal
        and incident.first_response_at is None
    ):
        incident.first_response_at = datetime.now(timezone.utc)

        record_incident_history(
            db=db,
            organization_id=current_user.organization_id,
            incident_id=incident.id,
            actor_id=current_user.id,
            event_type="first_response",
            old_value=None,
            new_value=incident.first_response_at.isoformat()
        )

    db.commit()
    db.refresh(comment)

    return comment


@router.get(
    "/incidents/{incident_id}/comments",
    response_model=list[IncidentCommentResponse]
)
def get_incident_comments(
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

    query = (
        db.query(IncidentComment)
        .filter(
            IncidentComment.incident_id == incident.id,
            IncidentComment.organization_id == current_user.organization_id
        )
    )

    if current_user.role == "customer":
        query = query.filter(
            IncidentComment.is_internal == False
        )

    comments = (
        query
        .order_by(IncidentComment.created_at.asc())
        .all()
    )

    return comments