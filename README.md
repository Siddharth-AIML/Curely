# Curely — AI-Powered Healthcare Management Platform

Curely is a full-stack healthcare management platform designed to connect **patients, doctors, and diagnostic laboratories** through a secure role-based system, while providing AI-assisted medical analysis and intelligent healthcare workflows.

The platform combines a web-based healthcare management system with a dedicated AI service for medical image analysis and explainable AI.

---

## 🚀 Overview

Curely provides a centralized platform where:

- Patients can manage their healthcare information.
- Doctors can manage patients and review medical information.
- Doctors can refer patients to laboratories.
- Patients can securely authorize access to their laboratory reports using OTP verification.
- Laboratories can manage diagnostic reports.
- AI models can assist with medical image analysis.
- AI predictions can be accompanied by explainability visualizations such as Grad-CAM.
- The system is designed around **doctor-in-the-loop clinical decision support**, rather than autonomous diagnosis.

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
                         │                      │
                         │ Authentication       │
                         │ Authorization        │
                         │ Business Logic       │
                         │ API Routes            │
                         └───────┬───────┬──────┘
                                 │       │
                       Database  │       │ AI Requests
                                 │       │
                                 ▼       ▼
                         ┌──────────┐  ┌──────────────────┐
                         │ Database │  │   FastAPI AI     │
                         │          │  │     Service      │
                         └──────────┘  └────────┬─────────┘
                                               │
                                               ▼
                                     ┌────────────────────┐
                                     │    AI/ML Models    │
                                     │                    │
                                     │ Skin Analysis      │
                                     │ Grad-CAM           │
                                     │ Future AI Models   │
                                     └────────────────────┘
```

---

# 📁 Project Structure

```text
Curely/
│
├── backend/
│   │
│   ├── config/
│   │   └── Database/configuration files
│   │
│   ├── middleware/
│   │   └── Authentication and authorization middleware
│   │
│   ├── models/
│   │   └── Database models
│   │
│   ├── routes/
│   │   ├── ai.js
│   │   ├── appointment.js
│   │   ├── auth.js
│   │   ├── chatRoutes.js
│   │   ├── customer.js
│   │   ├── doctor.js
│   │   ├── lab.js
│   │   ├── medical.js
│   │   └── reports.js
│   │
│   ├── uploads/
│   │   └── Backend-uploaded files
│   │
│   ├── utils/
│   │   └── Utility functions
│   │
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── backend_chatbot/
│   └── Existing chatbot implementation
│
├── ai-service/
│   │
│   ├── data/
│   │   ├── raw/
│   │   │   └── HAM10000 dataset
│   │   └── processed/
│   │
│   ├── models/
│   │   ├── skin_model_best.pth
│   │   ├── skin_model_sampler_best.pth
│   │   ├── training_history.json
│   │   ├── training_history_sampler.json
│   │   └── Grad-CAM outputs
│   │
│   ├── services/
│   │   ├── explainability.py
│   │   ├── preprocessing.py
│   │   ├── skin_gradcam.py
│   │   └── skin_predictor.py
│   │
│   ├── training/
│   │   ├── dataset.py
│   │   ├── model.py
│   │   ├── train.py
│   │   ├── evaluate.py
│   │   ├── split_dataset.py
│   │   └── check_split.py
│   │
│   ├── uploads/
│   │   └── Runtime AI uploads
│   │
│   ├── results/
│   │   └── Generated AI results
│   │
│   ├── app.py
│   ├── test_gradcam.py
│   └── requirements.txt
│
├── vite-frontend/
│   │
│   ├── public/
│   ├── src/
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vercel.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

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

The AI service is an independent Python microservice built using:

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

The AI service is separated from the Express backend so that machine-learning inference and training dependencies remain isolated from the Node.js application.

---

# 🧠 Current AI Module — Skin Disease Analysis

The first integrated AI module performs skin lesion classification using the **HAM10000 dataset**.

## Model

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

# 📊 Current Model Performance

The current sampler-based experiment achieved approximately:

| Metric | Result |
|---|---:|
| Test Accuracy | 85.18% |
| Balanced Accuracy | 74.79% |
| Macro F1 | 76.23% |
| Weighted F1 | 85.28% |
| Macro ROC-AUC | 96.81% |

