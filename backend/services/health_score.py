import pandas as pd


def calculate_health_score(df: pd.DataFrame):

    total_rows = len(df)
    total_cells = df.size

    missing_cells = int(df.isnull().sum().sum())
    duplicate_rows = int(df.duplicated().sum())

    # Percentage-based, not raw point subtraction — a large dataset with
    # a small fraction of missing values shouldn't collapse to 0 the way
    # "-2 points per missing cell" would.
    completeness_score = (
        100 * (1 - missing_cells / total_cells) if total_cells > 0 else 100
    )

    uniqueness_score = (
        100 * (1 - duplicate_rows / total_rows) if total_rows > 0 else 100
    )

    completeness_score = max(0, completeness_score)
    uniqueness_score = max(0, uniqueness_score)

    # Completeness weighted higher — missing data usually hurts analysis
    # more directly than a handful of duplicate rows.
    weights = {"completeness": 0.7, "uniqueness": 0.3}

    score = round(
        weights["completeness"] * completeness_score
        + weights["uniqueness"] * uniqueness_score
    )

    score = max(0, min(100, score))

    recommendations = []

    if missing_cells > 0:
        recommendations.append("Fill missing values.")

    if duplicate_rows > 0:
        recommendations.append("Remove duplicate rows.")

    if not recommendations:
        recommendations.append("Dataset is ready for Machine Learning.")

    if score >= 90:
        status = "Excellent"
    elif score >= 70:
        status = "Good"
    elif score >= 50:
        status = "Needs Cleaning"
    else:
        status = "Poor"

    return {
        "health_score": score,
        "status": status,
        "recommendations": recommendations,
        "health_breakdown": {
            "completeness_score": round(completeness_score, 1),
            "uniqueness_score": round(uniqueness_score, 1),
            "missing_cells": missing_cells,
            "total_cells": total_cells,
            "duplicate_rows": duplicate_rows,
            "total_rows": total_rows,
            "weights": weights
        }
    }