from sqlalchemy.orm import Session

from app.models.automation_rule import AutomationRule
from app.models.incident import Incident
from app.models.user import User


def find_matching_automation_rule(
    db: Session,
    incident: Incident,
):
    """
    Find the most specific active automation rule
    for an incident.

    Priority:
    1. priority + category rule
    2. category-only rule
    3. priority-only rule
    4. catch-all rule

    Returns:
        (rule, assignee)

    If nothing valid matches:
        (None, None)
    """

    incident_priority = (
        incident.priority.strip().lower()
        if incident.priority
        else ""
    )

    incident_category = (
        incident.category.strip().lower()
        if incident.category
        else ""
    )

    rules = (
        db.query(AutomationRule)
        .filter(
            AutomationRule.organization_id
            == incident.organization_id,
            AutomationRule.is_active == True,
        )
        .all()
    )

    candidates = []

    for rule in rules:
        rule_priority = (
            rule.priority.strip().lower()
            if rule.priority
            else None
        )

        rule_category = (
            rule.category.strip().lower()
            if rule.category
            else None
        )

        # Priority condition does not match
        if (
            rule_priority is not None
            and rule_priority != incident_priority
        ):
            continue

        # Category condition does not match
        if (
            rule_category is not None
            and rule_category != incident_category
        ):
            continue

        # Make sure the configured assignee is
        # still valid at execution time.
        assignee = (
            db.query(User)
            .filter(
                User.id
                == rule.assign_to_user_id,
                User.organization_id
                == incident.organization_id,
                User.is_active == True,
                User.role.in_([
                    "agent",
                    "manager",
                ]),
            )
            .first()
        )

        if not assignee:
            continue

        # More specific rules win.
        #
        # priority + category = 3
        # category only       = 2
        # priority only       = 1
        # catch all           = 0
        specificity = 0

        if rule_priority is not None:
            specificity += 1

        if rule_category is not None:
            specificity += 2

        candidates.append(
            (
                specificity,
                rule.id,
                rule,
                assignee,
            )
        )

    if not candidates:
        return None, None

    # Highest specificity first.
    # If equal, oldest/lower rule ID wins.
    candidates.sort(
        key=lambda item: (
            -item[0],
            item[1],
        )
    )

    _, _, selected_rule, selected_assignee = (
        candidates[0]
    )

    return selected_rule, selected_assignee