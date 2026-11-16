import pytest

from backend.core.config import settings
from backend.models import EMBEDDING_DIMENSIONS


@pytest.fixture
def course_with_document(client, make_pdf):
    course_id = client.post("/courses", json={"title": "Docker"}).json()["id"]
    client.post(
        f"/courses/{course_id}/documents",
        files={"file": ("lecture.pdf", make_pdf(["Docker."]), "application/pdf")},
    )
    return course_id


def ask(client, course_id, headers=None):
    return client.post(
        f"/courses/{course_id}/chat",
        json={"question": "What does Docker run?"},
        headers=headers,
    )


def test_questions_are_limited_per_hour(
    client, course_with_document, fake_gemini, monkeypatch
):
    monkeypatch.setattr(settings, "max_questions_per_hour", 2)

    first = ask(client, course_with_document)
    second = ask(client, course_with_document)
    third = ask(client, course_with_document)

    assert first.status_code == second.status_code == 200
    assert third.status_code == 429
    # The oldest question was just asked, so it leaves the window in ~60 minutes
    assert "Try again in 60 minutes" in third.json()["detail"]
    assert third.headers["Retry-After"] == "3600"


def test_failed_answers_count_too(client, course_with_document, monkeypatch):
    def broken_generate_answer(prompt):
        raise RuntimeError("Gemini is down")

    monkeypatch.setattr(settings, "max_questions_per_hour", 1)
    monkeypatch.setattr(
        "backend.services.retrieval.embed_texts",
        lambda texts, task_type: [[0.1] * EMBEDDING_DIMENSIONS],
    )
    monkeypatch.setattr("backend.services.chat.generate_answer", broken_generate_answer)

    with pytest.raises(RuntimeError):
        ask(client, course_with_document)  # reached Gemini, then failed

    assert ask(client, course_with_document).status_code == 429


def test_rejected_questions_do_not_count(client, fake_gemini, monkeypatch):
    monkeypatch.setattr(settings, "max_questions_per_hour", 1)
    empty_course = client.post("/courses", json={"title": "Empty"}).json()["id"]

    # 409 (no ready documents) never reaches Gemini...
    assert ask(client, empty_course).status_code == 409
    assert ask(client, empty_course).status_code == 409
    # ...so the user still has their one question
    assert "prompt" not in fake_gemini


def test_the_limit_is_per_user(
    client, course_with_document, fake_gemini, other_user, monkeypatch, make_pdf
):
    monkeypatch.setattr(settings, "max_questions_per_hour", 1)
    ask(client, course_with_document)
    assert ask(client, course_with_document).status_code == 429

    other_course = client.post(
        "/courses", json={"title": "Mine"}, headers=other_user
    ).json()["id"]
    client.post(
        f"/courses/{other_course}/documents",
        files={"file": ("lecture.pdf", make_pdf(["Docker."]), "application/pdf")},
        headers=other_user,
    )

    assert ask(client, other_course, headers=other_user).status_code == 200


def test_documents_are_limited_per_user(client, make_pdf, monkeypatch):
    monkeypatch.setattr(settings, "max_documents_per_user", 2)
    first_course = client.post("/courses", json={"title": "One"}).json()["id"]
    second_course = client.post("/courses", json={"title": "Two"}).json()["id"]

    def upload(course_id):
        return client.post(
            f"/courses/{course_id}/documents",
            files={"file": ("a.pdf", make_pdf(["Text."]), "application/pdf")},
        )

    assert upload(first_course).status_code == 201
    assert upload(second_course).status_code == 201
    # The limit counts documents across ALL of the user's courses
    third = upload(first_course)
    assert third.status_code == 400
    assert third.json()["detail"] == "You've reached the limit of 2 documents."
