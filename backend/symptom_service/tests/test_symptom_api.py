import unittest
import sys
import tempfile
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient
from sklearn.naive_bayes import BernoulliNB, MultinomialNB

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api import app
from model_utils import _load_model, get_model_info, predict_disease
from train_model import train_model
from utils.symptom_mapping import parse_symptom_description


class SymptomModelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.model, cls.features, cls.diseases, cls.schema = _load_model()
        cls.ids = {entry["name"]: entry["id"] for entry in cls.schema}

    def test_saved_model_and_schema_match(self):
        info = get_model_info()
        self.assertIsInstance(self.model, MultinomialNB)
        self.assertEqual(len(self.features), self.model.n_features_in_)
        self.assertEqual(len(self.diseases), len(self.model.classes_))
        self.assertEqual(info["symptom_count"], len(self.features))
        self.assertEqual(info["disease_count"], len(self.diseases))
        self.assertEqual(info["model_name"], "Bernoulli Naive Bayes belief network")
        self.assertEqual(info["source_estimator"], "MultinomialNB")
        self.assertFalse(info["probabilities_calibrated"])

    def test_natural_language_and_curated_aliases_map_to_model_features(self):
        parsed = parse_symptom_description(
            "I have a headache, fever, nausea and difficulty breathing.",
            self.schema,
        )
        self.assertEqual(
            {entry["name"] for entry in parsed["recognized_symptoms"]},
            {"headache", "fever", "nausea", "shortness of breath"},
        )
        self.assertEqual(parsed["unsupported_terms"], [])

    def test_negation_and_uncertainty_scope_across_coordinated_symptoms(self):
        parsed = parse_symptom_description(
            "No fever or cough, but maybe nausea and headache.",
            self.schema,
        )
        self.assertEqual(parsed["recognized_symptoms"], [])
        self.assertEqual(
            {(item["symptom"]["label"], item["reason"]) for item in parsed["clarifications"]},
            {
                ("fever", "negative"),
                ("cough", "negative"),
                ("nausea", "uncertain"),
                ("headache", "uncertain"),
            },
        )
        self.assertEqual(parsed["unsupported_terms"], [])

    def test_unknown_terms_are_reported_with_nonbinding_suggestions(self):
        parsed = parse_symptom_description("I have chest pain and a rash", self.schema)
        self.assertEqual(parsed["recognized_symptoms"], [])
        self.assertEqual(
            {item["term"] for item in parsed["unsupported_terms"]},
            {"chest pain", "rash"},
        )
        self.assertTrue(any(item["suggestions"] for item in parsed["unsupported_terms"]))

    def test_negative_and_uncertain_mentions_are_not_positive_evidence(self):
        parsed = parse_symptom_description(
            "I do not have fever, but maybe nausea.",
            self.schema,
        )
        self.assertEqual(parsed["recognized_symptoms"], [])
        self.assertEqual(
            {item["reason"] for item in parsed["clarifications"]},
            {"negative", "uncertain"},
        )
        self.assertEqual(parsed["unsupported_terms"], [])

    def test_multiple_evidence_uses_the_saved_bbn_tables_and_true_posteriors(self):
        symptom_ids = [self.ids["headache"], self.ids["fever"], self.ids["nausea"]]
        result = predict_disease(symptom_ids)
        feature_index_by_id = {
            entry["id"]: index for index, entry in enumerate(self.schema)
        }
        indices = [feature_index_by_id[symptom_id] for symptom_id in symptom_ids]
        alpha = float(self.model.alpha)
        likelihoods = (
            self.model.feature_count_[:, indices] + alpha
        ) / (self.model.class_count_[:, None] + 2 * alpha)
        log_scores = self.model.class_log_prior_ + np.log(likelihoods).sum(axis=1)
        expected = np.exp(log_scores - log_scores.max())
        expected /= expected.sum()
        self.assertEqual(len(result["accepted_evidence"]), 3)
        self.assertEqual(len(result["results"]), 5)
        for item in result["results"]:
            class_index = self.diseases.index(item["disease"])
            self.assertAlmostEqual(item["probability"], float(expected[class_index]), places=12)
            self.assertGreaterEqual(item["probability"], 0)
            self.assertLessEqual(item["probability"], 1)
        self.assertLess(sum(item["probability"] for item in result["results"]), 1)

    def test_unknown_ids_and_empty_evidence_are_rejected(self):
        with self.assertRaises(ValueError):
            predict_disease([])
        with self.assertRaises(ValueError):
            predict_disease(["not-a-model-symptom"])

    def test_training_script_saves_a_reloadable_classifier_from_synthetic_rows(self):
        with tempfile.TemporaryDirectory() as directory:
            dataset_path = Path(directory) / "synthetic.csv"
            output_path = Path(directory) / "model.pkl"
            pd.DataFrame({
                "fever": [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
                "cough": [0, 0, 1, 1, 0, 0, 1, 1, 0, 1],
                "diseases": ["a", "a", "a", "a", "a", "b", "b", "b", "b", "b"],
            }).to_csv(dataset_path, index=False)
            train_model(dataset_path, output_path)
            model, features, diseases = joblib.load(output_path)
            self.assertIsInstance(model, BernoulliNB)
            self.assertEqual(features, ["fever", "cough"])
            self.assertEqual(set(diseases), {"a", "b"})

    def test_training_rejects_nonbinary_symptom_features(self):
        with tempfile.TemporaryDirectory() as directory:
            dataset_path = Path(directory) / "nonbinary.csv"
            output_path = Path(directory) / "model.pkl"
            pd.DataFrame({
                "fever": [0, 2, 0, 1],
                "cough": [0, 0, 1, 1],
                "diseases": ["a", "a", "b", "b"],
            }).to_csv(dataset_path, index=False)
            with self.assertRaisesRegex(ValueError, "binary indicators"):
                train_model(dataset_path, output_path)

    def test_schema_endpoint_returns_model_vocabulary(self):
        response = self.client.get("/schema")
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(data["symptoms"]), len(self.features))
        self.assertEqual(data["model_name"], "Bernoulli Naive Bayes belief network")
        self.assertEqual(data["source_estimator"], "MultinomialNB")

    def test_analysis_endpoint_combines_selected_and_text_evidence(self):
        response = self.client.post("/analyze", json={
            "symptom_ids": [self.ids["headache"]],
            "description": "I also have fever and nausea.",
        })
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {item["id"] for item in data["accepted_evidence"]},
            {self.ids["headache"], self.ids["fever"], self.ids["nausea"]},
        )
        self.assertEqual(data["source_estimator"], "MultinomialNB")
        self.assertEqual(len(data["results"]), 5)

    def test_unsupported_and_negative_terms_are_explicit(self):
        response = self.client.post("/analyze", json={
            "description": "I have fever and a rash, but no nausea.",
        })
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["label"] for item in data["accepted_evidence"]], ["fever"])
        self.assertTrue(data["clarification_required"])
        self.assertTrue(data["unsupported_terms"])
        self.assertEqual(data["clarifications"][0]["reason"], "negative")

    def test_description_conflicting_with_selected_symptom_is_not_used(self):
        response = self.client.post("/analyze", json={
            "symptom_ids": [self.ids["fever"]],
            "description": "I do not have fever.",
        })
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["accepted_evidence"], [])
        self.assertEqual(data["results"], [])
        self.assertEqual(data["clarifications"][0]["reason"], "conflicts_with_selection")

    def test_empty_and_invalid_requests_are_rejected(self):
        self.assertEqual(self.client.post("/analyze", json={}).status_code, 400)
        self.assertEqual(self.client.post("/analyze", json=[]).status_code, 400)
        self.assertEqual(
            self.client.post("/analyze", json={"symptom_ids": ["bad-id"]}).status_code,
            400,
        )
        self.assertEqual(
            self.client.post("/analyze", json={"description": "x" * 1001}).status_code,
            400,
        )
        self.assertEqual(
            self.client.post("/analyze", content="not-json", headers={
                "Content-Type": "application/json",
            }).status_code,
            400,
        )
        self.assertEqual(
            self.client.post("/analyze", json={
                "symptom_ids": [self.ids["fever"]],
                "unexpected": True,
            }).status_code,
            400,
        )


if __name__ == "__main__":
    unittest.main()
