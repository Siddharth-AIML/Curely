"""Resolve user-entered symptom text only to variables supported by the model."""

from __future__ import annotations

import re
import unicodedata
from difflib import SequenceMatcher
from typing import Any


_ALIASES = {
    "breathing difficulty": "shortness of breath",
    "difficulty breathing": "shortness of breath",
    "high temperature": "fever",
    "head pain": "headache",
    "coughing": "cough",
}
_STOP_WORDS = {
    "a", "about", "also", "am", "an", "and", "are", "at", "but", "check",
    "do", "does", "experiencing", "feel", "feeling", "for", "have", "having",
    "i", "im", "in", "is", "it", "me", "my", "of", "or", "please", "some",
    "no", "not", "symptom", "symptoms", "the", "to", "with", "without", "never",
    "maybe", "possibly", "perhaps", "might", "may", "unsure", "uncertain",
    "acute", "bad", "chronic", "mild", "moderate", "persistent", "severe",
    "sudden", "terrible", "very",
}
_NEGATION_PHRASES = (
    ("no",), ("not",), ("without",), ("never",), ("denies",), ("denied",),
    ("absence", "of"), ("do", "not", "have"), ("does", "not", "have"),
    ("did", "not", "have"), ("not", "experiencing"), ("not", "feeling"),
)
_UNCERTAINTY_PHRASES = (
    ("maybe",), ("possibly",), ("perhaps",), ("might",), ("may",),
    ("unsure",), ("uncertain",), ("not", "sure"), ("could", "be"),
)


def normalize_symptom(value: str) -> str:
    """Normalize punctuation and spacing without guessing an unsupported term."""
    text = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    text = text.lower().replace("_", " ").replace("-", " ")
    for contraction, expanded in (
        ("don't", "do not"), ("doesn't", "does not"), ("didn't", "did not"),
        ("isn't", "is not"), ("aren't", "are not"), ("wasn't", "was not"),
        ("weren't", "were not"), ("can't", "cannot"),
    ):
        text = text.replace(contraction, expanded)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return " ".join(text.split())


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", normalize_symptom(value)).strip("_")


def build_symptom_schema(feature_names: list[str]) -> list[dict[str, Any]]:
    """Build the public vocabulary from the exact ordered model feature list."""
    if (
        not feature_names
        or any(not isinstance(name, str) or not name.strip() for name in feature_names)
        or len(set(feature_names)) != len(feature_names)
    ):
        raise ValueError("The model symptom feature list is invalid.")

    entries = []
    by_name: dict[str, dict[str, Any]] = {}
    ids: set[str] = set()
    for name in feature_names:
        symptom_id = _slug(name)
        if not symptom_id or symptom_id in ids:
            raise ValueError("The model symptom features do not have unique identifiers.")
        ids.add(symptom_id)
        entry = {
            "id": symptom_id,
            "name": name,
            "evidence_variable": name,
            "aliases": [],
        }
        entries.append(entry)
        by_name[normalize_symptom(name)] = entry

    for alias, target in _ALIASES.items():
        entry = by_name.get(normalize_symptom(target))
        if entry is not None and normalize_symptom(alias) != normalize_symptom(entry["name"]):
            entry["aliases"].append(alias)

    return entries


def _phrase_matches(text: str, schema: list[dict[str, Any]]) -> list[dict[str, Any]]:
    candidates = []
    for entry in schema:
        for phrase in [entry["name"], *entry["aliases"]]:
            normalized = normalize_symptom(phrase)
            if not normalized:
                continue
            pattern = rf"(?<![a-z0-9]){re.escape(normalized)}(?![a-z0-9])"
            for match in re.finditer(pattern, text):
                candidates.append({
                    "start": match.start(),
                    "end": match.end(),
                    "entry": entry,
                    "phrase": normalized,
                })

    candidates.sort(key=lambda item: (-(item["end"] - item["start"]), item["start"]))
    selected = []
    for candidate in candidates:
        if any(
            candidate["start"] < existing["end"]
            and candidate["end"] > existing["start"]
            for existing in selected
        ):
            continue
        selected.append(candidate)
    return sorted(selected, key=lambda item: item["start"])


