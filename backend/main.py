from fastapi import FastAPI
from routes.upload import router as upload_router

app = FastAPI(
    title="AI Business Analytics API",
    version="1.0.0"
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