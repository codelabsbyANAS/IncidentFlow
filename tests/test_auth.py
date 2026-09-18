from tests.conftest import client


def test_signup_and_login_user():
    # Create organization + first admin
    signup_response = client.post(
        "/auth/signup",
        json={
            "organization_name": "Auth Test Organization",
            "organization_slug": "auth-test-organization",
            "admin_name": "Test Admin",
            "admin_email": "auth-admin@test.com",
            "password": "TestPass123"
        }
    )

    assert signup_response.status_code == 201

    signup_data = signup_response.json()

    assert signup_data["name"] == "Test Admin"
    assert signup_data["role"] == "admin"
    assert signup_data["organization_id"] is not None
    assert "access_token" in signup_data

    # Login using the newly created admin account
    login_response = client.post(
        "/auth/login",
        json={
            "email": "auth-admin@test.com",
            "password": "TestPass123"
        }
    )

    assert login_response.status_code == 200

    login_data = login_response.json()

    assert "access_token" in login_data
    assert login_data["token_type"] == "bearer"
    assert login_data["name"] == "Test Admin"
    assert login_data["role"] == "admin"
    assert login_data["organization_id"] == signup_data["organization_id"]