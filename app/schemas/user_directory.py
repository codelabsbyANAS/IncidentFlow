from pydantic import BaseModel


class UserDirectoryResponse(BaseModel):
    id: int
    name: str
    role: str

    model_config = {
        "from_attributes": True
    }