from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User

from app.schemas.user import (
    AdminUserCreate,
    UserResponse
)

from app.schemas.user_directory import UserDirectoryResponse

from app.security import hash_password


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# -------------------------------------------------
# SAFE USER DIRECTORY
# Available to every authenticated tenant user
# Returns only id, name, and role
# -------------------------------------------------

@router.get(
    "/directory",
    response_model=list[UserDirectoryResponse]
)
def user_directory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    users = (
        db.query(User)
        .filter(
            User.organization_id == current_user.organization_id,
            User.is_active == True
        )
        .order_by(User.name.asc())
        .all()
    )

    return users


# -------------------------------------------------
# FULL USER LIST
# Admin / Manager only
# -------------------------------------------------

@router.get(
    "",
    response_model=list[UserResponse]
)
def list_users(
    current_user: User = Depends(
        require_roles("admin", "manager")
    ),
    db: Session = Depends(get_db)
):
    users = (
        db.query(User)
        .filter(
            User.organization_id == current_user.organization_id
        )
        .order_by(User.name.asc())
        .all()
    )

    return users


# -------------------------------------------------
# CREATE USER
# Admin only
# -------------------------------------------------

@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user_by_admin(
    user_data: AdminUserCreate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db)
):
    email = user_data.email.lower()

    existing_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists."
        )

    allowed_roles = {
        "customer",
        "agent",
        "manager"
    }

    role = user_data.role.lower()

    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be customer, agent, or manager."
        )

    new_user = User(
        organization_id=current_user.organization_id,
        name=user_data.name,
        email=email,
        password_hash=hash_password(user_data.password),
        role=role,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user