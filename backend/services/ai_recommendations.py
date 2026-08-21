import json

import pandas as pd

from services.ai_chat import client, MODEL_NAME


def _fallback_recommendations(df: pd.DataFrame) -> list:

    missing = int(df.isnull().sum().sum())
    duplicates = int(df.duplicated().sum())

    recommendations = []

    if duplicates > 0:
        recommendations.append("Remove duplicate rows.")

    if missing > 0:
        recommendations.append("Fill missing values.")

    if not recommendations:
        recommendations.append("Dataset is ready for machine learning.")

    return recommendations


def generate_ai_recommendations(
    df: pd.DataFrame,
    health_score: int,
    status: str,
    insights: list
) -> list:

    if client is None:
        return _fallback_recommendations(df)

    rows, cols = df.shape
    missing = int(df.isnull().sum().sum())
    duplicates = int(df.duplicated().sum())

    context = f"""Rows: {rows}, Columns: {cols}
Missing values: {missing}
Duplicate rows: {duplicates}
Health score: {health_score}/100 ({status})
Key insights: {"; ".join(insights[:8]) if insights else "None"}"""

    prompt = f"""You are a data quality analyst. Based ONLY on the statistics
below, suggest 3-5 concrete, specific next steps a data team should take
with this dataset. Be specific to what's actually true of this data — do
not give generic advice unrelated to these facts.

{context}

Respond with ONLY a JSON array of short strings, nothing else. Example
format: ["Remove 4 duplicate rows before modeling", "Impute missing Age
values using the median"]
"""

    try:

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=300
        )

        text = response.choices[0].message.content.strip()

        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:].strip()

        recommendations = json.loads(text)

        if (
            isinstance(recommendations, list)
            and recommendations
            and all(isinstance(r, str) for r in recommendations)
        ):
            return recommendations

        raise ValueError("Unexpected response shape from model")

    except Exception as e:

        print("AI recommendations generation failed, using fallback:", e)

        return _fallback_recommendations(df)