import assert from 'node:assert/strict';
import test from 'node:test';

import {
    getSymptomErrorMessage,
    isSymptomAnalysisResponse,
    isSymptomSchemaResponse,
} from '../src/pages/symptomCheckerUtils.js';

const schemaResponse = {
    success: true,
    symptoms: [{
        id: 'shortness_of_breath',
        name: 'shortness of breath',
        evidence_variable: 'shortness of breath',
        aliases: ['difficulty breathing'],
    }],
};

const analysisResponse = {
    success: true,
    recognized_symptoms: [{
        id: 'fever',
        name: 'fever',
        source: 'description',
    }],
    unsupported_terms: [{
        term: 'rash',
        suggestions: [{ id: 'skin_rash', label: 'skin rash' }],
    }],
    clarifications: [],
    results: [{ disease: 'influenza', probability: 0.42 }],
    accepted_evidence: [{ id: 'fever', label: 'fever' }],
};

test('frontend accepts the model-backed symptom schema and rejects malformed entries', () => {
    assert.equal(isSymptomSchemaResponse(schemaResponse), true);
    assert.equal(isSymptomSchemaResponse({ ...schemaResponse, symptoms: [] }), false);
    assert.equal(isSymptomSchemaResponse({
        success: true,
        symptoms: [{ id: 'fever', name: 'fever' }],
    }), false);
});

test('frontend accepts ranked analysis results and rejects invalid evidence or probabilities', () => {
    assert.equal(isSymptomAnalysisResponse(analysisResponse), true);
    assert.equal(isSymptomAnalysisResponse({
        ...analysisResponse,
        results: [{ disease: 'influenza', probability: 1.2 }],
    }), false);
    assert.equal(isSymptomAnalysisResponse({
        ...analysisResponse,
        accepted_evidence: null,
    }), false);
});

test('frontend surfaces API validation and availability errors with a safe fallback', () => {
    assert.equal(
        getSymptomErrorMessage({ response: { data: { message: 'Review your symptoms.' } } }),
        'Review your symptoms.',
    );
    assert.equal(
        getSymptomErrorMessage({ response: { data: { error: 'Unsupported evidence.' } } }),
        'Unsupported evidence.',
    );
    assert.equal(
        getSymptomErrorMessage(new Error('network failure')),
        'Symptom analysis is currently unavailable. Please try again.',
    );
});
