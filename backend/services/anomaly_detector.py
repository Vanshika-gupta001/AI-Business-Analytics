import pandas as pd
import numpy as np

def detect_anomalies(df: pd.DataFrame):
    numeric_df = df.select_dtypes(include=[np.number])

    anomalies_report = {}

    for col in numeric_df.columns:
        mean = numeric_df[col].mean()
        std = numeric_df[col].std()

        if std == 0 or pd.isna(std):
            anomalies_report[col] = 0
            continue

        z_scores = (numeric_df[col] - mean) / std

        anomalies = (abs(z_scores) > 3).sum()
        anomalies_report[col] = int(anomalies)

    total_anomalies = sum(anomalies_report.values())

    return {
        "column_anomalies": anomalies_report,
        "total_anomalies": total_anomalies
    }