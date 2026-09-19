from pathlib import Path
import random
import json


# ============================================================
# CONFIGURATION
# ============================================================

ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = ROOT / "data" / "brain_mri" / "raw" / "kaggle_3m"

OUTPUT_DIR = ROOT / "data" / "brain_mri" / "processed"

SEED = 42

TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15


# ============================================================
# HELPERS
# ============================================================

def get_patient_dirs():

    patients = sorted(
        [
            p.name
            for p in DATA_DIR.iterdir()
            if p.is_dir()
        ]
    )

    return patients


# ============================================================
# SPLIT
# ============================================================

def main():

    print("=" * 70)
    print("BRAIN MRI PATIENT-LEVEL DATASET SPLIT")
    print("=" * 70)

    if not DATA_DIR.exists():
        raise FileNotFoundError(
            f"Dataset directory not found:\n{DATA_DIR}"
        )

    patients = get_patient_dirs()

    print(f"\nTotal patients: {len(patients)}")

    if len(patients) == 0:
        raise RuntimeError("No patient directories found.")

    # --------------------------------------------------------
    # Reproducible shuffle
    # --------------------------------------------------------

    random.seed(SEED)
    random.shuffle(patients)

    # --------------------------------------------------------
    # Calculate split sizes
    # --------------------------------------------------------

    total = len(patients)

    train_count = int(total * TRAIN_RATIO)
    val_count = int(total * VAL_RATIO)

    test_count = total - train_count - val_count

    # --------------------------------------------------------
    # Split
    # --------------------------------------------------------

    train_patients = patients[:train_count]

    val_patients = patients[
        train_count:train_count + val_count
    ]

    test_patients = patients[
        train_count + val_count:
    ]

    # --------------------------------------------------------
    # Verify
    # --------------------------------------------------------

    train_set = set(train_patients)
    val_set = set(val_patients)
    test_set = set(test_patients)

    assert train_set.isdisjoint(val_set)
    assert train_set.isdisjoint(test_set)
    assert val_set.isdisjoint(test_set)

    assert (
        len(train_set | val_set | test_set)
        == total
    )

    # --------------------------------------------------------
    # Create output directory
    # --------------------------------------------------------

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    # --------------------------------------------------------
    # Save JSON
    # --------------------------------------------------------

    split_data = {
        "seed": SEED,
        "train_ratio": TRAIN_RATIO,
        "val_ratio": VAL_RATIO,
        "test_ratio": TEST_RATIO,
        "train": sorted(train_patients),
        "val": sorted(val_patients),
        "test": sorted(test_patients)
    }

    output_file = OUTPUT_DIR / "patient_split.json"

    with open(
        output_file,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            split_data,
            f,
            indent=4
        )

    # ========================================================
    # PRINT RESULTS
    # ========================================================

    print("\n" + "-" * 70)
    print("SPLIT RESULTS")
    print("-" * 70)

    print(
        f"Train patients : {len(train_patients)} "
        f"({len(train_patients) / total:.2%})"
    )

    print(
        f"Validation     : {len(val_patients)} "
        f"({len(val_patients) / total:.2%})"
    )

    print(
        f"Test patients  : {len(test_patients)} "
        f"({len(test_patients) / total:.2%})"
    )

    print("\nPatient leakage check: PASSED")

    print(f"\nSaved split file:")
    print(output_file)

    print("\n" + "=" * 70)
    print("SPLIT COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()