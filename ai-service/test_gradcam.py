from pathlib import Path

from services.skin_gradcam import (
    predict_with_gradcam
)


BASE_DIR = Path(__file__).resolve().parent


# Replace this with one actual HAM10000 image
IMAGE_PATH = (
    BASE_DIR
    / "data"
    / "raw"
    / "HAM10000_images_part_1"
    / "ISIC_0024306.jpg"
)


OUTPUT_PATH = (
    BASE_DIR
    / "models"
    / "gradcam_test.jpg"
)


result = predict_with_gradcam(

    str(IMAGE_PATH),

    str(OUTPUT_PATH)

)


print("\nPrediction:")
print(
    result["prediction"]
)

print("\nConfidence:")
print(
    result["confidence"]
)

print("\nTop predictions:")

for prediction in result[
    "predictions"
]:

    print(
        prediction
    )


print("\nGrad-CAM saved to:")

print(
    OUTPUT_PATH
)