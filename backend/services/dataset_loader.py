"""
Shared helper for loading a dataset's dataframe. Render's free tier has an
ephemeral filesystem — any file saved to disk (uploads/datasets/*.csv) is
wiped whenever the service restarts or spins down after inactivity. To
survive that, the raw CSV content is *also* stored in Postgres (which does
persist). This helper tries the disk path first (fast, works locally and
right after upload) and transparently falls back to the database copy if
the file is gone.
"""

import io

import pandas as pd
from fastapi import HTTPException


def load_dataframe(dataset_row) -> pd.DataFrame:

    if dataset_row.file_path:
        try:
            return pd.read_csv(dataset_row.file_path)
        except (FileNotFoundError, OSError):
            pass

    if dataset_row.csv_content:
        return pd.read_csv(io.StringIO(dataset_row.csv_content))

    raise HTTPException(
        status_code=404,
        detail="Dataset file is no longer available. Please re-upload your CSV."
    )