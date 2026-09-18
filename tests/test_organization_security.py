from tests.conftest import client


def test_admin_cannot_access_other_organization():
    # Create Organization A + Admin A
    signup_a = client.post(
        "/auth/signup",
        json={
            "organization_name": "Organization A",
            "organization_slug": "organization-a",
            "admin_name": "Admin A",
            "admin_email": "org-admin-a@test.com",
            "password": "AdminPass123"
        }
    )

    assert signup_a.status_code == 201

    data_a = signup_a.json()

    token_a = data_a["access_token"]
    organization_a_id = data_a["organization_id"]

    # Create Organization B + Admin B
    signup_b = client.post(
        "/auth/signup",
        json={
            "organization_name": "Organization B",
            "organization_slug": "organization-b",
            "admin_name": "Admin B",
            "admin_email": "org-admin-b@test.com",
            "password": "AdminPass123"
        }
    )

    assert signup_b.status_code == 201

    data_b = signup_b.json()

    token_b = data_b["access_token"]
    organization_b_id = data_b["organization_id"]

    # Admin A can access Organization A
    own_response = client.get(
        f"/organizations/{organization_a_id}",
        headers={
            "Authorization": f"Bearer {token_a}"
        }
    )

    assert own_response.status_code == 200

    # Admin A cannot access Organization B
    other_response = client.get(
        f"/organizations/{organization_b_id}",
        headers={
            "Authorization": f"Bearer {token_a}"
        }
    )

    assert other_response.status_code == 404

    # Admin B cannot update Organization A
    update_response = client.patch(
        f"/organizations/{organization_a_id}",
        headers={
            "Authorization": f"Bearer {token_b}"
        },
        json={
            "name": "Unauthorized Change"
        }
    )

    assert update_response.status_code == 404