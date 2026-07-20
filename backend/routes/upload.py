import traceback

from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd

from services.data_profiler import profile_data
from services.insights import generate_insights
from services.health_score import calculate_health_score
from services.chart_generator import generate_charts
from services.anomaly_detector import detect_anomalies
from services.ai_summary import generate_ai_summary
from services.business_ai import generate_business_report
from services.grade import get_grade
from services.pdf_generator import generate_pdf_report
from services.column_summary import get_column_summary

router = APIRouter()


@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):

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

        # Add grade
        if "health_score" in result:
            result["grade"] = get_grade(result["health_score"])

        # -------------------------------
        # Charts
        # -------------------------------
        result["charts"] = generate_charts(df)

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
        pdf_path = generate_pdf_report(result)

        result["report"] = (
            "http://127.0.0.1:8000/"
            + pdf_path.replace("\\","/")
        )

        # -------------------------------
        # Filename
        # -------------------------------
        result["filename"] = file.filename

        return result

    except Exception as e:
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )