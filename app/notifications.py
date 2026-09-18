from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    organization_id: int,
    user_id: int,
    notification_type: str,
    message: str,
    incident_id: int | None = None
):
    notification = Notification(
        organization_id=organization_id,
        user_id=user_id,
        incident_id=incident_id,
        notification_type=notification_type,
        message=message
    )

    db.add(notification)

    return notification 