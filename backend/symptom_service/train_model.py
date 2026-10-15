"""Train the supported Multinomial Naive Bayes symptom classifier."""

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import BernoulliNB

SERVICE_DIR = Path(__file__).resolve().parent
DEFAULT_DATASET = SERVICE_DIR / "data" / "diseases.csv"
DEFAULT_MODEL = SERVICE_DIR / "models" / "disease_model.pkl"
TARGET_COLUMN = "diseases"
MAX_DISEASES = 500


def train_model(dataset_path: Path, output_path: Path) -> None:
    if not dataset_path.is_file():
        raise FileNotFoundError(
            f"Training dataset not found at {dataset_path}. "
            "Provide the authorized diseases.csv dataset before retraining."
        )
    frame = pd.read_csv(dataset_path)
    if TARGET_COLUMN not in frame.columns:
        raise ValueError(f"Dataset must contain the {TARGET_COLUMN!r} target column.")
    if frame.empty or len(frame.columns) < 2:
        raise ValueError("Training dataset must contain rows, symptom features, and a target.")

    top_diseases = frame[TARGET_COLUMN].value_counts().head(MAX_DISEASES).index
    frame = frame[frame[TARGET_COLUMN].isin(top_diseases)].copy()
    features = frame.drop(columns=[TARGET_COLUMN])
    if features.empty or not all(pd.api.types.is_numeric_dtype(dtype) for dtype in features.dtypes):
        raise ValueError("All symptom feature columns must be numeric.")
    if features.isna().any().any() or not features.isin([0, 1]).all().all():
        raise ValueError("Symptom feature values must be present binary indicators (0 or 1).")
    if frame[TARGET_COLUMN].value_counts().min() < 2:
        raise ValueError("Each retained disease class needs at least two rows for stratified splitting.")

    x_train, _x_test, y_train, _y_test = train_test_split(
        features,
        frame[TARGET_COLUMN],
        test_size=0.2,
        random_state=42,
        stratify=frame[TARGET_COLUMN],
    )
    model = BernoulliNB(alpha=1.0, binarize=None)
    model.fit(x_train, y_train)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump((model, list(features.columns), list(top_diseases)), output_path)
    print(
        f"Saved {type(model).__name__} with {len(features.columns)} binary symptoms "
        f"and {len(model.classes_)} disease classes to {output_path}"
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--output", type=Path, default=DEFAULT_MODEL)
    args = parser.parse_args()
    train_model(args.dataset, args.output)
