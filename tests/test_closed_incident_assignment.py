from tests.conftest import client


def test_closed_incident_cannot_be_reassigned():
    # -------------------------------------------------
    # Create organization + admin
    # -------------------------------------------------
    signup_response = client.post(
        "/auth/signup",
        json={
            "organization_name": "Closed Incident Company",
            "organization_slug": "closed-incident-company",
            "admin_name": "Closed Incident Admin",
            "admin_email": "closed-admin@test.com",
            "password": "AdminPass123"
        }
    )

    assert signup_response.status_code == 201

    admin_token = signup_response.json()["access_token"]

    # -------------------------------------------------
    # Create agent
    # -------------------------------------------------
    agent_response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "name": "Closed Incident Agent",
            "email": "closed-agent@test.com",
            "password": "AgentPass123",
            "role": "agent"
        }
    )

    assert agent_response.status_code == 201

    agent_id = agent_response.json()["id"]

    # -------------------------------------------------
    # Create incident
    # -------------------------------------------------
    incident_response = client.post(
        "/incidents",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "title": "Closed assignment test",
            "description": "This incident will be closed.",
            "priority": "medium",
            "category": "testing"
        }
    )

    assert incident_response.status_code == 201

    incident_id = incident_response.json()["id"]

    # -------------------------------------------------
    # Assign incident to agent
    # -------------------------------------------------
    assign_response = client.patch(
        f"/incidents/{incident_id}/assign",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "assigned_to": agent_id
        }
    )

    assert assign_response.status_code == 200
    assert assign_response.json()["status"] == "assigned"
    assert assign_response.json()["assigned_to"] == agent_id

    # -------------------------------------------------
    # Move through lifecycle
    # -------------------------------------------------
    in_progress_response = client.patch(
        f"/incidents/{incident_id}/status",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "status": "in_progress"
        }
    )

    assert in_progress_response.status_code == 200

    resolved_response = client.patch(
        f"/incidents/{incident_id}/status",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "status": "resolved"
        }
    )

    assert resolved_response.status_code == 200

    closed_response = client.patch(
        f"/incidents/{incident_id}/status",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "status": "closed"
        }
    )

    assert closed_response.status_code == 200
    assert closed_response.json()["status"] == "closed"

    # -------------------------------------------------
    # Closed incident must NOT be reassigned
    # -------------------------------------------------
    reassign_response = client.patch(
        f"/incidents/{incident_id}/assign",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "assigned_to": agent_id
        }
    )

    assert reassign_response.status_code == 400
    assert (
        reassign_response.json()["detail"]
        == "Cannot assign a closed incident."
    )

    # -------------------------------------------------
    # Incident must remain closed and assigned
    # to the original agent
    # -------------------------------------------------
    final_response = client.get(
        f"/incidents/{incident_id}",
        headers={
            "Authorization": f"Bearer {admin_token}"
        }
    )

    assert final_response.status_code == 200
    assert final_response.json()["status"] == "closed"
    assert final_response.json()["assigned_to"] == agent_id