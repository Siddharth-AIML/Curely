from pathlib import Path

from PIL import Image
import pandas as pd

from torch.utils.data import Dataset


CLASS_NAMES = [
    "akiec",
    "bcc",
    "bkl",
    "df",
    "mel",
    "nv",
    "vasc"
]


CLASS_TO_IDX = {
    name: idx
    for idx, name in enumerate(CLASS_NAMES)
}


class HAM10000Dataset(Dataset):

    def __init__(
        self,
        dataframe,
        image_dirs,
        transform=None
    ):

        self.df = dataframe.reset_index(drop=True)

        self.image_dirs = [
            Path(directory)
            for directory in image_dirs
        ]

        self.transform = transform


    def __len__(self):

        return len(self.df)


    def find_image(self, image_id):

        filename = f"{image_id}.jpg"

        for directory in self.image_dirs:

            image_path = directory / filename

            if image_path.exists():
                return image_path

        raise FileNotFoundError(
            f"Image not found: {filename}"
        )


    def __getitem__(self, index):

        row = self.df.iloc[index]

        image_id = row["image_id"]

        diagnosis = row["dx"]

        label = CLASS_TO_IDX[diagnosis]

        image_path = self.find_image(
            image_id
        )

        image = Image.open(
            image_path
        ).convert("RGB")


        if self.transform is not None:

            image = self.transform(image)


        return image, label