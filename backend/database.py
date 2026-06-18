import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./quantra.db")

# Render / Heroku database URLs often start with postgres://, which SQLAlchemy requires to be postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# For SQLite, allow access from multiple threads and resolve relative paths to absolute paths
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    
    # Extract path portion
    if "sqlite:///" in DATABASE_URL:
        db_path = DATABASE_URL.split("sqlite:///")[1].split("?")[0]
        if not os.path.isabs(db_path):
            base_dir = os.path.dirname(os.path.abspath(__file__))
            resolved_path = os.path.abspath(os.path.join(base_dir, db_path))
            DATABASE_URL = f"sqlite:///{resolved_path}"
            
            # Ensure the directory exists
            try:
                os.makedirs(os.path.dirname(resolved_path), exist_ok=True)
            except Exception:
                pass

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
