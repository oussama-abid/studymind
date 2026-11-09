from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health_db_ok(monkeypatch):
    monkeypatch.setattr("backend.main.check_database", lambda: True)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "db": "ok"}


def test_health_db_error(monkeypatch):
    monkeypatch.setattr("backend.main.check_database", lambda: False)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "db": "error"}
