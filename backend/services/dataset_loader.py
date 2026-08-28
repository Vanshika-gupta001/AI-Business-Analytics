import io
import random

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


def load_dataframe_sampled(dataset_row, max_rows: int = 20000) -> pd.DataFrame:
    """
    Like load_dataframe, but never materializes more than ~max_rows in
    memory. Reads the file twice — once to count lines (cheap, no
    DataFrame built), once with skiprows to construct only the sampled
    rows — instead of loading the entire file into a DataFrame first
    and sampling afterward. A 250k-row DataFrame can exceed available
    RAM on memory-limited hosting even before any training happens.
    """

    def _sample_read(opener):

        with opener() as f:
            total_rows = sum(1 for _ in f) - 1  # minus header

        if total_rows <= max_rows:
            with opener() as f:
                return pd.read_csv(f)

        random.seed(42)
        skip_count = total_rows - max_rows
        skip_rows = set(random.sample(range(1, total_rows + 1), skip_count))

        with opener() as f:
            return pd.read_csv(f, skiprows=lambda i: i in skip_rows)

    if dataset_row.file_path:
        try:
            return _sample_read(
                lambda: open(dataset_row.file_path, "r", encoding="utf-8", errors="ignore")
            )
        except (FileNotFoundError, OSError):
            pass

    if dataset_row.csv_content:
        return _sample_read(lambda: io.StringIO(dataset_row.csv_content))

    raise HTTPException(
        status_code=404,
        detail="Dataset file is no longer available. Please re-upload your CSV."
    )