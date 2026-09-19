from pathlib import Path

import torch
import numpy as np

from PIL import Image

from torchvision import transforms

from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import (
    ClassifierOutputTarget
)
from pytorch_grad_cam.utils.image import (
    show_cam_on_image
)

from training.model import create_model
from training.dataset import CLASS_NAMES


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    BASE_DIR
    / "models"
    / "skin_model_sampler_best.pth"
)


# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


# ============================================================
# LOAD MODEL
# ============================================================

model = create_model(
    num_classes=len(CLASS_NAMES)
)


checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE
)


model.load_state_dict(
    checkpoint["model_state_dict"]
)


model = model.to(DEVICE)

model.eval()


# ============================================================
# TRANSFORM
# ============================================================

transform = transforms.Compose([

    transforms.Resize(
        (224, 224)
    ),

    transforms.ToTensor(),

    transforms.Normalize(

        mean=[
            0.485,
            0.456,
            0.406
        ],

        std=[
            0.229,
            0.224,
            0.225
        ]

    )

])


# ============================================================
# GRAD-CAM TARGET
# ============================================================

# EfficientNet-B0's final convolutional feature layer.

TARGET_LAYER = (
    model.features[-1]
)


# ============================================================
# PREDICTION + GRAD-CAM
# ============================================================

def predict_with_gradcam(
    image_path: str,
    output_path: str
):

    # --------------------------------------------------------
    # LOAD IMAGE
    # --------------------------------------------------------

    original_image = Image.open(
        image_path
    ).convert("RGB")


    # --------------------------------------------------------
    # RESIZE FOR DISPLAY
    # --------------------------------------------------------

    display_image = original_image.resize(
        (224, 224)
    )


    # Convert to [0,1]
    display_array = np.array(
        display_image
    ).astype(np.float32) / 255.0


    # --------------------------------------------------------
    # PREPROCESS
    # --------------------------------------------------------

    input_tensor = transform(
        original_image
    )


    input_tensor = input_tensor.unsqueeze(
        0
    )


    input_tensor = input_tensor.to(
        DEVICE
    )


    # --------------------------------------------------------
    # PREDICTION
    # --------------------------------------------------------

    with torch.no_grad():

        outputs = model(
            input_tensor
        )

        probabilities = torch.softmax(
            outputs,
            dim=1
        )


    predicted_class = (
        probabilities.argmax(
            dim=1
        ).item()
    )


    confidence = (
        probabilities[0][
            predicted_class
        ].item()
    )


    # --------------------------------------------------------
    # GRAD-CAM
    # --------------------------------------------------------

    targets = [
        ClassifierOutputTarget(
            predicted_class
        )
    ]


    with GradCAM(

        model=model,

        target_layers=[
            TARGET_LAYER
        ]

    ) as cam:

        grayscale_cam = cam(

            input_tensor=input_tensor,

            targets=targets

        )


    grayscale_cam = (
        grayscale_cam[0]
    )


    # --------------------------------------------------------
    # CREATE HEATMAP
    # --------------------------------------------------------

    visualization = show_cam_on_image(

        display_array,

        grayscale_cam,

        use_rgb=True

    )


    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    output_image = Image.fromarray(
        visualization
    )


    output_image.save(
        output_path
    )


    # --------------------------------------------------------
    # RETURN RESULT
    # --------------------------------------------------------

    predictions = []

    for index, probability in enumerate(
        probabilities[0]
    ):

        predictions.append({

            "class":
                CLASS_NAMES[index],

            "probability":
                round(
                    probability.item(),
                    4
                )

        })


    predictions.sort(

        key=lambda x:
        x["probability"],

        reverse=True

    )


    return {

        "prediction":
            CLASS_NAMES[
                predicted_class
            ],

        "confidence":
            round(
                confidence,
                4
            ),

        "predictions":
            predictions,

        "heatmap":
            output_path

    }