from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles

from app.models.automation_rule import AutomationRule
from app.models.user import User

from app.schemas.automation_rule import (
    AutomationRuleCreate,
    AutomationRuleUpdate,
    AutomationRuleResponse,
)


router = APIRouter(
    prefix="/automation-rules",
    tags=["Automation Rules"],
)


# -------------------------------------------------
# HELPERS
# -------------------------------------------------

ALLOWED_PRIORITIES = {
    "low",
    "medium",
    "high",
    "critical",
}


def normalize_priority(priority):
    if priority is None:
        return None

    value = priority.strip().lower()

    if not value:
        return None

    if value not in ALLOWED_PRIORITIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Priority must be low, medium, high, "
                "critical, or empty."
            ),
        )

    return value


def normalize_category(category):
    if category is None:
        return None

    value = category.strip().lower()

    if not value:
        return None

    return value


def get_assignment_target(
    db: Session,
    organization_id: int,
    user_id: int,
):
    user = (
        db.query(User)
        .filter(
            User.id == user_id,
            User.organization_id == organization_id,
            User.is_active == True,
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment user not found.",
        )

    if user.role not in {
        "agent",
        "manager",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Automation rules can assign incidents "
                "only to active agents or managers."
            ),
        )

    return user


def duplicate_rule_exists(
    db: Session,
    organization_id: int,
    priority,
    category,
    exclude_rule_id=None,
):
    query = (
        db.query(AutomationRule)
        .filter(
            AutomationRule.organization_id
            == organization_id
        )
    )

    if priority is None:
        query = query.filter(
            AutomationRule.priority.is_(None)
        )
    else:
        query = query.filter(
            AutomationRule.priority == priority
        )

    if category is None:
        query = query.filter(
            AutomationRule.category.is_(None)
        )
    else:
        query = query.filter(
            AutomationRule.category == category
        )

    if exclude_rule_id is not None:
        query = query.filter(
            AutomationRule.id != exclude_rule_id
        )

    return query.first() is not None


# -------------------------------------------------
# CREATE RULE
# Admin / Manager
# -------------------------------------------------

@router.post(
    "",
    response_model=AutomationRuleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_automation_rule(
    rule_data: AutomationRuleCreate,
    current_user: User = Depends(
        require_roles("admin", "manager")
    ),
    db: Session = Depends(get_db),
):
    priority = normalize_priority(
        rule_data.priority
    )

    category = normalize_category(
        rule_data.category
    )

    get_assignment_target(
        db=db,
        organization_id=current_user.organization_id,
        user_id=rule_data.assign_to_user_id,
    )

    if duplicate_rule_exists(
        db=db,
        organization_id=current_user.organization_id,
        priority=priority,
        category=category,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "An automation rule already exists "
                "for this priority/category combination."
            ),
        )

    rule = AutomationRule(
        organization_id=current_user.organization_id,
        name=rule_data.name.strip(),
        priority=priority,
        category=category,
        assign_to_user_id=rule_data.assign_to_user_id,
        is_active=rule_data.is_active,
    )

    db.add(rule)
    db.commit()
    db.refresh(rule)

    return rule


# -------------------------------------------------
# LIST RULES
# Admin / Manager
# -------------------------------------------------

@router.get(
    "",
    response_model=list[AutomationRuleResponse],
)
def get_automation_rules(
    current_user: User = Depends(
        require_roles("admin", "manager")
    ),
    db: Session = Depends(get_db),
):
    return (
        db.query(AutomationRule)
        .filter(
            AutomationRule.organization_id
            == current_user.organization_id
        )
        .order_by(
            AutomationRule.is_active.desc(),
            AutomationRule.id.asc(),
        )
        .all()
    )


# -------------------------------------------------
# UPDATE RULE
# Admin / Manager
# -------------------------------------------------

@router.patch(
    "/{rule_id}",
    response_model=AutomationRuleResponse,
)
def update_automation_rule(
    rule_id: int,
    rule_data: AutomationRuleUpdate,
    current_user: User = Depends(
        require_roles("admin", "manager")
    ),
    db: Session = Depends(get_db),
):
    rule = (
        db.query(AutomationRule)
        .filter(
            AutomationRule.id == rule_id,
            AutomationRule.organization_id
            == current_user.organization_id,
        )
        .first()
    )

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found.",
        )

    priority = normalize_priority(
        rule_data.priority
    )

    category = normalize_category(
        rule_data.category
    )

    get_assignment_target(
        db=db,
        organization_id=current_user.organization_id,
        user_id=rule_data.assign_to_user_id,
    )

    if duplicate_rule_exists(
        db=db,
        organization_id=current_user.organization_id,
        priority=priority,
        category=category,
        exclude_rule_id=rule.id,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Another automation rule already "
                "uses this priority/category combination."
            ),
        )

    rule.name = rule_data.name.strip()
    rule.priority = priority
    rule.category = category
    rule.assign_to_user_id = (
        rule_data.assign_to_user_id
    )
    rule.is_active = rule_data.is_active

    db.commit()
    db.refresh(rule)

    return rule


# -------------------------------------------------
# DELETE RULE
# Admin / Manager
# -------------------------------------------------

@router.delete(
    "/{rule_id}",
)
def delete_automation_rule(
    rule_id: int,
    current_user: User = Depends(
        require_roles("admin", "manager")
    ),
    db: Session = Depends(get_db),
):
    rule = (
        db.query(AutomationRule)
        .filter(
            AutomationRule.id == rule_id,
            AutomationRule.organization_id
            == current_user.organization_id,
        )
        .first()
    )

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Automation rule not found.",
        )

    db.delete(rule)
    db.commit()

    return {
        "message": "Automation rule deleted successfully."
    }