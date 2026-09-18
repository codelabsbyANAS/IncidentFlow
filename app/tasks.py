from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.incident import Incident
from app.sla import evaluate_sla_escalations


@celery_app.task(name="incidentflow.health_check")
def celery_health_check():
    return "Celery is working"

@celery_app.task(name="incidentflow.check_sla_breaches")
def check_sla_breaches():
    db = SessionLocal()

    try:
        incidents = (
            db.query(Incident)
            .filter(
                Incident.status.in_(
                    ["open", "assigned", "in_progress"]
                )
            )
            .all()
        )

        checked_count = 0
        created_count = 0

        for incident in incidents:
            created_escalations = evaluate_sla_escalations(
                db=db,
                incident=incident
            )

            checked_count += 1
            created_count += len(created_escalations)

        db.commit()

        return {
            "incidents_checked": checked_count,
            "escalations_created": created_count
        }

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()