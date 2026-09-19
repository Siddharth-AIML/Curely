from pathlib import Path

import numpy as np
import pandas as pd

import torch
from torch.utils.data import DataLoader

from torchvision import transforms

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    balanced_accuracy_score,
    f1_score,
    roc_auc_score
)

from dataset import (
    HAM10000Dataset,
    CLASS_NAMES
)

from model import create_model


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"

PROCESSED_DIR = DATA_DIR / "processed"

RAW_DIR = DATA_DIR / "raw"

MODEL_PATH = (
    BASE_DIR /
    "models" /
    "skin_model_sampler_best.pth"
)

TEST_CSV = (
    PROCESSED_DIR /
    "test.csv"
)


IMAGE_DIRS = [

    RAW_DIR /
    "HAM10000_images_part_1",

    RAW_DIR /
    "HAM10000_images_part_2"

]


# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


print("=" * 60)

print("CURELY SKIN MODEL - TEST EVALUATION")

print("=" * 60)

print()

print("Device:", DEVICE)

if torch.cuda.is_available():

    print(
        "GPU:",
        torch.cuda.get_device_name(0)
    )


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
# TEST DATA
# ============================================================

test_df = pd.read_csv(
    TEST_CSV
)

print()

print(
    "Test samples:",
    len(test_df)
)


test_dataset = HAM10000Dataset(

    test_df,

    IMAGE_DIRS,

    transform=transform

)


test_loader = DataLoader(

    test_dataset,

    batch_size=32,

    shuffle=False,

    num_workers=0,

    pin_memory=torch.cuda.is_available()

)


# ============================================================
# MODEL
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


print()

print(
    "Loaded checkpoint from epoch:",
    checkpoint.get("epoch")
)

print(
    "Best validation Macro F1:",
    checkpoint.get(
        "best_val_macro_f1"
    )
)

print(
    "Validation Accuracy at Best Epoch:",
    checkpoint.get(
        "best_val_accuracy"
    )
)

# ============================================================
# PREDICTION
# ============================================================

all_labels = []

all_predictions = []

all_probabilities = []


with torch.no_grad():

    for images, labels in test_loader:

        images = images.to(
            DEVICE,
            non_blocking=True
        )


        outputs = model(images)


        probabilities = torch.softmax(
            outputs,
            dim=1
        )


        predictions = probabilities.argmax(
            dim=1
        )


        all_labels.extend(
            labels.numpy()
        )

        all_predictions.extend(
            predictions.cpu().numpy()
        )

        all_probabilities.extend(
            probabilities.cpu().numpy()
        )


all_labels = np.array(
    all_labels
)

all_predictions = np.array(
    all_predictions
)

all_probabilities = np.array(
    all_probabilities
)


# ============================================================
# BASIC METRICS
# ============================================================

accuracy = (
    all_predictions == all_labels
).mean()


balanced_acc = balanced_accuracy_score(
    all_labels,
    all_predictions
)


macro_f1 = f1_score(

    all_labels,

    all_predictions,

    average="macro"

)


weighted_f1 = f1_score(

    all_labels,

    all_predictions,

    average="weighted"

)


print()

print("=" * 60)

print("OVERALL TEST METRICS")

print("=" * 60)

print()

print(
    f"Accuracy:          {accuracy:.4f}"
)

print(
    f"Balanced Accuracy: {balanced_acc:.4f}"
)

print(
    f"Macro F1:          {macro_f1:.4f}"
)

print(
    f"Weighted F1:       {weighted_f1:.4f}"
)


# ============================================================
# ROC-AUC
# ============================================================

try:

    roc_auc = roc_auc_score(

        all_labels,

        all_probabilities,

        multi_class="ovr",

        average="macro"

    )

    print(
        f"Macro ROC-AUC:     {roc_auc:.4f}"
    )

except ValueError as e:

    print(
        "\nROC-AUC could not be calculated:"
    )

    print(e)


# ============================================================
# CLASSIFICATION REPORT
# ============================================================

print()

print("=" * 60)

print("PER-CLASS PERFORMANCE")

print("=" * 60)

print()


report = classification_report(

    all_labels,

    all_predictions,

    target_names=CLASS_NAMES,

    digits=4,

    zero_division=0

)


print(report)


# ============================================================
# CONFUSION MATRIX
# ============================================================

cm = confusion_matrix(

    all_labels,

    all_predictions

)


print("=" * 60)

print("CONFUSION MATRIX")

print("=" * 60)

print()

print(
    "Rows    = Actual"
)

print(
    "Columns = Predicted"
)

print()

print(
    pd.DataFrame(

        cm,

        index=[
            f"Actual_{x}"
            for x in CLASS_NAMES
        ],

        columns=[
            f"Pred_{x}"
            for x in CLASS_NAMES
        ]

    )
)


# ============================================================
# SAVE PREDICTIONS
# ============================================================

results = test_df.copy()


results["true_label"] = [
    CLASS_NAMES[i]
    for i in all_labels
]


results["predicted_label"] = [
    CLASS_NAMES[i]
    for i in all_predictions
]


results["confidence"] = (
    all_probabilities.max(axis=1)
)


for i, class_name in enumerate(
    CLASS_NAMES
):

    results[
        f"prob_{class_name}"
    ] = all_probabilities[:, i]


OUTPUT_PATH = (
    BASE_DIR /
    "models" /
    "test_predictions.csv"
)


results.to_csv(

    OUTPUT_PATH,

    index=False

)


print()

print(
    "Predictions saved to:"
)

print(
    OUTPUT_PATH
)