from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class IncidentCommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)
    is_internal: bool = False


class IncidentCommentResponse(BaseModel):
    id: int
    organization_id: int
    incident_id: int
    author_id: int
    body: str
    is_internal: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)