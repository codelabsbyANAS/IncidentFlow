from tests.conftest import client


def test_admin_can_create_user_in_own_organization():
    # Create a brand-new organization + admin
    signup_response = client.post(
        "/auth/signup",
        json={
            "organization_name": "Admin User Test Company",
            "organization_slug": "admin-user-test-company",
            "admin_name": "Test Admin",
            "admin_email": "admin-user-test@test.com",
            "password": "AdminPass123"
        }
    )

    assert signup_response.status_code == 201

    signup_data = signup_response.json()

    admin_token = signup_data["access_token"]
    organization_id = signup_data["organization_id"]

    # Admin creates an agent
    create_response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "name": "Test Agent",
            "email": "new-agent@test.com",
            "password": "AgentPass123",
            "role": "agent"
        }
    )

    assert create_response.status_code == 201

    created_user = create_response.json()

    assert created_user["name"] == "Test Agent"
    assert created_user["email"] == "new-agent@test.com"
    assert created_user["role"] == "agent"

    # Organization must come from the logged-in admin
    assert created_user["organization_id"] == organization_id


def test_non_admin_cannot_create_user():
    # Create organization + admin
    signup_response = client.post(
        "/auth/signup",
        json={
            "organization_name": "Permission Test Company",
            "organization_slug": "permission-test-company",
            "admin_name": "Permission Admin",
            "admin_email": "permission-admin@test.com",
            "password": "AdminPass123"
        }
    )

    assert signup_response.status_code == 201

    admin_token = signup_response.json()["access_token"]

    # Admin creates a normal customer
    customer_response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "name": "Normal Customer",
            "email": "normal-customer@test.com",
            "password": "CustomerPass123",
            "role": "customer"
        }
    )

    assert customer_response.status_code == 201

    # Customer logs in
    login_response = client.post(
        "/auth/login",
        json={
            "email": "normal-customer@test.com",
            "password": "CustomerPass123"
        }
    )

    assert login_response.status_code == 200

    customer_token = login_response.json()["access_token"]

    # Customer tries to create another user
    forbidden_response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {customer_token}"
        },
        json={
            "name": "Unauthorized User",
            "email": "unauthorized@test.com",
            "password": "Unauthorized123",
            "role": "customer"
        }
    )

    assert forbidden_response.status_code == 403