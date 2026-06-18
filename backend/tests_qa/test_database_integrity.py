import os
from sqlalchemy import create_engine, exc, text
from sqlalchemy.orm import sessionmaker

TEST_DB_FILE = "./test_database_integrity.db"
if os.path.exists(TEST_DB_FILE):
    try:
        os.remove(TEST_DB_FILE)
    except Exception:
        pass

# Configure environment database URL to point to database test file
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_FILE}"

from backend.database import Base
from backend import models, auth

# Setup database session
engine = create_engine(f"sqlite:///{TEST_DB_FILE}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

def run_db_tests():
    print("======================================================================")
    print("STARTING TEST SUITE: DATABASE INTEGRITY & CONSTRAINTS")
    print("======================================================================")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Unique Email Constraint Check
        print("[RUN] Testing unique email constraint...")
        pwd_hash = auth.get_password_hash("password123")
        u1 = models.User(email="test@example.com", hashed_password=pwd_hash)
        u2 = models.User(email="test@example.com", hashed_password=pwd_hash)
        
        db.add(u1)
        db.commit()
        
        db.add(u2)
        try:
            db.commit()
            raise AssertionError("Unique email constraint failed: duplicate email committed successfully.")
        except exc.IntegrityError:
            db.rollback()
            print("  -> Passed (Blocked duplicate user email)")

        # 2. User Data Isolation Check
        print("[RUN] Testing user data isolation...")
        # Create second user
        user_a = db.query(models.User).filter(models.User.email == "test@example.com").first()
        u_b = models.User(email="other@example.com", hashed_password=pwd_hash)
        db.add(u_b)
        db.commit()
        user_b = u_b
        
        # Add watchlists for both
        w_a = models.Watchlist(user_id=user_a.id, ticker="AAPL")
        w_b = models.Watchlist(user_id=user_b.id, ticker="MSFT")
        db.add(w_a)
        db.add(w_b)
        db.commit()
        
        # Query User A watchlist
        watchlist_a = db.query(models.Watchlist).filter(models.Watchlist.user_id == user_a.id).all()
        assert len(watchlist_a) == 1
        assert watchlist_a[0].ticker == "AAPL"
        
        # Query User B watchlist
        watchlist_b = db.query(models.Watchlist).filter(models.Watchlist.user_id == user_b.id).all()
        assert len(watchlist_b) == 1
        assert watchlist_b[0].ticker == "MSFT"
        print("  -> Passed (Verified strict user data isolation)")

        # 3. Cascading Deletes Check
        print("[RUN] Testing cascading deletes...")
        # Create portfolio and holdings for User A
        port_a = models.Portfolio(user_id=user_a.id, name="User A Port")
        db.add(port_a)
        db.commit()
        
        holding_a = models.PortfolioHolding(portfolio_id=port_a.id, ticker="GOOG", shares=10, avg_cost=150.0)
        alert_a = models.AlertRule(user_id=user_a.id, ticker="AMZN", condition_type="price_above", threshold=180.0)
        db.add(holding_a)
        db.add(alert_a)
        db.commit()
        
        # Ensure items exist
        assert db.query(models.Watchlist).filter(models.Watchlist.user_id == user_a.id).count() == 1
        assert db.query(models.Portfolio).filter(models.Portfolio.user_id == user_a.id).count() == 1
        assert db.query(models.PortfolioHolding).filter(models.PortfolioHolding.portfolio_id == port_a.id).count() == 1
        assert db.query(models.AlertRule).filter(models.AlertRule.user_id == user_a.id).count() == 1
        
        # SQLite foreign key support check (enable constraints explicitly for sqlite)
        db.execute(text("PRAGMA foreign_keys = ON;"))
        
        # Delete User A
        db.delete(user_a)
        db.commit()
        
        # Assert cascading deletes worked (all associated child rows must be gone)
        assert db.query(models.Watchlist).filter(models.Watchlist.user_id == user_a.id).count() == 0, "Watchlist not cascaded"
        assert db.query(models.Portfolio).filter(models.Portfolio.user_id == user_a.id).count() == 0, "Portfolio not cascaded"
        assert db.query(models.PortfolioHolding).filter(models.PortfolioHolding.portfolio_id == port_a.id).count() == 0, "PortfolioHolding not cascaded"
        assert db.query(models.AlertRule).filter(models.AlertRule.user_id == user_a.id).count() == 0, "AlertRule not cascaded"
        print("  -> Passed (Verified cascade delete watchlists, portfolios, holdings, alerts)")

        # 4. Hashing Password Validation
        print("[RUN] Testing secure password encryption...")
        user_b_db = db.query(models.User).filter(models.User.email == "other@example.com").first()
        assert user_b_db.hashed_password != "password123", "Plaintext passwords saved in database"
        assert user_b_db.hashed_password.startswith("$2b$"), "Password is not standard bcrypt hash format"
        print("  -> Passed (Secure password hashing verified)")

        print("======================================================================")
        print("SUCCESS: DATABASE INTEGRITY & CONSTRAINTS PASSED SUCCESSFULLY!")
        print("======================================================================")
        
    finally:
        db.close()

if __name__ == "__main__":
    try:
        run_db_tests()
    finally:
        if os.path.exists(TEST_DB_FILE):
            try:
                os.remove(TEST_DB_FILE)
            except Exception:
                pass
