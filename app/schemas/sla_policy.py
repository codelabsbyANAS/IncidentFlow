from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class SLAPolicyCreate(BaseModel):
    priority: str = Field(min_length=2, max_length=20)
    response_minutes: int = Field(gt=0)
    resolution_minutes: int = Field(gt=0)


class SLAPolicyResponse(BaseModel):
    id: int
    organization_id: int
    priority: str
    response_minutes: int
    resolution_minutes: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)