The model is intended for **AI-assisted analysis and clinical decision support**.

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
```

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

The pre-existing `kidney_disease_model.pkl` and `kidney_scaler.pkl` artifacts
are left untouched and are not used by this pipeline.

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

The intended architecture is:

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

The intended production workflow is:

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
   ├── Patient validation
   └── Audit / database operations
   │
   ▼
FastAPI AI Service
   │
   ▼
EfficientNet-B0
   │
   ├── Prediction
   ├── Confidence
   └── Grad-CAM
   │
   ▼
Express Backend
   │
   ▼
Database
   │
   ▼
React Frontend
```

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
| `ai-service/app.py` | FastAPI application |
| `ai-service/services/skin_predictor.py` | Skin prediction logic |
| `ai-service/services/skin_gradcam.py` | Prediction + Grad-CAM |
| `ai-service/services/preprocessing.py` | Image preprocessing |
| `ai-service/services/explainability.py` | Explainability utilities |
| `ai-service/training/model.py` | EfficientNet model architecture |
| `ai-service/training/dataset.py` | HAM10000 dataset loader |
| `ai-service/training/train.py` | Model training |
| `ai-service/training/evaluate.py` | Model evaluation |
| `ai-service/training/split_dataset.py` | Dataset splitting |
| `ai-service/training/check_split.py` | Dataset split verification |
| `ai-service/test_gradcam.py` | Grad-CAM testing |

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

The following files and directories should normally **not** be committed:

```text
.venv/
node_modules/
__pycache__/
.env

ai-service/data/raw/
ai-service/uploads/
ai-service/results/

*.pth
*.pt
*.onnx
```

Large model checkpoints should be managed using Git LFS, a model registry, or another artifact-storage solution if they need to be versioned.

---

# 🔑 Environment Variables

Environment variables should be stored in `.env` files and should never be committed.

Example:

```env
PORT=5000
MONGO_URI=your_database_url
JWT_SECRET=your_secret
AI_SERVICE_URL=http://127.0.0.1:8000
```

Use the actual variables required by your local configuration.

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
- EfficientNet-B0
- Scikit-learn
- Grad-CAM
- Pandas
- NumPy
- Pillow

---

# 📈 AI Roadmap

Curely is being developed toward a broader AI-assisted healthcare platform.

## 1. Skin Disease Analysis

```text
Image
  ↓
EfficientNet-B0
  ↓
Classification
  ↓
Grad-CAM
```

## 2. Brain MRI Analysis

Potential architecture:

```text
MRI
 ↓
Preprocessing
 ↓
Segmentation
 ↓
Tumor Classification
 ↓
Explainability
```

## 3. Medical Report Intelligence

```text
Lab Report
     ↓
OCR
     ↓
Information Extraction
     ↓
Structured Medical Data
     ↓
Abnormal Value Detection
```

## 4. Patient Record Intelligence

A retrieval-based healthcare assistant can provide authorized access to:

- Previous reports
- Lab results
- Medical history
- Prescriptions
- AI analysis results

The assistant should retrieve only records that the authenticated user is authorized to access.

## 5. Longitudinal Health Analytics

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

---

## Start Backend

```bash
cd backend
npm install
npm start
```

---

## Start Frontend

Open another terminal:

```bash
cd vite-frontend
npm install
npm run dev
```

---

## Start AI Service

Open another terminal:

```powershell
cd ai-service
.\.venv\Scripts\Activate.ps1
uvicorn app:app --reload --port 8000
```

---

# 🔗 Local Services

| Service | URL |
|---|---|
| Frontend | `http://localhost:<frontend-port>` |
| Express Backend | `http://localhost:<backend-port>` |
| FastAPI AI Service | `http://127.0.0.1:8000` |
| FastAPI Swagger | `http://127.0.0.1:8000/docs` |

Use the ports configured in the respective environment/configuration files.

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
- [x] AI service architecture
- [x] HAM10000 preprocessing
- [x] Lesion-grouped train/validation/test split
- [x] EfficientNet-B0 skin classifier
- [x] Class imbalance handling using weighted sampling
- [x] Model evaluation
- [x] FastAPI AI service
- [x] Skin prediction endpoint
- [x] Grad-CAM explainability
- [x] Swagger API testing

## In Progress

- [ ] React skin-analysis interface
- [ ] Express → FastAPI integration
- [ ] AI result persistence
- [ ] Doctor review workflow
- [ ] AI audit logging

## Planned

- [ ] Brain MRI analysis
- [ ] Medical report OCR
- [ ] Patient-record RAG assistant
- [ ] Longitudinal health analytics
- [ ] Additional explainability modules
- [ ] External validation of medical image models

---

# ⚠️ Medical Disclaimer

Curely is an academic/research software project.

AI-generated predictions are intended for **research and clinical decision-support purposes only** and must not be treated as a definitive medical diagnosis.

Medical decisions should be made by qualified healthcare professionals using appropriate clinical information and examination.

---

# 👩‍💻 Development

Curely is developed as a full-stack healthcare and AI/ML project with separate frontend, backend, and AI-service components.

The architecture is designed to allow additional AI models to be integrated without tightly coupling machine-learning dependencies to the Node.js backend.