"""
Natural-language-to-analysis query engine.

Design choice: the LLM is asked to output a constrained JSON "operation
spec" (e.g. {"operation": "groupby_agg", "group_by": "Department", ...})
rather than raw Python/pandas code. The backend then validates that spec
against the actual dataframe's columns and interprets it using real
pandas calls. This means the AI never gets to execute arbitrary code
against the server — it only *selects* from a fixed, safe set of
operations, which the backend performs. This is what makes it safe to
run in production.
"""

import json
import operator as op_module

import pandas as pd

from services.ai_chat import client, MODEL_NAME


ALLOWED_OPERATIONS = {
    "groupby_agg",
    "value_counts",
    "describe_column",
    "correlation",
    "top_n",
    "filter_count",
    "overall_stats",
    "off_topic"
}

ALLOWED_AGG_FUNCS = {"mean", "sum", "count", "min", "max", "median"}

ALLOWED_OPERATORS = {"==", "!=", ">", ">=", "<", "<="}

OPERATOR_FUNCS = {
    "==": op_module.eq,
    "!=": op_module.ne,
    ">": op_module.gt,
    ">=": op_module.ge,
    "<": op_module.lt,
    "<=": op_module.le,
}


def _build_schema_context(df: pd.DataFrame) -> str:

    lines = []

    for col in df.columns:

        dtype = str(df[col].dtype)

        lines.append(f"- {col} ({dtype})")

    return "\n".join(lines)


def _extract_operation_spec(question: str, df: pd.DataFrame) -> dict:

    if client is None:
        raise RuntimeError("AI service is not configured.")

    schema = _build_schema_context(df)

    prompt = f"""You convert a business question about a dataset into a
JSON "operation spec" that a backend will execute. You do NOT write code.

Dataset columns:
{schema}

Supported operations (respond with exactly one, matching a column name
from the list above EXACTLY):

1. groupby_agg — group by a column, aggregate another column
   {{"operation": "groupby_agg", "group_by": "<column>", "agg_column": "<column>", "agg_func": "mean|sum|count|min|max|median", "sort": "asc|desc", "limit": <int>}}

2. value_counts — count occurrences of each category in a column
   {{"operation": "value_counts", "column": "<column>", "limit": <int>}}

3. describe_column — summary statistics for one numeric column
   {{"operation": "describe_column", "column": "<column>"}}

4. correlation — correlation between two numeric columns
   {{"operation": "correlation", "column_a": "<column>", "column_b": "<column>"}}

5. top_n — top N rows sorted by a column
   {{"operation": "top_n", "sort_column": "<column>", "sort": "asc|desc", "limit": <int>, "columns": ["<column>", ...]}}

6. filter_count — count rows where a column meets a condition
   {{"operation": "filter_count", "column": "<column>", "op": "==|!=|>|>=|<|<=", "value": <value>}}

7. overall_stats — general row/column/missing/duplicate counts for the
   WHOLE dataset (use only for genuine questions like "how many rows are
   there" or "how clean is this data" — not as a generic fallback)
   {{"operation": "overall_stats"}}

8. off_topic — the question is NOT asking you to compute, summarize, or
   look up anything about THIS dataset (e.g. greetings, general knowledge,
   casual conversation, coding help, jokes, anything unrelated to the
   data above). Use this whenever none of operations 1-7 is a genuine,
   specific match — do not force-fit an unrelated question into one of
   them just because it's the "closest" option.
   {{"operation": "off_topic"}}

Question: "{question}"

Respond with ONLY the JSON object for the single best-matching operation.
No explanation, no markdown fences.
"""

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=250
    )

    text = response.choices[0].message.content.strip()

    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:].strip()

    spec = json.loads(text)

    if not isinstance(spec, dict) or spec.get("operation") not in ALLOWED_OPERATIONS:
        raise ValueError("Model produced an unsupported operation.")

    if spec.get("operation") == "off_topic":
        raise ValueError("off_topic")

    return spec


def _validate_column(df: pd.DataFrame, name: str) -> str:

    if name not in df.columns:
        raise ValueError(f"Column '{name}' does not exist in this dataset.")

    return name


