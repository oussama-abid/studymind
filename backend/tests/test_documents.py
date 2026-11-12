from google.genai.errors import ServerError
from sqlalchemy import text


def create_course(client):
    return client.post("/courses", json={"title": "Databases"}).json()["id"]


def upload(client, course_id, content, filename="lecture.pdf"):
    return client.post(
        f"/courses/{course_id}/documents",
        files={"file": (filename, content, "application/pdf")},
    )


def get_document(client, course_id):
    """The newest document of the course, as the API shows it now."""
    return client.get(f"/courses/{course_id}/documents").json()[0]


def test_upload_pdf(client, upload_dir, make_pdf):
    course_id = create_course(client)

    response = upload(client, course_id, make_pdf(["Docker runs containers."]))

    # The response comes back before processing starts
    assert response.status_code == 201
    body = response.json()
    assert body["filename"] == "lecture.pdf"
    assert body["status"] == "processing"
    assert (upload_dir / f"{body['id']}.pdf").exists()


def test_upload_pdf_becomes_ready(client, make_pdf):
    course_id = create_course(client)

    upload(client, course_id, make_pdf(["Docker runs containers."]))

    # The background job has finished by now
    document = get_document(client, course_id)
    assert document["status"] == "ready"
    assert document["error_message"] is None


def test_upload_creates_chunks_with_page_numbers(client, engine, make_pdf):
    course_id = create_course(client)
    pdf = make_pdf(["Docker runs containers.", "Images are templates."])

    upload(client, course_id, pdf)

    with engine.connect() as connection:
        rows = connection.execute(
            text("SELECT page_number, content FROM chunks ORDER BY chunk_index")
        ).all()
    assert rows == [(1, "Docker runs containers."), (2, "Images are templates.")]


def test_upload_embeds_every_chunk(client, engine, make_pdf):
    course_id = create_course(client)
    pdf = make_pdf(["Docker runs containers.", "Images are templates."])

    upload(client, course_id, pdf)

    with engine.connect() as connection:
        embedded = connection.execute(
            text("SELECT count(*) FROM chunks WHERE embedding IS NOT NULL")
        ).scalar_one()
    assert embedded == 2


def test_upload_pdf_without_text_fails(client, make_pdf):
    course_id = create_course(client)

    # A page without text, like a scanned page
    upload(client, course_id, make_pdf([""]))

    document = get_document(client, course_id)
    assert document["status"] == "failed"
    assert "No text found" in document["error_message"]


def test_upload_unreadable_pdf_fails(client):
    course_id = create_course(client)

    # Starts like a PDF, but the rest is not a valid PDF
    upload(client, course_id, b"%PDF-1.4 broken content")

    document = get_document(client, course_id)
    assert document["status"] == "failed"
    assert document["error_message"] == "The PDF could not be read."


def test_upload_fails_when_embedding_fails(client, engine, make_pdf, monkeypatch):
    def broken_embed_texts(texts):
        raise ServerError(503, {"error": {"message": "Service unavailable"}})

    monkeypatch.setattr("backend.services.processing.embed_texts", broken_embed_texts)
    course_id = create_course(client)

    upload(client, course_id, make_pdf(["Docker runs containers."]))

    document = get_document(client, course_id)
    assert document["status"] == "failed"
    assert document["error_message"] == "Embedding failed. Please try again later."
    with engine.connect() as connection:
        chunks = connection.execute(text("SELECT count(*) FROM chunks")).scalar_one()
    assert chunks == 1  # the chunks are kept for a later retry


def test_unexpected_error_marks_document_failed(client, make_pdf, monkeypatch):
    def crashing_embed_texts(texts):
        raise RuntimeError("bug in our code")

    monkeypatch.setattr("backend.services.processing.embed_texts", crashing_embed_texts)
    course_id = create_course(client)

    upload(client, course_id, make_pdf(["Docker runs containers."]))

    # Never stuck in "processing": a crash still ends as "failed"
    document = get_document(client, course_id)
    assert document["status"] == "failed"
    assert document["error_message"] == "Processing failed. Please try again later."


def test_upload_non_pdf_fails(client):
    course_id = create_course(client)

    # Name and content type claim PDF, but the content is not a PDF
    response = upload(client, course_id, b"hello")

    assert response.status_code == 400


def test_upload_too_big_fails(client, monkeypatch, make_pdf):
    monkeypatch.setattr("backend.routers.documents.MAX_UPLOAD_BYTES", 10)
    course_id = create_course(client)

    response = upload(client, course_id, make_pdf(["Too big."]))

    assert response.status_code == 400


def test_upload_to_missing_course_returns_404(client, make_pdf):
    response = upload(client, 999, make_pdf(["Hello."]))

    assert response.status_code == 404


def test_list_documents_newest_first(client, make_pdf):
    course_id = create_course(client)
    upload(client, course_id, make_pdf(["One."]), filename="lecture1.pdf")
    upload(client, course_id, make_pdf(["Two."]), filename="lecture2.pdf")

    response = client.get(f"/courses/{course_id}/documents")

    assert response.status_code == 200
    filenames = [doc["filename"] for doc in response.json()]
    assert filenames == ["lecture2.pdf", "lecture1.pdf"]


def test_list_documents_for_missing_course_returns_404(client):
    response = client.get("/courses/999/documents")

    assert response.status_code == 404
