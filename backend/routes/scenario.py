from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import User, Dataset
from auth import get_current_user
from services.dataset_loader import load_dataframe_sampled
from services.scenario_optimizer import optimize_scenario
from services.pdf_generator import generate_pdf_report
from services.chart_generator import generate_charts
import os

router = APIRouter()


class ScenarioRequest(BaseModel):
    dataset_id: str
    target_column: str
    controllable_columns: list[str]
    direction: str = "maximize"  # "maximize" | "minimize"


@router.post("/scenario/optimize")
def optimize(
    request: ScenarioRequest,
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

    if request.direction not in ("maximize", "minimize"):
        raise HTTPException(
            status_code=400,
            detail="direction must be 'maximize' or 'minimize'."
        )

    try:

        df = load_dataframe_sampled(dataset_row)

        result = optimize_scenario(
            df=df,
            target_column=request.target_column,
            controllable_columns=request.controllable_columns,
            direction=request.direction,
        )

        # Persist the scenario onto the dataset's saved analysis and
        # regenerate the PDF so "Download Business Report PDF" includes
        # the recommended scenario — without this, the optimization
        # result would only ever live in the dashboard, not the
        # boardroom-ready report.
        analysis = dataset_row.analysis_result or {}
        analysis["scenario"] = result

        # Free-tier hosting wipes local disk on every redeploy/restart —
        # the chart PNGs referenced in analysis["charts"] may no longer
        # exist even though the dataset record itself is fine (it's
        # persisted in Postgres). Regenerate them from the dataframe we
        # already loaded above rather than silently shipping a PDF with
        # no graphs, matching the same resilience pattern already used
        # in routes/upload.py's get_dataset endpoint.
        existing_charts = analysis.get("charts", [])
        charts_missing = not existing_charts or not all(
            os.path.exists(c) for c in existing_charts
        )

        if charts_missing:
            try:
                analysis["charts"] = generate_charts(df)
            except Exception:
                pass  # non-fatal — PDF will just omit charts, as before

        new_pdf_path = generate_pdf_report(analysis, dataset_row.id)

        dataset_row.analysis_result = analysis
        dataset_row.report_path = new_pdf_path
        db.commit()

        return result

    except ValueError as e:

        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Scenario optimization failed: {str(e)}"
        )