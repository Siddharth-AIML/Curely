from pathlib import Path
import uuid

import numpy as np
import torch
from PIL import Image

from training.brain.model import create_model

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "brain_unet_best.pth"
RESULTS_DIR = BASE_DIR / "results" / "brain"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
THRESHOLD = 0.5
MODEL_VERSION = "brain-unet-v1"

_model = None


def load_model():
    global _model
    if _model is not None:
        return _model

    model = create_model().to(DEVICE)
    checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)

    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
    elif isinstance(checkpoint, dict):
        state_dict = checkpoint
    else:
        raise TypeError(f"Unsupported model checkpoint format: {type(checkpoint)}")

    model.load_state_dict(state_dict)
    model.eval()
    _model = model
    return model


def preprocess_image(image: Image.Image):
    image = image.convert("RGB").resize((256, 256))
    image_array = np.array(image).astype(np.float32) / 255.0

    tensor = torch.from_numpy(image_array).permute(2, 0, 1)
    mean = tensor.mean()
    std = tensor.std()
    tensor = (tensor - mean) / (std + 1e-8)
    tensor = tensor.unsqueeze(0).to(DEVICE)

    return tensor, image_array


def create_overlay(image_array: np.ndarray, prediction_mask: np.ndarray) -> np.ndarray:
    overlay = image_array.copy().astype(np.float32)

    tumor_pixels = prediction_mask > 0
    if np.any(tumor_pixels):
        overlay[tumor_pixels] = 0.65 * overlay[tumor_pixels] + 0.35 * np.array([1.0, 0.0, 0.0])

    return np.clip(overlay, 0.0, 1.0)


def predict_brain_mri(image_path: str, output_id: str | None = None):
    model = load_model()
    image = Image.open(image_path).convert("RGB")
    tensor, image_array = preprocess_image(image)

    with torch.no_grad():
        logits = model(tensor)
        probability_map = torch.sigmoid(logits)[0, 0].cpu().numpy()

    prediction_mask = (probability_map >= THRESHOLD).astype(np.uint8)
    tumor_detected = bool(prediction_mask.any())
    tumor_area_percent = float(np.mean(prediction_mask) * 100.0)

    output_id = output_id or str(uuid.uuid4())
    segmentation_path = RESULTS_DIR / f"{output_id}_segmentation.png"
    overlay_path = RESULTS_DIR / f"{output_id}_overlay.png"

    Image.fromarray((probability_map * 255).astype(np.uint8)).save(segmentation_path)

    overlay_image = create_overlay(image_array, prediction_mask)
    Image.fromarray((overlay_image * 255).astype(np.uint8)).save(overlay_path)

    return {
        "success": True,
        "tumor_detected": tumor_detected,
        "tumor_area_percent": round(tumor_area_percent, 2),
        "segmentation_url": f"/results/brain/{output_id}_segmentation.png",
        "overlay_url": f"/results/brain/{output_id}_overlay.png",
        "model_version": MODEL_VERSION,
    }
