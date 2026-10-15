"""Load and run the saved symptom classifier using its persisted feature order."""

from __future__ import annotations

import logging
import math
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.naive_bayes import BernoulliNB, MultinomialNB

from utils.symptom_mapping import build_symptom_schema

logger = logging.getLogger(__name__)
MODEL_PATH = Path(__file__).resolve().parent / "models" / "disease_model.pkl"
MODEL_NAME = "Bernoulli Naive Bayes belief network"


class SymptomModelUnavailableError(RuntimeError):
    """The saved classifier is absent or inconsistent with its feature metadata."""


@lru_cache(maxsize=1)
def _load_model() -> tuple[Any, list[str], list[str], list[dict[str, Any]]]:
    if not MODEL_PATH.is_file():
        raise SymptomModelUnavailableError("The symptom model artifact is missing.")
    try:
        artifact = joblib.load(MODEL_PATH)
    except Exception as exc:
        logger.exception("Unable to load the symptom model")
        raise SymptomModelUnavailableError("The symptom model artifact could not be loaded.") from exc

    if not isinstance(artifact, (tuple, list)) or len(artifact) != 3:
        raise SymptomModelUnavailableError("The symptom model artifact has an unsupported format.")

    model, features, saved_diseases = artifact
    if (
        not isinstance(features, list)
        or any(not isinstance(feature, str) or not feature.strip() for feature in features)
        or len(set(features)) != len(features)
        or not isinstance(model, (BernoulliNB, MultinomialNB))
        or not callable(getattr(model, "predict_proba", None))
        or getattr(model, "n_features_in_", None) != len(features)
    ):
        raise SymptomModelUnavailableError("The symptom model feature schema is incompatible.")
    fitted_features = getattr(model, "feature_names_in_", None)
    if fitted_features is not None and list(fitted_features) != features:
        raise SymptomModelUnavailableError("The symptom model feature order is incompatible.")

    classes = getattr(model, "classes_", None)
    if classes is None:
        raise SymptomModelUnavailableError("The symptom model has no disease classes.")
    diseases = [str(value) for value in np.asarray(classes).tolist()]
    if not diseases or len(set(diseases)) != len(diseases):
        raise SymptomModelUnavailableError("The symptom model disease classes are invalid.")
    if (
        not isinstance(saved_diseases, list)
        or set(map(str, saved_diseases)) != set(diseases)
    ):
        raise SymptomModelUnavailableError("The saved disease labels do not match the classifier.")
    class_counts = np.asarray(getattr(model, "class_count_", []), dtype=float)
    feature_counts = np.asarray(getattr(model, "feature_count_", []), dtype=float)
    class_log_priors = np.asarray(getattr(model, "class_log_prior_", []), dtype=float)
    if (
        class_counts.shape != (len(diseases),)
        or feature_counts.shape != (len(diseases), len(features))
        or class_log_priors.shape != (len(diseases),)
        or not np.isfinite(class_counts).all()
        or not np.isfinite(feature_counts).all()
        or not np.isfinite(class_log_priors).all()
        or (class_counts <= 0).any()
        or (feature_counts < 0).any()
        or (feature_counts > class_counts[:, None] + 1e-9).any()
        or not math.isclose(
            float(np.exp(class_log_priors).sum()),
            1.0,
            rel_tol=1e-6,
            abs_tol=1e-6,
        )
    ):
        raise SymptomModelUnavailableError(
            "The saved classifier does not contain valid binary symptom probability tables."
        )
    alpha = getattr(model, "alpha", None)
    if isinstance(alpha, bool) or not isinstance(alpha, (int, float, np.number)):
        raise SymptomModelUnavailableError("The saved symptom smoothing parameter is invalid.")
    if not math.isfinite(float(alpha)) or float(alpha) <= 0:
        raise SymptomModelUnavailableError("The saved symptom smoothing parameter is invalid.")
    try:
        schema = build_symptom_schema(features)
    except ValueError as exc:
        raise SymptomModelUnavailableError("The symptom model symptom schema is invalid.") from exc
    return model, features, diseases, schema


def get_model_info() -> dict[str, Any]:
    model, features, diseases, schema = _load_model()
    return {
        "model_name": MODEL_NAME,
        "model_type": "Disease root with conditionally independent binary symptom nodes",
        "source_estimator": type(model).__name__,
        "symptoms": schema,
        "disease_count": len(diseases),
        "symptom_count": len(features),
        "probabilities_calibrated": False,
    }


def predict_disease(symptom_ids: list[str], top_k: int = 5) -> dict[str, Any]:
    """Infer actual class probabilities for the explicitly selected evidence."""
    model, _, diseases, schema = _load_model()
    if not isinstance(symptom_ids, list) or not symptom_ids:
        raise ValueError("Select at least one supported symptom.")
    if isinstance(top_k, bool) or not isinstance(top_k, int) or not 1 <= top_k <= 10:
        raise ValueError("The result limit must be between 1 and 10.")

    entry_by_id = {entry["id"]: entry for entry in schema}
    if any(not isinstance(symptom_id, str) or symptom_id not in entry_by_id for symptom_id in symptom_ids):
        raise ValueError("One or more selected symptoms are not supported by this model.")
    unique_ids = list(dict.fromkeys(symptom_ids))
    feature_index_by_id = {
        entry["id"]: index
        for index, entry in enumerate(schema)
    }
    class_counts = np.asarray(model.class_count_, dtype=float)
    feature_counts = np.asarray(model.feature_count_, dtype=float)
    class_log_priors = np.asarray(model.class_log_prior_, dtype=float)
    alpha = float(model.alpha)
    symptom_probabilities = (
        (feature_counts + alpha) / (class_counts[:, None] + 2 * alpha)
    )
    observed_indices = [feature_index_by_id[symptom_id] for symptom_id in unique_ids]

    try:
        # Unmentioned symptoms are marginalized; only reported-present evidence contributes.
        log_scores = class_log_priors + np.log(
            symptom_probabilities[:, observed_indices]
        ).sum(axis=1)
        log_scores -= log_scores.max()
        probabilities = np.exp(log_scores)
        probabilities /= probabilities.sum()
    except Exception as exc:
        logger.exception("Symptom belief-network inference failed")
        raise RuntimeError("Symptom inference failed.") from exc

    if (
        probabilities.shape != (len(diseases),)
        or not np.isfinite(probabilities).all()
        or (probabilities < 0).any()
        or (probabilities > 1).any()
        or not math.isclose(float(probabilities.sum()), 1.0, rel_tol=1e-6, abs_tol=1e-6)
    ):
        raise RuntimeError("The symptom classifier returned invalid probabilities.")

    order = np.argsort(probabilities)[::-1][:top_k]
    return {
        "results": [
            {"disease": diseases[index], "probability": float(probabilities[index])}
            for index in order
        ],
        "accepted_evidence": [
            {"id": symptom_id, "label": entry_by_id[symptom_id]["name"]}
            for symptom_id in unique_ids
        ],
        "model_name": MODEL_NAME,
        "probability_description": (
            "Posterior from a disease-root Bernoulli Naive Bayes network using "
            "Laplace-smoothed probabilities derived from the saved training counts; "
            "uncalibrated and not a clinical risk."
        ),
        "probabilities_calibrated": False,
        "disease_distribution_size": len(diseases),
    }
