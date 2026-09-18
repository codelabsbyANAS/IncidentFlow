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


def test_internal_comment_privacy():
    # Create organization + admin
    signup_response = client.post(
        "/auth/signup",
        json={
            "organization_name": "Comment Test Organization",
            "organization_slug": "comment-test-org",
            "admin_name": "Comment Admin",
            "admin_email": "comment-admin@test.com",
            "password": "AdminPass123"
        }
    )

    assert signup_response.status_code == 201

    admin_token = signup_response.json()["access_token"]

    # Admin creates agent
    agent_response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "name": "Comment Agent",
            "email": "comment-agent@test.com",
            "password": "AgentPass123",
            "role": "agent"
        }
    )

    assert agent_response.status_code == 201

    agent = agent_response.json()

    agent_token = login(
        "comment-agent@test.com",
        "AgentPass123"
    )

    # Admin creates customer
    customer_response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "name": "Comment Customer",
            "email": "comment-customer@test.com",
            "password": "CustomerPass123",
            "role": "customer"
        }
    )

    assert customer_response.status_code == 201

    customer_token = login(
        "comment-customer@test.com",
        "CustomerPass123"
    )

    # Create incident
    incident_response = client.post(
        "/incidents",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "title": "Comment privacy test",
            "description": "Testing public comments and internal notes.",
            "priority": "medium",
            "category": "testing"
        }
    )

    assert incident_response.status_code == 201

    incident_id = incident_response.json()["id"]

    # Assign to agent
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

    # Agent creates public comment
    public_response = client.post(
        f"/incidents/{incident_id}/comments",
        headers={
            "Authorization": f"Bearer {agent_token}"
        },
        json={
            "body": "Public support response.",
            "is_internal": False
        }
    )

    assert public_response.status_code == 201

    # Agent creates internal note
    internal_response = client.post(
        f"/incidents/{incident_id}/comments",
        headers={
            "Authorization": f"Bearer {agent_token}"
        },
        json={
            "body": "Internal diagnostic note.",
            "is_internal": True
        }
    )

    assert internal_response.status_code == 201

    # Customer must only see public comment
    customer_comments_response = client.get(
        f"/incidents/{incident_id}/comments",
        headers={
            "Authorization": f"Bearer {customer_token}"
        }
    )

    assert customer_comments_response.status_code == 200

    customer_comments = customer_comments_response.json()

    assert len(customer_comments) == 1
    assert customer_comments[0]["body"] == "Public support response."
    assert customer_comments[0]["is_internal"] is False

    # Customer must not be able to create internal note
    forbidden_response = client.post(
        f"/incidents/{incident_id}/comments",
        headers={
            "Authorization": f"Bearer {customer_token}"
        },
        json={
            "body": "Customer trying internal note.",
            "is_internal": True
        }
    )

    assert forbidden_response.status_code == 403