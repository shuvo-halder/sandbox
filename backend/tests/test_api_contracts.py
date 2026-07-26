import pytest
from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)

def get_auth_token():
    response = client.post("/api/v1/auth/login", json={"username": "sec_analyst", "password": "password"})
    if response.status_code == 200:
        return response.json()["access_token"]
    return "mock-jwt-token-access"

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert "status" in response.json()
    assert response.json()["status"] == "ok"

def test_dashboard_stats():
    token = get_auth_token()
    response = client.get("/api/v1/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "total_sandboxes" in data
    assert "active_sandboxes" in data
    assert "total_sessions" in data
    assert "avg_risk_score" in data

def test_dashboard_recent():
    token = get_auth_token()
    response = client.get("/api/v1/dashboard/recent", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert isinstance(data["items"], list)
    if data["items"]:
        item = data["items"][0]
        assert "type" in item
        assert "title" in item
        assert "description" in item
        assert "status" in item

def test_sandboxes_list():
    token = get_auth_token()
    response = client.get("/api/v1/sandboxes", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    if data["items"]:
        item = data["items"][0]
        assert "id" in item
        assert "name" in item
        assert "status" in item

def test_analytics_sessions():
    token = get_auth_token()
    response = client.get("/api/v1/analytics/sessions", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    if data["items"]:
        item = data["items"][0]
        assert "id" in item
        assert "sample_name" in item
        assert "status" in item

def test_session_events():
    token = get_auth_token()
    # Test with seed session 'sess-101'
    response = client.get("/api/v1/sessions/sess-101/events", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
