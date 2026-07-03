from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd

from services.insights import generate_insights
from services.data_profiler import profile_data
from services.health_score import calculate_health_score

router = APIRouter()


@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):

    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed."
        )

    try:
        df = pd.read_csv(file.file)

        result = profile_data(df)

        result["insights"] = generate_insights(df)

        health = calculate_health_score(df)
        result.update(health)

        result["filename"] = file.filename

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )