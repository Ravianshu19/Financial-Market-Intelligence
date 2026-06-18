import os
import time
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DB_FILE = "./test_functional_api.db"
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
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)
client = TestClient(app)

def run_functional_tests():
    print("======================================================================")
    print("STARTING TEST SUITE: FUNCTIONAL & API CONTRACTS")
    print("======================================================================")
    
    # 1. Health and public indices
    print("[RUN] Testing /api/health...")
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    print("  -> Passed")

    print("[RUN] Testing /api/ticker...")
    r = client.get("/api/ticker")
    assert r.status_code == 200
    assert "items" in r.json()
    print("  -> Passed")

    # 2. Quote and engineered fundamentals
    print("[RUN] Testing /api/quote/NVDA (Fundamentals validation)...")
    r = client.get("/api/quote/NVDA")
    assert r.status_code == 200
    data = r.json()
    assert "fundamentals" in data
    f = data["fundamentals"]
    assert f["pe_ttm"] > 0
    assert "analyst_rating" in f
    assert f["target_mean"] > 0
    print(f"  -> Passed (Rating: {f['analyst_rating']}, PE: {f['pe_ttm']})")

    # 3. Sentiment Analysis API
    print("[RUN] Testing /api/sentiment/NVDA...")
    r = client.get("/api/sentiment/NVDA")
    assert r.status_code == 200
    data = r.json()
    assert data["ticker"] == "NVDA"
    assert "sentiment_distribution" in data
    assert len(data["news"]) > 0
    print(f"  -> Passed (Score: {data['score']}, Label: {data['label']})")

    # 4. MLOps Endpoints
    print("[RUN] Testing /api/mlops/models...")
    r = client.get("/api/mlops/models")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) > 0
    print(f"  -> Passed (Found {len(data)} models in registry)")

    print("[RUN] Testing /api/mlops/drift...")
    r = client.get("/api/mlops/drift")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 40
    print("  -> Passed")

    print("[RUN] Testing /api/mlops/latency...")
    r = client.get("/api/mlops/latency")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 40
    print("  -> Passed")

    # 5. Auth and Watchlist CRUD
    print("[RUN] Testing Auth user registration...")
    r = client.post("/api/auth/signup", json={"email": "tester@example.com", "password": "securepassword123"})
    assert r.status_code == 200
    print("  -> Passed")

    print("[RUN] Testing Auth login...")
    r = client.post("/api/auth/login", data={"username": "tester@example.com", "password": "securepassword123"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  -> Passed")

    print("[RUN] Testing User Watchlist addition and retrieval...")
    r = client.post("/api/watchlist", json={"ticker": "MSFT"}, headers=headers)
    assert r.status_code == 200
    r = client.get("/api/watchlist", headers=headers)
    assert "MSFT" in r.json()
    print("  -> Passed")

    print("[RUN] Testing User Watchlist deletion...")
    r = client.delete("/api/watchlist/MSFT", headers=headers)
    assert r.status_code == 200
    r = client.get("/api/watchlist", headers=headers)
    assert "MSFT" not in r.json()
    print("  -> Passed")

    # 6. Portfolio positions
    print("[RUN] Testing Portfolio holdings creation...")
    r = client.post("/api/portfolio/holdings", json={"ticker": "AAPL", "shares": 10, "avg_cost": 150.0}, headers=headers)
    assert r.status_code == 200
    r = client.get("/api/portfolio", headers=headers)
    port = r.json()
    assert len(port["holdings"]) == 1
    assert port["holdings"][0]["ticker"] == "AAPL"
    print("  -> Passed")

    # 7. Alert triggers
    print("[RUN] Testing Price Alert rule additions...")
    r = client.post("/api/alerts", json={"ticker": "TSLA", "condition_type": "price_above", "threshold": 250.0}, headers=headers)
    assert r.status_code == 200
    alert_id = r.json()["id"]
    r = client.get("/api/alerts", headers=headers)
    assert len(r.json()) == 1
    print("  -> Passed")

    print("[RUN] Testing Price Alert manual trigger...")
    r = client.post(f"/api/alerts/{alert_id}/trigger", headers=headers)
    assert r.status_code == 200
    assert r.json()["alert_status"] == "triggered"
    print("  -> Passed")

    print("======================================================================")
    print("SUCCESS: ALL FUNCTIONAL & API CONTRACT TESTS PASSED!")
    print("======================================================================")

if __name__ == "__main__":
    try:
        run_functional_tests()
    finally:
        if os.path.exists(TEST_DB_FILE):
            try:
                os.remove(TEST_DB_FILE)
            except Exception:
                pass
