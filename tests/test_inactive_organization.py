from tests.conftest import client, TestingSessionLocal

from app.models.organization import Organization


def test_existing_token_rejected_after_organization_deactivation():
    # Create organization + first admin through secure signup
    signup_response = client.post(
        "/auth/signup",
        json={
            "organization_name": "Inactive Org Test",
            "organization_slug": "inactive-org-test",
            "admin_name": "Security Test Admin",
            "admin_email": "security-admin@test.com",
            "password": "SecurityPass123"
        }
    )

    assert signup_response.status_code == 201

    signup_data = signup_response.json()

    token = signup_data["access_token"]
    organization_id = signup_data["organization_id"]

    # Token works while organization is active
    profile_response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert profile_response.status_code == 200

    # Deactivate organization directly in test database
    db = TestingSessionLocal()

    organization = (
        db.query(Organization)
        .filter(
            Organization.id == organization_id
        )
        .first()
    )

    organization.is_active = False

    db.commit()
    db.close()

    # The SAME JWT must now be rejected
    blocked_response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert blocked_response.status_code == 403
    assert (
        blocked_response.json()["detail"]
        == "Organization is inactive."
    )