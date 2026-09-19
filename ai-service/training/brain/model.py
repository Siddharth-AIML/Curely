import torch
import torch.nn as nn


# ============================================================
# DOUBLE CONVOLUTION BLOCK
# ============================================================

class DoubleConv(nn.Module):

    def __init__(self, in_channels, out_channels):

        super().__init__()

        self.block = nn.Sequential(

            nn.Conv2d(
                in_channels,
                out_channels,
                kernel_size=3,
                padding=1,
                bias=False
            ),

            nn.BatchNorm2d(out_channels),

            nn.ReLU(inplace=True),

            nn.Conv2d(
                out_channels,
                out_channels,
                kernel_size=3,
                padding=1,
                bias=False
            ),

            nn.BatchNorm2d(out_channels),

            nn.ReLU(inplace=True)
        )

    def forward(self, x):

        return self.block(x)


# ============================================================
# U-NET
# ============================================================

class UNet(nn.Module):

    def __init__(
        self,
        in_channels=3,
        out_channels=1
    ):

        super().__init__()

        # ----------------------------------------------------
        # Encoder
        # ----------------------------------------------------

        self.enc1 = DoubleConv(
            in_channels,
            64
        )

        self.enc2 = DoubleConv(
            64,
            128
        )

        self.enc3 = DoubleConv(
            128,
            256
        )

        self.enc4 = DoubleConv(
            256,
            512
        )

        # ----------------------------------------------------
        # Bottleneck
        # ----------------------------------------------------

        self.bottleneck = DoubleConv(
            512,
            1024
        )

        # ----------------------------------------------------
        # Pooling
        # ----------------------------------------------------

        self.pool = nn.MaxPool2d(
            kernel_size=2,
            stride=2
        )

        # ----------------------------------------------------
        # Decoder
        # ----------------------------------------------------

        self.up4 = nn.ConvTranspose2d(
            1024,
            512,
            kernel_size=2,
            stride=2
        )

        self.dec4 = DoubleConv(
            1024,
            512
        )

        self.up3 = nn.ConvTranspose2d(
            512,
            256,
            kernel_size=2,
            stride=2
        )

        self.dec3 = DoubleConv(
            512,
            256
        )

        self.up2 = nn.ConvTranspose2d(
            256,
            128,
            kernel_size=2,
            stride=2
        )

        self.dec2 = DoubleConv(
            256,
            128
        )

        self.up1 = nn.ConvTranspose2d(
            128,
            64,
            kernel_size=2,
            stride=2
        )

        self.dec1 = DoubleConv(
            128,
            64
        )

        # ----------------------------------------------------
        # Output
        # ----------------------------------------------------

        self.output = nn.Conv2d(
            64,
            out_channels,
            kernel_size=1
        )

    # ========================================================
    # FORWARD
    # ========================================================

    def forward(self, x):

        # ----------------------------------------------------
        # Encoder
        # ----------------------------------------------------

        e1 = self.enc1(x)

        e2 = self.enc2(
            self.pool(e1)
        )

        e3 = self.enc3(
            self.pool(e2)
        )

        e4 = self.enc4(
            self.pool(e3)
        )

        # ----------------------------------------------------
        # Bottleneck
        # ----------------------------------------------------

        b = self.bottleneck(
            self.pool(e4)
        )

        # ----------------------------------------------------
        # Decoder 4
        # ----------------------------------------------------

        d4 = self.up4(b)

        d4 = torch.cat(
            [d4, e4],
            dim=1
        )

        d4 = self.dec4(d4)

        # ----------------------------------------------------
        # Decoder 3
        # ----------------------------------------------------

        d3 = self.up3(d4)

        d3 = torch.cat(
            [d3, e3],
            dim=1
        )

        d3 = self.dec3(d3)

        # ----------------------------------------------------
        # Decoder 2
        # ----------------------------------------------------

        d2 = self.up2(d3)

        d2 = torch.cat(
            [d2, e2],
            dim=1
        )

        d2 = self.dec2(d2)

        # ----------------------------------------------------
        # Decoder 1
        # ----------------------------------------------------

        d1 = self.up1(d2)

        d1 = torch.cat(
            [d1, e1],
            dim=1
        )

        d1 = self.dec1(d1)

        # ----------------------------------------------------
        # Output logits
        # ----------------------------------------------------

        return self.output(d1)


# ============================================================
# MODEL FACTORY
# ============================================================

def create_model():

    return UNet(
        in_channels=3,
        out_channels=1
    )


# ============================================================
# MODEL TEST
# ============================================================

if __name__ == "__main__":

    print("=" * 70)
    print("TESTING U-NET")
    print("=" * 70)

    device = torch.device(
        "cuda"
        if torch.cuda.is_available()
        else "cpu"
    )

    print(f"\nDevice: {device}")

    model = create_model().to(device)

    # --------------------------------------------------------
    # Parameter count
    # --------------------------------------------------------

    total_params = sum(
        p.numel()
        for p in model.parameters()
    )

    trainable_params = sum(
        p.numel()
        for p in model.parameters()
        if p.requires_grad
    )

    print(
        f"Total parameters     : "
        f"{total_params:,}"
    )

    print(
        f"Trainable parameters : "
        f"{trainable_params:,}"
    )

    # --------------------------------------------------------
    # Dummy input
    # --------------------------------------------------------

    x = torch.randn(
        2,
        3,
        256,
        256,
        device=device
    )

    with torch.no_grad():

        output = model(x)

    print(
        f"\nInput shape  : {x.shape}"
    )

    print(
        f"Output shape : {output.shape}"
    )

    assert output.shape == (
        2,
        1,
        256,
        256
    )

    print("\nOutput shape check: PASSED")

    print("\n" + "=" * 70)
    print("U-NET TEST COMPLETE")
    print("=" * 70)