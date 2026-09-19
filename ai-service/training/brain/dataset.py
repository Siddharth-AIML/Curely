from pathlib import Path
import json

import numpy as np
from PIL import Image

import torch
from torch.utils.data import Dataset

import torchvision.transforms.functional as TF
from torchvision.transforms import InterpolationMode


# ============================================================
# PATHS
# ============================================================

ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = (
    ROOT
    / "data"
    / "brain_mri"
    / "raw"
    / "kaggle_3m"
)

SPLIT_FILE = (
    ROOT
    / "data"
    / "brain_mri"
    / "processed"
    / "patient_split.json"
)


# ============================================================
# CONSTANTS
# ============================================================

IMAGE_SIZE = 256


# ============================================================
# DATASET
# ============================================================

class BrainMRIDataset(Dataset):

    def __init__(
        self,
        split="train",
        image_size=IMAGE_SIZE,
        augment=False
    ):

        if split not in ["train", "val", "test"]:
            raise ValueError(
                "split must be one of: train, val, test"
            )

        self.split = split
        self.image_size = image_size
        self.augment = augment

        # ----------------------------------------------------
        # Load patient split
        # ----------------------------------------------------

        if not SPLIT_FILE.exists():
            raise FileNotFoundError(
                f"Split file not found:\n{SPLIT_FILE}\n"
                "Run split_dataset.py first."
            )

        with open(
            SPLIT_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            split_data = json.load(f)

        self.patient_ids = split_data[split]

        # ----------------------------------------------------
        # Build image-mask pairs
        # ----------------------------------------------------

        self.samples = []

        for patient_id in self.patient_ids:

            patient_dir = DATA_DIR / patient_id

            if not patient_dir.exists():
                print(
                    f"WARNING: Patient directory missing: "
                    f"{patient_dir}"
                )
                continue

            image_files = sorted(
                [
                    p
                    for p in patient_dir.glob("*.tif")
                    if not p.name.endswith("_mask.tif")
                ]
            )

            for image_path in image_files:

                mask_path = image_path.with_name(
                    image_path.stem + "_mask.tif"
                )

                if not mask_path.exists():

                    print(
                        f"WARNING: Missing mask for "
                        f"{image_path}"
                    )

                    continue

                self.samples.append(
                    {
                        "image": image_path,
                        "mask": mask_path,
                        "patient": patient_id
                    }
                )

        print(
            f"[BrainMRIDataset] "
            f"split={split} | "
            f"patients={len(self.patient_ids)} | "
            f"samples={len(self.samples)}"
        )

    # ========================================================
    # LENGTH
    # ========================================================

    def __len__(self):
        return len(self.samples)

    # ========================================================
    # LOAD IMAGE
    # ========================================================

    def load_image(self, path):

        image = Image.open(path).convert("RGB")

        return image

    # ========================================================
    # LOAD MASK
    # ========================================================

    def load_mask(self, path):

        mask = Image.open(path).convert("L")

        return mask

    # ========================================================
    # AUGMENTATION
    # ========================================================

    def apply_augmentation(
        self,
        image,
        mask
    ):

        # ----------------------------------------------------
        # Random horizontal flip
        # ----------------------------------------------------

        if torch.rand(1).item() < 0.5:

            image = TF.hflip(image)
            mask = TF.hflip(mask)

        # ----------------------------------------------------
        # Random vertical flip
        # ----------------------------------------------------

        if torch.rand(1).item() < 0.5:

            image = TF.vflip(image)
            mask = TF.vflip(mask)

        # ----------------------------------------------------
        # Random rotation
        # ----------------------------------------------------

        if torch.rand(1).item() < 0.5:

            angle = float(
                torch.empty(1).uniform_(-15, 15).item()
            )

            image = TF.rotate(
                image,
                angle,
                interpolation=InterpolationMode.BILINEAR
            )

            mask = TF.rotate(
                mask,
                angle,
                interpolation=InterpolationMode.NEAREST
            )

        return image, mask

    # ========================================================
    # GET ITEM
    # ========================================================

    def __getitem__(self, index):

        sample = self.samples[index]

        image_path = sample["image"]
        mask_path = sample["mask"]

        # ----------------------------------------------------
        # Load
        # ----------------------------------------------------

        image = self.load_image(image_path)
        mask = self.load_mask(mask_path)

        # ----------------------------------------------------
        # Resize
        # ----------------------------------------------------

        image = TF.resize(
            image,
            [self.image_size, self.image_size],
            interpolation=InterpolationMode.BILINEAR
        )

        mask = TF.resize(
            mask,
            [self.image_size, self.image_size],
            interpolation=InterpolationMode.NEAREST
        )

        # ----------------------------------------------------
        # Augmentation
        # ----------------------------------------------------

        if self.augment:

            image, mask = self.apply_augmentation(
                image,
                mask
            )

        # ----------------------------------------------------
        # Convert image to tensor
        # ----------------------------------------------------

        image = TF.to_tensor(image)

        # ----------------------------------------------------
        # Normalize image
        #
        # MRI images here are represented as RGB TIFFs.
        # We normalize each image using its own intensity
        # distribution after conversion to [0, 1].
        # ----------------------------------------------------

        mean = image.mean()
        std = image.std()

        image = (image - mean) / (std + 1e-8)

        # ----------------------------------------------------
        # Convert mask to binary tensor
        #
        # Original mask:
        #     0   -> background
        #     255 -> tumor
        #
        # Final:
        #     0.0 -> background
        #     1.0 -> tumor
        # ----------------------------------------------------

        mask = np.array(mask)

        mask = (mask > 127).astype(np.float32)

        mask = torch.from_numpy(mask)

        mask = mask.unsqueeze(0)

        # ----------------------------------------------------
        # Safety checks
        # ----------------------------------------------------

        assert image.shape == (
            3,
            self.image_size,
            self.image_size
        )

        assert mask.shape == (
            1,
            self.image_size,
            self.image_size
        )

        return {
            "image": image.float(),
            "mask": mask.float(),
            "patient": sample["patient"],
            "image_path": str(image_path),
            "mask_path": str(mask_path)
        }


# ============================================================
# TEST DATASET
# ============================================================

if __name__ == "__main__":

    print("=" * 70)
    print("TESTING BRAIN MRI DATASET")
    print("=" * 70)

    # --------------------------------------------------------
    # Train
    # --------------------------------------------------------

    train_dataset = BrainMRIDataset(
        split="train",
        augment=True
    )

    # --------------------------------------------------------
    # Validation
    # --------------------------------------------------------

    val_dataset = BrainMRIDataset(
        split="val",
        augment=False
    )

    # --------------------------------------------------------
    # Test
    # --------------------------------------------------------

    test_dataset = BrainMRIDataset(
        split="test",
        augment=False
    )

    print("\n" + "-" * 70)
    print("DATASET SIZES")
    print("-" * 70)

    print(f"Train      : {len(train_dataset)}")
    print(f"Validation : {len(val_dataset)}")
    print(f"Test       : {len(test_dataset)}")

    # --------------------------------------------------------
    # Inspect one sample
    # --------------------------------------------------------

    sample = train_dataset[0]

    print("\n" + "-" * 70)
    print("SAMPLE")
    print("-" * 70)

    print(
        f"Image shape : {sample['image'].shape}"
    )

    print(
        f"Mask shape  : {sample['mask'].shape}"
    )

    print(
        f"Image dtype : {sample['image'].dtype}"
    )

    print(
        f"Mask dtype  : {sample['mask'].dtype}"
    )

    print(
        f"Image min   : {sample['image'].min().item():.4f}"
    )

    print(
        f"Image max   : {sample['image'].max().item():.4f}"
    )

    print(
        f"Mask values : {torch.unique(sample['mask']).tolist()}"
    )

    print(
        f"Patient     : {sample['patient']}"
    )

    print(
        f"Image path  : {sample['image_path']}"
    )

    print(
        f"Mask path   : {sample['mask_path']}"
    )

    print("\n" + "=" * 70)
    print("DATASET TEST COMPLETE")
    print("=" * 70)