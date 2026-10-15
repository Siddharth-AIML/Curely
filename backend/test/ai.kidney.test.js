const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');

process.env.JWT_SECRET = 'kidney-route-test-secret';
process.env.AI_SERVICE_URL = 'http://ai-service.test';

const aiRoutes = require('../routes/ai');

const sample = {
    age: 45,
    bp: 80,
    sg: '1.020',
    al: '0',
    su: '0',
    rbc: 'normal',
    pc: 'normal',
    pcc: 'notpresent',
    ba: 'notpresent',
    bgr: 120,
    bu: 36,
    sc: 1.2,
    sod: 140,
    pot: 4.5,
    hemo: 14,
    pcv: 42,
    wbcc: 8000,
    rbcc: 4.8,
    htn: 'no',
    dm: 'no',
    cad: 'no',
    appet: 'good',
    pe: 'no',
    ane: 'no',
};

const successResult = {
    success: true,
    prediction: 'notckd',
    predicted_label: 'No CKD pattern detected',
    model_name: 'extra_trees',
    probability: 0.12,
    class_probabilities: { notckd: 0.88, ckd: 0.12 },
    probability_label: 'Model-estimated probability for ckd',
    disclaimer: 'Screening estimate only.',
};

test('kidney API authenticates, validates, proxies, and handles upstream errors', async () => {
    const originalPost = axios.post;
    const originalGet = axios.get;
    const app = express();
    app.use(express.json());
    app.use('/api/ai', aiRoutes);
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const token = jwt.sign({ role: 'customer' }, process.env.JWT_SECRET);
    const calls = [];
    let upstreamResult = { data: successResult };
    let upstreamError = null;

    axios.post = async (url, payload, options) => {
        calls.push({ url, payload, options });
        if (upstreamError) throw upstreamError;
        return upstreamResult;
    };
    axios.get = async (url) => {
        calls.push({ url });
        return {
            data: {
                success: true,
                features: [{ name: 'age' }],
                labels: { ckd: 'CKD', notckd: 'No CKD' },
                probability_supported: true,
            },
        };
    };

    const request = (path, body, authorization = `Bearer ${token}`) => fetch(`${baseUrl}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
            ...(authorization ? { Authorization: authorization } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    try {
        const authResponse = await request('/api/ai/kidney/predict', sample, '');
        assert.equal(authResponse.status, 401);

        const schemaResponse = await request('/api/ai/kidney/schema');
        assert.equal(schemaResponse.status, 200);
        assert.equal(calls.at(-1).url, `${process.env.AI_SERVICE_URL}/predict/kidney/schema`);

        const missingResponse = await request(
            '/api/ai/kidney/predict',
            Object.fromEntries(Object.entries(sample).filter(([key]) => key !== 'age')),
        );
        assert.equal(missingResponse.status, 400);
        const callsBeforeInvalid = calls.length;
        const invalidResponse = await request('/api/ai/kidney/predict', { ...sample, age: -1 });
        assert.equal(invalidResponse.status, 400);
        assert.equal(calls.length, callsBeforeInvalid);

        const successResponse = await request('/api/ai/kidney/predict', sample);
        assert.equal(successResponse.status, 200);
        assert.equal((await successResponse.json()).prediction, 'notckd');
        assert.equal(calls.at(-1).url, `${process.env.AI_SERVICE_URL}/predict/kidney`);
        assert.deepEqual(calls.at(-1).payload, sample);

        upstreamError = { message: 'Unprocessable input', response: { status: 422 } };
        assert.equal((await request('/api/ai/kidney/predict', sample)).status, 400);
        upstreamError = { message: 'Service unavailable', response: { status: 503 } };
        assert.equal((await request('/api/ai/kidney/predict', sample)).status, 503);
        upstreamError = { message: 'Unexpected upstream error', response: { status: 500 } };
        assert.equal((await request('/api/ai/kidney/predict', sample)).status, 502);

        upstreamError = null;
        upstreamResult = { data: { success: true, prediction: 'unknown' } };
        assert.equal((await request('/api/ai/kidney/predict', sample)).status, 502);
    } finally {
        axios.post = originalPost;
        axios.get = originalGet;
        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
});
