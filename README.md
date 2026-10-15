# Curely — AI-Powered Healthcare Management Platform

Curely is a full-stack healthcare management and clinical decision-support project
for **patients, doctors, and diagnostic laboratories**. It combines role-based
healthcare workflows (appointments, patient records, prescriptions, and lab
reports) with AI-assisted image, tabular-data, and symptom analysis. AI results
are informational screening outputs for review by a qualified professional;
they are not diagnoses.

---

## 🚀 Overview

Curely provides a React web client, an Express/MongoDB application API, a
FastAPI AI API, and a separate FastAPI symptom-analysis service that Express
starts automatically on local development machines. The AI API currently
provides skin-lesion classification with Grad-CAM, brain-MRI segmentation,
diabetes screening and report OCR, and kidney-disease screening. The symptom
checker supports model-backed symptom selection and conservative natural
language mapping.

---

## 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │      React UI        │
                         │    Vite Frontend     │
                         └──────────┬───────────┘
                                    │
                                    │ HTTP / REST
                                    ▼
                         ┌──────────────────────┐
                         │   Express Backend    │
                         │ Auth, roles, APIs    │
                         └───────┬───────┬──────┘
                                 │       │
                         MongoDB │       ├───────────────┐
                                 │       │               │
                                 ▼       ▼               ▼
                         ┌──────────┐ ┌────────────┐ ┌───────────────────┐
                         │ MongoDB  │ │ FastAPI AI │ │ Symptom FastAPI   │
                         │ records  │ │ port 8000  │ │ port 5000         │
                         └──────────┘ └─────┬──────┘ └─────────┬─────────┘
                                            │                  │
                                            ▼                  ▼
                                  Image/tabular/OCR models   Symptom model
```

The browser talks to Express, not directly to either Python API. Express
authenticates users, applies role checks, validates requests, and proxies
inference calls. The symptom API is launched as a child process of Express when
`SYMPTOM_SERVICE_URL` points to a local loopback address. The general AI API
(`ai-service`) remains an independently started service for the skin, brain,
diabetes, and kidney features.

---

# 📁 Project Structure

```text
Curely/
│
├── backend/                         # Express API, MongoDB, auth and domain routes
│   ├── config/db.js
│   ├── middleware/authMiddleware.js
│   ├── models/                      # Customer, doctor, lab, appointment, report...
│   ├── routes/                      # Auth, appointments, reports, AI proxies...
│   ├── symptom_service/             # Python symptom API, model and mapping
│   │   ├── api.py
│   │   ├── model_utils.py
│   │   ├── models/disease_model.pkl
│   │   ├── utils/symptom_mapping.py
│   │   ├── train_model.py
│   │   └── tests/
│   ├── test/                        # Express route tests
│   ├── utils/
│   ├── package.json
│   └── server.js                    # Starts Express and local symptom API
├── ai-service/                      # Separate FastAPI inference/training service
│   ├── app.py                       # Skin, brain, diabetes and kidney endpoints
│   ├── services/                    # Model inference, OCR and Grad-CAM
│   ├── training/
│   │   ├── brain/
│   │   ├── diabetes/
│   │   ├── kidney/
│   │   ├── dataset.py, model.py, train.py, evaluate.py  # Skin pipeline
│   │   └── split_dataset.py, check_split.py
│   ├── models/
│   │   ├── skin_model_sampler_best.pth
│   │   ├── brain_unet_best.pth
│   │   ├── diabetes/diabetes_xgboost.joblib + metadata
│   │   └── kidney/kidney_pipeline.joblib + metadata
│   ├── tests/
│   ├── data/                        # Local datasets; not all are committed
│   ├── uploads/                     # Runtime uploaded files
│   ├── results/                     # Runtime masks, overlays and output
│   └── requirements.txt
├── vite-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/                   # Customer, doctor, lab and AI screens
│   │   ├── services/api.js
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

Datasets, virtual environments, caches, uploaded files, and generated output
directories may exist locally without being tracked in Git.

---

# 🧩 Main Components

## 1. Frontend — `vite-frontend`

The frontend is built using:

- React
- Vite
- JavaScript
- CSS
- REST APIs

It provides the user-facing interface for:

- Patient workflows
- Doctor workflows
- Laboratory workflows
- Authentication
- Appointments
- Medical information
- Reports
- AI-assisted features

### Start the frontend

```bash
cd vite-frontend
npm install
npm run dev
```

---

# 2. Backend — `backend`

The backend is implemented using:

