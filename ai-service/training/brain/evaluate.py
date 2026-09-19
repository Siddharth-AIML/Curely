from pathlib import Path
import csv

import numpy as np
import torch
from torch.utils.data import DataLoader
from tqdm import tqdm
from PIL import Image

from dataset import BrainMRIDataset
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

RESULTS_DIR = (
    ROOT
    / "results"
    / "brain"
    / "test_predictions"
)

RESULTS_DIR.mkdir(
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

BATCH_SIZE = 8

THRESHOLD = 0.5

NUM_WORKERS = 2

SMOOTH = 1e-6


# ============================================================
# METRICS
# ============================================================

def calculate_sample_metrics(
    prediction,
    target
):

    prediction = prediction.astype(bool)
    target = target.astype(bool)

    tp = np.logical_and(
        prediction,
        target
    ).sum()

    fp = np.logical_and(
        prediction,
        np.logical_not(target)
    ).sum()

    fn = np.logical_and(
        np.logical_not(prediction),
        target
    ).sum()

    tn = np.logical_and(
        np.logical_not(prediction),
        np.logical_not(target)
    ).sum()

    dice = (
        2 * tp + SMOOTH
    ) / (
        2 * tp + fp + fn + SMOOTH
    )

    iou = (
        tp + SMOOTH
    ) / (
        tp + fp + fn + SMOOTH
    )

    precision = (
        tp + SMOOTH
    ) / (
        tp + fp + SMOOTH
    )

    recall = (
        tp + SMOOTH
    ) / (
        tp + fn + SMOOTH
    )

    return {
        "dice": float(dice),
        "iou": float(iou),
        "precision": float(precision),
        "recall": float(recall),
        "tp": int(tp),
        "fp": int(fp),
        "fn": int(fn),
        "tn": int(tn)
    }


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
        f"Loaded checkpoint from epoch "
        f"{checkpoint['epoch']}"
    )

    print(
        f"Checkpoint validation Dice: "
        f"{checkpoint['val_dice']:.4f}"
    )

    print(
        f"Checkpoint validation IoU: "
        f"{checkpoint['val_iou']:.4f}"
    )

    return model


# ============================================================
# SAVE PREDICTION VISUALIZATION
# ============================================================

def save_visualization(
    image_tensor,
    target_tensor,
    prediction_tensor,
    output_path
):

    # --------------------------------------------------------
    # Convert image back to displayable RGB
    # --------------------------------------------------------

    image = image_tensor.cpu().numpy()

    image = np.transpose(
        image,
        (1, 2, 0)
    )

    # Normalize for visualization only
    image = (
        image - image.min()
    ) / (
        image.max() - image.min() + 1e-8
    )

    target = target_tensor.cpu().numpy()

    prediction = prediction_tensor.cpu().numpy()

    # --------------------------------------------------------
    # Create 3-panel image
    # --------------------------------------------------------

    canvas = np.zeros(
        (256, 256 * 3, 3),
        dtype=np.uint8
    )

    image_uint8 = (
        image * 255
    ).astype(np.uint8)

    target_rgb = np.zeros_like(
        image_uint8
    )

    prediction_rgb = np.zeros_like(
        image_uint8
    )

    target_rgb[target > 0] = [
        255,
        255,
        255
    ]

    prediction_rgb[prediction > 0] = [
        255,
        255,
        255
    ]

    canvas[:, :256] = image_uint8

    canvas[:, 256:512] = target_rgb

    canvas[:, 512:768] = prediction_rgb

    Image.fromarray(canvas).save(
        output_path
    )


# ============================================================
# MAIN
# ============================================================

