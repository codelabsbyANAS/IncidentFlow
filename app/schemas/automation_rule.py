from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AutomationRuleCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150
    )

    priority: str | None = None

    category: str | None = Field(
        default=None,
        max_length=100
    )

    assign_to_user_id: int

    is_active: bool = True


class AutomationRuleUpdate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150
    )

    priority: str | None = None

    category: str | None = Field(
        default=None,
        max_length=100
    )

    assign_to_user_id: int

    is_active: bool = True


class AutomationRuleResponse(BaseModel):
    id: int
    organization_id: int

    name: str

    priority: str | None
    category: str | None

    assign_to_user_id: int | None

    is_active: bool

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )