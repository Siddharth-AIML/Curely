"""
Train Curely's diabetes risk screening model.

Dataset:
    Pima Indians Diabetes Database CSV with columns:
    Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin,
    BMI, DiabetesPedigreeFunction, Age, Outcome

Usage:
    python training/diabetes/train.py --data data/diabetes/diabetes.csv
"""
from pathlib import Path
import argparse
import json

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, classification_report,
    confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


FEATURES = [
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
    "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"
]
TARGET = "Outcome"

# In this dataset, zero is physiologically implausible for these measurements
# and is treated as missing before model training.
ZERO_AS_MISSING = [
    "Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True)
    parser.add_argument(
        "--output-dir",
        default="models/diabetes"
    )
    args = parser.parse_args()

    data_path = Path(args.data)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(data_path)

    missing = [c for c in FEATURES + [TARGET] if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns: {missing}")

    df = df[FEATURES + [TARGET]].copy()
    df = df.dropna(subset=[TARGET])

    for col in ZERO_AS_MISSING:
        df.loc[df[col] == 0, col] = np.nan

    X = df[FEATURES]
    y = df[TARGET].astype(int)

    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, stratify=y, random_state=42
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=42
    )

    # XGBoost does not require feature scaling. Median imputation keeps the
    # preprocessing deterministic and is saved with the model.
    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=3,
        learning_rate=0.035,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=2,
        reg_alpha=0.05,
        reg_lambda=1.5,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        n_jobs=4,
    )

    pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("model", model),
    ])

    pipeline.fit(X_train, y_train)

    val_prob = pipeline.predict_proba(X_val)[:, 1]
    # Fixed 0.50 threshold is kept for transparent portfolio behavior.
    val_pred = (val_prob >= 0.50).astype(int)

    test_prob = pipeline.predict_proba(X_test)[:, 1]
    test_pred = (test_prob >= 0.50).astype(int)

    metrics = {
        "dataset_rows": int(len(df)),
        "train_rows": int(len(X_train)),
        "validation_rows": int(len(X_val)),
        "test_rows": int(len(X_test)),
        "positive_rate": float(y.mean()),
        "accuracy": float(accuracy_score(y_test, test_pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y_test, test_pred)),
        "precision": float(precision_score(y_test, test_pred, zero_division=0)),
        "recall": float(recall_score(y_test, test_pred, zero_division=0)),
        "f1": float(f1_score(y_test, test_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, test_prob)),
        "confusion_matrix": confusion_matrix(y_test, test_pred).tolist(),
    }

    joblib.dump(pipeline, output_dir / "diabetes_xgboost.joblib")

    metadata = {
        "model_name": "Curely Diabetes Risk XGBoost",
        "model_version": "diabetes-xgb-v1",
        "features": FEATURES,
        "target": TARGET,
        "zero_as_missing": ZERO_AS_MISSING,
        "threshold": 0.50,
        "metrics": metrics,
        "note": (
            "Screening model for portfolio demonstration. "
            "Not a medical diagnostic device."
        ),
    }
    (output_dir / "metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )

    print("\n=== Curely Diabetes Model ===")
    for k, v in metrics.items():
        print(f"{k}: {v}")

    print(f"\nSaved: {output_dir / 'diabetes_xgboost.joblib'}")
    print(f"Saved: {output_dir / 'metadata.json'}")


if __name__ == "__main__":
    main()
