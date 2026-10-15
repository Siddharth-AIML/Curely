"""Load and serve Curely's fitted kidney disease classification pipeline."""
from __future__ import annotations

import json
import logging
import math
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

SERVICE_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = SERVICE_ROOT / "models" / "kidney" / "kidney_pipeline.joblib"
METADATA_PATH = SERVICE_ROOT / "models" / "kidney" / "metadata.json"


class KidneyModelUnavailableError(RuntimeError):
    """Raised when the trained artifact or its metadata cannot be loaded."""


class KidneyInputError(ValueError):
    """Raised when values do not conform to the trained kidney input schema."""


class KidneyPredictor:
    def __init__(
        self,
        model_path: Path = MODEL_PATH,
        metadata_path: Path = METADATA_PATH,
    ) -> None:
        if not model_path.is_file() or not metadata_path.is_file():
            raise KidneyModelUnavailableError(
                "Kidney prediction model artifacts are not installed."
            )

        try:
            self.pipeline = joblib.load(model_path)
            self.metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        except Exception as exc:
            logger.exception("Unable to load kidney prediction artifacts")
            raise KidneyModelUnavailableError(
                "Kidney prediction model artifacts could not be loaded."
            ) from exc

        self.features = self.metadata.get("input_features")
        self.feature_schema = self.metadata.get("feature_schema")
        self.target_mapping = self.metadata.get("target_label_mapping")
        self.positive_class = self.metadata.get("positive_class")

        schema_is_valid = (
            isinstance(self.feature_schema, list)
            and all(isinstance(item, dict) for item in self.feature_schema)
            and [item.get("name") for item in self.feature_schema]
            == self.features
        )
        if (
            not isinstance(self.features, list)
            or not self.features
            or not schema_is_valid
            or not isinstance(self.target_mapping, dict)
            or not self.positive_class
        ):
            raise KidneyModelUnavailableError(
                "Kidney prediction model metadata is incompatible."
            )

        expected_count = getattr(self.pipeline, "n_features_in_", None)
        if expected_count != len(self.features):
            raise KidneyModelUnavailableError(
                "Kidney prediction model feature count does not match its metadata."
            )
        fitted_features = getattr(self.pipeline, "feature_names_in_", None)
        if fitted_features is not None and list(fitted_features) != self.features:
            raise KidneyModelUnavailableError(
                "Kidney prediction model feature order does not match its metadata."
            )

        classes = getattr(self.pipeline, "classes_", None)
        encoded_classes = {
            item.get("encoded_value")
            for item in self.target_mapping.values()
            if isinstance(item, dict)
        }
        if classes is None or set(np.asarray(classes).tolist()) != encoded_classes:
            raise KidneyModelUnavailableError(
                "Kidney prediction model classes do not match its metadata."
            )

        if not callable(getattr(self.pipeline, "predict", None)):
            raise KidneyModelUnavailableError(
                "Kidney prediction model does not support prediction."
            )

        self.label_by_encoded_value = {
            item["encoded_value"]: label
            for label, item in self.target_mapping.items()
        }
        if self.positive_class not in self.target_mapping:
            raise KidneyModelUnavailableError(
                "Kidney prediction positive class is not mapped."
            )

    def validate_input(self, payload: Any) -> dict[str, Any]:
        if not isinstance(payload, dict):
            raise KidneyInputError("A JSON object containing kidney inputs is required.")

        missing = [feature for feature in self.features if feature not in payload]
        extra = sorted(set(payload) - set(self.features))
        if missing:
            raise KidneyInputError(f"Missing required fields: {', '.join(missing)}.")
        if extra:
            raise KidneyInputError(f"Unexpected fields: {', '.join(extra)}.")

        validated: dict[str, Any] = {}
        for item in self.feature_schema:
            name = item["name"]
            value = payload[name]
            if value is None:
                raise KidneyInputError(f"{item['label']} is required.")

            if item["type"] == "numeric":
                if isinstance(value, bool) or not isinstance(value, (int, float)):
                    raise KidneyInputError(f"{item['label']} must be a number.")
                if not math.isfinite(float(value)):
                    raise KidneyInputError(f"{item['label']} must be finite.")
                minimum = item.get("minimum")
                if minimum is not None and value < minimum:
                    raise KidneyInputError(
                        f"{item['label']} must be at least {minimum}."
                    )
                validated[name] = float(value)
            elif item["type"] == "categorical":
                categories = item.get("categories", [])
                if not isinstance(value, str) or value not in categories:
                    choices = ", ".join(categories)
                    raise KidneyInputError(
                        f"{item['label']} must be one of: {choices}."
                    )
                validated[name] = value
            else:
                raise KidneyModelUnavailableError(
                    "Kidney prediction metadata contains an unsupported feature type."
                )
        return validated

    def predict(self, payload: Any) -> dict[str, Any]:
        values = self.validate_input(payload)
        row = pd.DataFrame([[values[name] for name in self.features]], columns=self.features)

        try:
            encoded_prediction = self.pipeline.predict(row)[0]
            encoded_prediction = encoded_prediction.item() if hasattr(encoded_prediction, "item") else encoded_prediction
            predicted_class = self.label_by_encoded_value[encoded_prediction]
        except Exception as exc:
            logger.exception("Kidney prediction inference failed")
            raise RuntimeError("Kidney prediction inference failed.") from exc

        result: dict[str, Any] = {
            "success": True,
            "prediction": predicted_class,
            "predicted_label": self.target_mapping[predicted_class]["display_label"],
            "model_name": self.metadata["model_name"],
            "disclaimer": (
                "This model output is a screening estimate, not a medical diagnosis. "
                "Consult a qualified healthcare professional."
            ),
        }

        predict_proba = getattr(self.pipeline, "predict_proba", None)
        if callable(predict_proba):
            try:
                class_probabilities = predict_proba(row)[0]
                classes = np.asarray(self.pipeline.classes_).tolist()
                probabilities = {
                    self.label_by_encoded_value[class_value]: float(probability)
                    for class_value, probability in zip(classes, class_probabilities)
                }
                if (
                    len(probabilities) != len(classes)
                    or any(
                        not math.isfinite(probability) or probability < 0 or probability > 1
                        for probability in probabilities.values()
                    )
                    or not math.isclose(sum(probabilities.values()), 1.0, abs_tol=0.02)
                ):
                    raise ValueError("Kidney classifier returned invalid class probabilities.")
                positive_probability = probabilities[self.positive_class]
                result["probability"] = positive_probability
                result["class_probabilities"] = probabilities
                result["probability_label"] = (
                    f"Model-estimated probability for {self.positive_class}"
                )
            except Exception as exc:
                logger.exception("Kidney model probability calculation failed")
                raise RuntimeError("Kidney model probability calculation failed.") from exc
        return result

    def public_schema(self) -> dict[str, Any]:
        return {
            "success": True,
            "features": self.feature_schema,
            "labels": {
                label: item["display_label"]
                for label, item in self.target_mapping.items()
            },
            "positive_class": self.positive_class,
            "probability_supported": callable(
                getattr(self.pipeline, "predict_proba", None)
            ),
        }


@lru_cache(maxsize=1)
def get_kidney_predictor() -> KidneyPredictor:
    try:
        return KidneyPredictor()
    except KidneyModelUnavailableError:
        raise
    except Exception as exc:
        logger.exception("Unexpected kidney model initialization error")
        raise KidneyModelUnavailableError(
            "Kidney prediction model could not be initialized."
        ) from exc
