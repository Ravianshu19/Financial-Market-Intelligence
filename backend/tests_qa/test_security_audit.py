import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DB_FILE = "./test_security_audit.db"
if os.path.exists(TEST_DB_FILE):
    try:
        os.remove(TEST_DB_FILE)
    except Exception:
        pass

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_FILE}"

from backend.database import Base, get_db
from backend.main import app
from backend import auth

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

def run_security_audit():
    print("======================================================================")
    print("STARTING TEST SUITE: SECURITY AUDIT & VULNERABILITIES")
    print("======================================================================")

    # Pre-setup a standard user
    client.post("/api/auth/signup", json={"email": "victim@example.com", "password": "victimpassword123"})
    print("[SETUP] Created victim user account.")

    # 1. SQL Injection Audit
    print("[RUN] Auditing SQL Injection in Login endpoint...")
    sql_payloads = [
        "' OR '1'='1",
        "victim@example.com' --",
        "' UNION SELECT NULL, NULL, NULL --",
        "'; DROP TABLE users; --"
    ]
    for payload in sql_payloads:
        # Test JSON login body
        r = client.post("/api/auth/login-json", json={"email": payload, "password": "anypassword"})
        assert r.status_code in (400, 422)
        # Test OAuth2 form login
        r = client.post("/api/auth/login", data={"username": payload, "password": "anypassword"})
        assert r.status_code in (400, 422)
    print("  -> Passed (SQL Injection blocked in Login)")

    print("[RUN] Auditing SQL Injection in URL parameters...")
    # Ticker endpoints should reject or safely fall back to 404 for SQL injection ticker inputs
    for payload in sql_payloads:
        r = client.get(f"/api/quote/{payload}")
        # SQLAlchemy ORM will parameterize the query, making the string literal. yfinance will return empty DataFrame or error, returning 502/404.
        assert r.status_code in (404, 502, 422)
    print("  -> Passed (SQL Injection blocked in URL params)")

    # 2. Broken Authentication / JWT Tampering
    print("[RUN] Auditing Watchlist access without authentication...")
    r = client.get("/api/watchlist")
    assert r.status_code == 401
    print("  -> Passed (Blocked unauthorized access)")

    print("[RUN] Auditing Watchlist access with malformed Authorization header...")
    r = client.get("/api/watchlist", headers={"Authorization": "Bearer malformed_token_string"})
    assert r.status_code == 401
    print("  -> Passed (Blocked malformed JWT)")

    print("[RUN] Auditing Watchlist access with tampered signature...")
    # Create valid token first
    r = client.post("/api/auth/login", data={"username": "victim@example.com", "password": "victimpassword123"})
    valid_token = r.json()["access_token"]
    
    # Tamper with the signature portion of the token (header.payload.signature)
    parts = valid_token.split('.')
    if len(parts) == 3:
        tampered_token = f"{parts[0]}.{parts[1]}.tamperedsignature123"
        r = client.get("/api/watchlist", headers={"Authorization": f"Bearer {tampered_token}"})
        assert r.status_code == 401
    print("  -> Passed (Blocked tampered JWT signature)")

    # 3. Password strength and hashing verification
    print("[RUN] Verifying password hashing mechanism...")
    # Check if pwd hash functions return valid bcrypt string hashes starting with $2b$
    h1 = auth.get_password_hash("testpassword")
    assert h1.startswith("$2b$")
    assert auth.verify_password("testpassword", h1) is True
    assert auth.verify_password("wrongpassword", h1) is False
    print("  -> Passed (bcrypt hashing validated)")

    # 4. Regression tests: SECRET_KEY production enforcement & default key rejection
    import subprocess
    import sys

    print("[RUN] Auditing SECRET_KEY production enforcement & default key rejection...")
    
    # Test case 4a: Production env (APP_ENV=production) and no SECRET_KEY should fail
    env = os.environ.copy()
    if "SECRET_KEY" in env:
        del env["SECRET_KEY"]
    env["APP_ENV"] = "production"
    
    cmd = [sys.executable, "-c", "from backend import auth"]
    res = subprocess.run(cmd, env=env, capture_output=True, text=True)
    assert res.returncode != 0
    assert "RuntimeError" in res.stderr
    assert "SECRET_KEY environment variable MUST be set in production mode!" in res.stderr
    print("  -> Passed (production mode requires SECRET_KEY)")

    # Test case 4b: Production env (DATABASE_URL=postgresql://...) and no SECRET_KEY should fail
    env = os.environ.copy()
    if "SECRET_KEY" in env:
        del env["SECRET_KEY"]
    env["APP_ENV"] = "development"
    env["DATABASE_URL"] = "postgresql://user:pass@localhost/db"
    res = subprocess.run(cmd, env=env, capture_output=True, text=True)
    assert res.returncode != 0
    assert "RuntimeError" in res.stderr
    assert "SECRET_KEY environment variable MUST be set in production mode!" in res.stderr
    print("  -> Passed (production database requires SECRET_KEY)")

    # Test case 4c: Forbidden keys rejected in production
    forbidden_keys = [
        "quantra-super-secret-key-1234567890abcdef",
        "quantra-compose-secret-key-9876543210"
    ]
    for key in forbidden_keys:
        env = os.environ.copy()
        env["SECRET_KEY"] = key
        env["APP_ENV"] = "production"
        res = subprocess.run(cmd, env=env, capture_output=True, text=True)
        assert res.returncode != 0
        assert "RuntimeError" in res.stderr
        assert "insecure/default key and is rejected" in res.stderr
    print("  -> Passed (forbidden/default keys rejected in production)")

    # Test case 4d: Ephemeral key uniqueness on separate restarts in dev
    env1 = os.environ.copy()
    if "SECRET_KEY" in env1:
        del env1["SECRET_KEY"]
    env1["APP_ENV"] = "development"
    env1["DATABASE_URL"] = "sqlite:///:memory:"
    
    cmd_print = [sys.executable, "-c", "from backend import auth; print(auth.SECRET_KEY)"]
    res1 = subprocess.run(cmd_print, env=env1, capture_output=True, text=True)
    res2 = subprocess.run(cmd_print, env=env1, capture_output=True, text=True)
    
    assert res1.returncode == 0, f"res1 failed: {res1.stderr}"
    assert res2.returncode == 0, f"res2 failed: {res2.stderr}"
    key1 = res1.stdout.strip()
    key2 = res2.stdout.strip()
    key1_clean = key1.splitlines()[-1] if key1 else ""
    key2_clean = key2.splitlines()[-1] if key2 else ""
    assert len(key1_clean) == 64
    assert len(key2_clean) == 64
    assert key1_clean != key2_clean
    print("  -> Passed (ephemeral keys are unique per process start)")

    print("======================================================================")
    print("SUCCESS: SECURITY AUDIT PASSED - NO VULNERABILITIES DETECTED!")
    print("======================================================================")

if __name__ == "__main__":
    try:
        run_security_audit()
    finally:
        if os.path.exists(TEST_DB_FILE):
            try:
                os.remove(TEST_DB_FILE)
            except Exception:
                pass
