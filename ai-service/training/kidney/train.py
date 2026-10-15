"""Train and evaluate kidney disease classifiers from the supplied ARFF files."""
from __future__ import annotations

import argparse
import hashlib
import json
import platform
import warnings
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split

from training.kidney.config import (
    CATEGORICAL_FEATURES,
    COMPARISON_DATA_PATH,
    DEFAULT_DATA_PATH,
    FEATURE_DETAILS,
    HUMAN_LABELS,
    INPUT_FEATURES,
    METADATA_PATH,
    MODEL_DIR,
    NUMERIC_FEATURES,
    PIPELINE_PATH,
    TARGET_FEATURE,
    TARGET_LABELS,
)
from training.kidney.model import RANDOM_STATE, build_pipeline, candidate_model_names
from training.kidney.preprocess import compare_dataset_sources, load_kidney_arff


def _scoring() -> dict[str, str]:
    return {
        "accuracy": "accuracy",
        "balanced_accuracy": "balanced_accuracy",
        "precision": "precision",
        "recall": "recall",
        "f1": "f1",
        "roc_auc": "roc_auc",
    }


def _metric_summary(y_true: pd.Series, predictions: np.ndarray, probabilities: np.ndarray) -> dict[str, Any]:
    return {
        "accuracy": float(accuracy_score(y_true, predictions)),
        "balanced_accuracy": float(balanced_accuracy_score(y_true, predictions)),
        "precision_ckd": float(precision_score(y_true, predictions, pos_label=1, zero_division=0)),
        "recall_ckd": float(recall_score(y_true, predictions, pos_label=1, zero_division=0)),
        "f1_ckd": float(f1_score(y_true, predictions, pos_label=1, zero_division=0)),
        "roc_auc_ckd": float(roc_auc_score(y_true, probabilities)),
        "confusion_matrix_labels": ["notckd", "ckd"],
        "confusion_matrix": confusion_matrix(y_true, predictions, labels=[0, 1]).tolist(),
    }


def _feature_schema(dataset_info: dict[str, Any]) -> list[dict[str, Any]]:
    schema = []
    for name in INPUT_FEATURES:
        label, units, description = FEATURE_DETAILS[name]
        feature = {
            "name": name,
            "label": label,
            "type": "numeric" if name in NUMERIC_FEATURES else "categorical",
            "units": units,
            "description": description,
            "minimum": 0 if name in NUMERIC_FEATURES else None,
            "categories": dataset_info["categorical_values"].get(name, []),
        }
        schema.append(feature)
    return schema


