from tests.conftest import client


def test_admin_can_reset_user_password_securely():
    # -------------------------------------------------
    # Create Organization A + Admin
    # -------------------------------------------------
    signup_a = client.post(
        "/auth/signup",
        json={
            "organization_name": "Password Reset Company",
            "organization_slug": "password-reset-company",
            "admin_name": "Password Admin",
            "admin_email": "password-admin@test.com",
            "password": "AdminPass123"
        }
    )

    assert signup_a.status_code == 201

    admin_token = signup_a.json()["access_token"]

    # -------------------------------------------------
    # Admin creates an Agent
    # -------------------------------------------------
    agent_response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "name": "Password Test Agent",
            "email": "password-agent@test.com",
            "password": "OldPassword123",
            "role": "agent"
        }
    )

    assert agent_response.status_code == 201

    agent_id = agent_response.json()["id"]

    # -------------------------------------------------
    # Agent can login with original password
    # -------------------------------------------------
    old_login = client.post(
        "/auth/login",
        json={
            "email": "password-agent@test.com",
            "password": "OldPassword123"
        }
    )

    assert old_login.status_code == 200

    # -------------------------------------------------
    # Admin resets Agent password
    # -------------------------------------------------
    reset_response = client.patch(
        f"/users/{agent_id}/reset-password",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "new_password": "NewPassword123"
        }
    )

    assert reset_response.status_code == 200
    assert (
        reset_response.json()["message"]
        == "Password reset successfully."
    )

    # -------------------------------------------------
    # Old password must no longer work
    # -------------------------------------------------
    old_password_login = client.post(
        "/auth/login",
        json={
            "email": "password-agent@test.com",
            "password": "OldPassword123"
        }
    )

    assert old_password_login.status_code == 401

    # -------------------------------------------------
    # New password must work
    # -------------------------------------------------
    new_password_login = client.post(
        "/auth/login",
        json={
            "email": "password-agent@test.com",
            "password": "NewPassword123"
        }
    )

    assert new_password_login.status_code == 200

    agent_token = new_password_login.json()["access_token"]

    # -------------------------------------------------
    # Agent must NOT be able to reset passwords
    # -------------------------------------------------
    forbidden_reset = client.patch(
        f"/users/{agent_id}/reset-password",
        headers={
            "Authorization": f"Bearer {agent_token}"
        },
        json={
            "new_password": "AgentShouldNotReset123"
        }
    )

    assert forbidden_reset.status_code == 403

    # -------------------------------------------------
    # Create Organization B + Admin
    # -------------------------------------------------
    signup_b = client.post(
        "/auth/signup",
        json={
            "organization_name": "Other Password Company",
            "organization_slug": "other-password-company",
            "admin_name": "Other Admin",
            "admin_email": "other-password-admin@test.com",
            "password": "AdminPass123"
        }
    )

    assert signup_b.status_code == 201

    admin_b_token = signup_b.json()["access_token"]

    # -------------------------------------------------
    # Organization B creates its own Agent
    # -------------------------------------------------
    agent_b_response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_b_token}"
        },
        json={
            "name": "Other Organization Agent",
            "email": "other-agent@test.com",
            "password": "OtherPassword123",
            "role": "agent"
        }
    )

    assert agent_b_response.status_code == 201

    agent_b_id = agent_b_response.json()["id"]

    # -------------------------------------------------
    # Organization A Admin must NOT reset Org B user
    # -------------------------------------------------
    cross_tenant_reset = client.patch(
        f"/users/{agent_b_id}/reset-password",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "new_password": "HackedPassword123"
        }
    )

    assert cross_tenant_reset.status_code == 404