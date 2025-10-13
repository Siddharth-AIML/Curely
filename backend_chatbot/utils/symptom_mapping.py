# utils/symptom_mapping.py

SYMPTOM_MAP = {
    "chest pain": "chest_pain",
    "pain in chest": "chest_pain",
    "chest-pain": "chest_pain",

    "shortness of breath": "shortness_of_breath",
    "breathing difficulty": "shortness_of_breath",
    "difficulty breathing": "shortness_of_breath",

    "fever": "fever",
    "high temperature": "fever",
    "temperature": "fever",

    "headache": "headache",
    "migraine": "headache",

    "stomach ache": "abdominal_pain",
    "tummy pain": "abdominal_pain",
    "abdominal pain": "abdominal_pain",

    "cough": "cough",
    "dry cough": "cough",
    "wet cough": "cough",
}

def normalize_symptom(user_input: str) -> str:
    """
    Normalize user-entered symptom to match dataset format.
    """
    text = user_input.strip().lower().replace("-", " ")
    if text in SYMPTOM_MAP:
        return SYMPTOM_MAP[text]
    return text.replace(" ", "_")  # fallback: convert spaces → underscores
