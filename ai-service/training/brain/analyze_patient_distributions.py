from pathlib import Path
from PIL import Image
import numpy as np
import pandas as pd

from dataset import BrainMRIDataset


# ============================================================
# PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[2]

SPLIT_PATH = (
    ROOT
    / "data"
    / "brain_mri"
    / "processed"
    / "patient_split.json"
)

DATASET_ROOT = (
    ROOT
    / "data"
    / "brain_mri"
    / "raw"
    / "kaggle_3m"
)

OUTPUT_DIR = (
    ROOT
    / "results"
    / "brain"
    / "distribution_analysis"
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# PATIENTS WE KNOW ARE DIFFICULT
# ============================================================

FOCUS_PATIENTS = [
    "TCGA_FG_7634_20000128",
    "TCGA_FG_A60K_20040224",
    "TCGA_HT_A5RC_19990831",
    "TCGA_DU_A5TP_19970614",
    "TCGA_DU_6408_19860521",
    "TCGA_DU_7014_19860618",
]


# ============================================================
# IMAGE STATISTICS
# ============================================================

def image_statistics(image_path):

    image = Image.open(
        image_path
    ).convert("RGB")

    image = np.asarray(
        image
    ).astype(np.float32) / 255.0

    stats = {}

    # --------------------------------------------------------
    # Global statistics
    # --------------------------------------------------------

    stats["mean"] = float(
        image.mean()
    )

    stats["std"] = float(
        image.std()
    )

    stats["min"] = float(
        image.min()
    )

    stats["max"] = float(
        image.max()
    )

    # --------------------------------------------------------
    # Channel statistics
    # --------------------------------------------------------

    for channel, name in enumerate(
        ["R", "G", "B"]
    ):

        values = image[:, :, channel]

        stats[
            f"{name}_mean"
        ] = float(
            values.mean()
        )

        stats[
            f"{name}_std"
        ] = float(
            values.std()
        )

    return stats


# ============================================================
# PATIENT ANALYSIS
# ============================================================

def analyze_patient(patient):

    patient_dir = (
        DATASET_ROOT
        / patient
    )

    image_paths = sorted(
        [
            p
            for p in patient_dir.glob("*.tif")
            if not p.name.endswith(
                "_mask.tif"
            )
        ]
    )

    print("\n" + "=" * 70)

    print(
        f"PATIENT: {patient}"
    )

    print("=" * 70)

    if not image_paths:

        print(
            "No images found."
        )

        return None

    rows = []

    for image_path in image_paths:

        stats = image_statistics(
            image_path
        )

        stats["image"] = (
            image_path.name
        )

        rows.append(
            stats
        )

    df = pd.DataFrame(
        rows
    )

    numeric_columns = [
        "mean",
        "std",
        "min",
        "max",
        "R_mean",
        "R_std",
        "G_mean",
        "G_std",
        "B_mean",
        "B_std",
    ]

    summary = df[
        numeric_columns
    ].agg(
        [
            "mean",
            "std",
            "min",
            "max"
        ]
    )

    print(
        summary.to_string()
    )

    output_path = (
        OUTPUT_DIR
        / f"{patient}_statistics.csv"
    )

    df.to_csv(
        output_path,
        index=False
    )

    return df


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("BRAIN MRI PATIENT DISTRIBUTION ANALYSIS")
    print("=" * 70)

    print(
        "\nDataset:"
    )

    print(
        DATASET_ROOT
    )

    # --------------------------------------------------------
    # Difficult patients
    # --------------------------------------------------------

    all_summaries = []

    for patient in FOCUS_PATIENTS:

        df = analyze_patient(
            patient
        )

        if df is not None:

            summary = {
                "patient": patient,
                "mean_intensity": df["mean"].mean(),
                "std_intensity": df["std"].mean(),
                "R_mean": df["R_mean"].mean(),
                "G_mean": df["G_mean"].mean(),
                "B_mean": df["B_mean"].mean(),
            }

            all_summaries.append(
                summary
            )

    # --------------------------------------------------------
    # Save comparison
    # --------------------------------------------------------

    if all_summaries:

        comparison = pd.DataFrame(
            all_summaries
        )

        output_path = (
            OUTPUT_DIR
            / "difficult_patient_comparison.csv"
        )

        comparison.to_csv(
            output_path,
            index=False
        )

        print(
            "\n" + "=" * 70
        )

        print(
            "PATIENT COMPARISON"
        )

        print(
            "=" * 70
        )

        print(
            comparison.to_string(
                index=False
            )
        )

    print(
        "\n" + "=" * 70
    )

    print(
        "DISTRIBUTION ANALYSIS COMPLETE"
    )

    print(
        f"\nResults saved to:"
    )

    print(
        OUTPUT_DIR
    )

    print(
        "=" * 70
    )


if __name__ == "__main__":
    main()