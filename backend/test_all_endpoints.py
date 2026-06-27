import os
import time

TEST_DB_FILE = "./test_all_endpoints.db"
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

def run_qa_tests():
    try:
        print("1. [QA] Testing public /api/health endpoint...")
        resp = client.get("/api/health")
        assert resp.status_code == 200, f"Health check failed: {resp.text}"
        data = resp.json()
        assert data["status"] == "ok"
        assert "version" in data
        print("   -> OK")

        print("2. [QA] Testing public /api/ticker endpoint...")
        resp = client.get("/api/ticker")
        assert resp.status_code == 200, f"Ticker strip failed: {resp.text}"
        data = resp.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        print(f"   -> OK (found {len(data['items'])} items)")

        # We will use NVDA as our primary test symbol
        test_sym = "NVDA"

        print(f"3. [QA] Testing public /api/quote/{test_sym} endpoint...")
        resp = client.get(f"/api/quote/{test_sym}")
        assert resp.status_code == 200, f"Quote NVDA failed: {resp.text}"
        data = resp.json()
        assert data["ticker"] == test_sym
        assert "price" in data
        assert "change" in data
        assert "change_pct" in data
        print(f"   -> OK (price: {data['price']}, change %: {data['change_pct']:.2f}%)")

        print(f"4. [QA] Testing public /api/history/{test_sym} endpoint...")
        resp = client.get(f"/api/history/{test_sym}?period=1mo&interval=1d")
        assert resp.status_code == 200, f"History NVDA failed: {resp.text}"
        data = resp.json()
        assert data["ticker"] == test_sym
        assert "candles" in data
        assert isinstance(data["candles"], list)
        print(f"   -> OK (found {len(data['candles'])} candles)")

        print("5. [QA] Testing public /api/movers endpoint...")
        resp = client.get("/api/movers?limit=3")
        assert resp.status_code == 200, f"Movers failed: {resp.text}"
        data = resp.json()
        assert "gainers" in data
        assert "losers" in data
        print(f"   -> OK (gainers: {len(data['gainers'])}, losers: {len(data['losers'])})")

        print("6. [QA] Testing public /api/heatmap endpoint...")
        resp = client.get("/api/heatmap")
        assert resp.status_code == 200, f"Heatmap failed: {resp.text}"
        data = resp.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        print(f"   -> OK (found {len(data['items'])} assets in S&P 500 subset)")

        print(f"7. [QA] Testing public /api/forecast/{test_sym} endpoint...")
        resp = client.get(f"/api/forecast/{test_sym}?horizon=10")
        assert resp.status_code == 200, f"Forecast NVDA failed: {resp.text}"
        data = resp.json()
        assert data["ticker"] == test_sym
        assert "forecast" in data
        assert len(data["forecast"]) == 10
        assert "metrics" in data
        print("   -> OK (forecast values generated successfully)")

        print(f"8. [QA] Testing public /api/explain/{test_sym} endpoint...")
        resp = client.get(f"/api/explain/{test_sym}?top_k=4")
        assert resp.status_code == 200, f"Explain NVDA failed: {resp.text}"
        data = resp.json()
        assert data["ticker"] == test_sym
        assert "top" in data
        assert len(data["top"]) == 4
        print("   -> OK (SHAP attribution contributions generated)")

        print(f"9. [QA] Testing public /api/analyst/{test_sym} endpoint...")
        resp = client.get(f"/api/analyst/{test_sym}")
        assert resp.status_code == 200, f"Analyst NVDA failed: {resp.text}"
        data = resp.json()
        assert "forecast" in data
        assert "explain" in data
        assert "narrative" in data
        assert data["narrative"]["ticker"] == test_sym
        assert "stance" in data["narrative"]
        print(f"   -> OK (Analyst stance: {data['narrative']['stance']}, conviction: {data['narrative']['conviction']})")

        print(f"10. [QA] Testing public /api/indicators/{test_sym} endpoint...")
        resp = client.get(f"/api/indicators/{test_sym}")
        assert resp.status_code == 200, f"Indicators NVDA failed: {resp.text}"
        data = resp.json()
        assert data["ticker"] == test_sym
        assert "latest" in data
        assert "rsi" in data["latest"]
        assert "macd" in data["latest"]
        print(f"   -> OK (RSI: {data['latest']['rsi']:.2f}, MACD: {data['latest']['macd']:.4f})")

        # Now test auth endpoints for CRUD isolation and schema matching
        print("\n11. [QA] Testing Auth Sign-up...")
        resp = client.post("/api/auth/signup", json={"email": "qa_user@example.com", "password": "qa_password123"})
        assert resp.status_code == 200, f"Signup failed: {resp.text}"
        assert resp.json()["email"] == "qa_user@example.com"
        print("   -> OK")

        print("12. [QA] Testing Auth Login...")
        resp = client.post("/api/auth/login", data={"username": "qa_user@example.com", "password": "qa_password123"})
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   -> OK")

        print("13. [QA] Testing Auth Watchlist CRUD...")
        # Add to watchlist
        resp = client.post("/api/watchlist", json={"ticker": "AAPL"}, headers=headers)
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "ok"
        
        # Get watchlist
        resp = client.get("/api/watchlist", headers=headers)
        assert resp.status_code == 200, resp.text
        assert resp.json() == ["AAPL"]
        
        # Remove from watchlist
        resp = client.delete("/api/watchlist/AAPL", headers=headers)
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "ok"
        
        # Get watchlist again (should be empty)
        resp = client.get("/api/watchlist", headers=headers)
        assert resp.status_code == 200, resp.text
        assert resp.json() == []
        print("   -> OK")

        print("14. [QA] Testing Auth Portfolio CRUD...")
        # Add holding
        resp = client.post("/api/portfolio/holdings", json={"ticker": "GOOG", "shares": 5, "avg_cost": 175.0}, headers=headers)
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "ok"
        
        # Fetch portfolio
        resp = client.get("/api/portfolio", headers=headers)
        assert resp.status_code == 200, resp.text
        port = resp.json()
        assert len(port["holdings"]) == 1
        assert port["holdings"][0]["ticker"] == "GOOG"
        
        # Remove holding
        resp = client.delete("/api/portfolio/holdings/GOOG", headers=headers)
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "ok"
        
        # Fetch portfolio again
        resp = client.get("/api/portfolio", headers=headers)
        assert resp.status_code == 200, resp.text
        assert len(resp.json()["holdings"]) == 0
        print("   -> OK")

        print("15. [QA] Testing Auth Alerts CRUD...")
        # Create alert
        resp = client.post("/api/alerts", json={"ticker": "MSFT", "condition_type": "price_above", "threshold": 420.0}, headers=headers)
        assert resp.status_code == 200, resp.text
        alert = resp.json()
        assert alert["ticker"] == "MSFT"
        alert_uuid = alert["uuid"]
        
        # Get alerts
        resp = client.get("/api/alerts", headers=headers)
        assert resp.status_code == 200, resp.text
        assert len(resp.json()) == 1
        
        # Trigger alert
        resp = client.post(f"/api/alerts/{alert_uuid}/trigger", headers=headers)
        assert resp.status_code == 200, resp.text
        assert resp.json()["alert_status"] == "triggered"
        
        # Delete alert
        resp = client.delete(f"/api/alerts/{alert_uuid}", headers=headers)
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "ok"
        print("   -> OK")

        print("\n🔥 QA SUCCESS: All 15 automated validation test scenarios passed cleanly!")

    finally:
        # Clean up the test database file
        if os.path.exists(TEST_DB_FILE):
            try:
                os.remove(TEST_DB_FILE)
            except Exception:
                pass

if __name__ == "__main__":
    run_qa_tests()
