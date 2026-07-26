import unittest
from fastapi.testclient import TestClient
from backend.api.main import app
import datetime

class TestAPIContracts(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.token = self.get_auth_token()
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def get_auth_token(self):
        response = self.client.post("/api/v1/auth/login", json={"username": "sec_analyst", "password": "password"})
        if response.status_code == 200:
            return response.json()["access_token"]
        return "mock-jwt-token-access"

    def test_health_check(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_dashboard_stats(self):
        response = self.client.get("/api/v1/dashboard/stats", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_sandboxes", data)
        self.assertIn("total_sessions", data)

    def test_dashboard_recent(self):
        response = self.client.get("/api/v1/dashboard/recent", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("items", data)
        self.assertIsInstance(data["items"], list)

    def test_sandboxes_list(self):
        response = self.client.get("/api/v1/sandboxes", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("items", data)

    def test_reports_list(self):
        response = self.client.get("/api/v1/reports", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("items", data)

    def test_generate_report(self):
        payload = {"session_id": "sess-101", "format": "pdf"}
        response = self.client.post("/api/v1/reports/generate", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["session_id"], "sess-101")
        self.assertEqual(data["format"], "pdf")

    def test_ingest_event(self):
        payload = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "type": "process",
            "session_id": "sess-101",
            "title": "Test Event",
            "description": "Test Description",
            "severity": "high"
        }
        response = self.client.post("/api/v1/events", json=payload, headers=self.headers)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("status", data)
        self.assertEqual(data["status"], "ingested")
        self.assertIn("risk_score", data)

if __name__ == "__main__":
    unittest.main()
