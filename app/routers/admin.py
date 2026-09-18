from fastapi import APIRouter, Depends

from app.dependencies import require_roles
from app.models.user import User


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/test")
def admin_test(
    current_user: User = Depends(
        require_roles("admin")
    )
):
    return {
        "message": "Welcome Admin",
        "user": current_user.name
    }