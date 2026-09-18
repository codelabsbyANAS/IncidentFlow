from tests.conftest import client


def test_tenant_signup_creates_organization_and_admin():
    signup_response = client.post(
        "/auth/signup",
        json={
            "organization_name": "New Test Company",
            "organization_slug": "new-test-company",
            "admin_name": "Company Admin",
            "admin_email": "company-admin@test.com",
            "password": "AdminPass123"
        }
    )

    assert signup_response.status_code == 201

    signup_data = signup_response.json()

    assert signup_data["role"] == "admin"
    assert signup_data["name"] == "Company Admin"
    assert signup_data["token_type"] == "bearer"
    assert "access_token" in signup_data
    assert signup_data["organization_id"] is not None

    token = signup_data["access_token"]

    # Verify the returned token works
    profile_response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert profile_response.status_code == 200

    profile = profile_response.json()

    assert profile["name"] == "Company Admin"
    assert profile["email"] == "company-admin@test.com"
    assert profile["role"] == "admin"
    assert profile["organization_id"] == signup_data["organization_id"]