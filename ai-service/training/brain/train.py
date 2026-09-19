from pathlib import Path
import csv
import time

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from tqdm import tqdm

import matplotlib.pyplot as plt

from dataset import BrainMRIDataset
from model import create_model


# ============================================================
# CONFIGURATION
# ============================================================

ROOT = Path(__file__).resolve().parents[2]

MODEL_DIR = ROOT / "models"
RESULTS_DIR = ROOT / "results" / "brain"

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)

RESULTS_DIR.mkdir(
    parents=True,
    exist_ok=True
)

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)

IMAGE_SIZE = 256

BATCH_SIZE = 8

NUM_WORKERS = 2

EPOCHS = 40

LEARNING_RATE = 1e-4

WEIGHT_DECAY = 1e-5

DICE_SMOOTH = 1e-6

EARLY_STOPPING_PATIENCE = 8

CHECKPOINT_PATH = (
    MODEL_DIR / "brain_unet_best.pth"
)

HISTORY_PATH = (
    RESULTS_DIR / "training_history.csv"
)

PLOT_PATH = (
    RESULTS_DIR / "training_curves.png"
)


# ============================================================
# REPRODUCIBILITY
# ============================================================

SEED = 42

torch.manual_seed(SEED)

if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)


# ============================================================
# DICE LOSS
# ============================================================

class DiceLoss(nn.Module):

    def __init__(
        self,
        smooth=DICE_SMOOTH
    ):

        super().__init__()

        self.smooth = smooth

    def forward(
        self,
        logits,
        targets
    ):

        probabilities = torch.sigmoid(logits)

        probabilities = probabilities.contiguous()
        targets = targets.contiguous()

        probabilities = probabilities.view(
            probabilities.size(0),
            -1
        )

        targets = targets.view(
            targets.size(0),
            -1
        )

        intersection = (
            probabilities * targets
        ).sum(dim=1)

        denominator = (
            probabilities.sum(dim=1)
            +
            targets.sum(dim=1)
        )

        dice = (
            (2.0 * intersection + self.smooth)
            /
            (denominator + self.smooth)
        )

        return 1.0 - dice.mean()


# ============================================================
# COMBINED LOSS
# ============================================================

class BCEDiceLoss(nn.Module):

    def __init__(
        self,
        bce_weight=0.5,
        dice_weight=0.5
    ):

        super().__init__()

        self.bce = nn.BCEWithLogitsLoss()

        self.dice = DiceLoss()

        self.bce_weight = bce_weight
        self.dice_weight = dice_weight

    def forward(
        self,
        logits,
        targets
    ):

        bce_loss = self.bce(
            logits,
            targets
        )

        dice_loss = self.dice(
            logits,
            targets
        )

        total_loss = (
            self.bce_weight * bce_loss
            +
            self.dice_weight * dice_loss
        )

        return total_loss


# ============================================================
# METRICS
# ============================================================

def calculate_metrics(
    logits,
    targets,
    threshold=0.5
):

    probabilities = torch.sigmoid(logits)

    predictions = (
        probabilities >= threshold
    ).float()

    targets = targets.float()

    # --------------------------------------------------------
    # Flatten
    # --------------------------------------------------------

    predictions = predictions.view(
        predictions.size(0),
        -1
    )

    targets = targets.view(
        targets.size(0),
        -1
    )

    # --------------------------------------------------------
    # Confusion components
    # --------------------------------------------------------

    intersection = (
        predictions * targets
    ).sum(dim=1)

    prediction_sum = predictions.sum(dim=1)

    target_sum = targets.sum(dim=1)

    union = (
        prediction_sum
        +
        target_sum
        -
        intersection
    )

    # --------------------------------------------------------
    # Dice
    # --------------------------------------------------------

    dice = (
        (2.0 * intersection + DICE_SMOOTH)
        /
        (
            prediction_sum
            +
            target_sum
            +
            DICE_SMOOTH
        )
    )

    # --------------------------------------------------------
    # IoU
    # --------------------------------------------------------

    iou = (
        (intersection + DICE_SMOOTH)
        /
        (union + DICE_SMOOTH)
    )

    return (
        dice.mean().item(),
        iou.mean().item()
    )


