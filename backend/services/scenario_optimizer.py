"""
Strategic scenario simulator.

Design choice: instead of grid-searching every combination of business
variables (which scales exponentially — 4 variables x 20 steps each is
160,000 evaluations, each requiring a model.predict() call), this uses
Bayesian Optimization. A Gaussian Process surrogate models the response
surface from the points tried so far, and an Expected Improvement
acquisition function picks the next point most likely to improve on the
best result found. This reaches a near-optimal answer in ~20-30
evaluations instead of thousands — important on a CPU/time-constrained
free-tier host.

Reuses the exact model training logic from ml_model.py (via
_train_model_internal) so this stays in sync with the dashboard's
predictive modeling feature rather than drifting into a second,
inconsistent training path.
"""

import pandas as pd
from skopt import gp_minimize
from skopt.space import Real
from skopt.utils import use_named_args

from services.ml_model import _train_model_internal

# Kept low deliberately: each call is a full model.predict(), and this
# runs synchronously inside a request on a free-tier host.
MAX_ITERATIONS = 25


def _build_baseline_row(df: pd.DataFrame, target_column: str) -> dict:
    """
    Every feature not being actively searched is held constant at the
    dataset's median (numeric) or mode (categorical) — this isolates the
    effect of the controllable variables instead of letting the
    optimizer wander into unrealistic combinations of everything at once.
    """

    baseline = {}

    for col in df.columns:

        if col == target_column:
            continue

        if pd.api.types.is_numeric_dtype(df[col]):
            baseline[col] = float(df[col].median())
        else:
            mode = df[col].mode()
            baseline[col] = mode.iloc[0] if not mode.empty else "missing"

    return baseline


def _prepare_row(row_dict: dict, features_template: pd.DataFrame) -> pd.DataFrame:
    """
    Applies the same one-hot encoding used at training time to a single
    what-if row, then aligns its columns exactly to the trained model's
    feature columns. Any dummy column the training data produced that
    this specific row doesn't (e.g. a category this combination doesn't
    hit) is filled with 0; any extra column is dropped. Without this,
    model.predict() would fail on a shape mismatch almost every time.
    """

    row_df = pd.DataFrame([row_dict])

    categorical_cols = [c for c in row_df.columns if row_df[c].dtype == "object"]

    if categorical_cols:
        row_df = pd.get_dummies(row_df, columns=categorical_cols, drop_first=True)

    row_df = row_df.reindex(columns=features_template.columns, fill_value=0)

    return row_df


def _compute_sensitivity(
    df: pd.DataFrame,
    controllable_columns: list,
    model,
    features_template: pd.DataFrame,
    baseline: dict,
    best_values: dict,
) -> list:
    """
    For each controllable variable, holds every other variable at its
    optimized value and sweeps this one variable across its full
    observed range (min -> max), recording the model's predicted target
    at both ends. The resulting swing (high - low) shows how much this
    single lever can move the KPI on its own, all else held constant —
    the same idea as a traditional finance "tornado chart" / sensitivity
    analysis, just computed from a trained model instead of a manual
    spreadsheet formula. Sorted by impact so the most important lever
    is always first.
    """

    sensitivity = []

    for col in controllable_columns:

        col_min = float(df[col].min())
        col_max = float(df[col].max())

        row_low = {**baseline, **best_values, col: col_min}
        row_high = {**baseline, **best_values, col: col_max}

        pred_low = float(model.predict(_prepare_row(row_low, features_template))[0])
        pred_high = float(model.predict(_prepare_row(row_high, features_template))[0])

        lo, hi = (pred_low, pred_high) if pred_low <= pred_high else (pred_high, pred_low)

        sensitivity.append({
            "variable": col,
            "low_input": round(col_min, 4),
            "high_input": round(col_max, 4),
            "low_target": round(lo, 4),
            "high_target": round(hi, 4),
            "impact_range": round(hi - lo, 4),
        })

    sensitivity.sort(key=lambda s: s["impact_range"], reverse=True)

    return sensitivity


def optimize_scenario(
    df: pd.DataFrame,
    target_column: str,
    controllable_columns: list,
    direction: str = "maximize",
):
    """
    Finds the combination of `controllable_columns` values that
    maximizes/minimizes the model's predicted `target_column`, holding
    every other feature at its dataset median/mode.

    Only supports numeric controllable variables (price, budget, spend,
    etc.) — that covers the "adjust a KPI lever" use case this is built
    for. Categorical controllable variables would need a different
    search space type (skopt.space.Categorical) and are a reasonable
    follow-up, not included here to keep the search space simple.

    Returns a dict with the best values found, the model's predicted
    target at that point, and the full exploration trace (every point
    tried) — the trace is what powers the sensitivity chart in step 3
    of the roadmap.
    """

    if not controllable_columns:
        raise ValueError("At least one controllable variable is required.")

    if target_column in controllable_columns:
        raise ValueError("A controllable variable cannot be the target column.")

    for col in controllable_columns:

        if col not in df.columns:
            raise ValueError(f"Column '{col}' not found in dataset.")

        if not pd.api.types.is_numeric_dtype(df[col]):
            raise ValueError(
                f"'{col}' is not numeric — only numeric variables can be "
                "optimized (price, budget, spend, etc.)."
            )

    trained = _train_model_internal(df, target_column)

    model = trained["model"]
    features_template = trained["features_template"]
    problem_type = trained["problem_type"]

    if problem_type != "regression":
        raise ValueError(
            "Scenario optimization currently supports numeric (regression) "
            "targets only — choose a numeric target column with more than "
            "20 distinct values."
        )

    baseline = _build_baseline_row(df, target_column)

    space = []

    for col in controllable_columns:

        col_min = float(df[col].min())
        col_max = float(df[col].max())

        if col_min == col_max:
            col_max = col_min + 1.0  # avoid a zero-width search dimension

        space.append(Real(col_min, col_max, name=col))

    exploration_trace = []

    @use_named_args(space)
    def _objective(**values):

        row = baseline.copy()
        row.update(values)

        prepared = _prepare_row(row, features_template)
        prediction = float(model.predict(prepared)[0])

        exploration_trace.append({
            **{k: round(float(v), 4) for k, v in values.items()},
            target_column: round(prediction, 4)
        })

        # skopt always minimizes — negate the score when the goal is to maximize
        return -prediction if direction == "maximize" else prediction

    result = gp_minimize(
        _objective,
        space,
        n_calls=MAX_ITERATIONS,
        random_state=42,
        acq_func="EI",  # Expected Improvement
    )

    best_values = {
        dim.name: round(float(val), 4) for dim, val in zip(space, result.x)
    }

    best_score = -result.fun if direction == "maximize" else result.fun

    sensitivity = _compute_sensitivity(
        df=df,
        controllable_columns=controllable_columns,
        model=model,
        features_template=features_template,
        baseline=baseline,
        best_values=best_values,
    )

    return {
        "target_column": target_column,
        "direction": direction,
        "best_values": best_values,
        "predicted_target": round(float(best_score), 4),
        "iterations_run": MAX_ITERATIONS,
        "exploration_trace": exploration_trace,
        "sensitivity": sensitivity,
        "baseline_used": {
            k: v for k, v in baseline.items() if k not in controllable_columns
        },
    }