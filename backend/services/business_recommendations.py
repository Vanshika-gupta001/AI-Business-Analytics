import json
import time

import pandas as pd

from services.ai_chat import client, MODEL_NAME


def _build_context(result: dict) -> str:

    info = result.get("dataset_info", {}) or {}
    columns = result.get("column_summary", []) or []
    insights = result.get("insights", []) or []
    anomalies = result.get("anomalies", {}) or {}

    column_lines = [
        f"- {col.get('column')} ({col.get('type')}): "
        f"{col.get('missing')} missing, {col.get('unique')} unique values"
        for col in columns[:25]
    ]

    lines = [
        f"Rows: {info.get('rows')}, Columns: {info.get('columns')}",
        f"Health score: {result.get('health_score')}/100 ({result.get('status')})",
        "",
        "Columns:",
        *column_lines,
    ]

    if insights:
        lines += ["", "Key insights:"] + [f"- {i}" for i in insights[:10]]

    total_anomalies = anomalies.get("total_anomalies", 0) if isinstance(anomalies, dict) else 0

    if total_anomalies:
        lines += ["", f"Statistical outliers detected: {total_anomalies}"]

    return "\n".join(lines)


def _fallback_recommendations(result: dict) -> list:

    health = result.get("health_score", 0)
    info = result.get("dataset_info", {}) or {}

    return [{
        "problem": "Dataset quality has not been fully assessed by AI.",
        "evidence": f"Health score is {health}/100 based on {info.get('rows')} rows.",
        "cause": "AI-generated business recommendations are temporarily unavailable.",
        "recommendation": "Review the data quality and column statistics sections manually.",
        "impact": "Ensures analysis is based on well-understood data."
    }]


def generate_business_recommendations(result: dict) -> list:
    """
    Returns business-framed recommendations (not data-cleaning tips) in a
    Problem -> Evidence -> Cause -> Recommendation -> Impact structure,
    grounded only in the dataset's actual computed statistics.
    """

    if client is None:
        return _fallback_recommendations(result)

    context = _build_context(result)

    prompt = f"""You are a business data analyst. Based ONLY on the dataset
statistics below, identify 2-4 real business-relevant findings — not
generic data-cleaning tasks like "remove duplicates" (that's covered
elsewhere). Focus on what the data quality or patterns imply for business
decisions.

Dataset statistics:
{context}

For each finding, respond with an object with these exact keys:
- "problem": one sentence naming the issue or pattern
- "evidence": the specific numbers from above that support it
- "cause": a plausible, grounded explanation (don't invent facts not in the data)
- "recommendation": one concrete action a business/data team could take
- "impact": one sentence on what this prevents or improves

Respond with ONLY a JSON array of 2-4 such objects, nothing else.
"""

    last_error = None

    for attempt in range(2):

        try:

            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=700
            )

            text = response.choices[0].message.content.strip()

            if text.startswith("```"):
                text = text.strip("`")
                if text.lower().startswith("json"):
                    text = text[4:].strip()

            cards = json.loads(text)

            required_keys = {"problem", "evidence", "cause", "recommendation", "impact"}

            if (
                isinstance(cards, list)
                and cards
                and all(isinstance(c, dict) and required_keys.issubset(c.keys()) for c in cards)
            ):
                return cards

            raise ValueError("Unexpected response shape from model")

        except Exception as e:

            last_error = e

            print(f"Business recommendations generation failed (attempt {attempt + 1}):", e)

            time.sleep(1.5)

    print("Business recommendations generation failed after retries, using fallback:", last_error)

    return _fallback_recommendations(result)