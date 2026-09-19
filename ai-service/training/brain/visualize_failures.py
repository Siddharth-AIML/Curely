from pathlib import Path
import pandas as pd
import numpy as np

import torch
from PIL import Image
import matplotlib.pyplot as plt

from model import create_model


# ============================================================
# PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    ROOT
    / "models"
    / "brain_unet_best.pth"
)

METRICS_PATH = (
    ROOT
    / "results"
    / "brain"
    / "test_predictions"
    / "test_metrics.csv"
)

OUTPUT_DIR = (
    ROOT
    / "results"
    / "brain"
    / "failure_analysis"
    / "visualizations"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# CONFIG
# ============================================================

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)

THRESHOLD = 0.5


# ============================================================
# LOAD MODEL
# ============================================================

def load_model():

    model = create_model().to(DEVICE)

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=DEVICE
    )

    model.load_state_dict(
        checkpoint["model_state_dict"]
    )

    model.eval()

    print(
        f"Loaded model from epoch "
        f"{checkpoint['epoch']}"
    )

    return model


# ============================================================
# LOAD SAMPLE
# ============================================================

def load_sample(
    image_path,
    mask_path
):

    image = Image.open(
        image_path
    ).convert("RGB")

    mask = Image.open(
        mask_path
    ).convert("L")

    image_array = np.array(
        image
    ).astype(np.float32) / 255.0

    # --------------------------------------------------------
    # Same preprocessing as dataset.py
    # --------------------------------------------------------

    tensor = torch.from_numpy(
        image_array
    ).permute(
        2,
        0,
        1
    )

    mean = tensor.mean()
    std = tensor.std()

    tensor = (
        tensor - mean
    ) / (
        std + 1e-8
    )

    tensor = tensor.unsqueeze(0)

    mask_array = np.array(
        mask
    )

    mask_array = (
        mask_array > 127
    ).astype(np.uint8)

    return (
        image_array,
        mask_array,
        tensor
    )


# ============================================================
# GENERATE PREDICTION
# ============================================================

@torch.no_grad()
def predict(
    model,
    tensor
):

    tensor = tensor.to(
        DEVICE
    )

    logits = model(tensor)

    probability = torch.sigmoid(
        logits
    )[0, 0].cpu().numpy()

    prediction = (
        probability >= THRESHOLD
    ).astype(np.uint8)

    return (
        probability,
        prediction
    )


# ============================================================
# CREATE OVERLAY
# ============================================================

def create_overlay(
    image,
    mask,
    prediction
):

    overlay = image.copy()

    # Ground truth in red
    overlay[
        mask > 0
    ] = (
        0.65 * overlay[
            mask > 0
        ]
        +
        0.35 * np.array(
            [1.0, 0.0, 0.0]
        )
    )

    # Prediction in green
    overlay[
        prediction > 0
    ] = (
        0.65 * overlay[
            prediction > 0
        ]
        +
        0.35 * np.array(
            [0.0, 1.0, 0.0]
        )
    )

    # Both overlap → yellow
    overlap = (
        (mask > 0)
        &
        (prediction > 0)
    )

    overlay[
        overlap
    ] = (
        0.5 * overlay[
            overlap
        ]
        +
        0.5 * np.array(
            [1.0, 1.0, 0.0]
        )
    )

    return np.clip(
        overlay,
        0,
        1
    )


# ============================================================
# SAVE VISUALIZATION
# ============================================================

