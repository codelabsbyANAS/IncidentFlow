from datetime import datetime
from pydantic import BaseModel


class SLAStatusResponse(BaseModel):
    incident_id: int
    ticket_number: str
    priority: str
    sla_policy_id: int | None

    response_status: str
    resolution_status: str

    response_due_at: datetime | None
    resolution_due_at: datetime | None

    first_response_at: datetime | None
    resolved_at: datetime | None