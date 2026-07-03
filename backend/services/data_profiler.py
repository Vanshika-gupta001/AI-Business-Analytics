import pandas as pd


def profile_data(df: pd.DataFrame):

    duplicate_rows = int(df.duplicated().sum())

    missing_values = int(df.isnull().sum().sum())

    numeric_columns = list(
        df.select_dtypes(include="number").columns
    )
    text_columns = list(
        df.select_dtypes(include="object").columns
    )

    memory_usage = round(
        df.memory_usage(deep=True).sum() / 1024,
        2
    )

    data_types = {
        column: str(dtype)
        for column, dtype in df.dtypes.items()
    }

    return {
        "numeric_columns": len(numeric_columns),
        "text_columns": len(text_columns),
        "numeric_column_names": numeric_columns,
        "text_column_names": text_columns,
        "memory_usage_kb": memory_usage,
    }