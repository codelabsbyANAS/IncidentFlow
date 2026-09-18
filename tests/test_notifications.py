from tests.conftest import client


def login(email: str, password: str):
    response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def test_assignment_notification_privacy_and_read_status():
    # -------------------------------------------------
    # Create organization + admin
    # -------------------------------------------------
    signup_response = client.post(
        "/auth/signup",
        json={
            "organization_name": "Notification Test Organization",
            "organization_slug": "notification-test-org",
            "admin_name": "Notification Admin",
            "admin_email": "notification-admin@test.com",
            "password": "AdminPass123"
        }
    )

    assert signup_response.status_code == 201

    signup_data = signup_response.json()

    admin_token = signup_data["access_token"]

    # -------------------------------------------------
    # Admin creates agent
    # -------------------------------------------------
    agent_response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "name": "Notification Agent",
            "email": "notification-agent@test.com",
            "password": "AgentPass123",
            "role": "agent"
        }
    )

    assert agent_response.status_code == 201

    agent = agent_response.json()

    agent_token = login(
        "notification-agent@test.com",
        "AgentPass123"
    )

    # -------------------------------------------------
    # Admin creates another normal customer
    # -------------------------------------------------
    other_user_response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "name": "Other User",
            "email": "other-user@test.com",
            "password": "OtherPass123",
            "role": "customer"
        }
    )

    assert other_user_response.status_code == 201

    other_token = login(
        "other-user@test.com",
        "OtherPass123"
    )

    # -------------------------------------------------
    # Create incident
    # -------------------------------------------------
    create_response = client.post(
        "/incidents",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "title": "Notification test incident",
            "description": "Testing assignment notification behavior.",
            "priority": "medium",
            "category": "testing"
        }
    )

    assert create_response.status_code == 201

    incident_id = create_response.json()["id"]

    # -------------------------------------------------
    # Assign incident to agent
    # -------------------------------------------------
    assign_response = client.patch(
        f"/incidents/{incident_id}/assign",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "assigned_to": agent["id"]
        }
    )

    assert assign_response.status_code == 200

    # -------------------------------------------------
    # Agent should receive notification
    # -------------------------------------------------
    agent_notifications_response = client.get(
        "/notifications",
        headers={
            "Authorization": f"Bearer {agent_token}"
        }
    )

    assert agent_notifications_response.status_code == 200

    agent_notifications = agent_notifications_response.json()

    assert len(agent_notifications) == 1

    notification = agent_notifications[0]

    assert notification["user_id"] == agent["id"]
    assert notification["incident_id"] == incident_id
    assert notification["notification_type"] == "incident_assigned"
    assert notification["is_read"] is False
    assert notification["read_at"] is None

    notification_id = notification["id"]

    # -------------------------------------------------
    # Another user must not see agent notification
    # -------------------------------------------------
    other_notifications_response = client.get(
        "/notifications",
        headers={
            "Authorization": f"Bearer {other_token}"
        }
    )

    assert other_notifications_response.status_code == 200
    assert other_notifications_response.json() == []

    # -------------------------------------------------
    # Agent marks notification as read
    # -------------------------------------------------
    read_response = client.patch(
        f"/notifications/{notification_id}/read",
        headers={
            "Authorization": f"Bearer {agent_token}"
        }
    )

    assert read_response.status_code == 200

    read_notification = read_response.json()

    assert read_notification["is_read"] is True
    assert read_notification["read_at"] is not None