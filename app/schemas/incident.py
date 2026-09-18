from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class IncidentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=5)
    priority: str = Field(default="medium")
    category: str | None = Field(default=None, max_length=100)


class IncidentResponse(BaseModel):
    id: int
    organization_id: int
    ticket_number: str
    title: str
    description: str
    priority: str
    status: str
    category: str | None
    created_by: int
    assigned_to: int | None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None
    sla_policy_id: int | None
    response_due_at: datetime | None
    resolution_due_at: datetime | None
    first_response_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
    
class IncidentAssign(BaseModel):
    assigned_to: int
    
class IncidentStatusUpdate(BaseModel):
    status: str