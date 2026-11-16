from google.genai.errors import ServerError

from backend.services.chat import build_prompt, unique_pages
from backend.services.retrieval import SearchResult

# --- build_prompt and unique_pages: pure functions, no database, no Gemini ---


def test_build_prompt_numbers_the_excerpts_and_ends_with_the_question():
    results = [
        SearchResult("Docker runs containers.", "lecture1.pdf", 2),
        SearchResult("Images are templates.", "lecture1.pdf", 5),
    ]

    prompt = build_prompt("What does Docker run?", results)

    assert prompt == (
        "Excerpts from the course documents:\n\n"
        "[1] (lecture1.pdf, page 2)\nDocker runs containers.\n\n"
        "[2] (lecture1.pdf, page 5)\nImages are templates.\n\n"
        "Question: What does Docker run?"
    )


def test_unique_pages_keeps_each_page_once_in_order():
    results = [
        SearchResult("a", "lecture1.pdf", 2),
        SearchResult("b", "lecture2.pdf", 1),
        SearchResult("c", "lecture1.pdf", 2),  # same page as the first one
    ]

    pages = [(r.filename, r.page_number) for r in unique_pages(results)]

    assert pages == [("lecture1.pdf", 2), ("lecture2.pdf", 1)]


# --- POST /courses/{id}/chat: the whole flow, with Gemini faked ---


def create_course(client):
    return client.post("/courses", json={"title": "Docker"}).json()["id"]


def ask(client, course_id, question="What does Docker run?"):
    return client.post(f"/courses/{course_id}/chat", json={"question": question})


def test_chat_answers_with_sources(client, make_pdf, fake_gemini):
    course_id = create_course(client)
    pdf = make_pdf(["Docker runs containers.", "Images are templates."])
    client.post(
        f"/courses/{course_id}/documents",
        files={"file": ("lecture1.pdf", pdf, "application/pdf")},
    )

    response = ask(client, course_id)

    assert response.status_code == 200
    body = response.json()
    assert body["answer"] == "Docker runs containers."
    assert {"filename": "lecture1.pdf", "page_number": 1} in body["sources"]
    assert "Question: What does Docker run?" in fake_gemini["prompt"]
    assert "Docker runs containers." in fake_gemini["prompt"]


def test_chat_without_an_answer_returns_no_sources(client, make_pdf, fake_gemini):
    fake_gemini["found"] = False  # Gemini says: not in the material
    course_id = create_course(client)
    client.post(
        f"/courses/{course_id}/documents",
        files={"file": ("lecture1.pdf", make_pdf(["Docker."]), "application/pdf")},
    )

    response = ask(client, course_id, question="What is the capital of France?")

    assert response.status_code == 200
    assert response.json()["sources"] == []


def test_chat_for_missing_course_returns_404(client, fake_gemini):
    response = ask(client, 999)

    assert response.status_code == 404


def test_chat_without_ready_documents_returns_409(client, fake_gemini):
    course_id = create_course(client)

    response = ask(client, course_id)

    assert response.status_code == 409
    assert "no ready documents" in response.json()["detail"]
    assert "prompt" not in fake_gemini  # Gemini was never called


def test_chat_with_empty_question_returns_422(client, fake_gemini):
    course_id = create_course(client)

    response = ask(client, course_id, question="")

    assert response.status_code == 422


def test_chat_returns_503_when_gemini_is_unavailable(
    client, make_pdf, fake_gemini, monkeypatch
):
    def broken_generate_answer(prompt):
        raise ServerError(503, {"error": {"message": "Service unavailable"}})

    monkeypatch.setattr("backend.services.chat.generate_answer", broken_generate_answer)
    course_id = create_course(client)
    client.post(
        f"/courses/{course_id}/documents",
        files={"file": ("lecture1.pdf", make_pdf(["Docker."]), "application/pdf")},
    )

    response = ask(client, course_id)

    assert response.status_code == 503
    assert "try again" in response.json()["detail"]
