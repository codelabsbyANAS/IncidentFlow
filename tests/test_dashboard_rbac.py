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


def test_dashboard_staff_allowed_customer_blocked():
    # Create organization + admin
    signup_response = client.post(
        "/auth/signup",
        json={
            "organization_name": "Dashboard Test Organization",
            "organization_slug": "dashboard-test-org",
            "admin_name": "Dashboard Admin",
            "admin_email": "dashboard-admin@test.com",
            "password": "AdminPass123"
        }
    )

    assert signup_response.status_code == 201

    admin_token = signup_response.json()["access_token"]

    # Admin should access dashboard
    admin_dashboard = client.get(
        "/dashboard/summary",
        headers={
            "Authorization": f"Bearer {admin_token}"
        }
    )

    assert admin_dashboard.status_code == 200

    # Admin creates customer
    customer_response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "name": "Dashboard Customer",
            "email": "dashboard-customer@test.com",
            "password": "CustomerPass123",
            "role": "customer"
        }
    )

    assert customer_response.status_code == 201

    customer_token = login(
        "dashboard-customer@test.com",
        "CustomerPass123"
    )

    # Customer must NOT access staff dashboard
    customer_dashboard = client.get(
        "/dashboard/summary",
        headers={
            "Authorization": f"Bearer {customer_token}"
        }
    )

    assert customer_dashboard.status_code == 403