@torch.no_grad()
def main():

    print("=" * 70)
    print("BRAIN MRI TEST EVALUATION")
    print("=" * 70)

    print(
        f"\nDevice: {DEVICE}"
    )

    print(
        f"Model: {MODEL_PATH}"
    )

    # --------------------------------------------------------
    # Dataset
    # --------------------------------------------------------

    test_dataset = BrainMRIDataset(
        split="test",
        augment=False
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=NUM_WORKERS,
        pin_memory=DEVICE.type == "cuda",
        persistent_workers=NUM_WORKERS > 0
    )

    print(
        f"\nTest samples: "
        f"{len(test_dataset)}"
    )

    # --------------------------------------------------------
    # Model
    # --------------------------------------------------------

    model = load_model()

    # --------------------------------------------------------
    # Metric storage
    # --------------------------------------------------------

    all_metrics = []

    global_tp = 0
    global_fp = 0
    global_fn = 0
    global_tn = 0

    positive_count = 0
    negative_count = 0

    visualization_count = 0

    # --------------------------------------------------------
    # Evaluation
    # --------------------------------------------------------

    progress = tqdm(
        test_loader,
        desc="Testing"
    )

    for batch in progress:

        images = batch["image"].to(
            DEVICE,
            non_blocking=True
        )

        masks = batch["mask"].to(
            DEVICE,
            non_blocking=True
        )

        logits = model(images)

        probabilities = torch.sigmoid(
            logits
        )

        predictions = (
            probabilities >= THRESHOLD
        )

        # ----------------------------------------------------
        # Individual sample metrics
        # ----------------------------------------------------

        for i in range(images.size(0)):

            prediction = (
                predictions[i, 0]
                .cpu()
                .numpy()
            )

            target = (
                masks[i, 0]
                .cpu()
                .numpy()
            )

            metrics = calculate_sample_metrics(
                prediction,
                target
            )

            patient = batch["patient"][i]

            image_path = batch["image_path"][i]

            has_tumor = (
                target.sum() > 0
            )

            metrics["patient"] = patient

            metrics["image_path"] = image_path

            metrics["has_tumor"] = bool(
                has_tumor
            )

            all_metrics.append(
                metrics
            )

            # ------------------------------------------------
            # Global statistics
            # ------------------------------------------------

            global_tp += metrics["tp"]
            global_fp += metrics["fp"]
            global_fn += metrics["fn"]
            global_tn += metrics["tn"]

            if has_tumor:
                positive_count += 1
            else:
                negative_count += 1

            # ------------------------------------------------
            # Save first 10 examples
            # ------------------------------------------------

            if visualization_count < 10:

                output_path = (
                    RESULTS_DIR
                    / f"example_{visualization_count + 1}.png"
                )

                save_visualization(
                    images[i],
                    masks[i, 0],
                    predictions[i, 0],
                    output_path
                )

                visualization_count += 1

    # ========================================================
    # AGGREGATE METRICS
    # ========================================================

    dice_scores = [
        x["dice"]
        for x in all_metrics
    ]

    iou_scores = [
        x["iou"]
        for x in all_metrics
    ]

    precision_scores = [
        x["precision"]
        for x in all_metrics
    ]

    recall_scores = [
        x["recall"]
        for x in all_metrics
    ]

    mean_dice = np.mean(
        dice_scores
    )

    median_dice = np.median(
        dice_scores
    )

    mean_iou = np.mean(
        iou_scores
    )

    mean_precision = np.mean(
        precision_scores
    )

    mean_recall = np.mean(
        recall_scores
    )

    # --------------------------------------------------------
    # Global pixel metrics
    # --------------------------------------------------------

    global_dice = (
        2 * global_tp + SMOOTH
    ) / (
        2 * global_tp
        + global_fp
        + global_fn
        + SMOOTH
    )

    global_iou = (
        global_tp + SMOOTH
    ) / (
        global_tp
        + global_fp
        + global_fn
        + SMOOTH
    )

    global_precision = (
        global_tp + SMOOTH
    ) / (
        global_tp
        + global_fp
        + SMOOTH
    )

    global_recall = (
        global_tp + SMOOTH
    ) / (
        global_tp
        + global_fn
        + SMOOTH
    )

    # ========================================================
    # PRINT RESULTS
    # ========================================================

    print("\n" + "=" * 70)
    print("TEST RESULTS")
    print("=" * 70)

    print(
        f"\nTest slices           : "
        f"{len(all_metrics)}"
    )

    print(
        f"Tumor-positive slices : "
        f"{positive_count}"
    )

    print(
        f"Tumor-negative slices : "
        f"{negative_count}"
    )

    print("\n" + "-" * 70)

    print(
        f"Mean Dice             : "
        f"{mean_dice:.4f}"
    )

    print(
        f"Median Dice           : "
        f"{median_dice:.4f}"
    )

    print(
        f"Mean IoU              : "
        f"{mean_iou:.4f}"
    )

    print(
        f"Mean Precision        : "
        f"{mean_precision:.4f}"
    )

    print(
        f"Mean Recall           : "
        f"{mean_recall:.4f}"
    )

    print("\n" + "-" * 70)
    print("GLOBAL PIXEL METRICS")
    print("-" * 70)

    print(
        f"Global Dice           : "
        f"{global_dice:.4f}"
    )

    print(
        f"Global IoU            : "
        f"{global_iou:.4f}"
    )

    print(
        f"Global Precision      : "
        f"{global_precision:.4f}"
    )

    print(
        f"Global Recall         : "
        f"{global_recall:.4f}"
    )

    # ========================================================
    # DICE DISTRIBUTION
    # ========================================================

    print("\n" + "-" * 70)
    print("DICE DISTRIBUTION")
    print("-" * 70)

    print(
        f"Minimum Dice          : "
        f"{np.min(dice_scores):.4f}"
    )

    print(
        f"25th percentile       : "
        f"{np.percentile(dice_scores, 25):.4f}"
    )

    print(
        f"Median                : "
        f"{np.percentile(dice_scores, 50):.4f}"
    )

    print(
        f"75th percentile       : "
        f"{np.percentile(dice_scores, 75):.4f}"
    )

    print(
        f"Maximum Dice          : "
        f"{np.max(dice_scores):.4f}"
    )

    # ========================================================
    # SAVE CSV
    # ========================================================

    csv_path = (
        RESULTS_DIR
        / "test_metrics.csv"
    )

    fieldnames = [
        "patient",
        "image_path",
        "has_tumor",
        "dice",
        "iou",
        "precision",
        "recall",
        "tp",
        "fp",
        "fn",
        "tn"
    ]

    with open(
        csv_path,
        "w",
        newline="",
        encoding="utf-8"
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=fieldnames
        )

        writer.writeheader()

        writer.writerows(
            all_metrics
        )

    # ========================================================
    # FINAL
    # ========================================================

    print("\n" + "-" * 70)

    print(
        f"Per-slice metrics saved:"
    )

    print(csv_path)

    print(
        f"\nVisual examples saved:"
    )

    print(RESULTS_DIR)

    print("\n" + "=" * 70)
    print("TEST EVALUATION COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()