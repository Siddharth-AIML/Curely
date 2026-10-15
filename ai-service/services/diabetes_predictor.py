"""
Curely Diabetes Risk Screening inference service.

Loads the XGBoost pipeline and produces:
- risk probability
- screening category
- top SHAP factors (when SHAP is available)
"""
from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd

# SHAP is optional because its numba native DLL may be blocked
# by Windows Application Control.
try:
    import shap
except Exception:
    shap = None


ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "models" / "diabetes" / "diabetes_xgboost.joblib"
METADATA_PATH = ROOT / "models" / "diabetes" / "metadata.json"

FEATURES = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
]

DISPLAY_NAMES = {
    "Pregnancies": "Pregnancies",
    "Glucose": "Glucose",
    "BloodPressure": "Blood Pressure",
    "SkinThickness": "Skin Thickness",
    "Insulin": "Insulin",
    "BMI": "BMI",
    "DiabetesPedigreeFunction": "Diabetes Pedigree",
    "Age": "Age",
}

ZERO_AS_MISSING = {
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
}


class DiabetesPredictor:
    def __init__(self):
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Diabetes model not found at {MODEL_PATH}. "
                "Train it first."
            )

        self.pipeline = joblib.load(MODEL_PATH)

        self.metadata = (
            json.loads(METADATA_PATH.read_text(encoding="utf-8"))
            if METADATA_PATH.exists()
            else {}
        )

        self.imputer = self.pipeline.named_steps["imputer"]
        self.model = self.pipeline.named_steps["model"]

        # SHAP is only used for explanations.
        # The actual diabetes prediction does NOT depend on SHAP.
        self.explainer = None

        if shap is not None:
            try:
                self.explainer = shap.TreeExplainer(self.model)
            except Exception:
                self.explainer = None

    def _frame(self, values: dict) -> pd.DataFrame:
        row = {feature: values.get(feature) for feature in FEATURES}
        df = pd.DataFrame([row], columns=FEATURES)

        for col in ZERO_AS_MISSING:
            if df.loc[0, col] == 0:
                df.loc[0, col] = np.nan

        return df

    def predict(self, values: dict) -> dict:
        raw = self._frame(values)

        # Apply the same imputation used during training.
        transformed = self.imputer.transform(raw)

        # Actual diabetes prediction.
        probability = float(
            self.model.predict_proba(transformed)[0, 1]
        )

        # ---------------------------------------------------------
        # SHAP EXPLANATION
        # ---------------------------------------------------------
        factors = []

        if self.explainer is not None:
            try:
                shap_values = self.explainer.shap_values(transformed)

                if isinstance(shap_values, list):
                    shap_values = shap_values[0]

                values_array = np.asarray(shap_values)[0]

                for feature, shap_value, actual_value in zip(
                    FEATURES,
                    values_array,
                    transformed[0],
                ):
                    contribution = float(shap_value)

                    if contribution > 0:
                        direction = "increases_risk"
                    else:
                        direction = "decreases_risk"

                    factors.append({
                        "feature": feature,
                        "label": DISPLAY_NAMES[feature],
                        "value": round(float(actual_value), 3),
                        "shap_value": round(contribution, 5),
                        "direction": direction,
                        "impact": round(abs(contribution), 5),
                    })

                factors.sort(
                    key=lambda x: x["impact"],
                    reverse=True,
                )

            except Exception:
                # SHAP failure should never prevent the prediction
                # API from returning the diabetes risk.
                factors = []

        # ---------------------------------------------------------
        # RISK CATEGORY
        # ---------------------------------------------------------
        if probability < 0.30:
            category = "lower"
        elif probability < 0.60:
            category = "moderate"
        else:
            category = "higher"

        return {
            "success": True,
            "risk_probability": round(probability, 4),
            "risk_percent": round(probability * 100, 2),
            "risk_category": category,
            "top_factors": factors[:5],
            "model_version": self.metadata.get(
                "model_version",
                "diabetes-xgb-v1",
            ),
            "disclaimer": (
                "This is an AI screening estimate for portfolio "
                "demonstration and is not a medical diagnosis."
            ),
        }


_predictor = None


def get_diabetes_predictor():
    global _predictor

    if _predictor is None:
        _predictor = DiabetesPredictor()

    return _predictor