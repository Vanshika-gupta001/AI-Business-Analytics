import os
import time

from dotenv import load_dotenv
from groq import Groq


load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=API_KEY) if API_KEY else None

MODEL_NAME = "openai/gpt-oss-120b"

MAX_HISTORY_MESSAGES = 8


def build_dataset_context(dataset: dict) -> str:
    """
    Build a compact, token-efficient summary of the dataset instead of
    dumping the full analysis payload (chart images, 200-row preview,
    the full business report) into every single prompt. This keeps
    requests small and well within the free-tier rate limits.
    """

    if not dataset:
        return "No dataset has been uploaded yet."

    info = dataset.get("dataset_info", {}) or {}
    columns = dataset.get("column_summary", []) or []
    insights = dataset.get("insights", []) or []

    column_lines = [
        f"- {col.get('column')} ({col.get('type')}): "
        f"{col.get('missing')} missing, {col.get('unique')} unique values"
        for col in columns[:25]
    ]

    lines = [
        f"Rows: {info.get('rows')}, Columns: {info.get('columns')}",
        f"Numeric columns: {info.get('numeric_columns')}, "
        f"Categorical columns: {info.get('categorical_columns')}",
        f"Health score: {dataset.get('health_score')}/100 "
        f"(Grade {dataset.get('grade')})",
        "",
        "Columns:",
        *column_lines,
    ]

    if insights:
        lines += ["", "Key insights:"] + [f"- {i}" for i in insights[:10]]

    return "\n".join(lines)


def build_history_messages(history: list) -> list:
    """
    Convert the frontend's {role: "user" | "ai", text} messages into
    Groq's OpenAI-style {role: "user" | "assistant", content} format.
    """

    if not history:
        return []

    trimmed = history[-MAX_HISTORY_MESSAGES:]

    messages = []

    for turn in trimmed:

        role = "user" if turn.get("role") == "user" else "assistant"

        messages.append({
            "role": role,
            "content": turn.get("text", "")
        })

    return messages


def generate_chat_response(message: str, dataset=None, history=None):

    if client is None:
        return "AI service is not configured (missing GROQ_API_KEY)."

    dataset_context = build_dataset_context(dataset)

    system_prompt = f"""You are the AI assistant inside "AI Business Analytics",
a data analytics dashboard. You are a helpful, general-purpose assistant —
answer any question the user asks, on any topic.

When the user's question is about their uploaded dataset, ground your
answer in the real numbers below rather than guessing:

Dataset summary:
{dataset_context}

Instructions:
- If the question relates to the dataset, use the summary above — don't
  invent numbers that aren't in it.
- If the question is unrelated to the dataset, just answer it normally,
  like any helpful assistant would.
- Keep answers concise (2-5 sentences unless more detail is asked for).
- Use markdown (lists, bold) when it improves readability.
- Do not repeat the full dataset summary back to the user.
"""

    messages = (
        [{"role": "system", "content": system_prompt}]
        + build_history_messages(history)
        + [{"role": "user", "content": message}]
    )

    last_error = None

    for attempt in range(2):

        try:

            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                temperature=0.4,
                max_tokens=600
            )

            return response.choices[0].message.content

        except Exception as e:

            last_error = e

            print(f"Groq chat error (attempt {attempt + 1}):", e)

            time.sleep(1.5)

    error_text = str(last_error).lower()

    if "rate_limit" in error_text or "429" in error_text:

        return (
            "I've hit the AI service's rate limit for now. "
            "Please wait a minute and try again."
        )

    return "AI service is temporarily unavailable. Please try again shortly."