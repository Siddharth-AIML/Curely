import tempfile
import unittest
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from app import app
from services.kidney_predictor import KidneyInputError, KidneyPredictor, get_kidney_predictor
from training.kidney.config import (
    CATEGORICAL_FEATURES,
    DEFAULT_DATA_PATH,
    INPUT_FEATURES,
    NUMERIC_FEATURES,
    TARGET_FEATURE,
    TARGET_LABELS,
)
from training.kidney.model import build_pipeline
from training.kidney.preprocess import compare_dataset_sources, load_kidney_arff


class KidneyPipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.predictor = get_kidney_predictor()
        cls.sample = {
            "age": 45,
            "bp": 80,
            "sg": "1.020",
            "al": "0",
            "su": "0",
            "rbc": "normal",
            "pc": "normal",
            "pcc": "notpresent",
            "ba": "notpresent",
            "bgr": 120,
            "bu": 36,
            "sc": 1.2,
            "sod": 140,
            "pot": 4.5,
            "hemo": 14,
            "pcv": 42,
            "wbcc": 8000,
            "rbcc": 4.8,
            "htn": "no",
            "dm": "no",
            "cad": "no",
            "appet": "good",
            "pe": "no",
            "ane": "no",
        }

    def test_dataset_sources_and_cleaning_are_verified(self):
        frame, info = load_kidney_arff(DEFAULT_DATA_PATH)
        comparison = compare_dataset_sources(
            DEFAULT_DATA_PATH,
            DEFAULT_DATA_PATH.with_name("chronic_kidney_disease_full.arff"),
        )
        self.assertEqual(frame.shape, (399, 25))
        self.assertEqual(list(frame.columns), INPUT_FEATURES + [TARGET_FEATURE])
        self.assertEqual(info["dropped_malformed_rows"], [399])
        self.assertEqual(len(info["repaired_trailing_empty_cells"]), 2)
        self.assertTrue(comparison["same_usable_records"])
        self.assertEqual(set(frame[TARGET_FEATURE]), set(TARGET_LABELS))
        self.assertEqual(len(NUMERIC_FEATURES), 11)
        self.assertEqual(len(CATEGORICAL_FEATURES), 13)

    def test_real_pipeline_load_and_prediction(self):
        result = self.predictor.predict(self.sample)
        self.assertTrue(result["success"])
        self.assertIn(result["prediction"], {"ckd", "notckd"})
        self.assertAlmostEqual(sum(result["class_probabilities"].values()), 1.0, places=6)
        self.assertGreaterEqual(result["probability"], 0)
        self.assertLessEqual(result["probability"], 1)

    def test_rejects_missing_extra_invalid_and_out_of_range_values(self):
        invalid_cases = [
            ({key: value for key, value in self.sample.items() if key != "age"}, "Missing"),
            ({**self.sample, "unknown": 1}, "Unexpected"),
            ({**self.sample, "age": "forty-five"}, "must be a number"),
            ({**self.sample, "age": -1}, "at least"),
            ({**self.sample, "rbc": "unknown"}, "must be one of"),
        ]
        for payload, message in invalid_cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(KidneyInputError, message):
                    self.predictor.validate_input(payload)

    def test_feature_order_and_target_mapping_are_used(self):
        metadata = self.predictor.metadata
        self.assertEqual(metadata["input_features"], INPUT_FEATURES)
        self.assertEqual(
            [item["name"] for item in metadata["feature_schema"]],
            INPUT_FEATURES,
        )
        class RecordingPipeline:
            n_features_in_ = len(INPUT_FEATURES)
            classes_ = np.array([0, 1])

            def predict(self, frame):
                self.frame = frame.copy()
                return np.array([1])

            def predict_proba(self, frame):
                return np.array([[0.2, 0.8]])

        original_pipeline = self.predictor.pipeline
        recording = RecordingPipeline()
        try:
            self.predictor.pipeline = recording
            result = self.predictor.predict(self.sample)
        finally:
            self.predictor.pipeline = original_pipeline
        self.assertEqual(list(recording.frame.columns), INPUT_FEATURES)
        self.assertEqual(result["prediction"], "ckd")
        self.assertEqual(result["probability"], 0.8)

    def test_pipeline_serialization_reproduces_prediction(self):
        rows = []
        labels = []
        for index in range(50):
            row = {
                feature: float(index + 20)
                for feature in NUMERIC_FEATURES
            }
            row.update({
                "sg": "1.020" if index % 2 else "1.010",
                "al": "0" if index % 2 else "2",
                "su": "0",
                "rbc": "normal" if index % 2 else "abnormal",
                "pc": "normal",
                "pcc": "notpresent",
                "ba": "notpresent",
                "htn": "no" if index % 2 else "yes",
                "dm": "no",
                "cad": "no",
                "appet": "good",
                "pe": "no",
                "ane": "no",
            })
            rows.append(row)
            labels.append(index % 2)
        frame = pd.DataFrame(rows, columns=INPUT_FEATURES)
        pipeline = build_pipeline("extra_trees")
        pipeline.fit(frame, labels)
        expected = pipeline.predict(frame.iloc[:1])
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "pipeline.joblib"
            joblib.dump(pipeline, path)
            loaded = joblib.load(path)
            actual = loaded.predict(frame.iloc[:1])
        np.testing.assert_array_equal(actual, expected)

    def test_fastapi_schema_prediction_and_validation(self):
        client = TestClient(app)
        schema_response = client.get("/predict/kidney/schema")
        self.assertEqual(schema_response.status_code, 200)
        schema = schema_response.json()
        self.assertEqual([item["name"] for item in schema["features"]], INPUT_FEATURES)

        valid_response = client.post("/predict/kidney", json=self.sample)
        self.assertEqual(valid_response.status_code, 200, valid_response.text)
        self.assertTrue(valid_response.json()["success"])

        missing_response = client.post(
            "/predict/kidney",
            json={key: value for key, value in self.sample.items() if key != "age"},
        )
        self.assertEqual(missing_response.status_code, 422)

        invalid_response = client.post(
            "/predict/kidney",
            json={**self.sample, "rbc": "unrecognized"},
        )
        self.assertEqual(invalid_response.status_code, 422)

    def test_existing_ai_routes_remain_registered_and_diabetes_runs(self):
        paths = {route.path for route in app.routes}
        self.assertTrue({
            "/predict/skin",
            "/predict/brain-mri",
            "/predict/diabetes",
            "/extract/diabetes-report",
        }.issubset(paths))

        response = TestClient(app).post("/predict/diabetes", json={
            "pregnancies": 2,
            "glucose": 120,
            "blood_pressure": 70,
            "skin_thickness": 20,
            "insulin": 79,
            "bmi": 30.5,
            "diabetes_pedigree_function": 0.4,
            "age": 35,
        })
        self.assertEqual(response.status_code, 200, response.text)
        self.assertTrue(response.json()["success"])


if __name__ == "__main__":
    unittest.main()
