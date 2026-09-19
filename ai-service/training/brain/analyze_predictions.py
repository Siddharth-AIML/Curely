from pathlib import Path
import pandas as pd
import numpy as np


# ============================================================
# PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[2]

CSV_PATH = (
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
)

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)
    print("BRAIN MRI FAILURE ANALYSIS")
    print("=" * 70)

    if not CSV_PATH.exists():

        raise FileNotFoundError(
            f"Metrics file not found:\n{CSV_PATH}"
        )

    df = pd.read_csv(CSV_PATH)

    print(
        f"\nTotal test slices: {len(df)}"
    )

    # ========================================================
    # POSITIVE / NEGATIVE SPLIT
    # ========================================================

    positive = df[
        df["has_tumor"] == True
    ].copy()

    negative = df[
        df["has_tumor"] == False
    ].copy()

    print(
        f"Tumor-positive slices: {len(positive)}"
    )

    print(
        f"Tumor-negative slices: {len(negative)}"
    )

    # ========================================================
    # WORST POSITIVE CASES
    # ========================================================

    worst_positive = (
        positive
        .sort_values("dice")
        .head(20)
    )

    worst_positive.to_csv(
        OUTPUT_DIR / "worst_positive_cases.csv",
        index=False
    )

    # ========================================================
    # BEST POSITIVE CASES
    # ========================================================

    best_positive = (
        positive
        .sort_values(
            "dice",
            ascending=False
        )
        .head(20)
    )

    best_positive.to_csv(
        OUTPUT_DIR / "best_positive_cases.csv",
        index=False
    )

    # ========================================================
    # FALSE-POSITIVE HEAVY CASES
    # ========================================================

    fp_heavy = (
        positive
        .sort_values(
            "precision"
        )
        .head(20)
    )

    fp_heavy.to_csv(
        OUTPUT_DIR / "false_positive_heavy.csv",
        index=False
    )

    # ========================================================
    # FALSE-NEGATIVE HEAVY CASES
    # ========================================================

    fn_heavy = (
        positive
        .sort_values(
            "recall"
        )
        .head(20)
    )

    fn_heavy.to_csv(
        OUTPUT_DIR / "false_negative_heavy.csv",
        index=False
    )

    # ========================================================
    # ZERO DICE
    # ========================================================

    zero_dice = df[
        df["dice"] == 0
    ].copy()

    zero_dice.to_csv(
        OUTPUT_DIR / "zero_dice_cases.csv",
        index=False
    )

    # ========================================================
    # VERY LOW DICE
    # ========================================================

    low_dice = df[
        df["dice"] < 0.5
    ].copy()

    low_dice.to_csv(
        OUTPUT_DIR / "low_dice_cases.csv",
        index=False
    )

    # ========================================================
    # PATIENT-LEVEL SUMMARY
    # ========================================================

    patient_summary = (
        df
        .groupby("patient")
        .agg(
            slices=("dice", "count"),
            mean_dice=("dice", "mean"),
            median_dice=("dice", "median"),
            mean_iou=("iou", "mean"),
            mean_precision=("precision", "mean"),
            mean_recall=("recall", "mean")
        )
        .sort_values(
            "mean_dice"
        )
    )

    patient_summary.to_csv(
        OUTPUT_DIR / "patient_summary.csv"
    )

    # ========================================================
    # PRINT RESULTS
    # ========================================================

    print("\n" + "-" * 70)
    print("LOWEST DICE CASES")
    print("-" * 70)

    print(
        worst_positive[
            [
                "patient",
                "dice",
                "iou",
                "precision",
                "recall"
            ]
        ].to_string(index=False)
    )

    print("\n" + "-" * 70)
    print("ZERO-DICE CASES")
    print("-" * 70)

    print(
        f"Zero Dice slices: {len(zero_dice)}"
    )

    if len(zero_dice) > 0:

        print(
            zero_dice[
                [
                    "patient",
                    "dice",
                    "iou",
                    "precision",
                    "recall"
                ]
            ].head(20).to_string(
                index=False
            )
        )

    print("\n" + "-" * 70)
    print("LOW-DICE STATISTICS")
    print("-" * 70)

    print(
        f"Dice < 0.50 : {len(low_dice)}"
    )

    print(
        f"Dice < 0.25 : "
        f"{len(df[df['dice'] < 0.25])}"
    )

    print(
        f"Dice = 0    : "
        f"{len(zero_dice)}"
    )

    print("\n" + "-" * 70)
    print("PATIENT-LEVEL PERFORMANCE")
    print("-" * 70)

    print(
        patient_summary.head(15).to_string()
    )

    print("\n" + "-" * 70)
    print("OUTPUT")
    print("-" * 70)

    print(OUTPUT_DIR)

    print("\n" + "=" * 70)
    print("FAILURE ANALYSIS COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()