- Node.js
- Express.js
- MongoDB
- JWT-based authentication
- Role-based authorization

The backend acts as the main application server.

### Responsibilities

- Authentication
- Authorization
- User management
- Patient management
- Doctor management
- Laboratory management
- Appointments
- Medical records
- Reports
- AI-service communication
- File handling

### Start the backend

```bash
cd backend
npm install
npm start
```

---

# 3. AI Service — `ai-service`

The general AI service is an independent Python microservice built using:

- Python
- FastAPI
- PyTorch
- Torchvision
- EfficientNet-B0
- Grad-CAM
- Scikit-learn
- Pandas
- NumPy
- Pillow

It is separate from Express so model inference and machine-learning dependencies
remain isolated from the Node.js application. Express authenticates requests and
proxies them to this service using `AI_SERVICE_URL`.

---

# 🧠 Implemented AI and Symptom Models

These are the model-backed features currently exposed by the FastAPI AI service
and the symptom-analysis service. Each produces a screening or analysis result;
none is a diagnosis. See the sections below for API details and training notes.

| Feature | Model / method | Input and processing | Output |
|---|---|---|---|
| Skin lesions | ImageNet-initialized EfficientNet-B0, fine-tuned for seven HAM10000 classes | Dermoscopic image resized to 224×224 and ImageNet-normalized; prediction uses the saved sampler-trained checkpoint | Ranked class probabilities and a Grad-CAM overlay |
| Brain MRI | U-Net convolutional segmentation model | MRI image resized to 256×256, normalized per image; sigmoid mask thresholded at 0.5 | Tumor-region segmentation, overlay, detected flag, and estimated mask area; this is segmentation, not tumor-type classification |
| Diabetes screening | Saved XGBoost binary-classification pipeline trained on eight Pima-style features | Zero values in five measurement fields are treated as missing and imputed using the fitted pipeline; optional Tree SHAP explanation | Model-estimated probability/category and up to five contributing features when SHAP works |
| Diabetes report extraction | OpenCV image enhancement + Tesseract OCR + field parsing; no predictive model | Report image is grayscaled, enlarged and contrast-enhanced before text extraction and parsing of diabetes-related measurements | Extracted values for review; OCR output should be checked before using it as model input |
| Kidney screening | Saved scikit-learn pipeline; selected Extra Trees classifier | 24 numeric and categorical features, with imputation, scaling and one-hot encoding inside the fitted pipeline | CKD/not-CKD class and model probabilities |
| Symptom checker | Saved MultinomialNB training artifact used to derive a disease-root Bernoulli Naive Bayes network | Up to 100 selected symptom IDs and/or up to 1,000 characters of text; exact feature names and curated aliases are mapped, while negative/uncertain mentions are not treated as positive evidence | Recognized evidence, clarifications, unsupported terms, and up to five uncalibrated posterior class probabilities |

The skin, brain, diabetes, and kidney endpoints are hosted by `ai-service`.
The symptom schema and inference endpoints are hosted by
`backend/symptom_service`; Express launches that local service automatically.
The symptom classifier's saved artifact contains 376 symptom features and 500
disease labels. Its original training dataset is not included in this checkout.
The kidney model uses the supplied 400-row historical dataset; the diabetes
artifact records an evaluation on 768 rows. These dataset-specific scores are
not evidence of clinical performance or external validation.

## Skin lesion classification

The skin feature uses the **HAM10000** dermoscopic-image dataset.

The current model uses:

```text
EfficientNet-B0
       ↓
7-class classifier
```

The seven classes are:

```text
akiec
bcc
bkl
df
mel
nv
vasc
```

---

# 🔬 Training Pipeline

```text
HAM10000 Metadata
        ↓
Lesion-grouped Dataset Split
        ↓
Image Preprocessing
        ↓
Data Augmentation
        ↓
EfficientNet-B0
        ↓
Weighted Sampling
        ↓
Cross-Entropy Loss
        ↓
Validation Macro-F1
        ↓
Best Model Checkpoint
```

The dataset is split at the **lesion level** to reduce data leakage between training, validation, and test sets.

---

# 📊 Recorded Skin Model Performance

The repository's recorded sampler-based experiment reports:

| Metric | Result |
|---|---:|
| Test Accuracy | 85.18% |
| Balanced Accuracy | 74.79% |
| Macro F1 | 76.23% |
| Weighted F1 | 85.28% |
| Macro ROC-AUC | 96.81% |

