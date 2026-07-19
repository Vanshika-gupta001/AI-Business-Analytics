import pandas as pd

def generate_ai_summary(df: pd.DataFrame, health_score: int, insights: list):

    summary_parts = []

    rows, cols = df.shape

    summary_parts.append(
        f"The dataset contains {rows} rows and {cols} columns."
    )

    # Missing values insight
    missing = df.isnull().sum().sum()
    if missing > 0:
        summary_parts.append(
            f"There are {missing} missing values that may impact data quality."
        )
    else:
        summary_parts.append(
            "No missing values detected, indicating clean data."
        )

    # Duplicates
    duplicates = df.duplicated().sum()
    if duplicates > 0:
        summary_parts.append(
            f"The dataset contains {duplicates} duplicate rows which should be removed."
        )

    # Health interpretation
    if health_score >= 90:
        summary_parts.append("Overall data quality is excellent and ready for analysis.")
    elif health_score >= 75:
        summary_parts.append("Data quality is good but minor cleaning is recommended.")
    elif health_score >= 50:
        summary_parts.append("Data requires cleaning before advanced analytics.")
    else:
        summary_parts.append("Poor data quality — significant preprocessing required.")

    # Column insights
    numeric_cols = len(df.select_dtypes(include=["number"]).columns)
    text_cols = len(df.select_dtypes(include=["object"]).columns)

    summary_parts.append(
        f"The dataset has {numeric_cols} numeric columns and {text_cols} categorical columns."
    )

    return " ".join(summary_parts)