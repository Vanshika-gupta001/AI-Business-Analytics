from typing import Optional, Dict, Any, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import User, ChatMessage
from auth import get_current_user
from services.ai_chat import generate_chat_response


router = APIRouter()


class ChatMessageIn(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    message: str
    dataset: Optional[Dict[str, Any]] = None
    history: Optional[List[ChatMessageIn]] = None
    dataset_id: Optional[str] = None


@router.post("/chat")
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    history = (
        [turn.dict() for turn in request.history]
        if request.history
        else []
    )

    response = generate_chat_response(
        request.message,
        request.dataset,
        history
    )

    # Persist the exchange so chat history survives a page refresh.
    # Only stored when the message is tied to a saved dataset.
    if request.dataset_id:

        db.add(ChatMessage(
            dataset_id=request.dataset_id,
            owner_id=current_user.id,
            role="user",
            text=request.message,
        ))
        db.add(ChatMessage(
            dataset_id=request.dataset_id,
            owner_id=current_user.id,
            role="ai",
            text=response,
        ))
        db.commit()

    return {
        "reply": response
    }


@router.get("/chat/{dataset_id}")
def get_chat_history(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    rows = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.dataset_id == dataset_id,
            ChatMessage.owner_id == current_user.id,
        )
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    return [
        {"role": row.role, "text": row.text, "created_at": row.created_at}
        for row in rows
    ]
