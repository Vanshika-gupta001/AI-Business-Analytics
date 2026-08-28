from services.dataset_loader import load_dataframe_sampled
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import pandas as pd

from database import get_db
from models.db_models import User, Dataset, TrainingRun
from auth import get_current_user
from services.ml_model import train_baseline_model

router = APIRouter()


class TrainRequest(BaseModel):
    dataset_id: str
    target_column: str


@router.post("/train")
def train_model(
    request: TrainRequest,
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

    try:

        df = load_dataframe_sampled(dataset_row)

        result = train_baseline_model(df, request.target_column)

        db.add(TrainingRun(
            dataset_id=dataset_row.id,
            owner_id=current_user.id,
            target_column=request.target_column,
            problem_type=result.get("problem_type"),
            algorithm=result.get("algorithm"),
            metrics=result.get("metrics"),
            feature_importance=result.get("feature_importance"),
        ))
        db.commit()

        return result

    except ValueError as e:

        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Model training failed: {str(e)}"
        )
