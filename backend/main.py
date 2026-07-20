from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles  
from fastapi.middleware.cors import CORSMiddleware 

from routes.upload import router as upload_router

app = FastAPI(
    title="AI Business Analytics API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="uploads"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount(
    "/reports",
    StaticFiles(directory="reports"),
    name="reports"
)

app.include_router(upload_router)


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