from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import pandas as pd

from database import get_db
from models.db_models import User, Dataset
from auth import get_current_user
from services.query_engine import run_data_query

router = APIRouter()


class QueryRequest(BaseModel):
    dataset_id: str
    question: str


@router.post("/query")
def query_dataset(
    request: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    dataset_row = (
        db.query(Dataset)
        .filter(
            Dataset.id == request.dataset_id,
            Dataset.owner_id == current_user.id,
        )
        .first()
    )

    if not dataset_row:
        raise HTTPException(
            status_code=404,
            detail=(
                "Dataset not found. It may have expired — "
                "please re-upload your CSV and try again."
            )
        )

    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:

        df = pd.read_csv(dataset_row.file_path)

        result = run_data_query(request.question, df)

        return result

    except ValueError as e:

        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Could not answer that question: {str(e)}"
        )