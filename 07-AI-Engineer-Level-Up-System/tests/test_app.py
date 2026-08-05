import os
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient


class LevelUpAppTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        os.environ["LEVELUP_DB"] = str(Path(self.temp_dir.name) / "test.db")
        from app import main
        main.DB_PATH = Path(os.environ["LEVELUP_DB"])
        main.init_db()
        self.client = TestClient(main.app)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_dashboard_has_seed_data(self):
        response = self.client.get("/api/dashboard")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(len(data["skills"]), 10)
        self.assertEqual(len(data["tasks"]), 3)
        self.assertEqual(data["profile"]["xp"], 20)

    def test_index_serves_react_build(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn('<div id="root"></div>', response.text)
        self.assertIn("/static/dist/assets/", response.text)

    def test_create_log_adds_xp(self):
        response = self.client.post("/api/logs", json={
            "log_date": "2026-08-05", "topic": "Python 容器",
            "content": "list and dict", "xp": 30,
        })
        self.assertEqual(response.status_code, 201)
        dashboard = self.client.get("/api/dashboard").json()
        self.assertEqual(dashboard["profile"]["xp"], 50)
        self.assertEqual(dashboard["profile"]["streak"], 2)

    def test_update_skill(self):
        response = self.client.patch("/api/skills/2", json={"status": "completed"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "completed")

    def test_invalid_skill_status_is_rejected(self):
        response = self.client.patch("/api/skills/2", json={"status": "unknown"})
        self.assertEqual(response.status_code, 422)

    def test_create_and_complete_task(self):
        created = self.client.post("/api/tasks", json={
            "title": "完成 API 练习", "priority": "high", "due_date": "2026-08-07"
        })
        self.assertEqual(created.status_code, 201)
        task_id = created.json()["id"]
        updated = self.client.patch(f"/api/tasks/{task_id}", json={"completed": True})
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["completed"], 1)


if __name__ == "__main__":
    unittest.main()