These are experiment results on the project's dataset split, not independent
clinical validation. The model is intended for **AI-assisted analysis and
clinical decision support**.

It should not be interpreted as an autonomous medical diagnosis.

---

# 🔎 Explainable AI — Grad-CAM

Curely uses **Grad-CAM** to visualize image regions that contributed to the model's prediction.

The workflow is:

```text
Uploaded Skin Image
        ↓
EfficientNet-B0
        ↓
Predicted Class
        ↓
Grad-CAM
        ↓
Activation Heatmap
```

This provides an additional interpretability layer for the AI prediction.

Example:

```text
Prediction:
nv

Confidence:
0.9996

Grad-CAM:
Generated heatmap showing influential image regions
```

---

# 🚀 Running the AI Service

Navigate to:

```bash
cd ai-service
```

### Create virtual environment

```powershell
python -m venv .venv
```

### Activate virtual environment

```powershell
.\.venv\Scripts\Activate.ps1
```

### Install dependencies

```powershell
pip install -r requirements.txt
```

If Grad-CAM is not already installed:

```powershell
python -m pip install grad-cam
```

### Start FastAPI

```powershell
uvicorn app:app --reload --port 8000
```

The service will run at:

```text
http://127.0.0.1:8000
```

---

# 📚 FastAPI Documentation

Once the AI service is running, open:

```text
http://127.0.0.1:8000/docs
```

FastAPI provides an interactive Swagger UI.

Current endpoints:

```text
GET  /
GET  /health
POST /predict/skin
POST /predict/brain-mri
POST /extract/diabetes-report
POST /predict/diabetes
GET  /predict/kidney/schema
POST /predict/kidney
```

The kidney schema endpoint returns the feature names, units, and allowed
categories used by the installed kidney pipeline.

---

# 🩺 Skin Prediction API

## Endpoint

```http
POST /predict/skin
```

## Request

The endpoint accepts a multipart form-data image:

```text
file = <skin image>
```

Supported formats:

```text
.jpg
.jpeg
.png
.webp
```

## Example Response

```json
{
    "success": true,
    "prediction": "nv",
    "confidence": 0.9996,
    "predictions": [
        {
            "class": "nv",
            "probability": 0.9996
        },
        {
            "class": "df",
            "probability": 0.0002
        }
    ],
    "heatmap_url": "/results/example_gradcam.jpg",
    "model_version": "efficientnet_b0_ham10000_v2"
}
```

---

# 🧪 Testing Grad-CAM

Grad-CAM can be tested independently before integrating the AI service with the rest of Curely.

From `ai-service`:

```powershell
python test_gradcam.py
```

The generated visualization is saved to the configured output path.

---

# 🧠 Brain MRI Segmentation

`POST /predict/brain-mri` accepts an MRI image. The service loads the saved
`brain_unet_best.pth` U-Net checkpoint, resizes the input to 256×256, predicts a
per-pixel probability mask, and applies a 0.5 threshold. It returns a
segmentation image, a red-overlay visualization, whether any pixels crossed
the threshold, and the fraction of the image marked by the mask. The returned
area is a model-mask fraction, not a clinical tumor-volume measurement. This
checkpoint performs segmentation; it does not identify tumor subtype or make a
diagnosis.

Training and evaluation code is under `ai-service/training/brain/`. The
training dataset and patient-level split files are expected under
`ai-service/data/brain_mri/`; those source data are not bundled with the
checkpoint.

---

# 🩸 Diabetes Screening and Report Extraction

## Risk screening model

`POST /predict/diabetes` uses the saved XGBoost pipeline at
`ai-service/models/diabetes/diabetes_xgboost.joblib`. It accepts the eight
Pima-style inputs: pregnancies, glucose, blood pressure, skin thickness,
insulin, BMI, diabetes pedigree function, and age. The predictor treats zero
values in glucose, blood pressure, skin thickness, insulin, and BMI as missing
and applies the fitted imputer before asking XGBoost for the positive-class
probability. The displayed categories are derived from fixed probability
bands (`<0.30`: lower, `<0.60`: moderate, otherwise higher); they are UI
screening bands, not clinical thresholds.

Tree SHAP is optional and used only to explain an already-computed prediction.
If SHAP is unavailable or explanation fails, inference can still return its
probability with no factor list. The committed metadata records a 768-row
evaluation (accuracy 0.741, balanced accuracy 0.684, ROC-AUC 0.819 on its
stored split). This is an internal dataset result, not clinical validation.
Training and evaluation scripts are under `ai-service/training/diabetes/`.

