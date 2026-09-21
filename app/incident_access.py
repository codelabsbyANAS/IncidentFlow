from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.user import User


def build_incident_query(
    db: Session,
    current_user: User
):
    """
    Base incident query for the current user.

    Staff:
        admin / manager / agent
        -> all incidents in their organization

    Customer:
        -> only incidents they created
    """

    query = (
        db.query(Incident)
        .filter(
            Incident.organization_id
            == current_user.organization_id
        )
    )

    if current_user.role == "customer":
        query = query.filter(
            Incident.created_by == current_user.id
        )

    return query


def get_accessible_incident(
    db: Session,
    current_user: User,
    incident_id: int
):
    """
    Return an incident only when the current user
    is allowed to access it.

    Returns 404 instead of 403 so customers cannot
    discover other users' incident IDs.
    """

    incident = (
        build_incident_query(
            db=db,
            current_user=current_user
        )
        .filter(
            Incident.id == incident_id
        )
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found."
        )

    return incident 