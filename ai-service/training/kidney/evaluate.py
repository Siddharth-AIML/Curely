"""Print the recorded holdout and cross-validation metrics for a trained model."""
import json

from training.kidney.config import METADATA_PATH


def main() -> None:
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    print(json.dumps({
        "model_name": metadata["model_name"],
        "cross_validation_results": metadata["cross_validation_results"],
        "holdout_metrics": metadata["holdout_metrics"],
    }, indent=2))


if __name__ == "__main__":
    main()