## Report image extraction

`POST /extract/diabetes-report` runs image preprocessing and OCR, not the
XGBoost model: OpenCV grayscales, enlarges and enhances contrast, then
Tesseract extracts text and application code attempts to parse expected
diabetes measurements. Tesseract OCR must be installed at
`C:\Program Files\Tesseract-OCR\tesseract.exe`, the path currently configured
in `services/diabetes_report_extractor.py`.
Review extracted values carefully; OCR can misread text and values and does
not verify whether they are clinically accurate.

---

# 🩺 Kidney Disease Prediction

Curely includes a tabular kidney disease screening workflow in the AI Health
Analysis experience. The frontend loads the supported input schema from the AI
service and submits it through the authenticated Express API.

## Dataset and model

Training data is supplied under
`ai-service/data/Chronic_Kidney_Disease/`:

- `chronic_kidney_disease.arff`
- `chronic_kidney_disease_full.arff`
- `chronic_kidney_disease.info.txt`

The two ARFF files have matching schemas and matching normalized usable rows.
They declare 24 predictors in this order:

```text
age, bp, sg, al, su, rbc, pc, pcc, ba, bgr, bu, sc,
sod, pot, hemo, pcv, wbcc, rbcc, htn, dm, cad, appet, pe, ane
```

The numeric features are `age` (years), `bp` (mmHg), `bgr` and `bu` (mg/dL),
`sc` (mg/dL), `sod` and `pot` (mEq/L), `hemo` (source notation `gms`), `pcv` (units not stated in the supplied info
file), `wbcc`
(cells/cumm), and `rbcc` (millions/cmm). Nominal features are `sg` (specific
gravity), `al` (albumin level 0-5), `su` (sugar level 0-5), `rbc`, `pc`, `pcc`,
`ba`, `htn`, `dm`, `cad`, `appet`, `pe`, and `ane`. Their allowed categories
are declared in `metadata.json` and served by the schema API.

The target is `class`; the verified dataset labels are `ckd` and `notckd`.
The training metadata maps encoded class `1` to `ckd` and class `0` to
`notckd`. Training compares Logistic Regression, Random Forest, and Extra Trees
using five-fold stratified cross-validation and selects by mean balanced
accuracy. Numeric median imputation and standard scaling, and nominal
most-frequent imputation and one-hot encoding, are part of the fitted
scikit-learn pipeline, so preprocessing is learned only within training folds.
No oversampling is used; candidate estimators use class weights.

Two rows with a superfluous trailing empty cell are repaired. One malformed
row with an ambiguous extra nominal value is excluded instead of guessing.
The selected pipeline and complete training/evaluation metadata are stored at:

```text
ai-service/models/kidney/kidney_pipeline.joblib
ai-service/models/kidney/metadata.json
```

For the recorded 20% stratified holdout, the selected Extra Trees pipeline
reported accuracy `0.9875`, balanced accuracy `0.99`, CKD precision `1.00`,
CKD recall `0.98`, CKD F1 `0.9899`, ROC-AUC `1.00`, and confusion matrix
`[[30, 0], [1, 49]]` (label order: `notckd`, `ckd`). Five-fold stratified CV
balanced accuracy was `0.99`. These are results on this small supplied
dataset split only, not a clinical performance claim.

## Train and evaluate

From `ai-service` (after installing `requirements.txt`):

```powershell
python -m training.kidney.train
python -m training.kidney.evaluate
python -m unittest discover -s tests -v
```

The training command reports actual stratified holdout metrics and candidate
cross-validation results, writes metadata, then reloads the saved artifact and
checks prediction consistency. It does not claim clinical accuracy.

## Prediction API

The Express endpoint is `POST /api/ai/kidney/predict` and requires an
authenticated customer or doctor. The FastAPI endpoint is
`POST /predict/kidney`. `GET /api/ai/kidney/schema` (FastAPI:
`GET /predict/kidney/schema`) returns the exact feature names, types, units,
categories, and target labels used by the installed pipeline.

All 24 fields are required. The categorical values are strings; numerical
fields are finite, non-negative JSON numbers. For the precise categories, use
the schema endpoint. Example request:

```json
{
  "age": 45,
  "bp": 80,
  "sg": "1.020",
  "al": "0",
  "su": "0",
  "rbc": "normal",
  "pc": "normal",
  "pcc": "notpresent",
  "ba": "notpresent",
  "bgr": 120,
  "bu": 36,
  "sc": 1.2,
  "sod": 140,
  "pot": 4.5,
  "hemo": 14,
  "pcv": 42,
  "wbcc": 8000,
  "rbcc": 4.8,
  "htn": "no",
  "dm": "no",
  "cad": "no",
  "appet": "good",
  "pe": "no",
  "ane": "no"
}
```