def _execute_spec(spec: dict, df: pd.DataFrame) -> dict:

    op = spec["operation"]

    if op == "groupby_agg":

        group_by = _validate_column(df, spec["group_by"])
        agg_column = _validate_column(df, spec["agg_column"])
        agg_func = spec.get("agg_func", "mean")

        if agg_func not in ALLOWED_AGG_FUNCS:
            raise ValueError(f"Unsupported aggregation '{agg_func}'.")

        limit = min(int(spec.get("limit", 10)), 50)
        ascending = spec.get("sort", "desc") != "desc"

        grouped = (
            df.groupby(group_by)[agg_column]
            .agg(agg_func)
            .sort_values(ascending=ascending)
            .head(limit)
        )

        table = [
            {group_by: str(idx), agg_column: round(float(val), 2) if pd.notna(val) else None}
            for idx, val in grouped.items()
        ]

        return {
            "type": "table",
            "columns": [group_by, agg_column],
            "rows": table
        }

    if op == "value_counts":

        column = _validate_column(df, spec["column"])
        limit = min(int(spec.get("limit", 10)), 50)

        counts = df[column].value_counts().head(limit)

        table = [
            {column: str(idx), "count": int(val)}
            for idx, val in counts.items()
        ]

        return {
            "type": "table",
            "columns": [column, "count"],
            "rows": table
        }

    if op == "describe_column":

        column = _validate_column(df, spec["column"])

        series = pd.to_numeric(df[column], errors="coerce").dropna()

        if series.empty:
            raise ValueError(f"'{column}' has no numeric values to describe.")

        stats = {
            "count": int(series.count()),
            "mean": round(float(series.mean()), 2),
            "min": round(float(series.min()), 2),
            "max": round(float(series.max()), 2),
            "std": round(float(series.std()), 2) if series.count() > 1 else 0
        }

        return {"type": "stats", "column": column, "stats": stats}

    if op == "correlation":

        col_a = _validate_column(df, spec["column_a"])
        col_b = _validate_column(df, spec["column_b"])

        series_a = pd.to_numeric(df[col_a], errors="coerce")
        series_b = pd.to_numeric(df[col_b], errors="coerce")

        corr = series_a.corr(series_b)

        if pd.isna(corr):
            raise ValueError(
                f"Could not compute a correlation between '{col_a}' and '{col_b}' "
                "(one or both may not be numeric)."
            )

        return {
            "type": "correlation",
            "column_a": col_a,
            "column_b": col_b,
            "value": round(float(corr), 3)
        }

    if op == "top_n":

        sort_column = _validate_column(df, spec["sort_column"])
        limit = min(int(spec.get("limit", 5)), 25)
        ascending = spec.get("sort", "desc") != "desc"

        requested_columns = spec.get("columns") or list(df.columns[:5])
        columns = [c for c in requested_columns if c in df.columns] or list(df.columns[:5])

        subset = df.sort_values(sort_column, ascending=ascending).head(limit)[columns]

        rows = subset.fillna("").astype(str).to_dict(orient="records")

        return {
            "type": "table",
            "columns": columns,
            "rows": rows
        }

    if op == "filter_count":

        column = _validate_column(df, spec["column"])
        operator = spec.get("op", "==")
        value = spec.get("value")

        if operator not in ALLOWED_OPERATORS:
            raise ValueError(f"Unsupported comparison operator '{operator}'.")

        series = df[column]

        # Try numeric comparison first, fall back to string equality
        try:
            numeric_series = pd.to_numeric(series, errors="raise")
            numeric_value = float(value)
            mask = OPERATOR_FUNCS[operator](numeric_series, numeric_value)
        except (ValueError, TypeError):
            if operator not in ("==", "!="):
                raise ValueError(
                    f"'{column}' is not numeric — only equals/not-equals "
                    "comparisons are supported for text columns."
                )
            mask = (series.astype(str) == str(value)) if operator == "==" else (series.astype(str) != str(value))

        return {
            "type": "count",
            "column": column,
            "condition": f"{operator} {value}",
            "value": int(mask.sum())
        }

    if op == "overall_stats":

        return {
            "type": "stats",
            "column": None,
            "stats": {
                "rows": int(len(df)),
                "columns": int(len(df.columns)),
                "missing_values": int(df.isnull().sum().sum()),
                "duplicate_rows": int(df.duplicated().sum())
            }
        }

    raise ValueError(f"Unhandled operation '{op}'.")


def _format_answer(question: str, spec: dict, result: dict) -> str:

    result_type = result["type"]

    if result_type == "table":

        columns = result["columns"]
        rows = result["rows"]

        if not rows:
            return "No matching results were found for that question."

        lines = [f"{r[columns[0]]}: {r[columns[1]]}" for r in rows[:5]]

        return "Here's what I found:\n" + "\n".join(f"- {line}" for line in lines)

    if result_type == "stats":

        stats = result["stats"]
        column = result.get("column")

        if column:
            return (
                f"'{column}' — count: {stats['count']}, mean: {stats['mean']}, "
                f"min: {stats['min']}, max: {stats['max']}, std dev: {stats['std']}"
            )

        return (
            f"{stats['rows']} rows, {stats['columns']} columns, "
            f"{stats['missing_values']} missing values, "
            f"{stats['duplicate_rows']} duplicate rows."
        )

    if result_type == "correlation":

        value = result["value"]

        strength = (
            "strong" if abs(value) >= 0.7 else
            "moderate" if abs(value) >= 0.3 else
            "weak"
        )

        direction = "positive" if value >= 0 else "negative"

        return (
            f"The correlation between '{result['column_a']}' and "
            f"'{result['column_b']}' is {value} — a {strength} {direction} relationship."
        )

    if result_type == "count":

        return f"{result['value']} rows match {result['column']} {result['condition']}."

    return "Here's the result."


def run_data_query(question: str, df: pd.DataFrame) -> dict:
    """
    Returns {"answer": str, "operation": dict, "result": dict}
    Raises ValueError with a user-facing message on failure.
    """

    spec = _extract_operation_spec(question, df)

    result = _execute_spec(spec, df)

    answer = _format_answer(question, spec, result)

    return {
        "answer": answer,
        "operation": spec,
        "result": result
    }