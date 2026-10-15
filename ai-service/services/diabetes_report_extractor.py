import os
import re

import cv2
import pytesseract


# =========================================================
# TESSERACT CONFIGURATION
# =========================================================

TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
TESSERACT_AVAILABLE = os.path.exists(TESSERACT_PATH)

if TESSERACT_AVAILABLE:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


# =========================================================
# EXPECTED DIABETES MODEL FIELDS
# =========================================================

EXPECTED_FIELDS = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
]


# =========================================================
# IMAGE PREPROCESSING
# =========================================================

def preprocess_image(image_path: str):

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(
            f"Could not read image: {image_path}"
        )

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    # Upscale while preserving digits
    gray = cv2.resize(
        gray,
        None,
        fx=2,
        fy=2,
        interpolation=cv2.INTER_CUBIC,
    )

    # Mild contrast enhancement
    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8),
    )

    enhanced = clahe.apply(gray)

    return enhanced


# =========================================================
# OCR
# =========================================================

def extract_text_from_image(image_path: str) -> str:

    if not TESSERACT_AVAILABLE:
        raise FileNotFoundError(
            "Tesseract OCR is not installed or not configured on this machine. "
            "Please install Tesseract OCR to use diabetes report extraction."
        )

    processed = preprocess_image(image_path)

    # PSM 11:
    # sparse text / multiple blocks
    config = "--psm 11"

    return pytesseract.image_to_string(
        processed,
        config=config,
    )


# =========================================================
# HELPER
# =========================================================

def get_next_numeric_value(lines, index):

    for j in range(
        index + 1,
        min(index + 5, len(lines))
    ):

        line = lines[j].strip()

        if not line:
            continue

        lower = line.lower()

        # Stop if another field starts
        field_labels = [
            "blood pressure",
            "insulin",
            "bmi",
            "body mass index",
            "skin thickness",
            "diabetes pedigree",
            "pregnancies",
            "comments",
        ]

        if any(
            label in lower
            for label in field_labels
        ):
            break

        if lower == "age":
            break

        # Ignore units
        if re.fullmatch(
            r"(mg/dl|mm hg|years?|count|"
            r"unitless|kg/m.?|mm|µ?u/ml|u/ml)",
            line,
            re.IGNORECASE,
        ):
            continue

        # Ignore reference ranges
        if re.search(
            r"\d+(?:\.\d+)?\s*[-—]\s*"
            r"\d+(?:\.\d+)?",
            line,
        ):
            continue

        # Accept a line containing only a number
        match = re.fullmatch(
            r"(\d+(?:\.\d+)?)",
            line,
        )

        if match:
            return float(match.group(1))

    return None


# =========================================================
# EXTRACT STRUCTURED VALUES
# =========================================================

def extract_diabetes_values(text: str):

    values = {}

    lines = [
        re.sub(r"\s+", " ", line).strip()
        for line in text.splitlines()
        if line.strip()
    ]

    for i, line in enumerate(lines):

        lower = line.lower()

        # -------------------------------------------------
        # GLUCOSE
        # -------------------------------------------------

        if (
            "fasting blood sugar" in lower
            or "blood glucose" in lower
            or "(glucose)" in lower
            or lower == "glucose"
        ):

            value = get_next_numeric_value(
                lines,
                i
            )

            if value is not None:
                values["Glucose"] = value

        # -------------------------------------------------
        # BLOOD PRESSURE
        # -------------------------------------------------

        elif "blood pressure" in lower:

            for j in range(
                i + 1,
                min(i + 5, len(lines))
            ):

                match = re.search(
                    r"(\d{2,3})\s*/\s*(\d{2,3})",
                    lines[j],
                )

                if match:

                    # Pima dataset expects
                    # diastolic blood pressure
                    values["BloodPressure"] = float(
                        match.group(2)
                    )

                    break

        # -------------------------------------------------
        # INSULIN
        # -------------------------------------------------

        elif "insulin" in lower:

            value = get_next_numeric_value(
                lines,
                i
            )

            if value is not None:
                values["Insulin"] = value

        # -------------------------------------------------
        # BMI
        # -------------------------------------------------

        elif (
            "bmi" in lower
            or "body mass index" in lower
        ):

            value = get_next_numeric_value(
                lines,
                i
            )

            if value is not None:
                values["BMI"] = value

        # -------------------------------------------------
        # SKIN THICKNESS
        # -------------------------------------------------

        elif (
            "skin thickness" in lower
            or "skinfold thickness" in lower
        ):

            value = get_next_numeric_value(
                lines,
                i
            )

            if value is not None:
                values["SkinThickness"] = value

        # -------------------------------------------------
        # DIABETES PEDIGREE FUNCTION
        # -------------------------------------------------

        elif (
            "diabetes pedigree" in lower
            or "dpf" in lower
        ):

            value = get_next_numeric_value(
                lines,
                i
            )

            if value is not None:
                values[
                    "DiabetesPedigreeFunction"
                ] = value

        # -------------------------------------------------
        # PREGNANCIES
        # -------------------------------------------------

        elif lower == "pregnancies":

            value = get_next_numeric_value(
                lines,
                i
            )

            if value is not None:
                values["Pregnancies"] = int(value)

        # -------------------------------------------------
        # AGE
        # -------------------------------------------------

        elif lower == "age":

            value = get_next_numeric_value(
                lines,
                i
            )

            if value is not None:
                values["Age"] = int(value)

    missing = [
        field
        for field in EXPECTED_FIELDS
        if field not in values
    ]

    return {
        "values": values,
        "missing_fields": missing,
    }


# =========================================================
# PUBLIC FUNCTION
# =========================================================

def extract_diabetes_report(image_path: str) -> dict:

    text = extract_text_from_image(
        image_path
    )

    extracted = extract_diabetes_values(
        text
    )

    return {
        "success": True,
        "values": extracted["values"],
        "missing_fields": extracted["missing_fields"],
        "raw_text": text,
    }