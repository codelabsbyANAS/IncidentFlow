from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.user import User
from app.notifications import create_notification

from app.models.incident import Incident
from app.models.sla_escalation import SLAEscalation

def notify_sla_breach(
    db: Session,
    incident: Incident,
    breach_type: str
):
    recipients = (
        db.query(User)
        .filter(
            User.organization_id == incident.organization_id,
            User.role.in_(["admin", "manager"]),
            User.is_active == True
        )
        .all()
    )

    for user in recipients:
        create_notification(
            db=db,
            organization_id=incident.organization_id,
            user_id=user.id,
            incident_id=incident.id,
            notification_type="sla_escalation",
            message=(
                f"{incident.ticket_number} breached its "
                f"{breach_type} SLA."
            )
        )

def close_incident_escalations(
    db: Session,
    incident: Incident
):
    now = datetime.now(timezone.utc)

    active_escalations = (
        db.query(SLAEscalation)
        .filter(
            SLAEscalation.organization_id == incident.organization_id,
            SLAEscalation.incident_id == incident.id,
            SLAEscalation.is_active == True
        )
        .all()
    )

    for escalation in active_escalations:
        escalation.is_active = False
        escalation.resolved_at = now

    return len(active_escalations)

def evaluate_sla_escalations(
    db: Session,
    incident: Incident
):
    now = datetime.now(timezone.utc)
    created_escalations = []

    # -------------------------
    # Response SLA breach
    # -------------------------
    response_breached = False

    if incident.response_due_at:
        if incident.first_response_at:
            response_breached = (
                incident.first_response_at
                > incident.response_due_at
            )
        else:
            response_breached = (
                now > incident.response_due_at
            )

    if response_breached:
        existing = (
            db.query(SLAEscalation)
            .filter(
                SLAEscalation.incident_id == incident.id,
                SLAEscalation.breach_type == "response",
                SLAEscalation.escalation_level == 1
            )
            .first()
        )

        if not existing:
            escalation = SLAEscalation(
                organization_id=incident.organization_id,
                incident_id=incident.id,
                breach_type="response",
                escalation_level=1,
                reason="Response SLA breached."
            )

            db.add(escalation)

            notify_sla_breach(
                db=db,
                incident=incident,
                breach_type="response"
            )

            created_escalations.append(escalation)

    # -------------------------
    # Resolution SLA breach
    # -------------------------
    resolution_breached = False

    if incident.resolution_due_at:
        if incident.resolved_at:
            resolution_breached = (
                incident.resolved_at
                > incident.resolution_due_at
            )
        else:
            resolution_breached = (
                now > incident.resolution_due_at
            )

    if resolution_breached:
        existing = (
            db.query(SLAEscalation)
            .filter(
                SLAEscalation.incident_id == incident.id,
                SLAEscalation.breach_type == "resolution",
                SLAEscalation.escalation_level == 2
            )
            .first()
        )

        if not existing:
            escalation = SLAEscalation(
                organization_id=incident.organization_id,
                incident_id=incident.id,
                breach_type="resolution",
                escalation_level=2,
                reason="Resolution SLA breached."
            )

            db.add(escalation)

            notify_sla_breach(
                db=db,
                incident=incident,
                breach_type="resolution"
            )

            created_escalations.append(escalation)

    

        # Close active escalations when incident is finished
        if incident.status in {"resolved", "closed"}:
            db.flush()

            close_incident_escalations(
               db=db,
               incident=incident
        )

    return created_escalations