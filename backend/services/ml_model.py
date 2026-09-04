import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    r2_score,
    mean_absolute_error,
    mean_squared_error
)

# If a "categorical" target has more unique values than this, treat it as
# too high-cardinality to be a sensible classification target.
MAX_CLASSIFICATION_CLASSES = 20

# Columns with more unique values than this fraction of the dataset are
# dropped as features (likely IDs, not predictive signal).
MAX_CATEGORICAL_CARDINALITY = 30

# A baseline RandomForest is memory-heavy on a 200k-row dataset and
# unnecessary for a baseline model; 20k rows is plenty for a meaningful
# directional result while staying within tight free-tier memory limits.
MAX_TRAINING_ROWS = 20000

LOW_SAMPLE_THRESHOLD = 200


def _prepare_features(df: pd.DataFrame, target_column: str):

    features = df.drop(columns=[target_column]).copy()

    # Drop columns that are almost certainly identifiers, not signal
    for col in features.columns:

        if features[col].dtype == "object":

            if features[col].nunique() > MAX_CATEGORICAL_CARDINALITY:
                features = features.drop(columns=[col])

    numeric_cols = features.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = features.select_dtypes(exclude=[np.number]).columns.tolist()

    # Impute: numeric -> median, categorical -> mode
    for col in numeric_cols:
        features[col] = features[col].fillna(features[col].median())

    for col in categorical_cols:
        mode = features[col].mode()
        fill_value = mode.iloc[0] if not mode.empty else "missing"
        features[col] = features[col].fillna(fill_value)

    # One-hot encode remaining categoricals
    if categorical_cols:
        features = pd.get_dummies(features, columns=categorical_cols, drop_first=True)

    return features


def _train_model_internal(df: pd.DataFrame, target_column: str):
    """
    Does the actual training and returns the live model object plus
    everything needed to predict on new rows later (feature template,
    label encoder, problem type). Split out from train_baseline_model so
    the trained model can be reused by scenario_optimizer.py without
    duplicating this logic or re-deriving problem_type/feature prep by
    hand.

    Returns: (model, features_template, label_encoder, problem_type,
              working_df_used_for_training)
    """

    if target_column not in df.columns:
        raise ValueError(f"Column '{target_column}' not found in dataset.")

    working_df = df.dropna(subset=[target_column]).copy()

    if len(working_df) > MAX_TRAINING_ROWS:
        working_df = working_df.sample(n=MAX_TRAINING_ROWS, random_state=42)

    if len(working_df) < 20:
        raise ValueError(
            "Not enough rows with a valid target value to train a model "
            "(need at least 20)."
        )

    target = working_df[target_column]

    is_numeric_target = pd.api.types.is_numeric_dtype(target)
    unique_values = target.nunique()

    if is_numeric_target and unique_values > MAX_CLASSIFICATION_CLASSES:
        problem_type = "regression"
    else:
        if unique_values > MAX_CLASSIFICATION_CLASSES:
            raise ValueError(
                f"'{target_column}' has {unique_values} unique values — too many "
                "distinct categories for classification. Choose a numeric column "
                "for regression, or a column with fewer categories."
            )
        problem_type = "classification"

    features = _prepare_features(working_df, target_column)

    if features.shape[1] == 0:
        raise ValueError(
            "No usable feature columns remain after preprocessing "
            "(all columns were dropped as identifiers or were the target)."
        )

    label_encoder = None

    if problem_type == "classification":
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(target.astype(str))
    else:
        y = target.values

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        y,
        test_size=0.2,
        random_state=42
    )

    if problem_type == "classification":
        model = RandomForestClassifier(
            n_estimators=60,
            max_depth=None,
            random_state=42,
            n_jobs=-1
        )
    else:
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=None,
            random_state=42,
            n_jobs=-1
        )

    model.fit(x_train, y_train)

    return {
        "model": model,
        "features_template": features,
        "label_encoder": label_encoder,
        "problem_type": problem_type,
        "working_df": working_df,
        "x_test": x_test,
        "y_test": y_test,
    }


def train_baseline_model(df: pd.DataFrame, target_column: str):
    """
    Public API — unchanged from before. Trains a model and returns
    metrics/feature importance for the dashboard. Internally now backed
    by _train_model_internal so training logic lives in one place.
    """

    trained = _train_model_internal(df, target_column)

    model = trained["model"]
    problem_type = trained["problem_type"]
    features = trained["features_template"]
    working_df = trained["working_df"]
    x_test = trained["x_test"]
    y_test = trained["y_test"]

    predictions = model.predict(x_test)

    if problem_type == "classification":
        metrics = {
            "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
            "precision": round(
                float(precision_score(y_test, predictions, average="weighted", zero_division=0)), 4
            ),
            "recall": round(
                float(recall_score(y_test, predictions, average="weighted", zero_division=0)), 4
            ),
            "f1_score": round(
                float(f1_score(y_test, predictions, average="weighted", zero_division=0)), 4
            )
        }
    else:
        rmse = float(np.sqrt(mean_squared_error(y_test, predictions)))
        metrics = {
            "r2_score": round(float(r2_score(y_test, predictions)), 4),
            "mae": round(float(mean_absolute_error(y_test, predictions)), 4),
            "rmse": round(rmse, 4)
        }

    importance_pairs = sorted(
        zip(features.columns, model.feature_importances_),
        key=lambda pair: pair[1],
        reverse=True
    )[:10]

    feature_importance = [
        {"feature": name, "importance": round(float(score), 4)}
        for name, score in importance_pairs
    ]

    return {
        "problem_type": problem_type,
        "algorithm": (
            "Random Forest Classifier"
            if problem_type == "classification"
            else "Random Forest Regressor"
        ),
        "target_column": target_column,
        "rows_used": int(len(working_df)),
        "train_rows": int(len(x_test) * 4),  # matches original 80/20 split reporting
        "test_rows": int(len(x_test)),
        "feature_count": int(features.shape[1]),
        "metrics": metrics,
        "feature_importance": feature_importance,
        "low_sample_warning": len(working_df) < LOW_SAMPLE_THRESHOLD
    }