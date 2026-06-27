import os

# Set env DATABASE_URL to test database before any database imports
TEST_DB_FILE = "./test_quantra.db"
if os.path.exists(TEST_DB_FILE):
    try:
        os.remove(TEST_DB_FILE)
    except Exception:
        pass

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_FILE}"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base, get_db
from backend.main import app
from backend import models

# Setup testing SQLite engine and session
engine = create_engine(f"sqlite:///{TEST_DB_FILE}", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Apply dependency override
app.dependency_overrides[get_db] = override_get_db

# Create test tables in the test file
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_auth_and_user_isolation():
    try:
        print("Testing Sign Up...")
        # 1. Sign up User 1
        resp = client.post("/api/auth/signup", json={"email": "user1@example.com", "password": "password123"})
        assert resp.status_code == 200, resp.text
        assert resp.json()["email"] == "user1@example.com"

        print("Testing Login...")
        # 2. Login User 1
        resp = client.post("/api/auth/login", data={"username": "user1@example.com", "password": "password123"})
        assert resp.status_code == 200, resp.text
        token1 = resp.json()["access_token"]
        headers1 = {"Authorization": f"Bearer {token1}"}

        # Verify /api/auth/me works
        resp = client.get("/api/auth/me", headers=headers1)
        assert resp.status_code == 200, resp.text
        assert resp.json()["email"] == "user1@example.com"

        print("Testing Watchlist CRUD & Isolation...")
        # 3. Access watchlists for User 1 (should be empty initially)
        resp = client.get("/api/watchlist", headers=headers1)
        assert resp.status_code == 200, resp.text
        assert resp.json() == []

        # 4. Add ticker to watchlist for User 1
        resp = client.post("/api/watchlist", json={"ticker": "AAPL"}, headers=headers1)
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "ok"

        resp = client.get("/api/watchlist", headers=headers1)
        assert resp.status_code == 200, resp.text
        assert resp.json() == ["AAPL"]

        # 5. Sign up and Login User 2
        resp = client.post("/api/auth/signup", json={"email": "user2@example.com", "password": "password456"})
        assert resp.status_code == 200, resp.text
        resp = client.post("/api/auth/login", data={"username": "user2@example.com", "password": "password456"})
        assert resp.status_code == 200, resp.text
        token2 = resp.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}

        # 6. Verify User 2's watchlist is empty (user isolation check)
        resp = client.get("/api/watchlist", headers=headers2)
        assert resp.status_code == 200, resp.text
        assert resp.json() == []

        print("Testing Portfolio CRUD & Isolation...")
        # 7. Add holding to portfolio for User 1
        resp = client.post("/api/portfolio/holdings", json={"ticker": "MSFT", "shares": 10.0, "avg_cost": 350.0}, headers=headers1)
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "ok"

        # 8. Fetch portfolio for User 1
        resp = client.get("/api/portfolio", headers=headers1)
        assert resp.status_code == 200, resp.text
        port1 = resp.json()
        assert len(port1["holdings"]) == 1
        assert port1["holdings"][0]["ticker"] == "MSFT"
        assert port1["holdings"][0]["shares"] == 10.0

        # 9. Verify User 2's portfolio is empty (user isolation check)
        resp = client.get("/api/portfolio", headers=headers2)
        assert resp.status_code == 200, resp.text
        assert len(resp.json()["holdings"]) == 0

        print("Testing Alerts CRUD & Isolation...")
        # 10. Add alert for User 1
        resp = client.post("/api/alerts", json={"ticker": "TSLA", "condition_type": "price_above", "threshold": 250.0}, headers=headers1)
        assert resp.status_code == 200, resp.text
        alert_uuid = resp.json()["uuid"]

        # 11. Fetch alerts for User 1
        resp = client.get("/api/alerts", headers=headers1)
        assert resp.status_code == 200, resp.text
        assert len(resp.json()) == 1
        assert resp.json()[0]["ticker"] == "TSLA"

        # 12. Verify User 2's alerts are empty (user isolation check)
        resp = client.get("/api/alerts", headers=headers2)
        assert resp.status_code == 200, resp.text
        assert len(resp.json()) == 0

        # 13. Trigger alert for User 1
        resp = client.post(f"/api/alerts/{alert_uuid}/trigger", headers=headers1)
        assert resp.status_code == 200, resp.text
        assert resp.json()["alert_status"] == "triggered"

        # 14. Delete alert for User 1
        resp = client.delete(f"/api/alerts/{alert_uuid}", headers=headers1)
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "ok"

        # Verify it is deleted
        resp = client.get("/api/alerts", headers=headers1)
        assert resp.status_code == 200, resp.text
        assert len(resp.json()) == 0

        print("Testing Account Deletion with Re-Authentication...")
        # 15. Attempt delete account with wrong password (should fail)
        resp = client.post("/api/auth/delete-account", json={"password": "wrongpassword"}, headers=headers1)
        assert resp.status_code == 400, resp.text

        # 16. Delete account with correct password (should succeed)
        resp = client.post("/api/auth/delete-account", json={"password": "password123"}, headers=headers1)
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "ok"

        # 17. Verify user cannot authenticate anymore (me route returns 401)
        resp = client.get("/api/auth/me", headers=headers1)
        assert resp.status_code == 401, resp.text

        print("\nSUCCESS: All auth, user-isolation, and account deletion test cases passed!")
    finally:
        # Clean up the test database file
        if os.path.exists(TEST_DB_FILE):
            try:
                os.remove(TEST_DB_FILE)
            except Exception:
                pass

if __name__ == "__main__":
    test_auth_and_user_isolation()