The response includes the predicted class, its display label, the model's
probability for each class, and the `ckd` class probability:

```json
{
  "success": true,
  "prediction": "notckd",
  "predicted_label": "No CKD pattern detected",
  "model_name": "extra_trees",
  "probability": 0.0829,
  "class_probabilities": {
    "notckd": 0.9171,
    "ckd": 0.0829
  },
  "probability_label": "Model-estimated probability for ckd",
  "disclaimer": "This model output is a screening estimate, not a medical diagnosis. Consult a qualified healthcare professional."
}
```

Probabilities are model outputs, not calibrated clinical certainty. The
dataset is small, historical, and from a single source; external clinical
validation has not been performed. The result is not a diagnosis or treatment
recommendation. Users should consult a qualified healthcare professional.

## Run the integrated feature

Start FastAPI from `ai-service`:

```powershell
python -m uvicorn app:app --reload --port 8000
```

Start Express from `backend` with `AI_SERVICE_URL=http://127.0.0.1:8000` in its
local `.env`:

```powershell
npm start
npm test
```

Start the frontend from `vite-frontend`:

```powershell
npm run dev
npm run build
```

After signing in as a customer or doctor, open **AI Health Analysis** and
select **Kidney Disease Prediction**. The schema-driven form displays the
required measurements and choices. It has no simulated or fallback result.

---

# 🔐 Authentication and Authorization

Curely supports role-based workflows for:

```text
Patient
Doctor
Laboratory
```

The Express backend is responsible for determining whether a user has permission to access a particular resource.

The implemented request path is:

```text
React Frontend
      ↓
Express Backend
      ↓
Authentication / Authorization
      ↓
FastAPI AI Service
```

The AI service should be treated as an internal inference service rather than the primary authorization layer.

---

# 🔒 Patient Report Access

Curely includes a patient authorization mechanism for doctor access to laboratory reports.

The workflow is:

```text
Doctor requests report
        ↓
Patient receives OTP
        ↓
Patient verifies OTP
        ↓
Authorized report access
```

This provides an additional authorization layer for sensitive medical information.

---

# 🔄 AI Integration Architecture

The implemented request path for the general AI models is:

```text
Patient
   │
   ▼
React Frontend
   │
   ▼
Express Backend
   │
   ├── Authentication
   ├── Authorization
   ├── Role and request validation
   └── File size/type checks
   │
   ▼
FastAPI AI Service (AI_SERVICE_URL)
   ├── Skin: EfficientNet-B0 + Grad-CAM
   ├── Brain MRI: U-Net segmentation
   ├── Diabetes: XGBoost screening / OCR extraction
   └── Kidney: fitted scikit-learn pipeline
   │
   ▼
Express Backend
   │
   ▼
React Frontend
```

The symptom checker uses the same browser → Express authentication boundary,
then Express proxies requests to the local symptom FastAPI child process (or an
external URL configured by `SYMPTOM_SERVICE_URL`). AI results are returned to
the client; the current routes do not persist prediction results in MongoDB.

| Authenticated Express endpoint | General AI endpoint | Purpose |
|---|---|---|
| `POST /api/ai/skin-analysis` | `POST /predict/skin` | Skin classification and Grad-CAM |
| `POST /api/ai/brain-mri-analysis` | `POST /predict/brain-mri` | MRI segmentation |
| `POST /api/ai/diabetes-extract` | `POST /extract/diabetes-report` | OCR extraction from report image |
| `POST /api/ai/diabetes-predict` | `POST /predict/diabetes` | Tabular diabetes screening |
| `GET /api/ai/kidney/schema` | `GET /predict/kidney/schema` | Kidney form schema |
| `POST /api/ai/kidney/predict` | `POST /predict/kidney` | Tabular kidney screening |
| `GET /api/symptoms/schema` | `GET /schema` on symptom service | Model-backed symptom vocabulary |
| `POST /api/symptoms/analyze` | `POST /analyze` on symptom service | Symptom evidence mapping and ranking |

The Express image routes accept JPEG, PNG, and WebP images up to 10 MB and
require a customer or doctor JWT. The kidney schema/prediction and symptom
routes also require a customer or doctor JWT. The Python APIs are internal
inference endpoints; clients should use Express rather than calling them
directly.

