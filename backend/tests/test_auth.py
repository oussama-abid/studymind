from backend.services.security import create_access_token

EMAIL = "student@example.com"
PASSWORD = "correct-horse"


def register(client, email=EMAIL, password=PASSWORD):
    return client.post("/auth/register", json={"email": email, "password": password})


def login(client, email=EMAIL, password=PASSWORD):
    return client.post("/auth/login", json={"email": email, "password": password})


def test_register_creates_a_user_without_exposing_the_password(client):
    response = register(client)

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == EMAIL
    assert "password" not in body
    assert "hashed_password" not in body


def test_register_with_a_taken_email_returns_409(client):
    register(client)

    response = register(client)

    assert response.status_code == 409


def test_register_rejects_bad_email_and_short_password(client):
    assert register(client, email="not-an-email").status_code == 422
    assert register(client, password="short").status_code == 422


def test_login_returns_a_token(client):
    register(client)

    response = login(client)

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"].count(".") == 2  # header.payload.signature


def test_wrong_password_and_unknown_email_get_the_same_answer(client):
    register(client)

    wrong_password = login(client, password="wrong-password")
    unknown_email = login(client, email="nobody@example.com")

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


def test_me_returns_the_logged_in_user(client):
    register(client)
    token = login(client).json()["access_token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["email"] == EMAIL


def test_me_without_token_returns_401(client, anonymous):
    assert client.get("/auth/me", headers=anonymous).status_code == 401


def test_me_with_a_forged_token_returns_401(client):
    register(client)
    token = login(client).json()["access_token"]
    header, payload, signature = token.split(".")
    forged = f"{header}.{payload}.{signature[:-2]}xx"  # tampered signature

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {forged}"})

    assert response.status_code == 401


def test_me_with_a_token_for_a_deleted_user_returns_401(client):
    token = create_access_token(999)  # valid signature, but no such user

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 401
