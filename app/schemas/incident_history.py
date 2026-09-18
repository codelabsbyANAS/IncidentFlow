from datetime import datetime
from pydantic import BaseModel, ConfigDict


class IncidentHistoryResponse(BaseModel):
    id: int
    organization_id: int
    incident_id: int
    actor_id: int
    event_type: str
    old_value: str | None
    new_value: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)