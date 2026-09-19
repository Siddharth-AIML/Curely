import torch.nn as nn

from torchvision.models import (
    efficientnet_b0,
    EfficientNet_B0_Weights
)


def create_model(num_classes=7):

    weights = EfficientNet_B0_Weights.DEFAULT

    model = efficientnet_b0(
        weights=weights
    )


    # Replace ImageNet classifier
    # with our 7-class skin classifier

    in_features = (
        model.classifier[1].in_features
    )


    model.classifier[1] = nn.Linear(
        in_features,
        num_classes
    )


    return model