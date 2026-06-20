import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Enforce Postgres in production. Keep SQLite only for dev/test.
env = os.getenv("APP_ENV", "production")
default_db = "sqlite:///./solarai.db" if env in ["development", "testing"] else ""

DATABASE_URL = os.getenv("DATABASE_URL", default_db)

if not DATABASE_URL:
    raise ValueError("DATABASE_URL must be set in production")

# For SQLite, we need to allow multithreaded connections
if DATABASE_URL.startswith("sqlite"):
    if env not in ["development", "testing"]:
        raise ValueError("SQLite is only allowed in development or testing environments")
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
