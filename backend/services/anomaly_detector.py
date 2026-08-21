import pandas as pd
import numpy as np

MAX_DETAILS = 25


def detect_anomalies(df: pd.DataFrame):

    numeric_df = df.select_dtypes(include=[np.number])

    anomalies_report = {}

    details = []

    for col in numeric_df.columns:

        mean = numeric_df[col].mean()
        std = numeric_df[col].std()

        if std == 0 or pd.isna(std):
            anomalies_report[col] = 0
            continue

        z_scores = (numeric_df[col] - mean) / std

        flagged = z_scores[abs(z_scores) > 3]

        anomalies_report[col] = int(len(flagged))

        for row_index, z in flagged.items():

            details.append({
                "column": col,
                "row_index": int(row_index),
                "value": round(float(numeric_df[col].loc[row_index]), 2),
                "z_score": round(float(z), 2),
                "direction": "unusually high" if z > 0 else "unusually low"
            })

    total_anomalies = sum(anomalies_report.values())

    # Sort by how extreme the outlier is, most extreme first
    details.sort(key=lambda d: abs(d["z_score"]), reverse=True)

    return {
        "column_anomalies": anomalies_report,
        "total_anomalies": total_anomalies,
        "details": details[:MAX_DETAILS]
    }