from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.signup import TenantSignupRequest

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.organization import Organization
from app.schemas.auth import LoginRequest, LoginResponse
from app.schemas.user import UserResponse
from app.security import (
    verify_password,
    create_access_token,
    hash_password
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post(
    "/signup",
    response_model=LoginResponse,
    status_code=status.HTTP_201_CREATED
)
def signup(
    signup_data: TenantSignupRequest,
    db: Session = Depends(get_db)
):
    slug = signup_data.organization_slug.strip().lower()
    email = signup_data.admin_email.lower()

    # Organization slug must be unique
    existing_organization = (
        db.query(Organization)
        .filter(
            Organization.slug == slug
        )
        .first()
    )

    if existing_organization:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An organization with this slug already exists."
        )

    # Admin email must be unique
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

    # Create new organization
    organization = Organization(
        name=signup_data.organization_name,
        slug=slug,
        is_active=True
    )

    db.add(organization)
    db.flush()

    # First user automatically becomes the organization's admin
    admin_user = User(
        organization_id=organization.id,
        name=signup_data.admin_name,
        email=email,
        password_hash=hash_password(signup_data.password),
        role="admin",
        is_active=True
    )

    db.add(admin_user)

    db.commit()
    db.refresh(admin_user)

    access_token = create_access_token(
        user_id=admin_user.id,
        organization_id=admin_user.organization_id,
        role=admin_user.role
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": admin_user.id,
        "name": admin_user.name,
        "role": admin_user.role,
        "organization_id": admin_user.organization_id
    }

@router.post(
    "/login",
    response_model=LoginResponse
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    normalized_email = login_data.email.lower()

    user = (
        db.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    if not user or not verify_password(
        login_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive."
        )

    organization = (
        db.query(Organization)
        .filter(
            Organization.id == user.organization_id
        )
        .first()
    )

    if not organization or not organization.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization is inactive."
        )

    access_token = create_access_token(
        user_id=user.id,
        organization_id=user.organization_id,
        role=user.role
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "role": user.role,
        "organization_id": user.organization_id
    }


@router.get(
    "/me",
    response_model=UserResponse
)
def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user