import os
import traceback
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import pandas as pd

from database import get_db
from models.db_models import User, Dataset
from auth import get_current_user
from services.data_profiler import profile_data
from services.insights import generate_insights
from services.health_score import calculate_health_score
from services.chart_generator import generate_charts
from services.anomaly_detector import detect_anomalies
from services.ai_summary import generate_ai_summary
from services.ai_recommendations import generate_ai_recommendations

from services.business_recommendations import generate_business_recommendations

from services.business_ai import generate_business_report
from services.grade import get_grade
from services.pdf_generator import generate_pdf_report
from services.column_summary import get_column_summary

router = APIRouter()

DATASET_FOLDER = "uploads/datasets"


@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # Validate file
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed."
        )

    try:

        # Read CSV
        df = pd.read_csv(file.file)

        # -------------------------------
        # Persist dataset for later use (e.g. model training)
        # -------------------------------
        os.makedirs(DATASET_FOLDER, exist_ok=True)

        dataset_id = str(uuid.uuid4())

        dataset_path = os.path.join(DATASET_FOLDER, f"{dataset_id}.csv")

        df.to_csv(dataset_path, index=False)

        # -------------------------------
        # Dataset Information
        # -------------------------------
        dataset_info = {
            "rows": len(df),
            "columns": len(df.columns),
            "numeric_columns": len(df.select_dtypes(include="number").columns),
            "categorical_columns": len(df.select_dtypes(exclude="number").columns),
            "memory_usage_kb": round(
                df.memory_usage(deep=True).sum() / 1024,
                2
            )
        }

        # -------------------------------
        # Data Profiling
        # -------------------------------
        result = profile_data(df)

        result["dataset_info"] = dataset_info
        
        # -------------------------------
        # Dataset Preview
        # -------------------------------

        result["preview"] = (
            df.head(200)
            .fillna("")
            .to_dict(orient="records")
        )


        # -------------------------------
        # Anomaly Detection
        # -------------------------------
        anomalies = detect_anomalies(df)
        result["anomalies"] = anomalies

        # -------------------------------
        # Insights
        # -------------------------------
        result["insights"] = generate_insights(df, anomalies)

        # -------------------------------
        # Health Score
        # -------------------------------
        health_result = calculate_health_score(df)

        if isinstance(health_result, dict):
            result.update(health_result)
        else:
            result["health_score"] = health_result

        # -------------------------------
        # Add grade
        # -------------------------------
        if "health_score" in result:
            result["grade"] = get_grade(result["health_score"])

        # -------------------------------
        # AI Recommendations (overwrites the basic rule-based list from
        # calculate_health_score with dataset-specific AI-generated advice)
        # -------------------------------
        result["recommendations"] = generate_ai_recommendations(
            df,
            result.get("health_score", 0),
            result.get("status", ""),
            result.get("insights", [])
        )
        
        # -------------------------------
        # Business Recommendations (Problem -> Evidence -> Cause -> Rec -> Impact)
        # -------------------------------
        try:
            result["business_recommendations"] = generate_business_recommendations(result)
        except Exception:
            result["business_recommendations"] = []

        # -------------------------------
        # Charts
        # -------------------------------
        result["charts"] = generate_charts(df)

        # -------------------------------
        # Chart Data for Frontend
        # -------------------------------

        result["chart_data"] = {

            "columns": list(df.columns),

            "numeric_summary":
                df.select_dtypes(include="number")
                .describe()
                .to_dict()

        }

        # -------------------------------
        # Column Summary
        # -------------------------------
        result["column_summary"] = get_column_summary(df)

        # -------------------------------
        # AI Summary
        # -------------------------------
        result["ai_summary"] = generate_ai_summary(
            df,
            result.get("health_score", 0),
            result.get("insights", [])
        )

        # -------------------------------
        # Business AI
        # -------------------------------
        try:
            result["business_ai"] = generate_business_report(result)
        except Exception:
            result["business_ai"] = (
                "Business AI analysis is temporarily unavailable."
            )

        # -------------------------------
        # Raw Data for AI Chat
        # -------------------------------

        result["raw_data"] = (
            df.head(50)
            .fillna("")
            .to_dict(orient="records")
        )

        pdf_path = generate_pdf_report(result, dataset_id)

        backend_base_url = os.getenv(
            "BACKEND_BASE_URL",
            "http://127.0.0.1:8000"
        )

        result["report"] = (
            backend_base_url.rstrip("/")
            + "/reports/"
            + os.path.basename(pdf_path)
        )

        # -------------------------------
        # Filename
        # -------------------------------
        result["filename"] = file.filename
        result["dataset_id"] = dataset_id

        # -------------------------------
        # Persist to DB (tied to the uploading user)
        # -------------------------------
        dataset_row = Dataset(
            id=dataset_id,
            owner_id=current_user.id,
            filename=file.filename,
            file_path=dataset_path,
            rows=dataset_info["rows"],
            columns=dataset_info["columns"],
            health_score=result.get("health_score"),
            grade=result.get("grade"),
            analysis_result=result,
            report_path=pdf_path,
        )
        db.add(dataset_row)
        db.commit()

        return result

    except Exception as e:
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/datasets")
def list_datasets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """History of everything the current user has uploaded."""

    rows = (
        db.query(Dataset)
        .filter(Dataset.owner_id == current_user.id)
        .order_by(Dataset.created_at.desc())
        .all()
    )

    return [
        {
            "dataset_id": row.id,
            "filename": row.filename,
            "rows": row.rows,
            "columns": row.columns,
            "health_score": row.health_score,
            "grade": row.grade,
            "created_at": row.created_at,
        }
        for row in rows
    ]


@router.get("/datasets/{dataset_id}")
def get_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-fetch a previously computed analysis without recomputing it."""

    row = (
        db.query(Dataset)
        .filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id)
        .first()
    )

    if not row:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    return row.analysis_result

@router.get("/datasets/{dataset_id}/download/csv")
def download_dataset_csv(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    row = (
        db.query(Dataset)
        .filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id)
        .first()
    )

    if not row or not row.file_path or not os.path.exists(row.file_path):
        raise HTTPException(status_code=404, detail="CSV file not found.")

    return FileResponse(
        path=row.file_path,
        media_type="text/csv",
        filename=row.filename or "dataset.csv"
    )


@router.get("/datasets/{dataset_id}/download/pdf")
def download_dataset_pdf(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    row = (
        db.query(Dataset)
        .filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id)
        .first()
    )

    if not row or not row.report_path or not os.path.exists(row.report_path):
        raise HTTPException(status_code=404, detail="PDF report not found.")

    return FileResponse(
        path=row.report_path,
        media_type="application/pdf",
        filename=f"{(row.filename or 'dataset').rsplit('.', 1)[0]}_report.pdf"
    )

@router.delete("/datasets/{dataset_id}")
def delete_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes a dataset (and, via cascade, its chat history and training
    runs) plus the stored CSV and generated PDF report on disk.
    """

    row = (
        db.query(Dataset)
        .filter(Dataset.id == dataset_id, Dataset.owner_id == current_user.id)
        .first()
    )

    if not row:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    for path in (row.file_path, row.report_path):
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass  # non-fatal — DB row is still removed

    db.delete(row)
    db.commit()

    return {"message": "Dataset deleted."}