from datetime import datetime, timezone

import pytest
from sqlalchemy import Boolean, DateTime, Integer, String

from app.dependencies import get_current_user
from app.main import app
from app.models.organization import Organization
from app.models.user import User

from tests.conftest import TestingSessionLocal, client


# -------------------------------------------------
# TEST DATA HELPERS
# -------------------------------------------------

def create_model(db, model, tag: str, **provided_values):
    """
    Create SQLAlchemy test rows without depending too heavily
    on optional model fields.
    """

    values = {}
    columns = {
        column.name: column
        for column in model.__table__.columns
    }

    # Only use provided values that actually exist
    # on the SQLAlchemy model.
    for key, value in provided_values.items():
        if key in columns:
            values[key] = value

    # Fill any remaining required fields.
    for column in model.__table__.columns:
        if column.name in values:
            continue

        if column.primary_key and column.autoincrement:
            continue

        if column.nullable:
            continue

        if column.default is not None:
            continue

        if column.server_default is not None:
            continue

        if isinstance(column.type, String):
            if "email" in column.name:
                values[column.name] = (
                    f"{tag}-{column.name}@example.com"
                )
            elif "password" in column.name:
                values[column.name] = "test-password-hash"
            else:
                values[column.name] = (
                    f"{column.name}-{tag}"
                )

        elif isinstance(column.type, Boolean):
            values[column.name] = True

        elif isinstance(column.type, DateTime):
            values[column.name] = datetime.now(
                timezone.utc
            )

        elif isinstance(column.type, Integer):
            values[column.name] = 1

    obj = model(**values)

    db.add(obj)
    db.flush()

    return obj


def create_organization(db, tag: str):
    return create_model(
        db,
        Organization,
        tag,
        name=f"Organization {tag}",
        slug=f"organization-{tag}",
        is_active=True
    )


def create_user(
    db,
    organization,
    tag: str,
    role: str
):
    return create_model(
        db,
        User,
        tag,
        organization_id=organization.id,
        name=f"{role.title()} {tag}",
        full_name=f"{role.title()} {tag}",
        email=f"{role}-{tag}@example.com",
        hashed_password="test-password-hash",
        password_hash="test-password-hash",
        role=role,
        is_active=True
    )


def authenticate_as(user):
    """
    Override authentication so the API behaves as if
    this user supplied a valid JWT.
    """

    app.dependency_overrides[get_current_user] = (
        lambda: user
    )


def rule_payload(
    assignee_id: int,
    priority="critical",
    category=None,
    name="Critical incident routing"
):
    return {
        "name": name,
        "priority": priority,
        "category": category,
        "assign_to_user_id": assignee_id,
        "is_active": True
    }


@pytest.fixture(autouse=True)
def cleanup_current_user_override():
    """
    Prevent one automation test's mocked user from
    leaking into another test.
    """

    yield

    app.dependency_overrides.pop(
        get_current_user,
        None
    )


# -------------------------------------------------
# ADMIN CAN CREATE AUTOMATION RULE
# -------------------------------------------------

def test_admin_can_create_automation_rule():
    db = TestingSessionLocal()

    try:
        organization = create_organization(
            db,
            "admin-create"
        )

        admin = create_user(
            db,
            organization,
            "admin-create",
            "admin"
        )

        agent = create_user(
            db,
            organization,
            "admin-create",
            "agent"
        )

        db.commit()

        authenticate_as(admin)

        response = client.post(
            "/automation-rules",
            json=rule_payload(agent.id)
        )

        assert response.status_code == 201

        data = response.json()

        assert data["name"] == (
            "Critical incident routing"
        )
        assert data["priority"] == "critical"
        assert data["assign_to_user_id"] == agent.id
        assert data["organization_id"] == organization.id
        assert data["is_active"] is True

    finally:
        db.close()


# -------------------------------------------------
# MANAGER CAN CREATE AUTOMATION RULE
# -------------------------------------------------

def test_manager_can_create_automation_rule():
    db = TestingSessionLocal()

    try:
        organization = create_organization(
            db,
            "manager-create"
        )

        manager = create_user(
            db,
            organization,
            "manager-create",
            "manager"
        )

        agent = create_user(
            db,
            organization,
            "manager-create",
            "agent"
        )

        db.commit()

        authenticate_as(manager)

        response = client.post(
            "/automation-rules",
            json=rule_payload(
                agent.id,
                priority="high",
                name="High priority routing"
            )
        )

        assert response.status_code == 201
        assert response.json()["priority"] == "high"

    finally:
        db.close()


# -------------------------------------------------
# AGENT / CUSTOMER CANNOT MANAGE RULES
# -------------------------------------------------

@pytest.mark.parametrize(
    "role",
    ["agent", "customer"]
)
def test_agent_and_customer_cannot_create_rules(
    role
):
    db = TestingSessionLocal()

    try:
        organization = create_organization(
            db,
            f"forbidden-{role}"
        )

        current_user = create_user(
            db,
            organization,
            f"current-{role}",
            role
        )

        agent = create_user(
            db,
            organization,
            f"target-{role}",
            "agent"
        )

        db.commit()

        authenticate_as(current_user)

        response = client.post(
            "/automation-rules",
            json=rule_payload(agent.id)
        )

        assert response.status_code == 403

    finally:
        db.close()


# -------------------------------------------------
# CROSS-TENANT ASSIGNMENT IS BLOCKED
# -------------------------------------------------

def test_rule_cannot_assign_user_from_other_tenant():
    db = TestingSessionLocal()

    try:
        organization_one = create_organization(
            db,
            "tenant-one"
        )

        organization_two = create_organization(
            db,
            "tenant-two"
        )

        admin = create_user(
            db,
            organization_one,
            "tenant-one-admin",
            "admin"
        )

        foreign_agent = create_user(
            db,
            organization_two,
            "tenant-two-agent",
            "agent"
        )

        db.commit()

        authenticate_as(admin)

        response = client.post(
            "/automation-rules",
            json=rule_payload(
                foreign_agent.id
            )
        )

        assert response.status_code in {
            400,
            404
        }

    finally:
        db.close()


# -------------------------------------------------
# DUPLICATE RULE COMBINATION IS BLOCKED
# -------------------------------------------------

def test_duplicate_rule_is_rejected():
    db = TestingSessionLocal()

    try:
        organization = create_organization(
            db,
            "duplicate"
        )

        admin = create_user(
            db,
            organization,
            "duplicate-admin",
            "admin"
        )

        agent = create_user(
            db,
            organization,
            "duplicate-agent",
            "agent"
        )

        db.commit()

        authenticate_as(admin)

        first_response = client.post(
            "/automation-rules",
            json=rule_payload(agent.id)
        )

        assert first_response.status_code == 201

        second_response = client.post(
            "/automation-rules",
            json=rule_payload(
                agent.id,
                priority="CRITICAL",
                name="Duplicate critical routing"
            )
        )

        assert second_response.status_code == 409

    finally:
        db.close()


# -------------------------------------------------
# CRITICAL INCIDENT IS AUTOMATICALLY ASSIGNED
# -------------------------------------------------

def test_critical_incident_is_automatically_assigned():
    db = TestingSessionLocal()

    try:
        organization = create_organization(
            db,
            "auto-assign"
        )

        admin = create_user(
            db,
            organization,
            "auto-admin",
            "admin"
        )

        agent = create_user(
            db,
            organization,
            "auto-agent",
            "agent"
        )

        db.commit()

        # -----------------------------
        # Create automation rule
        # -----------------------------

        authenticate_as(admin)

        rule_response = client.post(
            "/automation-rules",
            json=rule_payload(agent.id)
        )

        assert rule_response.status_code == 201

        # -----------------------------
        # Create critical incident
        # -----------------------------

        incident_response = client.post(
            "/incidents",
            json={
                "title": "Critical payment outage",
                "description": (
                    "Payment processing is unavailable."
                ),
                "priority": "critical",
                "category": "payments"
            }
        )

        assert incident_response.status_code == 201

        incident = incident_response.json()

        assert incident["status"] == "assigned"
        assert incident["assigned_to"] == agent.id

        incident_id = incident["id"]
        ticket_number = incident["ticket_number"]

        # -----------------------------
        # Verify audit history
        # -----------------------------

        history_response = client.get(
            f"/incidents/{incident_id}/history"
        )

        assert history_response.status_code == 200

        history = history_response.json()

        event_types = {
            item["event_type"]
            for item in history
        }

        assert "incident_created" in event_types
        assert "incident_assigned" in event_types
        assert "status_changed" in event_types

        # -----------------------------
        # Verify assignee notification
        # -----------------------------

        authenticate_as(agent)

        notifications_response = client.get(
            "/notifications"
        )

        assert notifications_response.status_code == 200

        notifications = notifications_response.json()

        automatic_assignment_notifications = [
            notification
            for notification in notifications
            if (
                notification.get(
                    "notification_type"
                )
                == "incident_assigned"
                and ticket_number
                in notification.get(
                    "message",
                    ""
                )
                and "automatically assigned"
                in notification.get(
                    "message",
                    ""
                ).lower()
            )
        ]

        assert len(
            automatic_assignment_notifications
        ) == 1

    finally:
        db.close()