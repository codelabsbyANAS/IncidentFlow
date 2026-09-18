from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import require_roles
from app.models.user import User

from app.database import get_db
from app.models.organization import Organization
from app.schemas.organization import (
    OrganizationUpdate,
    OrganizationResponse
)


router = APIRouter(
    prefix="/organizations",
    tags=["Organizations"]
)

# -------------------------------------------------
# GET ALL ORGANIZATIONS
# -------------------------------------------------

@router.get(
    "",
    response_model=list[OrganizationResponse]
)
def get_organizations(
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db)
):
    organizations = (
        db.query(Organization)
        .filter(
            Organization.id == current_user.organization_id
        )
        .all()
    )

    return organizations


# -------------------------------------------------
# GET ONE ORGANIZATION
# -------------------------------------------------

@router.get(
    "/{organization_id}",
    response_model=OrganizationResponse
)
def get_organization(
    organization_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db)
):
    organization = (
        db.query(Organization)
        .filter(
            Organization.id == organization_id,
            Organization.id == current_user.organization_id
        )
        .first()
    )

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found."
        )

    return organization


# -------------------------------------------------
# UPDATE ORGANIZATION
# -------------------------------------------------

@router.patch(
    "/{organization_id}",
    response_model=OrganizationResponse
)
def update_organization(
    organization_id: int,
    organization_update: OrganizationUpdate,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db)
):
    organization = (
        db.query(Organization)
        .filter(
            Organization.id == organization_id,
            Organization.id == current_user.organization_id
        )
        .first()
    )

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found."
        )

    update_data = organization_update.model_dump(
        exclude_unset=True
    )

    if "slug" in update_data:
        existing_slug = (
            db.query(Organization)
            .filter(
                Organization.slug == update_data["slug"],
                Organization.id != organization_id
            )
            .first()
        )

        if existing_slug:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An organization with this slug already exists."
            )

    for field, value in update_data.items():
        setattr(
            organization,
            field,
            value
        )

    db.commit()
    db.refresh(organization)

    return organization

# -------------------------------------------------
# DEACTIVATE ORGANIZATION
# -------------------------------------------------

@router.delete(
    "/{organization_id}",
    status_code=status.HTTP_200_OK
)
def deactivate_organization(
    organization_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db)
):
    organization = (
        db.query(Organization)
        .filter(
            Organization.id == organization_id,
            Organization.id == current_user.organization_id
        )
        .first()
    )

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found."
        )

    if not organization.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization is already inactive."
        )

    organization.is_active = False

    db.commit()
    db.refresh(organization)

    return {
        "message": "Organization deactivated successfully.",
        "organization_id": organization.id
    }