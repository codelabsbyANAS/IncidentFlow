from tests.conftest import client


def test_user_cannot_access_other_organization_incident():
    # -------------------------------------------------
    # Create Organization A + first admin
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
    # Create Organization B + first admin
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


def test_customer_can_only_access_own_incidents():
    # -------------------------------------------------
    # Create organization + admin
    # -------------------------------------------------
    signup_response = client.post(
        "/auth/signup",
        json={
            "organization_name": "Customer Isolation Company",
            "organization_slug": "customer-isolation-company",
            "admin_name": "Isolation Admin",
            "admin_email": "isolation-admin@test.com",
            "password": "AdminPass123"
        }
    )

    assert signup_response.status_code == 201

    admin_token = signup_response.json()["access_token"]

    # -------------------------------------------------
    # Admin creates Customer A
    # -------------------------------------------------
    customer_a_response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "name": "Customer A",
            "email": "customer-a@test.com",
            "password": "CustomerPass123",
            "role": "customer"
        }
    )

    assert customer_a_response.status_code == 201

    # -------------------------------------------------
    # Admin creates Customer B
    # -------------------------------------------------
    customer_b_response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "name": "Customer B",
            "email": "customer-b@test.com",
            "password": "CustomerPass123",
            "role": "customer"
        }
    )

    assert customer_b_response.status_code == 201

    # -------------------------------------------------
    # Customer A logs in
    # -------------------------------------------------
    login_a = client.post(
        "/auth/login",
        json={
            "email": "customer-a@test.com",
            "password": "CustomerPass123"
        }
    )

    assert login_a.status_code == 200

    customer_a_token = login_a.json()["access_token"]

    # -------------------------------------------------
    # Customer B logs in
    # -------------------------------------------------
    login_b = client.post(
        "/auth/login",
        json={
            "email": "customer-b@test.com",
            "password": "CustomerPass123"
        }
    )

    assert login_b.status_code == 200

    customer_b_token = login_b.json()["access_token"]

    # -------------------------------------------------
    # Customer A creates their own incident
    # -------------------------------------------------
    incident_a_response = client.post(
        "/incidents",
        headers={
            "Authorization": f"Bearer {customer_a_token}"
        },
        json={
            "title": "Customer A incident",
            "description": "Private incident created by Customer A.",
            "priority": "medium",
            "category": "customer-test"
        }
    )

    assert incident_a_response.status_code == 201

    incident_a_id = incident_a_response.json()["id"]

    # -------------------------------------------------
    # Customer B creates their own incident
    # -------------------------------------------------
    incident_b_response = client.post(
        "/incidents",
        headers={
            "Authorization": f"Bearer {customer_b_token}"
        },
        json={
            "title": "Customer B incident",
            "description": "Private incident created by Customer B.",
            "priority": "high",
            "category": "customer-test"
        }
    )

    assert incident_b_response.status_code == 201

    incident_b_id = incident_b_response.json()["id"]

    # -------------------------------------------------
    # Customer A can access their own incident
    # -------------------------------------------------
    own_incident_response = client.get(
        f"/incidents/{incident_a_id}",
        headers={
            "Authorization": f"Bearer {customer_a_token}"
        }
    )

    assert own_incident_response.status_code == 200
    assert own_incident_response.json()["id"] == incident_a_id

    # -------------------------------------------------
    # Customer A cannot directly open Customer B incident
    # -------------------------------------------------
    other_customer_response = client.get(
        f"/incidents/{incident_b_id}",
        headers={
            "Authorization": f"Bearer {customer_a_token}"
        }
    )

    assert other_customer_response.status_code == 404

    # -------------------------------------------------
    # Customer A incident list contains only their own
    # -------------------------------------------------
    customer_a_list = client.get(
        "/incidents",
        headers={
            "Authorization": f"Bearer {customer_a_token}"
        }
    )

    assert customer_a_list.status_code == 200

    incidents = customer_a_list.json()

    incident_ids = [
        incident["id"]
        for incident in incidents
    ]

    assert incident_a_id in incident_ids
    assert incident_b_id not in incident_ids