from tests.conftest import client


def test_openapi_is_available():
    response = client.get("/openapi.json")

    assert response.status_code == 200