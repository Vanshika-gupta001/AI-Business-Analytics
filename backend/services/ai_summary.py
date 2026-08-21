import pandas as pd

from services.ai_chat import client, MODEL_NAME


def _fallback_summary(df: pd.DataFrame, health_score: int, insights: list) -> str:

    summary_parts = []

    rows, cols = df.shape

    summary_parts.append(f"The dataset contains {rows} rows and {cols} columns.")

    missing = df.isnull().sum().sum()

    if missing > 0:
        summary_parts.append(
            f"There are {missing} missing values that may impact data quality."
        )
    else:
        summary_parts.append("No missing values detected, indicating clean data.")

    duplicates = df.duplicated().sum()

    if duplicates > 0:
        summary_parts.append(
            f"The dataset contains {duplicates} duplicate rows which should be removed."
        )

    if health_score >= 90:
        summary_parts.append("Overall data quality is excellent and ready for analysis.")
    elif health_score >= 75:
        summary_parts.append("Data quality is good but minor cleaning is recommended.")
    elif health_score >= 50:
        summary_parts.append("Data requires cleaning before advanced analytics.")
    else:
        summary_parts.append("Poor data quality — significant preprocessing required.")

    numeric_cols = len(df.select_dtypes(include=["number"]).columns)
    text_cols = len(df.select_dtypes(include=["object"]).columns)

    summary_parts.append(
        f"The dataset has {numeric_cols} numeric columns and {text_cols} categorical columns."
    )

    return " ".join(summary_parts)


def generate_ai_summary(df: pd.DataFrame, health_score: int, insights: list) -> str:

    if client is None:
        return _fallback_summary(df, health_score, insights)

    rows, cols = df.shape
    missing = int(df.isnull().sum().sum())
    duplicates = int(df.duplicated().sum())
    numeric_cols = len(df.select_dtypes(include=["number"]).columns)
    text_cols = len(df.select_dtypes(include=["object"]).columns)

    context = f"""Rows: {rows}, Columns: {cols}
Numeric columns: {numeric_cols}, Categorical columns: {text_cols}
Missing values: {missing}
Duplicate rows: {duplicates}
Health score: {health_score}/100
Key insights: {"; ".join(insights[:8]) if insights else "None"}"""

    prompt = f"""Write a 3-4 sentence plain-English summary of this dataset's
shape and quality for a business audience, based only on the statistics
below. Be specific to these numbers, not generic. No markdown, no headers,
just plain sentences.

{context}
"""

    try:

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=250
        )

        return response.choices[0].message.content.strip()

    except Exception as e:

        print("AI summary generation failed, using fallback:", e)

        return _fallback_summary(df, health_score, insights)