def save_visualization(
    image,
    mask,
    prediction,
    probability,
    title,
    output_path
):

    overlay = create_overlay(
        image,
        mask,
        prediction
    )

    fig, axes = plt.subplots(
        1,
        4,
        figsize=(16, 4)
    )

    # --------------------------------------------------------
    # MRI
    # --------------------------------------------------------

    axes[0].imshow(
        image
    )

    axes[0].set_title(
        "MRI"
    )

    axes[0].axis("off")

    # --------------------------------------------------------
    # Ground truth
    # --------------------------------------------------------

    axes[1].imshow(
        mask,
        cmap="gray"
    )

    axes[1].set_title(
        "Ground Truth"
    )

    axes[1].axis("off")

    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    axes[2].imshow(
        prediction,
        cmap="gray"
    )

    axes[2].set_title(
        "Prediction"
    )

    axes[2].axis("off")

    # --------------------------------------------------------
    # Overlay
    # --------------------------------------------------------

    axes[3].imshow(
        overlay
    )

    axes[3].set_title(
        "Overlay"
    )

    axes[3].axis("off")

    fig.suptitle(
        title,
        fontsize=12
    )

    plt.tight_layout()

    plt.savefig(
        output_path,
        dpi=180,
        bbox_inches="tight"
    )

    plt.close()


# ============================================================
# PROCESS CASES
# ============================================================

def process_cases(
    model,
    dataframe,
    category,
    count=5
):

    selected = (
        dataframe
        .head(count)
    )

    print(
        f"\nGenerating {category} visualizations..."
    )

    for index, row in selected.iterrows():

        image_path = Path(
            row["image_path"]
        )

        mask_path = image_path.with_name(
            image_path.stem
            + "_mask.tif"
        )

        if not image_path.exists():

            print(
                f"Missing image: "
                f"{image_path}"
            )

            continue

        if not mask_path.exists():

            print(
                f"Missing mask: "
                f"{mask_path}"
            )

            continue

        (
            image,
            mask,
            tensor
        ) = load_sample(
            image_path,
            mask_path
        )

        (
            probability,
            prediction
        ) = predict(
            model,
            tensor
        )

        title = (
            f"{category} | "
            f"Patient: {row['patient']} | "
            f"Dice: {row['dice']:.4f} | "
            f"IoU: {row['iou']:.4f}"
        )

        filename = (
            f"{category}_"
            f"{index}_"
            f"{row['patient']}.png"
        )

        output_path = (
            OUTPUT_DIR
            / filename
        )

        save_visualization(
            image,
            mask,
            prediction,
            probability,
            title,
            output_path
        )

        print(
            f"Saved: {output_path.name}"
        )


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("BRAIN MRI FAILURE VISUALIZATION")
    print("=" * 70)

    print(
        f"\nDevice: {DEVICE}"
    )

    # --------------------------------------------------------
    # Load
    # --------------------------------------------------------

    df = pd.read_csv(
        METRICS_PATH
    )

    model = load_model()

    # --------------------------------------------------------
    # Positive cases
    # --------------------------------------------------------

    positive = df[
        df["has_tumor"] == True
    ].copy()

    # --------------------------------------------------------
    # Worst cases
    # --------------------------------------------------------

    worst = (
        positive
        .sort_values("dice")
    )

    process_cases(
        model,
        worst,
        "worst",
        count=10
    )

    # --------------------------------------------------------
    # Best cases
    # --------------------------------------------------------

    best = (
        positive
        .sort_values(
            "dice",
            ascending=False
        )
    )

    process_cases(
        model,
        best,
        "best",
        count=5
    )

    # --------------------------------------------------------
    # Low precision
    # --------------------------------------------------------

    low_precision = (
        positive
        .sort_values(
            "precision"
        )
    )

    process_cases(
        model,
        low_precision,
        "false_positive",
        count=5
    )

    # --------------------------------------------------------
    # Low recall
    # --------------------------------------------------------

    low_recall = (
        positive
        .sort_values(
            "recall"
        )
    )

    process_cases(
        model,
        low_recall,
        "false_negative",
        count=5
    )

    print("\n" + "=" * 70)

    print(
        "VISUALIZATION COMPLETE"
    )

    print(
        f"\nSaved to:"
    )

    print(
        OUTPUT_DIR
    )

    print("=" * 70)


if __name__ == "__main__":
    main()