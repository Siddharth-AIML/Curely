from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = SERVICE_ROOT / "data" / "Chronic_Kidney_Disease"
DEFAULT_DATA_PATH = DATA_DIR / "chronic_kidney_disease.arff"
COMPARISON_DATA_PATH = DATA_DIR / "chronic_kidney_disease_full.arff"
MODEL_DIR = SERVICE_ROOT / "models" / "kidney"
PIPELINE_PATH = MODEL_DIR / "kidney_pipeline.joblib"
METADATA_PATH = MODEL_DIR / "metadata.json"

NUMERIC_FEATURES = [
    "age",
    "bp",
    "bgr",
    "bu",
    "sc",
    "sod",
    "pot",
    "hemo",
    "pcv",
    "wbcc",
    "rbcc",
]

CATEGORICAL_FEATURES = [
    "sg",
    "al",
    "su",
    "rbc",
    "pc",
    "pcc",
    "ba",
    "htn",
    "dm",
    "cad",
    "appet",
    "pe",
    "ane",
]

INPUT_FEATURES = [
    "age",
    "bp",
    "sg",
    "al",
    "su",
    "rbc",
    "pc",
    "pcc",
    "ba",
    "bgr",
    "bu",
    "sc",
    "sod",
    "pot",
    "hemo",
    "pcv",
    "wbcc",
    "rbcc",
    "htn",
    "dm",
    "cad",
    "appet",
    "pe",
    "ane",
]

TARGET_FEATURE = "class"
TARGET_LABELS = {"notckd": 0, "ckd": 1}
HUMAN_LABELS = {
    "notckd": "No CKD pattern detected",
    "ckd": "CKD pattern detected",
}

FEATURE_DETAILS = {
    "age": ("Age", "years", "Patient age"),
    "bp": ("Blood pressure", "mmHg", "Blood pressure measurement"),
    "sg": ("Specific gravity", "", "Urine specific gravity"),
    "al": ("Albumin", "level 0-5", "Urine albumin level"),
    "su": ("Sugar", "level 0-5", "Urine sugar level"),
    "rbc": ("Red blood cells", "", "Urine red blood cell result"),
    "pc": ("Pus cells", "", "Urine pus cell result"),
    "pcc": ("Pus cell clumps", "", "Urine pus cell clumps"),
    "ba": ("Bacteria", "", "Bacteria in urine"),
    "bgr": ("Random blood glucose", "mg/dL", "Random blood glucose"),
    "bu": ("Blood urea", "mg/dL", "Blood urea"),
    "sc": ("Serum creatinine", "mg/dL", "Serum creatinine"),
    "sod": ("Sodium", "mEq/L", "Serum sodium"),
    "pot": ("Potassium", "mEq/L", "Serum potassium"),
    "hemo": ("Hemoglobin", "gms (source notation)", "Hemoglobin measurement"),
    "pcv": ("Packed cell volume", "not stated in dataset info", "Packed cell volume"),
    "wbcc": ("White blood cell count", "cells/cumm", "White blood cell count"),
    "rbcc": ("Red blood cell count", "millions/cmm", "Red blood cell count"),
    "htn": ("Hypertension", "", "Hypertension status"),
    "dm": ("Diabetes mellitus", "", "Diabetes mellitus status"),
    "cad": ("Coronary artery disease", "", "Coronary artery disease status"),
    "appet": ("Appetite", "", "Appetite classification"),
    "pe": ("Pedal edema", "", "Pedal edema status"),
    "ane": ("Anemia", "", "Anemia status"),
}
