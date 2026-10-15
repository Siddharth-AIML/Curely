"""
Evaluate an already-trained Curely diabetes model.

Usage:
    python training/diabetes/evaluate.py \
        --data data/diabetes/diabetes.csv \
        --model models/diabetes/diabetes_xgboost.joblib
"""
from pathlib import Path
import argparse
import json

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, f1_score,
    precision_score, recall_score, roc_auc_score, confusion_matrix
)

FEATURES = [
    "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
    "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"
]

ZERO_AS_MISSING = [
    "Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True)
    parser.add_argument("--model", required=True)
    args = parser.parse_args()

    df = pd.read_csv(args.data)
    for col in ZERO_AS_MISSING:
        df.loc[df[col] == 0, col] = np.nan

    X = df[FEATURES]
    y = df["Outcome"].astype(int)

    # Same deterministic split as training.
    from sklearn.model_selection import train_test_split
    _, X_temp, _, y_temp = train_test_split(
        X, y, test_size=0.30, stratify=y, random_state=42
    )
    _, X_test, _, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=42
    )

    model = joblib.load(args.model)
    prob = model.predict_proba(X_test)[:, 1]
    pred = (prob >= 0.50).astype(int)

    metrics = {
        "accuracy": accuracy_score(y_test, pred),
        "balanced_accuracy": balanced_accuracy_score(y_test, pred),
        "precision": precision_score(y_test, pred, zero_division=0),
        "recall": recall_score(y_test, pred, zero_division=0),
        "f1": f1_score(y_test, pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, prob),
        "confusion_matrix": confusion_matrix(y_test, pred).tolist(),
    }

    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
