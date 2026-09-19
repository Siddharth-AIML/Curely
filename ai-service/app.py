from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import shutil
import uuid

try:
    from services.skin_gradcam import predict_with_gradcam
except ModuleNotFoundError:
    predict_with_gradcam = None

from services.brain_predictor import predict_brain_mri

app = FastAPI(
    title="Curely AI Service",
    version="1.0.0"
)

# Directories
RESULTS_DIR = Path("results")
UPLOADS_DIR = Path("uploads")
BRAIN_RESULTS_DIR = RESULTS_DIR / "brain"

RESULTS_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)
BRAIN_RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# Serve generated AI result images
app.mount(
    "/results",
    StaticFiles(directory=RESULTS_DIR),
    name="results"
)


@app.get("/")
def root():
    return {
        "service": "Curely AI Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/predict/skin")
async def predict_skin_endpoint(file: UploadFile = File(...)):

    if predict_with_gradcam is None:
        raise HTTPException(
            status_code=503,
            detail="Skin model dependencies are not available"
        )

    allowed_types = {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )

    file_id = str(uuid.uuid4())

    extension = Path(file.filename).suffix.lower()

    if extension not in [".jpg", ".jpeg", ".png", ".webp"]:
        extension = ".jpg"

    input_path = UPLOADS_DIR / f"{file_id}{extension}"
    output_path = RESULTS_DIR / f"{file_id}_gradcam.jpg"

    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:

        result = predict_with_gradcam(
            image_path=str(input_path),
            output_path=str(output_path)
        )

        return {
            "success": True,
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "predictions": result["predictions"],
            "heatmap_url": f"/results/{file_id}_gradcam.jpg",
            "model_version": "efficientnet_b0_ham10000_v2"
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Skin analysis failed: {str(e)}"
        )


@app.post("/predict/brain-mri")
async def predict_brain_mri_endpoint(file: UploadFile = File(...)):
    allowed_types = {"image/jpeg", "image/jpg", "image/png", "image/webp"}

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid MRI image file."
        )

    file_id = str(uuid.uuid4())
    extension = Path(file.filename).suffix.lower()
    if extension not in [".jpg", ".jpeg", ".png", ".webp"]:
        extension = ".png"

    input_path = UPLOADS_DIR / f"{file_id}{extension}"
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        result = predict_brain_mri(str(input_path), output_id=file_id)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Brain MRI analysis failed: {str(exc)}"
        )