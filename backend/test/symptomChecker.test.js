const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');

process.env.JWT_SECRET = 'symptom-route-test-secret';
process.env.SYMPTOM_SERVICE_URL = 'http://symptom-service.test';

const symptomRoutes = require('../routes/symptomChecker');

const schema = {
    success: true,
    model_name: 'Bernoulli Naive Bayes belief network',
    model_type: 'Disease root with conditionally independent binary symptom nodes',
    source_estimator: 'MultinomialNB',
    symptoms: [{ id: 'fever', name: 'fever', evidence_variable: 'fever', aliases: [] }],
    symptom_count: 376,
    disease_count: 500,
    probabilities_calibrated: false,
};

const analysis = {
    success: true,
    recognized_symptoms: [{ id: 'fever', name: 'fever', source: 'description' }],
    unsupported_terms: [],
    clarifications: [],
    clarification_required: false,
    results: [{ disease: 'flu', probability: 0.42 }],
    accepted_evidence: [{ id: 'fever', label: 'fever' }],
    model_name: 'Bernoulli Naive Bayes belief network',
    source_estimator: 'MultinomialNB',
    probability_description: 'Uncalibrated model output.',
    probabilities_calibrated: false,
};

test('symptom routes authorize, validate, proxy, and surface upstream failures', async () => {
    const originalGet = axios.get;
    const originalPost = axios.post;
    const app = express();
    app.use(express.json());
    app.use('/api/symptoms', symptomRoutes);
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const token = jwt.sign({ role: 'customer' }, process.env.JWT_SECRET);
    const calls = [];
    let upstreamSchema = { data: schema };
    let upstreamAnalysis = { data: analysis };
    let upstreamError = null;

    axios.get = async (url, options) => {
        calls.push({ method: 'GET', url, options });
        if (upstreamError) throw upstreamError;
        return upstreamSchema;
    };
    axios.post = async (url, payload, options) => {
        calls.push({ method: 'POST', url, payload, options });
        if (upstreamError) throw upstreamError;
        return upstreamAnalysis;
    };

    const request = (path, body, authorized = true) => fetch(`${baseUrl}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
            ...(authorized ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    try {
        assert.equal((await request('/api/symptoms/schema', undefined, false)).status, 401);
        assert.equal((await request('/api/symptoms/schema')).status, 200);
        assert.equal(calls.at(-1).url, `${process.env.SYMPTOM_SERVICE_URL}/schema`);

        const payload = { symptom_ids: ['fever'], description: 'I also feel nausea.' };
        const invalidRequest = await request('/api/symptoms/analyze', { symptom_ids: [] });
        assert.equal(invalidRequest.status, 400);
        assert.equal(calls.filter((call) => call.method === 'POST').length, 0);

        const response = await request('/api/symptoms/analyze', payload);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), analysis);
        assert.equal(calls.at(-1).url, `${process.env.SYMPTOM_SERVICE_URL}/analyze`);
        assert.deepEqual(calls.at(-1).payload, payload);

        upstreamError = { message: 'unavailable', code: 'ECONNREFUSED' };
        assert.equal((await request('/api/symptoms/schema')).status, 503);
        upstreamError = { message: 'invalid input', response: { status: 422 } };
        assert.equal((await request('/api/symptoms/analyze', payload)).status, 400);
        upstreamError = { message: 'server failure', response: { status: 500 } };
        assert.equal((await request('/api/symptoms/analyze', payload)).status, 502);
        upstreamError = null;
        upstreamAnalysis = { data: { success: true, results: [{ disease: 'bad', probability: 2 }] } };
        assert.equal((await request('/api/symptoms/analyze', payload)).status, 502);
    } finally {
        axios.get = originalGet;
        axios.post = originalPost;
        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
});
