from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    dataset: Optional[Dict[str, Any]] = None


@router.post("/chat")
def chat(request: ChatRequest):

    return {
        "reply": f"You asked: {request.message}"
    }