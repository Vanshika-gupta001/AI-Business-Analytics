import pandas as pd

def generate_insights(df: pd.DataFrame, anomalies=None):

    insights = []

    insights.append(f"Dataset contains {len(df)} rows.")
    insights.append(f"Dataset has {len(df.columns)} columns.")

    duplicate_rows = int(df.duplicated().sum())

    if duplicate_rows == 0:
        insights.append("No duplicate rows found.")
    else:
        insights.append(f"{duplicate_rows} duplicate rows found.")

    for column in df.columns:
        missing = int(df[column].isnull().sum())

        if missing == 0:
            insights.append(f"{column} has no missing values.")
        else:
            insights.append(f"{column} contains {missing} missing values.")

    # 🔥 NEW: anomaly intelligence layer
    if anomalies and anomalies.get("total_anomalies", 0) > 0:
        insights.append(
            "Dataset contains statistical outliers that may affect model performance."
        )

    return insights