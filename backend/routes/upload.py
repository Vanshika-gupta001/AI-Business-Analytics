from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd

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

        duplicate_rows = int(df.duplicated().sum())

        data_types = {
            column: str(dtype)
            for column, dtype in df.dtypes.items()
        }

        return {
            "filename": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": list(df.columns),
            "missing_values": int(df.isnull().sum().sum()),
            "duplicate_rows": duplicate_rows,
            "data_types": data_types
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    