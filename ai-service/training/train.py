from pathlib import Path
import json

import numpy as np
import pandas as pd

import torch
import torch.nn as nn

from torch.utils.data import (
    DataLoader,
    WeightedRandomSampler
)

from torchvision import transforms

from sklearn.metrics import f1_score

from tqdm import tqdm

from dataset import (
    HAM10000Dataset,
    CLASS_NAMES
)

from model import create_model


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"

PROCESSED_DIR = DATA_DIR / "processed"

RAW_DIR = DATA_DIR / "raw"

MODEL_DIR = BASE_DIR / "models"

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)


TRAIN_CSV = (
    PROCESSED_DIR / "train.csv"
)

VAL_CSV = (
    PROCESSED_DIR / "val.csv"
)


IMAGE_DIRS = [

    RAW_DIR /
    "HAM10000_images_part_1",

    RAW_DIR /
    "HAM10000_images_part_2"

]


# ============================================================
# HYPERPARAMETERS
# ============================================================

BATCH_SIZE = 32

EPOCHS = 20

LEARNING_RATE = 1e-4

WEIGHT_DECAY = 1e-4

NUM_WORKERS = 0

PATIENCE = 5


# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


print("=" * 60)
print("CURELY SKIN DISEASE CLASSIFIER")
print("EXPERIMENT 2")
print("=" * 60)

print()

print("Device:", DEVICE)


if torch.cuda.is_available():

    print(
        "GPU:",
        torch.cuda.get_device_name(0)
    )

    print(
        "CUDA:",
        torch.version.cuda
    )


# ============================================================
# LOAD DATA
# ============================================================

train_df = pd.read_csv(
    TRAIN_CSV
)

val_df = pd.read_csv(
    VAL_CSV
)


print()

print(
    "Training samples:",
    len(train_df)
)

print(
    "Validation samples:",
    len(val_df)
)


# ============================================================
# CLASS MAPPING
# ============================================================

label_mapping = {
    name: index
    for index, name in enumerate(CLASS_NAMES)
}


train_labels = (
    train_df["dx"]
    .map(label_mapping)
    .values
)


# ============================================================
# WEIGHTED RANDOM SAMPLER
# ============================================================

print()

print("=" * 60)
print("CLASS DISTRIBUTION")
print("=" * 60)

class_counts = np.bincount(
    train_labels,
    minlength=len(CLASS_NAMES)
)


for class_name, count in zip(
    CLASS_NAMES,
    class_counts
):

    print(
        f"{class_name:6s}: {count}"
    )


# Give rare classes higher sampling probability.

class_sample_weights = (
    1.0 / class_counts
)


sample_weights = np.array([

    class_sample_weights[label]

    for label in train_labels

])


sample_weights = torch.tensor(
    sample_weights,
    dtype=torch.double
)


train_sampler = WeightedRandomSampler(

    weights=sample_weights,

    num_samples=len(sample_weights),

    replacement=True

)


print()

print(
    "✓ WeightedRandomSampler enabled"
)


# ============================================================
# TRANSFORMS
# ============================================================

# Moderate augmentation.
#
# We deliberately avoid aggressive augmentation because
# this is a medical-image classification task.

