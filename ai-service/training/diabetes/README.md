# Curely Diabetes Risk Screening

## Model

XGBoost binary classifier + Tree SHAP.

The model is intended as a portfolio demonstration of:
- tabular clinical prediction
- probability output
- explainable AI
- FastAPI integration

It is **not a medical diagnostic system**.

## Expected dataset

Put the Pima-style CSV here:

```text
ai-service/data/diabetes/diabetes.csv
```

Expected columns:

```text
Pregnancies
Glucose
BloodPressure
SkinThickness
Insulin
BMI
DiabetesPedigreeFunction
Age
Outcome
```

## Install

From `ai-service`:

```powershell
pip install -r training/diabetes/requirements.txt
```

## Train

```powershell
python training/diabetes/train.py --data data/diabetes/diabetes.csv
```

This creates:

```text
models/diabetes/
├── diabetes_xgboost.joblib
└── metadata.json
```

## Evaluate

```powershell
python training/diabetes/evaluate.py --data data/diabetes/diabetes.csv --model models/diabetes/diabetes_xgboost.joblib
```

## FastAPI integration

Add the following to your existing `ai-service/app.py` rather than creating another FastAPI application:

```python
from pydantic import BaseModel, Field
from services.diabetes_predictor import get_diabetes_predictor

class DiabetesInput(BaseModel):
    pregnancies: float = Field(ge=0)
    glucose: float = Field(ge=0)
    blood_pressure: float = Field(ge=0)
    skin_thickness: float = Field(ge=0)
    insulin: float = Field(ge=0)
    bmi: float = Field(ge=0)
    diabetes_pedigree_function: float = Field(ge=0)
    age: float = Field(ge=1)

@app.post("/predict/diabetes")
def predict_diabetes(payload: DiabetesInput):
    predictor = get_diabetes_predictor()

    return predictor.predict({
        "Pregnancies": payload.pregnancies,
        "Glucose": payload.glucose,
        "BloodPressure": payload.blood_pressure,
        "SkinThickness": payload.skin_thickness,
        "Insulin": payload.insulin,
        "BMI": payload.bmi,
        "DiabetesPedigreeFunction": payload.diabetes_pedigree_function,
        "Age": payload.age,
    })
```

## Example request

```json
{
  "pregnancies": 2,
  "glucose": 140,
  "blood_pressure": 80,
  "skin_thickness": 25,
  "insulin": 100,
  "bmi": 31.2,
  "diabetes_pedigree_function": 0.45,
  "age": 35
}
```

## Example response

```json
{
  "success": true,
  "risk_probability": 0.61,
  "risk_percent": 61.0,
  "risk_category": "higher",
  "top_factors": [
    {
      "feature": "Glucose",
      "label": "Glucose",
      "value": 140,
      "shap_value": 0.83,
      "direction": "increases_risk",
      "impact": 0.83
    }
  ],
  "model_version": "diabetes-xgb-v1"
}
```
