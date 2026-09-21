from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.incident_access import get_accessible_incident

from app.models.user import User
from app.models.incident_history import IncidentHistory

from app.schemas.incident_history import IncidentHistoryResponse


router = APIRouter(
    tags=["History"]
)


@router.get(
    "/incidents/{incident_id}/history",
    response_model=list[IncidentHistoryResponse]
)
def get_incident_history(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = get_accessible_incident(
        db=db,
        current_user=current_user,
        incident_id=incident_id
    )

    history = (
        db.query(IncidentHistory)
        .filter(
            IncidentHistory.incident_id == incident.id,
            IncidentHistory.organization_id
            == current_user.organization_id
        )
        .order_by(
            IncidentHistory.created_at.asc()
        )
        .all()
    )

    return history