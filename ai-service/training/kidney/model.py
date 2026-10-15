"""Leakage-safe preprocessing and candidate estimator construction."""
from __future__ import annotations

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from training.kidney.config import CATEGORICAL_FEATURES, NUMERIC_FEATURES

RANDOM_STATE = 42


def build_pipeline(model_name: str) -> Pipeline:
    numeric_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median", keep_empty_features=True)),
        ("scaler", StandardScaler()),
    ])
    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent", keep_empty_features=True)),
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ])
    preprocessor = ColumnTransformer([
        ("numeric", numeric_pipeline, NUMERIC_FEATURES),
        ("categorical", categorical_pipeline, CATEGORICAL_FEATURES),
    ])

    if model_name == "logistic_regression":
        estimator = LogisticRegression(
            class_weight="balanced",
            max_iter=2000,
            random_state=RANDOM_STATE,
        )
    elif model_name == "random_forest":
        estimator = RandomForestClassifier(
            n_estimators=400,
            max_depth=8,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )
    elif model_name == "extra_trees":
        estimator = ExtraTreesClassifier(
            n_estimators=400,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )
    else:
        raise ValueError(f"Unknown kidney model candidate: {model_name}")

    return Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", estimator),
    ])


def candidate_model_names() -> tuple[str, ...]:
    return ("logistic_regression", "random_forest", "extra_trees")
