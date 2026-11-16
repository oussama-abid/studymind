import pytest

# Every test here: the logged-in user ("owner") creates a course, then a second
# user tries to reach it, and a visitor without a token tries the endpoints.


@pytest.fixture
def course_id(client):
    return client.post("/courses", json={"title": "Docker"}).json()["id"]


def test_courses_list_only_shows_your_own(client, course_id, other_user):
    client.post("/courses", json={"title": "Not mine"}, headers=other_user)

    titles = [course["title"] for course in client.get("/courses").json()]

    assert titles == ["Docker"]


def test_other_users_course_is_not_found(client, course_id, other_user):
    url = f"/courses/{course_id}"

    assert client.get(url, headers=other_user).status_code == 404
    assert (
        client.put(url, json={"title": "Hacked"}, headers=other_user).status_code == 404
    )
    assert client.delete(url, headers=other_user).status_code == 404
    # ...and the owner's course is untouched
    assert client.get(url).json()["title"] == "Docker"


def test_other_users_documents_and_chat_are_not_found(
    client, course_id, other_user, make_pdf
):
    pdf = make_pdf(["Docker runs containers."])

    documents = client.get(f"/courses/{course_id}/documents", headers=other_user)
    upload = client.post(
        f"/courses/{course_id}/documents",
        files={"file": ("lecture.pdf", pdf, "application/pdf")},
        headers=other_user,
    )
    chat = client.post(
        f"/courses/{course_id}/chat",
        json={"question": "What does Docker run?"},
        headers=other_user,
    )

    assert documents.status_code == upload.status_code == chat.status_code == 404


def test_other_users_course_looks_exactly_like_a_missing_one(
    client, course_id, other_user
):
    foreign = client.get(f"/courses/{course_id}", headers=other_user)
    missing = client.get("/courses/999", headers=other_user)

    assert foreign.status_code == missing.status_code == 404
    assert foreign.json() == missing.json()


@pytest.mark.parametrize(
    ("method", "url"),
    [
        ("get", "/courses"),
        ("post", "/courses"),
        ("get", "/courses/1"),
        ("put", "/courses/1"),
        ("delete", "/courses/1"),
        ("get", "/courses/1/documents"),
        ("post", "/courses/1/documents"),
        ("post", "/courses/1/chat"),
    ],
)
def test_endpoints_require_login(client, anonymous, method, url):
    response = client.request(method, url, headers=anonymous)

    assert response.status_code == 401
