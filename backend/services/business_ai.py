from services.ai_chat import client, MODEL_NAME


def _build_context(result: dict) -> str:

    info = result.get("dataset_info", {}) or {}
    columns = result.get("column_summary", []) or []
    insights = result.get("insights", []) or []
    anomalies = result.get("anomalies", []) or []

    column_lines = [
        f"- {col.get('column')} ({col.get('type')}): "
        f"{col.get('missing')} missing, {col.get('unique')} unique values"
        for col in columns[:25]
    ]

    lines = [
        f"Rows: {info.get('rows')}, Columns: {info.get('columns')}",
        f"Numeric columns: {info.get('numeric_columns')}, "
        f"Categorical columns: {info.get('categorical_columns')}",
        f"Health score: {result.get('health_score')}/100 "
        f"(Grade {result.get('grade')})",
        "",
        "Columns:",
        *column_lines,
    ]

    if insights:
        lines += ["", "Key insights:"] + [f"- {i}" for i in insights[:10]]

    if anomalies:
        lines += ["", f"Anomalies detected: {len(anomalies)}"]

    return "\n".join(lines)


def _fallback_template_report(result: dict) -> str:
    """
    Used only if the AI call fails (no API key, rate limit, network issue)
    so the dashboard still shows something useful rather than an error.
    """

    health = result.get("health_score", 0)
    dataset = result.get("dataset_info", {})
    insights = result.get("insights", [])

    missing_values = 0
    duplicate_found = False

    for item in insights:

        if "missing values" in item:
            try:
                missing_values += int(item.split()[2])
            except Exception:
                pass

        if "duplicate" in item:
            duplicate_found = True

    summary = f"""
## Executive Summary

Dataset quality score is {health}/100, based on {dataset.get('rows')} rows
and {dataset.get('columns')} columns.
"""

    risks = "\n## Risks\n\n"

    if duplicate_found:
        risks += "- Duplicate records may introduce bias in analysis.\n"

    if missing_values > 0:
        risks += "- Missing values can impact model accuracy.\n"

    if not duplicate_found and missing_values == 0:
        risks += "- No major data quality risks detected.\n"

    steps = "\n## Recommended Next Steps\n\n"
    count = 1

    if duplicate_found:
        steps += f"{count}. Remove duplicate rows\n"
        count += 1

    if missing_values > 0:
        steps += f"{count}. Impute missing values\n"
        count += 1

    steps += f"{count}. Perform predictive modeling\n"

    return summary + risks + steps


def generate_business_report(result: dict) -> str:

    if client is None:
        return _fallback_template_report(result)

    context = _build_context(result)

    prompt = f"""You are a business data analyst writing a short report for a
non-technical stakeholder, based only on the dataset statistics below.

Dataset statistics:
{context}

Write the report using EXACTLY this structure (keep the "##" headers as
shown, plain text under each, "-" for bullet points, no other formatting):

## Executive Summary
2-3 sentences on overall data quality and what the dataset covers.

## Business Insights
2-4 bullet points on what the data suggests, grounded only in the
statistics given — do not invent numbers or facts not present above.

## Risks
2-3 bullet points on data quality risks (missing values, duplicates,
anomalies) based on the statistics above. If none are significant, say so.

## Recommended Next Steps
2-4 numbered, concrete next steps a data team could take with this dataset.
"""

    try:

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=700
        )

        report = response.choices[0].message.content

        if "##" not in report:
            raise ValueError("Model response missing expected section headers")

        return report

    except Exception as e:

        print("Business AI report generation failed, using fallback:", e)

        return _fallback_template_report(result)