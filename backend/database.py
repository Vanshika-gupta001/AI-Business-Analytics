"""
Database engine + session setup.

Uses DATABASE_URL from the environment (see .env.example). Falls back to a
local SQLite file if DATABASE_URL isn't set, so the project still runs out
of the box without requiring Postgres for a quick local test — but you
should use Postgres (or another real DB) in production.
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# IMPORTANT: anchor the default SQLite file to this file's own directory
# (not the process's current working directory). "sqlite:///./analytics.db"
# resolves relative to wherever `uvicorn` happened to be launched from —
# run the server from a different folder and you silently get a *different*
# database file, which looks like "deleted rows coming back" when really
# you're just looking at a different file each time.
_DEFAULT_SQLITE_PATH = Path(__file__).resolve().parent / "analytics.db"
_DEFAULT_SQLITE_URL = f"sqlite:///{_DEFAULT_SQLITE_PATH}"

DATABASE_URL = os.getenv("DATABASE_URL", _DEFAULT_SQLITE_URL)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    # Needed for SQLite when accessed from multiple threads (FastAPI's
    # default worker model spawns threads for sync endpoints).
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()