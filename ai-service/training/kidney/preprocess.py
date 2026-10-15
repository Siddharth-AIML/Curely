"""Parse and validate the supplied Chronic Kidney Disease ARFF dataset."""
from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from training.kidney.config import (
    CATEGORICAL_FEATURES,
    INPUT_FEATURES,
    NUMERIC_FEATURES,
    TARGET_FEATURE,
    TARGET_LABELS,
)


class DatasetFormatError(ValueError):
    """Raised when a kidney ARFF file does not match its declared schema."""


def load_kidney_arff(path: Path) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Load the repository's ARFF file and report narrowly handled row repairs."""
    attributes: list[tuple[str, str, list[str]]] = []
    records: list[dict[str, Any]] = []
    repaired_trailing_cells: list[int] = []
    dropped_malformed_rows: list[int] = []
    in_data = False

    for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw_line.strip()
        if not line or line.startswith("%"):
            continue

        if not in_data and line.lower() == "@data":
            in_data = True
            continue

        if not in_data and line.lower().startswith("@attribute"):
            match = re.match(r"@attribute\s+(?:'([^']+)'|\"([^\"]+)\"|([^\s]+))\s+(.+)$", line, re.I)
            if not match:
                raise DatasetFormatError(f"Invalid @attribute declaration on line {line_number}.")
            name = next(value for value in match.groups()[:3] if value is not None)
            declared_type = match.group(4).strip()
            categories = []
            if declared_type.startswith("{") and declared_type.endswith("}"):
                categories = [value.strip().lower() for value in declared_type[1:-1].split(",")]
                attributes.append((name.lower(), "categorical", categories))
            elif declared_type.lower() == "numeric":
                attributes.append((name.lower(), "numeric", categories))
            else:
                raise DatasetFormatError(
                    f"Unsupported ARFF type for {name!r} on line {line_number}."
                )
            continue

        if in_data:
            values = next(csv.reader([line], skipinitialspace=True))
            values = [value.strip().strip("'\"").lower() for value in values]
            if len(values) == len(attributes) + 1 and values[-1] == "":
                values.pop()
                repaired_trailing_cells.append(line_number)
            if len(values) != len(attributes):
                dropped_malformed_rows.append(line_number)
                continue

            record: dict[str, Any] = {}
            malformed_value = None
            for (name, kind, categories), value in zip(attributes, values):
                if value in ("", "?"):
                    record[name] = np.nan
                elif kind == "numeric":
                    try:
                        record[name] = float(value)
                    except ValueError:
                        malformed_value = (name, value)
                        break
                elif value in categories:
                    record[name] = value
                else:
                    malformed_value = (name, value)
                    break
            if malformed_value:
                name, value = malformed_value
                raise DatasetFormatError(
                    f"Unexpected value {value!r} for {name!r} on line {line_number}."
                )
            records.append(record)

    declared_names = [attribute[0] for attribute in attributes]
    expected_names = INPUT_FEATURES + [TARGET_FEATURE]
    if declared_names != expected_names:
        raise DatasetFormatError(
            f"Dataset feature order differs from the expected ARFF schema: {declared_names!r}"
        )

    frame = pd.DataFrame.from_records(records, columns=expected_names)
    if frame.empty:
        raise DatasetFormatError("The kidney dataset contains no usable rows.")

    for feature in NUMERIC_FEATURES:
        frame[feature] = pd.to_numeric(frame[feature], errors="raise")
    for feature in CATEGORICAL_FEATURES:
        frame[feature] = frame[feature].astype("object")

    invalid_targets = sorted(set(frame[TARGET_FEATURE].dropna()) - set(TARGET_LABELS))
    if invalid_targets:
        raise DatasetFormatError(f"Unexpected target labels: {invalid_targets!r}")
    if frame[TARGET_FEATURE].isna().any():
        raise DatasetFormatError("The dataset contains rows without a target label.")

    info = {
        "source_file": str(path),
        "row_count": int(len(frame)),
        "class_counts": {
            str(label): int(count)
            for label, count in frame[TARGET_FEATURE].value_counts().items()
        },
        "repaired_trailing_empty_cells": repaired_trailing_cells,
        "dropped_malformed_rows": dropped_malformed_rows,
        "missing_values": {
            feature: int(count)
            for feature, count in frame.isna().sum().items()
        },
        "input_features": declared_names[:-1],
        "numeric_features": NUMERIC_FEATURES.copy(),
        "categorical_features": CATEGORICAL_FEATURES.copy(),
        "categorical_values": {
            name: categories
            for name, kind, categories in attributes
            if kind == "categorical" and name != TARGET_FEATURE
        },
        "target_values": attributes[-1][2],
    }
    return frame, info


def compare_dataset_sources(
    primary_path: Path,
    comparison_path: Path,
) -> dict[str, Any]:
    """Confirm whether both provided files describe the same usable records."""
    primary, primary_info = load_kidney_arff(primary_path)
    comparison, comparison_info = load_kidney_arff(comparison_path)
    same_records = primary.equals(comparison)
    if not same_records:
        raise DatasetFormatError(
            "The primary and full ARFF files differ after normalization; "
            "inspect the files before training."
        )
    return {
        "same_schema": primary_info["input_features"] == comparison_info["input_features"],
        "same_usable_records": same_records,
        "primary_rows": primary_info["row_count"],
        "comparison_rows": comparison_info["row_count"],
    }
