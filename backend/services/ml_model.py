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


def train_baseline_model(df: pd.DataFrame, target_column: str):

    if target_column not in df.columns:
        raise ValueError(f"Column '{target_column}' not found in dataset.")

    working_df = df.dropna(subset=[target_column]).copy()

    if len(working_df) < 20:
        raise ValueError(
            "Not enough rows with a valid target value to train a model "
            "(need at least 20)."
        )

    target = working_df[target_column]

    is_numeric_target = pd.api.types.is_numeric_dtype(target)
    unique_values = target.nunique()

    # Decide problem type: numeric target with many distinct values -> regression.
    # Otherwise -> classification.
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
            n_estimators=200,
            max_depth=None,
            random_state=42,
            n_jobs=-1
        )

        model.fit(x_train, y_train)

        predictions = model.predict(x_test)

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

        model = RandomForestRegressor(
            n_estimators=200,
            max_depth=None,
            random_state=42,
            n_jobs=-1
        )

        model.fit(x_train, y_train)

        predictions = model.predict(x_test)

        rmse = float(np.sqrt(mean_squared_error(y_test, predictions)))

        metrics = {
            "r2_score": round(float(r2_score(y_test, predictions)), 4),
            "mae": round(float(mean_absolute_error(y_test, predictions)), 4),
            "rmse": round(rmse, 4)
        }

    # Feature importance (top 10)
    importance_pairs = sorted(
        zip(features.columns, model.feature_importances_),
        key=lambda pair: pair[1],
        reverse=True
    )[:10]

    feature_importance = [
        {"feature": name, "importance": round(float(score), 4)}
        for name, score in importance_pairs
    ]

    LOW_SAMPLE_THRESHOLD = 200

    return {
        "problem_type": problem_type,
        "algorithm": (
            "Random Forest Classifier"
            if problem_type == "classification"
            else "Random Forest Regressor"
        ),
        "target_column": target_column,
        "rows_used": int(len(working_df)),
        "train_rows": int(len(x_train)),
        "test_rows": int(len(x_test)),
        "feature_count": int(features.shape[1]),
        "metrics": metrics,
        "feature_importance": feature_importance,
        "low_sample_warning": len(working_df) < LOW_SAMPLE_THRESHOLD
    }