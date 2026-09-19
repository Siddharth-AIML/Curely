from pathlib import Path

import pandas as pd

from sklearn.model_selection import StratifiedGroupKFold


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

PROCESSED_DIR.mkdir(
    parents=True,
    exist_ok=True
)

METADATA = RAW_DIR / "HAM10000_metadata.csv"


# ============================================================
# LOAD DATA
# ============================================================

print("Reading metadata from:")
print(METADATA)

if not METADATA.exists():
    raise FileNotFoundError(
        f"Metadata file not found:\n{METADATA}"
    )


df = pd.read_csv(METADATA)

print("\nDataset loaded successfully!")
print("Total samples:", len(df))

print("\nColumns:")
print(df.columns.tolist())

print("\nOriginal class distribution:")
print(df["dx"].value_counts())


# ============================================================
# FIRST SPLIT
# 90% temporary + 10% TEST
#
# Stratified + Grouped:
#   Stratified -> preserve disease distribution
#   Grouped    -> prevent lesion leakage
# ============================================================

sgkf = StratifiedGroupKFold(
    n_splits=10,
    shuffle=True,
    random_state=42
)


splits = list(
    sgkf.split(
        df,
        y=df["dx"],
        groups=df["lesion_id"]
    )
)


train_val_idx, test_idx = splits[0]

train_val_df = df.iloc[train_val_idx].copy()
test_df = df.iloc[test_idx].copy()


# ============================================================
# SECOND SPLIT
# 90% of remaining -> TRAIN
# 10% of remaining -> VALIDATION
#
# Overall approximately:
# TRAIN = 81%
# VAL   = 9%
# TEST  = 10%
# ============================================================

sgkf_val = StratifiedGroupKFold(
    n_splits=10,
    shuffle=True,
    random_state=123
)


splits_val = list(
    sgkf_val.split(
        train_val_df,
        y=train_val_df["dx"],
        groups=train_val_df["lesion_id"]
    )
)


train_idx, val_idx = splits_val[0]


train_df = train_val_df.iloc[train_idx].copy()
val_df = train_val_df.iloc[val_idx].copy()


# ============================================================
# SAVE
# ============================================================

train_path = PROCESSED_DIR / "train.csv"
val_path = PROCESSED_DIR / "val.csv"
test_path = PROCESSED_DIR / "test.csv"


train_df.to_csv(
    train_path,
    index=False
)

val_df.to_csv(
    val_path,
    index=False
)

test_df.to_csv(
    test_path,
    index=False
)


# ============================================================
# SUMMARY
# ============================================================

print("\n" + "=" * 60)
print("STRATIFIED GROUP DATASET SPLIT COMPLETE")
print("=" * 60)


print(f"\nTrain:      {len(train_df)} samples")
print(f"Validation: {len(val_df)} samples")
print(f"Test:       {len(test_df)} samples")


# ============================================================
# DISTRIBUTIONS
# ============================================================

print("\n" + "-" * 60)
print("TRAIN DISTRIBUTION")
print("-" * 60)

print(
    train_df["dx"].value_counts()
)


print("\n" + "-" * 60)
print("VALIDATION DISTRIBUTION")
print("-" * 60)

print(
    val_df["dx"].value_counts()
)


print("\n" + "-" * 60)
print("TEST DISTRIBUTION")
print("-" * 60)

print(
    test_df["dx"].value_counts()
)


# ============================================================
# PERCENTAGES
# ============================================================

print("\n" + "-" * 60)
print("CLASS PERCENTAGES")
print("-" * 60)

for name, subset in [
    ("TRAIN", train_df),
    ("VALIDATION", val_df),
    ("TEST", test_df)
]:

    print(f"\n{name}")

    percentages = (
        subset["dx"]
        .value_counts(normalize=True)
        .mul(100)
        .round(2)
    )

    print(percentages)


print("\nFiles created:")

print(train_path)
print(val_path)
print(test_path)