---

# 🧪 Machine Learning Development Workflow

## Dataset Split

```bash
cd ai-service
python training/split_dataset.py
```

## Verify Dataset Split

```bash
python training/check_split.py
```

## Train Model

```bash
python training/train.py
```

## Evaluate Model

```bash
python training/evaluate.py
```

## Test Grad-CAM

```bash
python test_gradcam.py
```

---

# 📦 Important AI Files

| File | Purpose |
|---|---|
| `ai-service/app.py` | FastAPI routes for skin, MRI, diabetes, OCR, and kidney |
| `ai-service/services/skin_gradcam.py` | Skin inference and Grad-CAM overlay |
| `ai-service/training/model.py` | EfficientNet-B0 skin classifier definition |
| `ai-service/services/brain_predictor.py` | U-Net MRI segmentation inference |
| `ai-service/training/brain/model.py` | U-Net architecture |
| `ai-service/services/diabetes_predictor.py` | XGBoost inference and optional Tree SHAP |
| `ai-service/services/diabetes_report_extractor.py` | Image OCR and field extraction |
| `ai-service/services/kidney_predictor.py` | Kidney pipeline validation and inference |
| `ai-service/training/kidney/` | Kidney preprocessing, training, and evaluation |
| `backend/symptom_service/model_utils.py` | Symptom model loading and posterior inference |
| `backend/symptom_service/utils/symptom_mapping.py` | Symptom schema, aliases, and text parsing |
| `backend/routes/ai.js` | Authenticated Express proxy routes for AI API |
| `backend/routes/symptomChecker.js` | Authenticated Express proxy routes for symptoms |

---

# 🗃️ Dataset

The current skin analysis model uses the **HAM10000** dataset.

The dataset contains dermoscopic skin lesion images belonging to seven diagnostic categories.

Recommended local structure:

```text
ai-service/
└── data/
    ├── raw/
    │   ├── HAM10000_images_part_1/
    │   ├── HAM10000_images_part_2/
    │   └── HAM10000_metadata.csv
    │
    └── processed/
        ├── train.csv
        ├── val.csv
        └── test.csv
```

The dataset should not be committed to the Git repository.

---

# ⚠️ Git and Large Files

Datasets, runtime uploads, generated results, local environments, and secrets
should not be committed:

```text
.venv/
node_modules/
__pycache__/
.env

ai-service/data/
ai-service/uploads/
ai-service/results/
```

The current checkout includes the trained inference artifacts under
`ai-service/models/` and `backend/symptom_service/models/`. These artifacts
are required to run the included models. Larger or frequently updated
checkpoints are better stored using Git LFS or a model registry.

---

# 🩺 Symptom Checker

The symptom checker uses the saved classifier in `backend/symptom_service/models/disease_model.pkl`.
That artifact contains a fitted `MultinomialNB` estimator, its ordered 376 binary
symptom features, and 500 disease classes. Its saved class and feature counts are
used as the probability tables for a disease-root Bernoulli Naive Bayes belief
network, with binary symptom nodes conditionally independent given disease.
Inference uses the saved class priors and Laplace-smoothed symptom-present
likelihoods; symptoms not mentioned by the user are marginalized, not assumed
absent. The original dataset
`backend/symptom_service/data/diseases.csv` is not included in this checkout,
so the saved artifact was not retrained here. The service
validates that the artifact's saved feature counts are valid binary counts and
reports the source estimator rather than claiming the artifact itself is a
native BBN.

The symptom vocabulary is generated from the saved model's feature list. Users
can select multiple supported symptoms or describe them in natural language.
Exact supported feature names and a small set of conservative aliases are
mapped to model variables. Unknown terms and absent/uncertain mentions are
reported rather than silently converted into model evidence. The model receives
binary presence indicators in the persisted feature order.

The service computes the posterior distribution from the saved network tables.
Results show the top five classes with their original posterior values; the
top-five list is not renormalized. These probabilities are uncalibrated and are
not clinical risks; the tool does not diagnose.

## Run locally

Install the Python dependencies once from the repository root. The pinned
scikit-learn version (`1.7.2`) matches the serialized artifact's training
version. On Windows, create the service's virtual environment and install its
requirements:

```powershell
python -m venv backend\symptom_service\.venv
backend\symptom_service\.venv\Scripts\python.exe -m pip install -r backend\symptom_service\requirements.txt
```

