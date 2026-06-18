import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DB_FILE = "./test_regression.db"
if os.path.exists(TEST_DB_FILE):
    try:
        os.remove(TEST_DB_FILE)
    except Exception:
        pass

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_FILE}"

from backend.database import Base, get_db
from backend.main import app

engine = create_engine(f"sqlite:///{TEST_DB_FILE}", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        print("[DB] Overriding session local...")
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)
client = TestClient(app)

def run_regression_tests():
    print("======================================================================")
    print("STARTING TEST SUITE: REGRESSION CHECKS")
    print("======================================================================")
    
    # 1. Signup / Signin Regression
    print("[RUN] Verifying auth login/signup flows...")
    r = client.post("/api/auth/signup", json={"email": "reg_user@example.com", "password": "reg_password123"})
    assert r.status_code == 200, f"Signup failed: {r.text}"
    
    r = client.post("/api/auth/login", data={"username": "reg_user@example.com", "password": "reg_password123"})
    assert r.status_code == 200, f"OAuth2 Login failed: {r.text}"
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["email"] == "reg_user@example.com"
    print("  -> Passed")

    # 2. Watchlist CRUD Regression
    print("[RUN] Verifying watchlist manager flows...")
    # Get watchlist (should be empty initially)
    r = client.get("/api/watchlist", headers=headers)
    assert r.status_code == 200
    assert r.json() == []
    
    # Add AAPL
    r = client.post("/api/watchlist", json={"ticker": "AAPL"}, headers=headers)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    
    # Get watchlist again
    r = client.get("/api/watchlist", headers=headers)
    assert r.status_code == 200
    assert r.json() == ["AAPL"]
    
    # Remove AAPL
    r = client.delete("/api/watchlist/AAPL", headers=headers)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    
    # Confirm watchlist is empty
    r = client.get("/api/watchlist", headers=headers)
    assert r.json() == []
    print("  -> Passed")

    # 3. Portfolio Positions Regression
    print("[RUN] Verifying portfolio math updates...")
    # Add Google holding
    r = client.post("/api/portfolio/holdings", json={"ticker": "GOOG", "shares": 5, "avg_cost": 100.0}, headers=headers)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    
    # Add Apple holding
    r = client.post("/api/portfolio/holdings", json={"ticker": "AAPL", "shares": 10, "avg_cost": 150.0}, headers=headers)
    assert r.status_code == 200
    
    # Get portfolio and verify calculations
    r = client.get("/api/portfolio", headers=headers)
    assert r.status_code == 200
    port = r.json()
    assert port["total_cost"] == 2000.0 # (5*100) + (10*150)
    assert len(port["holdings"]) == 2
    
    # Assert holdings computed gains/losses are returned as float structures
    for holding in port["holdings"]:
        assert "shares" in holding
        assert "avg_cost" in holding
        assert "market_value" in holding
        assert "gain_loss" in holding
        assert "gain_loss_pct" in holding
        
    # Remove AAPL
    r = client.delete("/api/portfolio/holdings/AAPL", headers=headers)
    assert r.status_code == 200
    
    # Check total cost updated
    r = client.get("/api/portfolio", headers=headers)
    assert r.json()["total_cost"] == 500.0
    print("  -> Passed")

    # 4. Alerts Rule Regression
    print("[RUN] Verifying alerts rules and triggers...")
    # Create alert rule
    r = client.post("/api/alerts", json={"ticker": "MSFT", "condition_type": "price_above", "threshold": 400.0}, headers=headers)
    assert r.status_code == 200
    alert_id = r.json()["id"]
    
    # Verify status is armed
    assert r.json()["status"] == "armed"
    
    # Trigger alert rule manually
    r = client.post(f"/api/alerts/{alert_id}/trigger", headers=headers)
    assert r.status_code == 200
    assert r.json()["alert_status"] == "triggered"
    
    # Verify alert status is changed to triggered
    r = client.get("/api/alerts", headers=headers)
    assert r.json()[0]["status"] == "triggered"
    
    # Delete rule
    r = client.delete(f"/api/alerts/{alert_id}", headers=headers)
    assert r.status_code == 200
    print("  -> Passed")

    print("======================================================================")
    print("SUCCESS: ALL REGRESSION VERIFICATIONS PASSED CLEANLY!")
    print("======================================================================")

if __name__ == "__main__":
    try:
        run_regression_tests()
    finally:
        if os.path.exists(TEST_DB_FILE):
            try:
                os.remove(TEST_DB_FILE)
            except Exception:
                pass
