from tests.conftest import client


def test_incident_full_lifecycle():
    # -------------------------------------------------
    # Create organization + admin
    # -------------------------------------------------
    signup_response = client.post(
        "/auth/signup",
        json={
            "organization_name": "Lifecycle Test Organization",
            "organization_slug": "lifecycle-test-org",
            "admin_name": "Test Admin",
            "admin_email": "admin@test.com",
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
            "name": "Test Agent",
            "email": "agent@test.com",
            "password": "AgentPass123",
            "role": "agent"
        }
    )

    assert agent_response.status_code == 201

    agent = agent_response.json()

    # -------------------------------------------------
    # Agent login
    # -------------------------------------------------
    agent_login_response = client.post(
        "/auth/login",
        json={
            "email": "agent@test.com",
            "password": "AgentPass123"
        }
    )

    assert agent_login_response.status_code == 200

    agent_token = agent_login_response.json()["access_token"]

    # -------------------------------------------------
    # Create incident
    # -------------------------------------------------
    create_response = client.post(
        "/incidents",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "title": "Production API failure",
            "description": "Production API is currently unavailable.",
            "priority": "high",
            "category": "api"
        }
    )

    assert create_response.status_code == 201

    incident = create_response.json()

    assert incident["status"] == "open"

    incident_id = incident["id"]

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

    assigned_incident = assign_response.json()

    assert assigned_incident["assigned_to"] == agent["id"]
    assert assigned_incident["status"] == "assigned"

    # -------------------------------------------------
    # Invalid transition: assigned -> resolved
    # -------------------------------------------------
    invalid_response = client.patch(
        f"/incidents/{incident_id}/status",
        headers={
            "Authorization": f"Bearer {agent_token}"
        },
        json={
            "status": "resolved"
        }
    )

    assert invalid_response.status_code == 400

    # -------------------------------------------------
    # assigned -> in_progress
    # -------------------------------------------------
    progress_response = client.patch(
        f"/incidents/{incident_id}/status",
        headers={
            "Authorization": f"Bearer {agent_token}"
        },
        json={
            "status": "in_progress"
        }
    )

    assert progress_response.status_code == 200
    assert progress_response.json()["status"] == "in_progress"

    # -------------------------------------------------
    # in_progress -> resolved
    # -------------------------------------------------
    resolve_response = client.patch(
        f"/incidents/{incident_id}/status",
        headers={
            "Authorization": f"Bearer {agent_token}"
        },
        json={
            "status": "resolved"
        }
    )

    assert resolve_response.status_code == 200

    resolved_incident = resolve_response.json()

    assert resolved_incident["status"] == "resolved"
    assert resolved_incident["resolved_at"] is not None