The symptom service starts automatically as a child process when Express starts
with the default local `SYMPTOM_SERVICE_URL=http://127.0.0.1:5000`. The backend
uses the virtual environment above if present; otherwise it uses `python` on
Windows or `python3` on other platforms. If the Python executable is not on
`PATH`, set `SYMPTOM_PYTHON` in `backend/.env` to its full path.

To use only the healthcare web application and symptom checker, run the
frontend and backend in two terminals:

```powershell
cd backend
npm start
```

```powershell
cd vite-frontend
npm run dev
```

The React client uses `VITE_API_URL` (default
`http://localhost:3001/api`) and sends authenticated requests through Express.
When using a remote symptom-service URL, the backend will not start a local
Python service. To use skin, brain MRI, diabetes, or kidney features as well,
also start the independent `ai-service` on port 8000; all AI features together
therefore require three manually started processes (frontend, Express, and
general AI API), while the symptom API is managed by Express.

## API

Both backend routes require a customer or doctor JWT:

- `GET /api/symptoms/schema` — supported symptoms, aliases, model type, and
  disease/symptom counts.
- `POST /api/symptoms/analyze` — accepts `symptom_ids` (canonical IDs from the
  schema), a natural-language `description`, or both. At least one must be
  provided. Example request:

```json
{
  "symptom_ids": ["headache"],
  "description": "I also have fever and nausea."
}
```

