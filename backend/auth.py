import os
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Union
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session


# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY")

FORBIDDEN_KEYS = {
    "quantra-super-secret-key-1234567890abcdef",
    "quantra-compose-secret-key-9876543210",
    "secret",
    "secret_key",
    "default",
}

app_env = os.getenv("APP_ENV", "development").lower()
is_prod_db = os.getenv("DATABASE_URL", "").startswith("postgres")
is_production = (app_env == "production" or is_prod_db)

if SECRET_KEY:
    if SECRET_KEY.strip() in FORBIDDEN_KEYS:
        if is_production:
            raise RuntimeError(
                "The configured SECRET_KEY is a known insecure/default key and is rejected in production mode!"
            )
        else:
            logging.getLogger("quantra.auth").warning(
                f"WARNING: The configured SECRET_KEY '{SECRET_KEY}' is a known insecure/default key! "
                f"Please change it before deploying to production."
            )
else:
    if is_production:
        raise RuntimeError("SECRET_KEY environment variable MUST be set in production mode!")
    
    import sys
    banner = (
        "\n"
        "********************************************************************************\n"
        "* WARNING: SECRET_KEY environment variable is not set!                         *\n"
        "* Generating a random 32-byte secure key for this session.                     *\n"
        "* Note: Sessions will be invalidated on every process/server restart.          *\n"
        "* DO NOT USE THIS IN PRODUCTION!                                               *\n"
        "********************************************************************************\n"
    )
    sys.stderr.write(banner)
    logging.getLogger("quantra.auth").warning(
        "SECRET_KEY environment variable is not set! Generating a random 32-byte secure key for this session."
    )
    SECRET_KEY = secrets.token_hex(32)

from backend.database import get_db
from backend import models

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # Default to 24h for dev ease

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        # Check if the Authorization header is present but formatted differently (e.g. not parsed correctly by oauth2_scheme)
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user