# ============================================================
# TRAIN ONE EPOCH
# ============================================================

def train_one_epoch(
    model,
    loader,
    criterion,
    optimizer,
    scaler
):

    model.train()

    running_loss = 0.0

    running_dice = 0.0
    running_iou = 0.0

    total_samples = 0

    progress = tqdm(
        loader,
        desc="Training",
        leave=False
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

        optimizer.zero_grad(
            set_to_none=True
        )

        # ----------------------------------------------------
        # Mixed precision
        # ----------------------------------------------------

        with torch.amp.autocast(
            device_type="cuda",
            enabled=DEVICE.type == "cuda"
        ):

            logits = model(images)

            loss = criterion(
                logits,
                masks
            )

        # ----------------------------------------------------
        # Backpropagation
        # ----------------------------------------------------

        scaler.scale(loss).backward()

        scaler.unscale_(optimizer)

        torch.nn.utils.clip_grad_norm_(
            model.parameters(),
            max_norm=1.0
        )

        scaler.step(optimizer)

        scaler.update()

        # ----------------------------------------------------
        # Metrics
        # ----------------------------------------------------

        dice, iou = calculate_metrics(
            logits.detach(),
            masks
        )

        batch_size = images.size(0)

        running_loss += (
            loss.item() * batch_size
        )

        running_dice += (
            dice * batch_size
        )

        running_iou += (
            iou * batch_size
        )

        total_samples += batch_size

        progress.set_postfix(
            loss=f"{loss.item():.4f}",
            dice=f"{dice:.4f}",
            iou=f"{iou:.4f}"
        )

    return (
        running_loss / total_samples,
        running_dice / total_samples,
        running_iou / total_samples
    )


# ============================================================
# VALIDATION
# ============================================================

@torch.no_grad()
def validate(
    model,
    loader,
    criterion
):

    model.eval()

    running_loss = 0.0

    running_dice = 0.0
    running_iou = 0.0

    total_samples = 0

    progress = tqdm(
        loader,
        desc="Validation",
        leave=False
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

        with torch.amp.autocast(
            device_type="cuda",
            enabled=DEVICE.type == "cuda"
        ):

            logits = model(images)

            loss = criterion(
                logits,
                masks
            )

        dice, iou = calculate_metrics(
            logits,
            masks
        )

        batch_size = images.size(0)

        running_loss += (
            loss.item() * batch_size
        )

        running_dice += (
            dice * batch_size
        )

        running_iou += (
            iou * batch_size
        )

        total_samples += batch_size

    return (
        running_loss / total_samples,
        running_dice / total_samples,
        running_iou / total_samples
    )


# ============================================================
# SAVE HISTORY
# ============================================================

def save_history(history):

    with open(
        HISTORY_PATH,
        "w",
        newline="",
        encoding="utf-8"
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=history[0].keys()
        )

        writer.writeheader()

        writer.writerows(history)


# ============================================================
# PLOT TRAINING CURVES
# ============================================================

def plot_history(history):

    epochs = [
        row["epoch"]
        for row in history
    ]

    train_loss = [
        row["train_loss"]
        for row in history
    ]

    val_loss = [
        row["val_loss"]
        for row in history
    ]

    train_dice = [
        row["train_dice"]
        for row in history
    ]

    val_dice = [
        row["val_dice"]
        for row in history
    ]

    train_iou = [
        row["train_iou"]
        for row in history
    ]

    val_iou = [
        row["val_iou"]
        for row in history
    ]

    # --------------------------------------------------------
    # Loss
    # --------------------------------------------------------

    plt.figure(figsize=(10, 6))

    plt.plot(
        epochs,
        train_loss,
        label="Train Loss"
    )

    plt.plot(
        epochs,
        val_loss,
        label="Validation Loss"
    )

    plt.xlabel("Epoch")
    plt.ylabel("Loss")

    plt.title(
        "Brain MRI U-Net Training and Validation Loss"
    )

    plt.legend()

    plt.grid(True)

    plt.tight_layout()

    plt.savefig(
        RESULTS_DIR / "loss_curve.png",
        dpi=200
    )

    plt.close()

    # --------------------------------------------------------
    # Dice
    # --------------------------------------------------------

    plt.figure(figsize=(10, 6))

    plt.plot(
        epochs,
        train_dice,
        label="Train Dice"
    )

    plt.plot(
        epochs,
        val_dice,
        label="Validation Dice"
    )

    plt.xlabel("Epoch")
    plt.ylabel("Dice Score")

    plt.title(
        "Brain MRI U-Net Dice Score"
    )

    plt.legend()

    plt.grid(True)

    plt.tight_layout()

    plt.savefig(
        RESULTS_DIR / "dice_curve.png",
        dpi=200
    )

    plt.close()

    # --------------------------------------------------------
    # IoU
    # --------------------------------------------------------

    plt.figure(figsize=(10, 6))

    plt.plot(
        epochs,
        train_iou,
        label="Train IoU"
    )

    plt.plot(
        epochs,
        val_iou,
        label="Validation IoU"
    )

    plt.xlabel("Epoch")
    plt.ylabel("IoU")

    plt.title(
        "Brain MRI U-Net IoU"
    )

    plt.legend()

    plt.grid(True)

    plt.tight_layout()

    plt.savefig(
        RESULTS_DIR / "iou_curve.png",
        dpi=200
    )

    plt.close()


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("BRAIN MRI U-NET TRAINING")
    print("=" * 70)

    print(f"\nDevice          : {DEVICE}")
    print(f"Batch size      : {BATCH_SIZE}")
    print(f"Epochs          : {EPOCHS}")
    print(f"Learning rate   : {LEARNING_RATE}")
    print(f"Image size      : {IMAGE_SIZE}")
    print(f"Workers         : {NUM_WORKERS}")

    # --------------------------------------------------------
    # GPU information
    # --------------------------------------------------------

    if DEVICE.type == "cuda":

        print(
            f"GPU             : "
            f"{torch.cuda.get_device_name(0)}"
        )

    # ========================================================
    # DATASETS
    # ========================================================

    print("\n" + "-" * 70)
    print("LOADING DATASETS")
    print("-" * 70)

    train_dataset = BrainMRIDataset(
        split="train",
        image_size=IMAGE_SIZE,
        augment=True
    )

    val_dataset = BrainMRIDataset(
        split="val",
        image_size=IMAGE_SIZE,
        augment=False
    )

    # ========================================================
    # DATALOADERS
    # ========================================================

    train_loader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=NUM_WORKERS,
        pin_memory=DEVICE.type == "cuda",
        persistent_workers=NUM_WORKERS > 0
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=NUM_WORKERS,
        pin_memory=DEVICE.type == "cuda",
        persistent_workers=NUM_WORKERS > 0
    )

    print(
        f"\nTrain samples      : "
        f"{len(train_dataset)}"
    )

    print(
        f"Validation samples : "
        f"{len(val_dataset)}"
    )

    # ========================================================
    # MODEL
    # ========================================================

    print("\n" + "-" * 70)
    print("CREATING MODEL")
    print("-" * 70)

    model = create_model().to(DEVICE)

    # ========================================================
    # LOSS
    # ========================================================

    criterion = BCEDiceLoss(
        bce_weight=0.5,
        dice_weight=0.5
    )

    # ========================================================
    # OPTIMIZER
    # ========================================================

    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=LEARNING_RATE,
        weight_decay=WEIGHT_DECAY
    )

    # ========================================================
    # SCHEDULER
    # ========================================================

    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer,
        mode="max",
        factor=0.5,
        patience=3,
        min_lr=1e-6
    )

    # ========================================================
    # AMP
    # ========================================================

    scaler = torch.amp.GradScaler(
        "cuda",
        enabled=DEVICE.type == "cuda"
    )

    # ========================================================
    # TRAINING
    # ========================================================

    history = []

    best_val_dice = -1.0

    epochs_without_improvement = 0

    training_start = time.time()

    for epoch in range(1, EPOCHS + 1):

        print(
            f"\n{'=' * 70}"
        )

        print(
            f"EPOCH {epoch}/{EPOCHS}"
        )

        print(
            f"{'=' * 70}"
        )

        epoch_start = time.time()

        # ----------------------------------------------------
        # Training
        # ----------------------------------------------------

        train_loss, train_dice, train_iou = train_one_epoch(
            model,
            train_loader,
            criterion,
            optimizer,
            scaler
        )

        # ----------------------------------------------------
        # Validation
        # ----------------------------------------------------

        val_loss, val_dice, val_iou = validate(
            model,
            val_loader,
            criterion
        )

        # ----------------------------------------------------
        # Scheduler
        # ----------------------------------------------------

        scheduler.step(val_dice)

        current_lr = optimizer.param_groups[0]["lr"]

        epoch_time = time.time() - epoch_start

        # ----------------------------------------------------
        # Store history
        # ----------------------------------------------------

        row = {
            "epoch": epoch,
            "train_loss": train_loss,
            "val_loss": val_loss,
            "train_dice": train_dice,
            "val_dice": val_dice,
            "train_iou": train_iou,
            "val_iou": val_iou,
            "learning_rate": current_lr,
            "epoch_time_seconds": epoch_time
        }

        history.append(row)

        # ----------------------------------------------------
        # Print metrics
        # ----------------------------------------------------

        print(
            f"\nTrain Loss : {train_loss:.4f}"
        )

        print(
            f"Val Loss   : {val_loss:.4f}"
        )

        print(
            f"Train Dice : {train_dice:.4f}"
        )

        print(
            f"Val Dice   : {val_dice:.4f}"
        )

        print(
            f"Train IoU  : {train_iou:.4f}"
        )

        print(
            f"Val IoU    : {val_iou:.4f}"
        )

        print(
            f"LR         : {current_lr:.2e}"
        )

        print(
            f"Time       : {epoch_time:.1f}s"
        )

        # ----------------------------------------------------
        # Best checkpoint
        # ----------------------------------------------------

        if val_dice > best_val_dice:

            best_val_dice = val_dice

            epochs_without_improvement = 0

            torch.save(
                {
                    "epoch": epoch,
                    "model_state_dict": model.state_dict(),
                    "optimizer_state_dict": optimizer.state_dict(),
                    "val_dice": val_dice,
                    "val_iou": val_iou,
                    "val_loss": val_loss
                },
                CHECKPOINT_PATH
            )

            print(
                f"\n✓ BEST MODEL SAVED"
            )

            print(
                f"Best Val Dice: "
                f"{best_val_dice:.4f}"
            )

        else:

            epochs_without_improvement += 1

            print(
                f"\nNo improvement: "
                f"{epochs_without_improvement}/"
                f"{EARLY_STOPPING_PATIENCE}"
            )

        # ----------------------------------------------------
        # Save history every epoch
        # ----------------------------------------------------

        save_history(history)

        # ----------------------------------------------------
        # Early stopping
        # ----------------------------------------------------

        if (
            epochs_without_improvement
            >= EARLY_STOPPING_PATIENCE
        ):

            print(
                "\nEarly stopping triggered."
            )

            break

    # ========================================================
    # FINISH
    # ========================================================

    total_training_time = (
        time.time() - training_start
    )

    plot_history(history)

    print("\n" + "=" * 70)
    print("TRAINING COMPLETE")
    print("=" * 70)

    print(
        f"\nBest validation Dice : "
        f"{best_val_dice:.4f}"
    )

    print(
        f"Training time        : "
        f"{total_training_time / 60:.2f} minutes"
    )

    print(
        f"\nBest model:"
    )

    print(CHECKPOINT_PATH)

    print(
        f"\nTraining history:"
    )

    print(HISTORY_PATH)

    print(
        f"\nPlots:"
    )

    print(RESULTS_DIR)

    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()