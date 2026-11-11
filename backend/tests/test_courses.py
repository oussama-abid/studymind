def test_create_course(client):
    response = client.post("/courses", json={"title": "Databases"})

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Databases"
    assert body["description"] is None
    assert "id" in body


def test_create_course_without_title_fails(client):
    response = client.post("/courses", json={"title": ""})

    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "title"]


def test_delete_missing_course_returns_404(client):
    response = client.delete("/courses/999")

    assert response.status_code == 404
    body = response.json()
    assert body["detail"] == "Course not found"


def test_list_courses_newest_first(client):
    # Create two courses
    client.post("/courses", json={"title": "Databases"})
    client.post("/courses", json={"title": "Databases2"})

    response = client.get("/courses")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["title"] == "Databases2"
    assert body[1]["title"] == "Databases"


def test_update_course(client):
    # Create a course
    response = client.post("/courses", json={"title": "Databases"})
    course_id = response.json()["id"]

    # Update the course
    response = client.put(
        f"/courses/{course_id}",
        json={"title": "Databases Updated", "description": "Updated description"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Databases Updated"
    assert body["description"] == "Updated description"


def test_delete_course(client):
    # Create a course
    response = client.post("/courses", json={"title": "Databases"})
    course_id = response.json()["id"]

    # Delete the course
    response = client.delete(f"/courses/{course_id}")

    assert response.status_code == 204

    # Verify the course is deleted
    response = client.get(f"/courses/{course_id}")
    assert response.status_code == 404


def test_get_course(client):
    # Create a course
    response = client.post("/courses", json={"title": "Databases"})
    course_id = response.json()["id"]

    # Get the course
    response = client.get(f"/courses/{course_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Databases"


def test_get_missing_course_returns_404(client):
    response = client.get("/courses/999")

    assert response.status_code == 404
    body = response.json()
    assert body["detail"] == "Course not found"


def test_update_missing_course_returns_404(client):
    response = client.put(
        "/courses/999",
        json={"title": "Updated Title", "description": "Updated description"},
    )

    assert response.status_code == 404
    body = response.json()
    assert body["detail"] == "Course not found"
