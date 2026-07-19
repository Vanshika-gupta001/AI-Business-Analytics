import pandas as pd

def answer_question(df: pd.DataFrame, question: str):
    question = question.lower()

    numeric_cols = df.select_dtypes(include="number")

    # simple rules first (fast + reliable)

    if "average" in question or "mean" in question:
        col = None
        for c in numeric_cols.columns:
            if c.lower() in question:
                col = c
                break

        if col:
            return f"The average {col} is {df[col].mean():.2f}"

    if "missing" in question:
        missing = df.isnull().sum()
        return missing.to_dict()

    if "rows" in question:
        return f"The dataset has {len(df)} rows"

    return "I am still learning this query type. Try asking about averages, missing values, or row counts."