def _has_phrase_before(text: str, start: int, phrases: tuple[tuple[str, ...], ...]) -> bool:
    words = text[:start].split()[-5:]
    for phrase in phrases:
        count = len(phrase)
        for offset in range(max(0, len(words) - count - 1), len(words) - count + 1):
            if tuple(words[offset:offset + count]) == phrase:
                between = words[offset + count:]
                if len(between) <= 1 and all(word in {"a", "the", "any"} for word in between):
                    return True
    return False


def _mention_state(text: str, match: dict[str, Any]) -> str:
    if _has_phrase_before(text, match["start"], _UNCERTAINTY_PHRASES):
        return "uncertain"
    if _has_phrase_before(text, match["start"], _NEGATION_PHRASES):
        return "negative"
    after = text[match["end"]:].split()[:3]
    if after and after[0] in {"absent", "denied"}:
        return "negative"
    if len(after) >= 2 and after[:2] in (["not", "present"], ["is", "absent"]):
        return "negative"
    return "present"


def _inherits_nonpositive_state(
    text: str,
    previous_match: dict[str, Any],
    previous_state: str,
    match: dict[str, Any],
) -> bool:
    if previous_state not in {"negative", "uncertain"}:
        return False
    connector_words = {"and", "or", "plus", "also", "nor"}
    gap = normalize_symptom(text[previous_match["end"]:match["start"]]).split()
    return all(word in connector_words for word in gap)


def _suggestions(term: str, schema: list[dict[str, Any]], limit: int = 3) -> list[dict[str, Any]]:
    term_words = set(normalize_symptom(term).split()) - _STOP_WORDS
    scored = []
    for entry in schema:
        candidate_words = set(normalize_symptom(entry["name"]).split()) - _STOP_WORDS
        overlap = len(term_words & candidate_words) / max(len(term_words | candidate_words), 1)
        similarity = SequenceMatcher(None, normalize_symptom(term), normalize_symptom(entry["name"])).ratio()
        score = max(overlap, similarity)
        if score >= 0.45:
            scored.append((score, entry))
    scored.sort(key=lambda item: (-item[0], item[1]["name"]))
    return [
        {"id": entry["id"], "label": entry["name"]}
        for _, entry in scored[:limit]
    ]


def parse_symptom_description(
    description: str,
    schema: list[dict[str, Any]],
) -> dict[str, Any]:
    """Map exact supported names and curated aliases; report everything else."""
    text = normalize_symptom(description)
    matches = _phrase_matches(text, schema) if text else []
    recognized: list[dict[str, Any]] = []
    clarifications: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    previous_match = None
    previous_state = "present"
    for match in matches:
        entry = match["entry"]
        state = _mention_state(text, match)
        if (
            state == "present"
            and previous_match is not None
            and _inherits_nonpositive_state(
                text,
                previous_match,
                previous_state,
                match,
            )
        ):
            state = previous_state
        previous_match = match
        previous_state = state
        if state == "present":
            if entry["id"] not in seen_ids:
                recognized.append(entry)
                seen_ids.add(entry["id"])
        else:
            clarifications.append({
                "term": match["phrase"],
                "symptom": {"id": entry["id"], "label": entry["name"]},
                "reason": state,
            })

    remaining = text
    for match in reversed(matches):
        remaining = f"{remaining[:match['start']]} {remaining[match['end']:]}"
    unsupported_terms = []
    for clause in re.split(r"\b(?:and|or|but|plus|also)\b", remaining):
        remaining_words = [
            word for word in normalize_symptom(clause).split()
            if word not in _STOP_WORDS
        ]
        if remaining_words:
            term = " ".join(remaining_words)
            if not any(item["term"] == term for item in unsupported_terms):
                unsupported_terms.append({
                    "term": term,
                    "suggestions": _suggestions(term, schema),
                })

    return {
        "recognized_symptoms": recognized,
        "unsupported_terms": unsupported_terms,
        "clarifications": clarifications,
    }
