from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SLAEscalationResponse(BaseModel):
    id: int
    organization_id: int
    incident_id: int
    breach_type: str
    escalation_level: int
    reason: str
    is_active: bool
    created_at: datetime
    resolved_at: datetime | None

    model_config = ConfigDict(from_attributes=True)