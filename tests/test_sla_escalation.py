from tests.conftest import client


def test_user_cannot_access_other_organization_incident():
    # -------------------------------------------------
    # Create Organization A + its admin
    # -------------------------------------------------
    signup_a = client.post(
        "/auth/signup",
        json={
            "organization_name": "Organization A",
            "organization_slug": "organization-a",
            "admin_name": "Admin A",
            "admin_email": "admin-a@test.com",
            "password": "AdminPass123"
        }
    )

    assert signup_a.status_code == 201

    token_a = signup_a.json()["access_token"]

    # -------------------------------------------------
    # Create Organization B + its admin
    # -------------------------------------------------
    signup_b = client.post(
        "/auth/signup",
        json={
            "organization_name": "Organization B",
            "organization_slug": "organization-b",
            "admin_name": "Admin B",
            "admin_email": "admin-b@test.com",
            "password": "AdminPass123"
        }
    )

    assert signup_b.status_code == 201

    token_b = signup_b.json()["access_token"]

    # -------------------------------------------------
    # Organization A creates an incident
    # -------------------------------------------------
    create_response = client.post(
        "/incidents",
        headers={
            "Authorization": f"Bearer {token_a}"
        },
        json={
            "title": "Organization A private incident",
            "description": "This incident belongs only to Organization A.",
            "priority": "high",
            "category": "testing"
        }
    )

    assert create_response.status_code == 201

    incident_id = create_response.json()["id"]

    # -------------------------------------------------
    # Organization A can access its own incident
    # -------------------------------------------------
    owner_response = client.get(
        f"/incidents/{incident_id}",
        headers={
            "Authorization": f"Bearer {token_a}"
        }
    )

    assert owner_response.status_code == 200

    # -------------------------------------------------
    # Organization B must NOT access Organization A data
    # -------------------------------------------------
    other_tenant_response = client.get(
        f"/incidents/{incident_id}",
        headers={
            "Authorization": f"Bearer {token_b}"
        }
    )

    assert other_tenant_response.status_code == 404