train_transform = transforms.Compose([

    transforms.Resize(
        (224, 224)
    ),

    transforms.RandomHorizontalFlip(
        p=0.5
    ),

    transforms.RandomRotation(
        degrees=15
    ),

    transforms.ColorJitter(
        brightness=0.10,
        contrast=0.10,
        saturation=0.10
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


val_transform = transforms.Compose([

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
# DATASETS
# ============================================================

train_dataset = HAM10000Dataset(

    train_df,

    IMAGE_DIRS,

    transform=train_transform

)


val_dataset = HAM10000Dataset(

    val_df,

    IMAGE_DIRS,

    transform=val_transform

)


# ============================================================
# DATALOADERS
# ============================================================

train_loader = DataLoader(

    train_dataset,

    batch_size=BATCH_SIZE,

    sampler=train_sampler,

    num_workers=NUM_WORKERS,

    pin_memory=torch.cuda.is_available()

)


val_loader = DataLoader(

    val_dataset,

    batch_size=BATCH_SIZE,

    shuffle=False,

    num_workers=NUM_WORKERS,

    pin_memory=torch.cuda.is_available()

)


# ============================================================
# MODEL
# ============================================================

model = create_model(
    num_classes=len(CLASS_NAMES)
)

model = model.to(DEVICE)


print()

print(
    "✓ EfficientNet-B0 loaded"
)


# ============================================================
# LOSS
# ============================================================

# IMPORTANT:
#
# We are intentionally NOT using class weights here.
#
# Experiment 2 uses:
#
# WeightedRandomSampler
# +
# normal CrossEntropyLoss
#
# This lets us compare this experiment fairly against
# the previous class-weighted baseline.

criterion = nn.CrossEntropyLoss()


# ============================================================
# OPTIMIZER
# ============================================================

optimizer = torch.optim.AdamW(

    model.parameters(),

    lr=LEARNING_RATE,

    weight_decay=WEIGHT_DECAY

)


# ============================================================
# LEARNING RATE SCHEDULER
# ============================================================

# IMPORTANT:
#
# We monitor validation Macro F1 rather than accuracy.

scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(

    optimizer,

    mode="max",

    factor=0.5,

    patience=2

)


# ============================================================
# MIXED PRECISION
# ============================================================

use_amp = torch.cuda.is_available()


if use_amp:

    scaler = torch.amp.GradScaler(
        "cuda"
    )

else:

    scaler = None


# ============================================================
# TRAINING HISTORY
# ============================================================

history = {

    "train_loss": [],

    "train_accuracy": [],

    "val_loss": [],

    "val_accuracy": [],

    "val_macro_f1": [],

    "learning_rate": []

}


# ============================================================
# BEST MODEL TRACKING
# ============================================================

best_val_macro_f1 = 0.0

best_val_accuracy = 0.0

best_epoch = 0

epochs_without_improvement = 0


# ============================================================
# TRAINING LOOP
# ============================================================

for epoch in range(EPOCHS):

    print()

    print("=" * 60)

    print(
        f"Epoch {epoch + 1}/{EPOCHS}"
    )

    print("=" * 60)


    # ========================================================
    # TRAIN
    # ========================================================

    model.train()


    running_loss = 0.0

    train_correct = 0

    train_total = 0


    progress = tqdm(

        train_loader,

        desc="Training"

    )


    for images, labels in progress:

        images = images.to(

            DEVICE,

            non_blocking=True

        )

        labels = labels.to(

            DEVICE,

            non_blocking=True

        )


        optimizer.zero_grad(
            set_to_none=True
        )


        # ----------------------------------------------------
        # FORWARD PASS
        # ----------------------------------------------------

        if use_amp:

            with torch.amp.autocast(
                "cuda"
            ):

                outputs = model(
                    images
                )

                loss = criterion(
                    outputs,
                    labels
                )

        else:

            outputs = model(
                images
            )

            loss = criterion(
                outputs,
                labels
            )


        # ----------------------------------------------------
        # BACKPROPAGATION
        # ----------------------------------------------------

        if use_amp:

            scaler.scale(
                loss
            ).backward()

            scaler.step(
                optimizer
            )

            scaler.update()

        else:

            loss.backward()

            optimizer.step()


        # ----------------------------------------------------
        # TRAINING METRICS
        # ----------------------------------------------------

        running_loss += (

            loss.item()
            * labels.size(0)

        )


        predictions = outputs.argmax(
            dim=1
        )


        train_correct += (

            predictions == labels

        ).sum().item()


        train_total += (
            labels.size(0)
        )


        progress.set_postfix(

            loss=f"{loss.item():.4f}"

        )


    train_loss = (
        running_loss /
        train_total
    )


    train_accuracy = (
        train_correct /
        train_total
    )


    # ========================================================
    # VALIDATION
    # ========================================================

    model.eval()


    val_running_loss = 0.0

    val_correct = 0

    val_total = 0


    # IMPORTANT:
    #
    # These MUST be outside the batch loop.
    #
    # Otherwise they get reset for every validation batch.

    val_predictions = []

    val_labels = []


    with torch.no_grad():

        for images, labels in val_loader:

            images = images.to(

                DEVICE,

                non_blocking=True

            )

            labels = labels.to(

                DEVICE,

                non_blocking=True

            )


            # ------------------------------------------------
            # FORWARD PASS
            # ------------------------------------------------

            if use_amp:

                with torch.amp.autocast(
                    "cuda"
                ):

                    outputs = model(
                        images
                    )

                    loss = criterion(
                        outputs,
                        labels
                    )

            else:

                outputs = model(
                    images
                )

                loss = criterion(
                    outputs,
                    labels
                )


            # ------------------------------------------------
            # LOSS
            # ------------------------------------------------

            val_running_loss += (

                loss.item()
                * labels.size(0)

            )


            # ------------------------------------------------
            # PREDICTIONS
            # ------------------------------------------------

            predictions = outputs.argmax(
                dim=1
            )


            # ------------------------------------------------
            # STORE ALL PREDICTIONS
            # ------------------------------------------------

            val_predictions.extend(

                predictions
                .cpu()
                .numpy()

            )


            val_labels.extend(

                labels
                .cpu()
                .numpy()

            )


            # ------------------------------------------------
            # ACCURACY
            # ------------------------------------------------

            val_correct += (

                predictions == labels

            ).sum().item()


            val_total += (
                labels.size(0)
            )


    # ========================================================
    # VALIDATION METRICS
    # ========================================================

    val_loss = (
        val_running_loss /
        val_total
    )


    val_accuracy = (
        val_correct /
        val_total
    )


    # THIS IS THE IMPORTANT METRIC
    #
    # Every disease class receives equal importance.

    val_macro_f1 = f1_score(

        val_labels,

        val_predictions,

        average="macro",

        zero_division=0

    )


    # ========================================================
    # LEARNING RATE
    # ========================================================

    scheduler.step(
        val_macro_f1
    )


    current_lr = (
        optimizer
        .param_groups[0]["lr"]
    )


    # ========================================================
    # SAVE HISTORY
    # ========================================================

    history["train_loss"].append(
        train_loss
    )

    history["train_accuracy"].append(
        train_accuracy
    )

    history["val_loss"].append(
        val_loss
    )

    history["val_accuracy"].append(
        val_accuracy
    )

    history["val_macro_f1"].append(
        val_macro_f1
    )

    history["learning_rate"].append(
        current_lr
    )


    # ========================================================
    # PRINT RESULTS
    # ========================================================

    print()

    print(
        f"Train Loss:          "
        f"{train_loss:.4f}"
    )

    print(
        f"Train Accuracy:      "
        f"{train_accuracy:.4f}"
    )

    print(
        f"Validation Loss:     "
        f"{val_loss:.4f}"
    )

    print(
        f"Validation Accuracy: "
        f"{val_accuracy:.4f}"
    )

    print(
        f"Validation Macro F1: "
        f"{val_macro_f1:.4f}"
    )

    print(
        f"Learning Rate:       "
        f"{current_lr:.2e}"
    )


    # ========================================================
    # CHECKPOINT
    # ========================================================

    # IMPORTANT:
    #
    # We select the best model using Macro F1.
    #
    # This is different from Experiment 1,
    # where validation accuracy was used.

    if val_macro_f1 > best_val_macro_f1:

        best_val_macro_f1 = (
            val_macro_f1
        )

        best_val_accuracy = (
            val_accuracy
        )

        best_epoch = (
            epoch + 1
        )

        epochs_without_improvement = 0


        checkpoint_path = (

            MODEL_DIR /
            "skin_model_sampler_best.pth"

        )


        torch.save(

            {

                "model_state_dict":
                    model.state_dict(),

                "class_names":
                    CLASS_NAMES,

                "best_val_macro_f1":
                    best_val_macro_f1,

                "best_val_accuracy":
                    best_val_accuracy,

                "epoch":
                    best_epoch

            },

            checkpoint_path

        )


        print()

        print(
            "✓ BEST MODEL SAVED"
        )

        print(
            "Macro F1:",
            f"{best_val_macro_f1:.4f}"
        )

        print(
            "Validation Accuracy:",
            f"{best_val_accuracy:.4f}"
        )

        print(
            "Path:",
            checkpoint_path
        )


    else:

        epochs_without_improvement += 1


        print()

        print(
            "No Macro F1 improvement."
        )

        print(
            f"Patience: "
            f"{epochs_without_improvement}/"
            f"{PATIENCE}"
        )


    # ========================================================
    # EARLY STOPPING
    # ========================================================

    if (
        epochs_without_improvement
        >= PATIENCE
    ):

        print()

        print("=" * 60)

        print(
            "EARLY STOPPING"
        )

        print("=" * 60)

        print()

        print(
            "No improvement in "
            "validation Macro F1."
        )

        break


# ============================================================
# SAVE TRAINING HISTORY
# ============================================================

history_path = (

    MODEL_DIR /
    "training_history_sampler.json"

)


with open(
    history_path,
    "w"
) as f:

    json.dump(

        history,

        f,

        indent=4

    )


# ============================================================
# FINAL SUMMARY
# ============================================================

print()

print("=" * 60)

print(
    "EXPERIMENT 2 COMPLETE"
)

print("=" * 60)

print()

print(
    "Best Epoch:",
    best_epoch
)

print(

    "Best Validation Macro F1:",

    f"{best_val_macro_f1:.4f}"

)

print(

    "Validation Accuracy at Best Epoch:",

    f"{best_val_accuracy:.4f}"

)

print()

print(
    "Model:"
)

print(

    MODEL_DIR /
    "skin_model_sampler_best.pth"

)

print()

print(
    "History:"
)

print(
    history_path
)