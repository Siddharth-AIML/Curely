# model_utils.py
import joblib
import numpy as np

# Load model (contains: model, features list, disease classes)
model, features, diseases = joblib.load("models/disease_model.pkl")

def predict_disease(symptom_ratings: dict):
    """
    Convert user symptom ratings to model input and return top 3 predictions.
    """
    if not symptom_ratings:
        raise ValueError("No symptom ratings provided")

    # Build vector matching training feature order
    input_vector = [symptom_ratings.get(feat, 0) for feat in features]
    X = np.array(input_vector).reshape(1, -1)

    # Predict probabilities
    probs = model.predict_proba(X)[0]

    # Map to diseases
    disease_probs = dict(zip(model.classes_, probs))

    # Top 3 sorted
    sorted_probs = sorted(disease_probs.items(), key=lambda x: x[1], reverse=True)[:3]

    # Normalize so top 3 sum to 1
    total = sum(p for _, p in sorted_probs)
    normalized = [
        {"disease": d, "probability": round(float(p / total), 3)}
        for d, p in sorted_probs
    ]

    return normalized
