from pathlib import Path
from PIL import Image
import numpy as np

# ============================================================
# PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = ROOT / "data" / "brain_mri" / "raw" / "kaggle_3m"


# ============================================================
# HELPERS
# ============================================================

def is_image_file(path: Path):
    """
    Returns True for MRI image files, excluding segmentation masks.
    """
    return (
        path.suffix.lower() == ".tif"
        and not path.name.endswith("_mask.tif")
    )


def get_mask_path(image_path: Path):
    """
    Converts:
        patient_1.tif
    into:
        patient_1_mask.tif
    """
    return image_path.with_name(
        image_path.stem + "_mask.tif"
    )


# ============================================================
# DATASET INSPECTION
# ============================================================

def main():

    print("=" * 70)
    print("BRAIN MRI DATASET INSPECTION")
    print("=" * 70)

    if not DATA_DIR.exists():
        print(f"\nERROR: Dataset directory does not exist:")
        print(DATA_DIR)
        return

    patient_dirs = sorted(
        [p for p in DATA_DIR.iterdir() if p.is_dir()]
    )

    print(f"\nDataset path:")
    print(DATA_DIR)

    print(f"\nNumber of patients: {len(patient_dirs)}")

    if len(patient_dirs) == 0:
        print("ERROR: No patient folders found.")
        return

    # --------------------------------------------------------
    # Counters
    # --------------------------------------------------------

    total_images = 0
    total_masks = 0
    positive_masks = 0
    negative_masks = 0

    missing_masks = []
    invalid_images = []
    invalid_masks = []

    image_shapes = {}
    mask_shapes = {}
    mask_values = set()

    patient_slice_counts = []

    # --------------------------------------------------------
    # Iterate through patients
    # --------------------------------------------------------

    for patient_dir in patient_dirs:

        image_files = sorted(
            [
                p for p in patient_dir.glob("*.tif")
                if is_image_file(p)
            ]
        )

        patient_slice_counts.append(
            (patient_dir.name, len(image_files))
        )

        for image_path in image_files:

            total_images += 1

            mask_path = get_mask_path(image_path)

            # ------------------------------------------------
            # Check mask existence
            # ------------------------------------------------

            if not mask_path.exists():
                missing_masks.append(str(image_path))
                continue

            total_masks += 1

            # ------------------------------------------------
            # Read image
            # ------------------------------------------------

            try:
                image = Image.open(image_path)
                image_array = np.array(image)

                image_shapes[image_array.shape] = (
                    image_shapes.get(image_array.shape, 0) + 1
                )

            except Exception as e:
                invalid_images.append(
                    (str(image_path), str(e))
                )
                continue

            # ------------------------------------------------
            # Read mask
            # ------------------------------------------------

            try:
                mask = Image.open(mask_path)
                mask_array = np.array(mask)

                mask_shapes[mask_array.shape] = (
                    mask_shapes.get(mask_array.shape, 0) + 1
                )

                unique_values = np.unique(mask_array)

                for value in unique_values:
                    mask_values.add(int(value))

                # ------------------------------------------------
                # Determine whether mask contains tumor
                # ------------------------------------------------

                if np.any(mask_array > 0):
                    positive_masks += 1
                else:
                    negative_masks += 1

            except Exception as e:
                invalid_masks.append(
                    (str(mask_path), str(e))
                )

    # ========================================================
    # RESULTS
    # ========================================================

    print("\n" + "=" * 70)
    print("DATASET SUMMARY")
    print("=" * 70)

    print(f"\nPatients                : {len(patient_dirs)}")
    print(f"MRI slices              : {total_images}")
    print(f"Masks found             : {total_masks}")

    print(f"\nTumor-positive slices   : {positive_masks}")
    print(f"Tumor-negative slices   : {negative_masks}")

    print(
        f"Tumor-positive ratio   : "
        f"{positive_masks / total_masks:.4f}"
        if total_masks > 0
        else "Tumor-positive ratio   : N/A"
    )

    # --------------------------------------------------------
    # Shapes
    # --------------------------------------------------------

    print("\n" + "-" * 70)
    print("IMAGE SHAPES")
    print("-" * 70)

    for shape, count in sorted(image_shapes.items()):
        print(f"{shape}: {count}")

    print("\n" + "-" * 70)
    print("MASK SHAPES")
    print("-" * 70)

    for shape, count in sorted(mask_shapes.items()):
        print(f"{shape}: {count}")

    # --------------------------------------------------------
    # Mask values
    # --------------------------------------------------------

    print("\n" + "-" * 70)
    print("MASK PIXEL VALUES")
    print("-" * 70)

    print(sorted(mask_values))

    # --------------------------------------------------------
    # Missing masks
    # --------------------------------------------------------

    print("\n" + "-" * 70)
    print("MISSING MASKS")
    print("-" * 70)

    print(f"Missing masks: {len(missing_masks)}")

    if missing_masks:
        for item in missing_masks[:10]:
            print(item)

        if len(missing_masks) > 10:
            print(
                f"... and {len(missing_masks) - 10} more"
            )

    # --------------------------------------------------------
    # Invalid files
    # --------------------------------------------------------

    print("\n" + "-" * 70)
    print("INVALID FILES")
    print("-" * 70)

    print(f"Invalid images: {len(invalid_images)}")
    print(f"Invalid masks : {len(invalid_masks)}")

    # --------------------------------------------------------
    # Patient slice statistics
    # --------------------------------------------------------

    slice_counts = [
        count for _, count in patient_slice_counts
    ]

    print("\n" + "-" * 70)
    print("PATIENT SLICE STATISTICS")
    print("-" * 70)

    print(f"Minimum slices/patient : {min(slice_counts)}")
    print(f"Maximum slices/patient : {max(slice_counts)}")
    print(
        f"Average slices/patient : "
        f"{np.mean(slice_counts):.2f}"
    )

    # --------------------------------------------------------
    # Example patients
    # --------------------------------------------------------

    print("\n" + "-" * 70)
    print("FIRST 10 PATIENTS")
    print("-" * 70)

    for patient, count in patient_slice_counts[:10]:
        print(f"{patient}: {count} slices")

    print("\n" + "=" * 70)
    print("INSPECTION COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()