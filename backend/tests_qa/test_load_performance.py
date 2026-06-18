import os
import time
import asyncio
import numpy as np
import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DB_FILE = "./test_load_performance.db"
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

async def measure_endpoint_latency(client: httpx.AsyncClient, path: str) -> float:
    """Helper to query endpoint and return response time in ms."""
    t0 = time.time()
    try:
        r = await client.get(path)
        status_code = r.status_code
    except Exception:
        status_code = 500
        
    duration = (time.time() - t0) * 1000.0  # in ms
    return duration if status_code == 200 else -1.0

async def run_load_test():
    print("======================================================================")
    print("STARTING TEST SUITE: PERFORMANCE & CONCURRENT LOAD")
    print("======================================================================")
    
    from unittest.mock import MagicMock, patch
    import pandas as pd
    
    # Create mock stock history DataFrame
    dates = pd.bdate_range(end=pd.Timestamp.today(), periods=100)
    mock_df = pd.DataFrame({
        "Open": np.random.uniform(100, 110, 100),
        "High": np.random.uniform(110, 120, 100),
        "Low": np.random.uniform(90, 100, 100),
        "Close": np.random.uniform(100, 110, 100),
        "Volume": np.random.randint(1000000, 5000000, 100)
    }, index=dates)
    
    mock_ticker = MagicMock()
    mock_ticker.fast_info = {"market_cap": 2500000000000, "currency": "USD"}
    mock_ticker.history.return_value = mock_df
    mock_ticker.info = {
        "trailingPE": 72.4, "forwardPE": 38.1, "pegRatio": 1.42,
        "enterpriseToEbitda": 64.8, "grossMargins": 0.753, "operatingMargins": 0.624,
        "returnOnEquity": 1.034, "debtToEquity": -0.62, "revenueGrowth": 1.22,
        "earningsGrowth": 1.68, "beta": 1.71, "targetLowPrice": 840,
        "targetMeanPrice": 1210, "targetHighPrice": 1500, "numberOfAnalystOpinions": 47,
        "recommendationMean": 1.4, "longName": "Mock Asset Inc."
    }
    mock_ticker.news = []
    
    with patch("yfinance.Ticker", return_value=mock_ticker):
        # We query endpoints in-memory using ASGI app transport to avoid rate limits
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            # Warmup
            await client.get("/api/quote/NVDA")
            await client.get("/api/indicators/NVDA")
            
            concurrent_users = 40
            requests_per_user = 10
            total_requests = concurrent_users * requests_per_user
            
            paths = [
                "/api/quote/NVDA",
                "/api/indicators/NVDA",
                "/api/movers",
                "/api/ticker"
            ]
            
            print(f"[LOAD] Simulating {concurrent_users} concurrent users...")
            print(f"[LOAD] Sourcing {total_requests} requests total...")
            
            t_start = time.time()
            
            tasks = []
            for i in range(total_requests):
                path = paths[i % len(paths)]
                tasks.append(measure_endpoint_latency(client, path))
                
            durations = await asyncio.gather(*tasks)
            
            t_total = time.time() - t_start
            
            # Calculate stats
            valid_durations = [d for d in durations if d > 0]
            failed_count = total_requests - len(valid_durations)
            
            if not valid_durations:
                print("Error: All load test requests failed.")
                return

            avg_latency = np.mean(valid_durations)
            median_latency = np.median(valid_durations)
            p95_latency = np.percentile(valid_durations, 95)
            p99_latency = np.percentile(valid_durations, 99)
            throughput = total_requests / t_total
            
            print("\n--- Performance Metrics Report ---")
            print(f"Total Requests:       {total_requests}")
            print(f"Failed Requests:      {failed_count} ({failed_count/total_requests*100:.1f}%)")
            print(f"Total Test Duration:  {t_total:.3f} seconds")
            print(f"Throughput:           {throughput:.2f} req/sec")
            print(f"Average Latency:      {avg_latency:.2f} ms")
            print(f"Median Latency:       {median_latency:.2f} ms")
            print(f"p95 Latency:          {p95_latency:.2f} ms")
            print(f"p99 Latency:          {p99_latency:.2f} ms")
            print("----------------------------------")
            
            # Assertion thresholds
            assert throughput > 10.0, f"Throughput under target: {throughput:.2f} req/sec"
            assert p95_latency < 2000.0, f"p95 latency too high: {p95_latency:.2f} ms"
            print("  -> Passed")

if __name__ == "__main__":
    try:
        asyncio.run(run_load_test())
    finally:
        if os.path.exists(TEST_DB_FILE):
            try:
                os.remove(TEST_DB_FILE)
            except Exception:
                pass
