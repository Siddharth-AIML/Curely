from flask import Flask, request, jsonify
from flask_cors import CORS
import random
from model_utils import predict_disease

app = Flask(__name__)
CORS(app)

# ---- Dynamic question templates ----
QUESTION_TEMPLATES = [
    "On a scale of 1-5, how severe is your {symptom}?",
    "How frequently are you experiencing {symptom}?",
    "How long have you been noticing {symptom}?",
    "Does anything make your {symptom} better or worse?",
    "Is your {symptom} getting better, worse, or staying the same?"
]

# ---- Utility: clean symptom text ----
def normalize_symptom(symptom: str) -> str:
    """
    Normalize user-entered symptom names.
    Example: 'Chest Pain', 'chest-pain', ' chest pain ' → 'chest pain'
    """
    return symptom.lower().replace("-", " ").strip()

# ---- Endpoint: Generate dynamic questions ----
@app.route("/questions", methods=["GET", "POST"])
def generate_questions():
    """
    GET  -> /questions?symptom=fever
    POST -> { "symptoms": ["fever", "joint pain"] }
    """
    response = {}

    if request.method == "GET":
        symptom = request.args.get("symptom", "").strip()
        if not symptom:
            return jsonify({"error": "Please provide a symptom"}), 400
        clean_symptom = normalize_symptom(symptom)
        chosen = random.sample(QUESTION_TEMPLATES, k=3)
        response[clean_symptom] = [q.format(symptom=clean_symptom) for q in chosen]

    elif request.method == "POST":
        data = request.get_json()
        symptoms = data.get("symptoms", [])
        if not symptoms or not isinstance(symptoms, list):
            return jsonify({"error": "Please provide a list of symptoms"}), 400

        for symptom in symptoms:
            clean_symptom = normalize_symptom(symptom)
            chosen = random.sample(QUESTION_TEMPLATES, k=3)
            response[clean_symptom] = [q.format(symptom=clean_symptom) for q in chosen]

    return jsonify({"questions": response})

# ---- Endpoint: Predict top 3 diseases ----
@app.route("/predict", methods=["POST"])
def predict():
    """
    Request JSON:
    {
      "symptom_ratings": {
        "fever": 4,
        "joint pain": 3,
        "cough": 2
      }
    }
    """
    data = request.get_json() or {}
    ratings = data.get("symptom_ratings", {})

    if not ratings:
        return jsonify({"error": "No symptom ratings provided"}), 400

    print("Incoming prediction data:", ratings)

    try:
        predictions = predict_disease(ratings)
        return jsonify({"top_3_diseases": predictions})
    except Exception as e:
        print("Prediction error:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
