import os

from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from routes.upload import router as upload_router
from routes.chat import router as chat_router
from routes.train import router as train_router
from routes.auth import router as auth_router
from routes.query import router as query_router

from database import engine, Base
from models import db_models  # noqa: F401 (registers models on Base.metadata)


load_dotenv()

# Creates tables that don't exist yet. Fine for getting started; once you
# have real data, switch to Alembic migrations (alembic/ is already set
# up — see README) instead of relying on this.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Business Analytics API",
    version="1.0.0"
)

# In production, set FRONTEND_URL to your deployed Vercel URL
# (e.g. https://your-app.vercel.app). Local dev origins are always
# allowed so `npm run dev` keeps working without extra setup.
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

frontend_url = os.getenv("FRONTEND_URL")

if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pathlib import Path

_BASE_DIR = Path(__file__).resolve().parent

app.mount("/static", StaticFiles(directory=str(_BASE_DIR / "uploads")), name="static")
app.mount("/uploads", StaticFiles(directory=str(_BASE_DIR / "uploads")), name="uploads")
app.mount(
    "/reports",
    StaticFiles(directory=str(_BASE_DIR / "reports")),
    name="reports"
)

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(train_router)
app.include_router(query_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to AI Business Analytics API 🚀"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }