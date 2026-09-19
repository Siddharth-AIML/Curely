from pathlib import Path
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "processed"


train = pd.read_csv(DATA_DIR / "train.csv")
val = pd.read_csv(DATA_DIR / "val.csv")
test = pd.read_csv(DATA_DIR / "test.csv")


train_ids = set(train["lesion_id"])
val_ids = set(val["lesion_id"])
test_ids = set(test["lesion_id"])


print("Train ∩ Validation:", len(train_ids & val_ids))
print("Train ∩ Test:", len(train_ids & test_ids))
print("Validation ∩ Test:", len(val_ids & test_ids))


if (
    len(train_ids & val_ids) == 0
    and
    len(train_ids & test_ids) == 0
    and
    len(val_ids & test_ids) == 0
):
    print("\n✓ NO LESION LEAKAGE DETECTED")
else:
    print("\n✗ LEAKAGE DETECTED")