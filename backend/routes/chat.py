from fastapi import APIRouter, UploadFile, File
import pandas as pd
from services.ai_chat import answer_question

router = APIRouter()

df_cache = {}  # temporary (we'll upgrade later)

@router.post("/ask")
async def ask_question(file: UploadFile = File(...), question: str = ""):
    df = pd.read_csv(file.file)

    answer = answer_question(df, question)

    return {
        "question": question,
        "answer": answer
    }