def train(data_path: Path = DEFAULT_DATA_PATH, output_dir: Path = MODEL_DIR) -> dict[str, Any]:
    data_path = data_path.resolve()
    frame, dataset_info = load_kidney_arff(data_path)
    comparison = None
    if data_path == DEFAULT_DATA_PATH.resolve():
        comparison = compare_dataset_sources(data_path, COMPARISON_DATA_PATH)

    x = frame[INPUT_FEATURES]
    y = frame[TARGET_FEATURE].map(TARGET_LABELS).astype(int)
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.20,
        stratify=y,
        random_state=RANDOM_STATE,
    )

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    candidate_results: dict[str, Any] = {}
    candidate_scores: dict[str, float] = {}
    for name in candidate_model_names():
        pipeline = build_pipeline(name)
        scores = cross_validate(
            pipeline,
            x_train,
            y_train,
            cv=cv,
            scoring=_scoring(),
            return_train_score=False,
            error_score="raise",
            n_jobs=1,
        )
        candidate_results[name] = {
            metric: {
                "mean": float(np.mean(scores[f"test_{metric}"])),
                "std": float(np.std(scores[f"test_{metric}"])),
                "folds": [float(value) for value in scores[f"test_{metric}"]],
            }
            for metric in _scoring()
        }
        candidate_scores[name] = candidate_results[name]["balanced_accuracy"]["mean"]

    selected_name = max(
        candidate_model_names(),
        key=lambda name: (
            candidate_scores[name],
            candidate_results[name]["f1"]["mean"],
            candidate_results[name]["roc_auc"]["mean"],
        ),
    )
    evaluation_pipeline = build_pipeline(selected_name)
    evaluation_pipeline.fit(x_train, y_train)
    predictions = evaluation_pipeline.predict(x_test)
    probabilities = evaluation_pipeline.predict_proba(x_test)[:, 1]
    holdout_metrics = _metric_summary(y_test, predictions, probabilities)

    final_pipeline = build_pipeline(selected_name)
    final_pipeline.fit(x, y)
    output_dir.mkdir(parents=True, exist_ok=True)
    pipeline_path = output_dir / PIPELINE_PATH.name
    metadata_path = output_dir / METADATA_PATH.name
    joblib.dump(final_pipeline, pipeline_path)

    metadata: dict[str, Any] = {
        "model_name": selected_name,
        "model_type": type(final_pipeline.named_steps["classifier"]).__name__,
        "pipeline": ["median imputation + standard scaling for numeric inputs",
                     "most-frequent imputation + one-hot encoding for categorical inputs",
                     "fitted classifier"],
        "input_features": INPUT_FEATURES,
        "feature_schema": _feature_schema(dataset_info),
        "categorical_encodings": {
            name: dataset_info["categorical_values"][name]
            for name in CATEGORICAL_FEATURES
        },
        "target_feature": TARGET_FEATURE,
        "target_label_mapping": {
            str(label): {
                "encoded_value": encoded,
                "display_label": HUMAN_LABELS[label],
            }
            for label, encoded in TARGET_LABELS.items()
        },
        "positive_class": "ckd",
        "training_dataset": {
            "provenance": "Chronic Kidney Disease dataset, source information included in the supplied dataset info file (July 2015).",
            "source_file": (
                data_path.relative_to(DEFAULT_DATA_PATH.parents[2]).as_posix()
                if data_path.is_relative_to(DEFAULT_DATA_PATH.parents[2])
                else data_path.name
            ),
            "source_sha256": hashlib.sha256(data_path.read_bytes()).hexdigest(),
            "comparison": comparison,
            "usable_rows": dataset_info["row_count"],
            "class_counts": dataset_info["class_counts"],
            "missing_values": dataset_info["missing_values"],
            "repaired_trailing_empty_cells": dataset_info["repaired_trailing_empty_cells"],
            "dropped_malformed_rows": dataset_info["dropped_malformed_rows"],
        },
        "training_configuration": {
            "random_state": RANDOM_STATE,
            "test_size": 0.20,
            "cross_validation": "5-fold stratified CV on training split",
            "selection_metric": "mean cross-validation balanced accuracy",
            "class_imbalance": "class_weight=balanced; no resampling",
            "candidate_models": list(candidate_model_names()),
            "selected_model_parameters": final_pipeline.named_steps[
                "classifier"
            ].get_params(deep=False),
        },
        "cross_validation_results": candidate_results,
        "holdout_metrics": holdout_metrics,
        "class_probability_semantics": (
            "The classifier's predict_proba output for class ckd; a model estimate, "
            "not a calibrated clinical certainty or diagnosis."
        ),
        "limitations": [
            "Small historical dataset with missing values and a single source.",
            "No external clinical validation has been performed.",
            "One structurally malformed row was excluded rather than guessed.",
        ],
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "python_version": platform.python_version(),
        "library_versions": {
            "scikit_learn": sklearn.__version__,
            "pandas": pd.__version__,
            "numpy": np.__version__,
            "joblib": joblib.__version__,
        },
        "artifact": pipeline_path.name,
    }
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    # Verify serialization with a synthetic row from the training schema.
    reloaded = joblib.load(pipeline_path)
    verification_row = x.iloc[[0]]
    original_prediction = final_pipeline.predict(verification_row)
    reloaded_prediction = reloaded.predict(verification_row)
    if not np.array_equal(original_prediction, reloaded_prediction):
        raise RuntimeError("Saved kidney pipeline did not reproduce its prediction after reload.")

    result = {
        "selected_model": selected_name,
        "holdout_metrics": holdout_metrics,
        "candidate_cv_balanced_accuracy": candidate_scores,
        "pipeline_path": str(pipeline_path),
        "metadata_path": str(metadata_path),
        "dataset": dataset_info,
    }
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_PATH)
    parser.add_argument("--output-dir", type=Path, default=MODEL_DIR)
    args = parser.parse_args()
    with warnings.catch_warnings():
        warnings.simplefilter("default")
        result = train(args.data, args.output_dir)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
