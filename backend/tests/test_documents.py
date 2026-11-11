def test_upload_pdf(client, upload_dir):
    course_id = client.post("/courses", json={"title": "Databases"}).json()["id"]

    response = client.post(
        f"/courses/{course_id}/documents",
        files={"file": ("lecture.pdf", b"%PDF-1.4 fake content", "application/pdf")},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["filename"] == "lecture.pdf"
    assert body["status"] == "processing"
    assert (upload_dir / f"{body['id']}.pdf").exists()


def test_upload_non_pdf_fails(client):
    course_id = client.post("/courses", json={"title": "Databases"}).json()["id"]

    response = client.post(
        f"/courses/{course_id}/documents",
        files={"file": ("lecture.txt", b"hello", "text/plain")},
    )

    assert response.status_code == 400


def test_upload_to_missing_course_returns_404(client):
    response = client.post(
        "/courses/999/documents",
        files={"file": ("lecture.pdf", b"%PDF-1.4 fake content", "application/pdf")},
    )
    assert response.status_code == 404


def test_list_documents(client):
    # Create a course and upload two documents
    course_id = client.post("/courses", json={"title": "Databases"}).json()["id"]
    client.post(
        f"/courses/{course_id}/documents",
        files={"file": ("lecture1.pdf", b"%PDF-1.4 fake content", "application/pdf")},
    )
    client.post(
        f"/courses/{course_id}/documents",
        files={"file": ("lecture2.pdf", b"%PDF-1.4 fake content", "application/pdf")},
    )

    # List documents for the course
    response = client.get(f"/courses/{course_id}/documents")
    assert response.status_code == 200
    documents = response.json()
    assert len(documents) == 2
    assert {doc["filename"] for doc in documents} == {"lecture1.pdf", "lecture2.pdf"}


def test_upload_too_big_fails(client):
    course_id = client.post("/courses", json={"title": "Databases"}).json()["id"]

    # Create a file larger than 20 MB
    large_content = b"%PDF-1.4" + b"a" * (20 * 1024 * 1024 + 1)

    response = client.post(
        f"/courses/{course_id}/documents",
        files={"file": ("large.pdf", large_content, "application/pdf")},
    )

    assert response.status_code == 400


def test_list_documents_for_missing_course_returns_404(client):
    response = client.get("/courses/999/documents")
    assert response.status_code == 404
