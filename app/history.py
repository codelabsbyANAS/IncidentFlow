from sqlalchemy.orm import Session

from app.models.incident_history import IncidentHistory


def record_incident_history(
    db: Session,
    organization_id: int,
    incident_id: int,
    actor_id: int,
    event_type: str,
    old_value: str | None = None,
    new_value: str | None = None
):
    history = IncidentHistory(
        organization_id=organization_id,
        incident_id=incident_id,
        actor_id=actor_id,
        event_type=event_type,
        old_value=old_value,
        new_value=new_value
    )

    db.add(history)

    return history