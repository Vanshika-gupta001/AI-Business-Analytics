import pandas as pd


def calculate_health_score(df: pd.DataFrame):

    score = 100
    recommendations = []

    missing = int(df.isnull().sum().sum())
    duplicates = int(df.duplicated().sum())

    score -= missing * 2
    score -= duplicates * 5

    score = max(0, score)

    if missing > 0:
        recommendations.append("Fill missing values.")

    if duplicates > 0:
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
        "recommendations": recommendations
    }