The response includes `recognized_symptoms`, `accepted_evidence`,
`unsupported_terms` (with non-binding suggestions), `clarifications`,
`clarification_required`, and `results` (ranked disease labels with the
network's posterior probabilities). When there is no supported positive
evidence, `results` is empty and the model is not called. Python service routes
are `GET /schema` and `POST /analyze`.

Run the Python tests from the repository root with the service virtual
environment:

```powershell
backend\symptom_service\.venv\Scripts\python.exe -m unittest discover -s backend\symptom_service\tests
```

Retraining requires the authorized source dataset at
`backend/symptom_service/data/diseases.csv` (target column `diseases`):

```powershell
backend\symptom_service\.venv\Scripts\python.exe backend\symptom_service\train_model.py
```

The model's capabilities are limited to its saved 376 symptom features and 500
disease classes. Adding a supported UI term alone does not extend its predictive
capability; retraining requires suitable labeled data, preprocessing and
validation, and an updated model artifact. Seek professional medical advice for
health concerns.

---

# 🔑 Environment Variables

Environment variables should be stored in `.env` files and should never be committed.

Example:

```env
PORT=3001
MONGO_URI=your_database_url
JWT_SECRET=your_secret
AI_SERVICE_URL=http://127.0.0.1:8000
SYMPTOM_SERVICE_URL=http://127.0.0.1:5000
```

`PORT`, `MONGO_URI`, and `JWT_SECRET` configure Express. `AI_SERVICE_URL`
points to the separately started general AI API. `SYMPTOM_SERVICE_URL` defaults
to the local child service; point it elsewhere only when using a separately
hosted symptom API. `SYMPTOM_PYTHON` is optional and selects the executable
used to start the local symptom service. Configure `VITE_API_URL` in the
frontend environment only if the Express API is not at its default URL.

---

# 🛠️ Technology Stack

## Frontend

- React
- Vite
- JavaScript
- CSS
- REST APIs

## Backend

- Node.js
- Express.js
- MongoDB
- JWT
- REST APIs

## AI / ML

- Python
- FastAPI
- PyTorch
- Torchvision
- EfficientNet-B0 and U-Net
- Scikit-learn
- XGBoost
- SHAP (optional diabetes explanations)
- Grad-CAM
- OpenCV and Tesseract OCR
- Pandas
- Joblib
- NumPy
- Pillow

---

# 📈 Further AI Roadmap

The following are possible future extensions, not currently implemented
features:

## Authorized patient-record assistant

A retrieval-based healthcare assistant can provide authorized access to:

- Previous reports
- Lab results
- Medical history
- Prescriptions
- AI analysis results

Any such assistant must retrieve only records the authenticated user is
authorized to access.

## Longitudinal health analytics

```text
Historical Medical Records
          ↓
Time-Series Analysis
          ↓
Health Trends
          ↓
Risk Indicators
          ↓
Doctor Review
```

---

# 🧑‍⚕️ Doctor-in-the-Loop Design

Curely's AI features are designed as **clinical decision-support tools**.

The intended workflow is:

```text
AI Analysis
     ↓
Prediction + Explainability
     ↓
Doctor Review
     ↓
Clinical Assessment
     ↓
Final Medical Decision
```

AI predictions should not replace professional medical judgment.

---

# 🎯 Project Goals

The major goals of Curely are:

1. Build an integrated healthcare management platform.
2. Provide secure patient-doctor-laboratory workflows.
3. Apply machine learning to healthcare-related data.
4. Provide explainable AI rather than purely black-box predictions.
5. Separate AI inference from the core backend using a microservice architecture.
6. Maintain secure role-based access to healthcare information.
7. Provide doctor-in-the-loop AI-assisted decision support.
8. Create a scalable foundation for additional healthcare AI modules.

---

# 🚀 Local Development

Clone the repository:

```bash
git clone <repository-url>
cd Curely
```

The application has three independently running development processes when
using all features: the React frontend, Express backend, and general AI API.
Express automatically starts the symptom FastAPI process as its child when
using the default local `SYMPTOM_SERVICE_URL`, so it does not need a fourth
terminal. MongoDB must also be available at `MONGO_URI`.

Install dependencies once:

```powershell
cd backend
npm install
cd ..\vite-frontend
npm install
cd ..\ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
cd ..
python -m venv backend\symptom_service\.venv
backend\symptom_service\.venv\Scripts\python.exe -m pip install -r backend\symptom_service\requirements.txt
```

## Start Backend

In a terminal, from the repository root:

```bash
cd backend
npm start
```

This starts Express on port 3001 and, by default, starts the local symptom API
on port 5000 as a child process.

---

## Start Frontend

In a second terminal, from the repository root:

```bash
cd vite-frontend
npm run dev
```

---

## Start AI Service

In a third terminal, from the repository root, for skin, brain, diabetes, and
kidney analysis:

```powershell
cd ai-service
.\.venv\Scripts\Activate.ps1
python -m uvicorn app:app --reload --port 8000
```

---

# 🔗 Local Services

| Service | URL |
|---|---|
| Frontend (Vite) | `http://localhost:5173` |
| Express Backend | `http://localhost:3001` |
| General FastAPI AI service | `http://127.0.0.1:8000` |
| General AI API docs | `http://127.0.0.1:8000/docs` |
| Symptom API (managed by Express) | `http://127.0.0.1:5000` |

The symptom API is an internal backend dependency; normal browser requests use
the Express routes under `/api/symptoms`.

---

# 🌿 Git Workflow

Feature development should preferably be performed using separate branches.

Example:

```bash
git switch -c feature/skin-ai-gradcam
```

Check changes:

```bash
git status
```

Stage changes:

```bash
git add .
```

Commit:

```bash
git commit -m "Add skin disease AI prediction with Grad-CAM"
```

Push:

```bash
git push -u origin feature/skin-ai-gradcam
```

---

# 📌 Current Development Status

## Completed

- [x] React frontend
- [x] Express backend
- [x] Role-based healthcare workflows
- [x] Patient / Doctor / Laboratory roles
- [x] Laboratory report authorization workflow
- [x] FastAPI AI service with skin, brain MRI, diabetes, OCR, and kidney endpoints
- [x] EfficientNet-B0 skin classification with Grad-CAM
- [x] U-Net brain MRI segmentation
- [x] Diabetes risk screening with optional SHAP feature explanation
- [x] Diabetes report image OCR and value extraction
- [x] Schema-driven kidney disease screening pipeline
- [x] Symptom vocabulary, natural-language evidence mapping, and model-backed ranking
- [x] Authenticated Express proxy routes for the AI and symptom services
- [x] Express-managed local startup of the symptom-analysis service
- [x] Model training/evaluation code and focused tests for implemented pipelines

## In Progress

- [ ] AI result persistence
- [ ] Doctor review workflow
- [ ] AI audit logging

## Planned

- [ ] Patient-record RAG assistant
- [ ] Longitudinal health analytics
- [ ] External clinical validation across independent datasets
- [ ] Broader audit logging and review workflows for AI results

---

# ⚠️ Medical Disclaimer

Curely is an academic/research software project.

AI-generated predictions are intended for **research and clinical decision-support purposes only** and must not be treated as a definitive medical diagnosis.

Medical decisions should be made by qualified healthcare professionals using appropriate clinical information and examination.

---

# 👩‍💻 Development

Curely is developed as a full-stack healthcare and AI/ML project with separate frontend, backend, and AI-service components.

The architecture is designed to allow additional AI models to be integrated without tightly coupling machine-learning dependencies to the Node.js backend.