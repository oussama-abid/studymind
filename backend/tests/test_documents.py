from sqlalchemy import text


def create_course(client):
    return client.post("/courses", json={"title": "Databases"}).json()["id"]


def upload(client, course_id, content, filename="lecture.pdf"):
    return client.post(
        f"/courses/{course_id}/documents",
        files={"file": (filename, content, "application/pdf")},
    )


def test_upload_pdf(client, upload_dir, make_pdf):
    course_id = create_course(client)

    response = upload(client, course_id, make_pdf(["Docker runs containers."]))

    assert response.status_code == 201
    body = response.json()
    assert body["filename"] == "lecture.pdf"
    assert body["status"] == "processing"
    assert (upload_dir / f"{body['id']}.pdf").exists()


def test_upload_creates_chunks_with_page_numbers(client, engine, make_pdf):
    course_id = create_course(client)
    pdf = make_pdf(["Docker runs containers.", "Images are templates."])

    upload(client, course_id, pdf)

    with engine.connect() as connection:
        rows = connection.execute(
            text("SELECT page_number, content FROM chunks ORDER BY chunk_index")
        ).all()
    assert rows == [(1, "Docker runs containers."), (2, "Images are templates.")]


def test_upload_pdf_without_text_fails(client, make_pdf):
    course_id = create_course(client)

    # A page without text, like a scanned page
    response = upload(client, course_id, make_pdf([""]))

    body = response.json()
    assert body["status"] == "failed"
    assert "No text found" in body["error_message"]


def test_upload_unreadable_pdf_fails(client):
    course_id = create_course(client)

    # Starts like a PDF, but the rest is not a valid PDF
    response = upload(client, course_id, b"%PDF-1.4 broken content")

    body = response.json()
    assert body["status"] == "failed"
    assert body["error_message"] == "The PDF could not be read."


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
