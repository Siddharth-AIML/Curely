"""FastAPI endpoints for the saved Curely symptom model."""

from __future__ import annotations

import json
import logging
import os

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from model_utils import (
    SymptomModelUnavailableError,
    get_model_info,
    predict_disease,
)
from utils.symptom_mapping import parse_symptom_description

app = FastAPI(title="Curely Symptom Analysis API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
logger = logging.getLogger(__name__)

# Load and validate the artifact once during service startup, not per request.
MODEL_INFO = get_model_info()


def _error_response(status_code: int, message: str, **details: object) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "error": message, **details},
    )


@app.get("/health")
async def health():
    return {"status": "healthy", "model": MODEL_INFO["model_name"]}


@app.get("/schema")
async def symptom_schema():
    return {
        "success": True,
        **MODEL_INFO,
    }


@app.post("/analyze")
async def analyze_symptoms(request: Request):
    if not request.headers.get("content-type", "").lower().startswith("application/json"):
        return _error_response(400, "A JSON object is required.")
    try:
        payload = await request.json()
    except (json.JSONDecodeError, UnicodeDecodeError):
        return _error_response(400, "A JSON object is required.")
    if not isinstance(payload, dict):
        return _error_response(400, "A JSON object is required.")
    if any(key not in {"symptom_ids", "description"} for key in payload):
        return _error_response(400, "Only symptom_ids and description are accepted.")

    symptom_ids = payload.get("symptom_ids", [])
    description = payload.get("description", "")
    if not isinstance(symptom_ids, list) or any(not isinstance(item, str) for item in symptom_ids):
        return _error_response(400, "symptom_ids must be a list of supported IDs.")
    if len(symptom_ids) > 100:
        return _error_response(400, "Select no more than 100 symptoms.")
    if not isinstance(description, str) or len(description) > 1000:
        return _error_response(
            400,
            "description must be text no longer than 1000 characters.",
        )
    if not symptom_ids and not description.strip():
        return _error_response(
            400,
            "Select at least one symptom or describe what you are experiencing.",
        )

    schema = MODEL_INFO["symptoms"]
    by_id = {entry["id"]: entry for entry in schema}
    unknown_ids = [item for item in symptom_ids if item not in by_id]
    if unknown_ids:
        return _error_response(
            400,
            "One or more selected symptoms are not supported by this model.",
            unsupported_symptom_ids=list(dict.fromkeys(unknown_ids)),
        )

    selected_ids = list(dict.fromkeys(symptom_ids))
    try:
        parsed = parse_symptom_description(description, schema)
        parsed_clarifications = parsed["clarifications"]
        conflicting_ids = {
            item["symptom"]["id"]
            for item in parsed_clarifications
            if item["symptom"]["id"] in selected_ids
        }
        selected_entries = [
            {"id": symptom_id, "name": by_id[symptom_id]["name"], "source": "selected"}
            for symptom_id in selected_ids
            if symptom_id not in conflicting_ids
        ]
        natural_entries = [
            {"id": entry["id"], "name": entry["name"], "source": "description"}
            for entry in parsed["recognized_symptoms"]
        ]
        recognized = selected_entries + [
            item for item in natural_entries
            if item["id"] not in set(selected_ids) and item["id"] not in conflicting_ids
        ]
        evidence_ids = list(dict.fromkeys(item["id"] for item in recognized))
        clarifications = [
            {
                **item,
                "reason": "conflicts_with_selection"
                if item["symptom"]["id"] in conflicting_ids
                else item["reason"],
            }
            for item in parsed_clarifications
        ]

        inference = None
        if evidence_ids:
            inference = predict_disease(evidence_ids)

        return {
            "success": True,
            "recognized_symptoms": recognized,
            "unsupported_terms": parsed["unsupported_terms"],
            "clarifications": clarifications,
            "clarification_required": bool(
                parsed["unsupported_terms"] or clarifications
            ),
            "results": inference["results"] if inference else [],
            "accepted_evidence": inference["accepted_evidence"] if inference else [],
            "model_name": inference["model_name"] if inference else MODEL_INFO["model_name"],
            "source_estimator": MODEL_INFO["source_estimator"],
            "probability_description": (
                inference["probability_description"] if inference else None
            ),
            "probabilities_calibrated": MODEL_INFO["probabilities_calibrated"],
        }
    except ValueError as exc:
        return _error_response(400, str(exc))
    except Exception:
        logger.exception("Symptom analysis request failed")
        return _error_response(
            500,
            "Symptom analysis failed. Please try again later.",
        )


@app.exception_handler(SymptomModelUnavailableError)
async def handle_model_unavailable(request: Request, error: SymptomModelUnavailableError):
    logger.error("Symptom model unavailable at %s: %s", request.url.path, error)
    return _error_response(503, "Symptom analysis is temporarily unavailable.")


if __name__ == "__main__":
    uvicorn.run(
        app,
        host=os.environ.get("HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", "5000")),
    )
