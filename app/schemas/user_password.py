from pydantic import BaseModel, Field


class UserPasswordReset(BaseModel):
    new_password: str = Field(
        min_length=8,
        max_length=128
    )