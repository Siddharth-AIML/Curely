const express = require("express");
const axios = require("axios");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
const symptomServiceUrl = () => (
    process.env.SYMPTOM_SERVICE_URL || "http://127.0.0.1:5000"
).replace(/\/$/, "");

const isCustomerOrDoctor = (req, res, next) => {
    if (req.user?.role === "customer" || req.user?.role === "doctor") return next();
    return res.status(403).json({ success: false, message: "Symptom analysis is available to patients and doctors only." });
};

const validateAnalysisRequest = (body) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return "A JSON object is required.";
    }
    if (Object.keys(body).some((key) => !["symptom_ids", "description"].includes(key))) {
        return "Only symptom_ids and description are accepted.";
    }
    if (
        body.symptom_ids !== undefined
        && (!Array.isArray(body.symptom_ids)
            || body.symptom_ids.length > 100
            || body.symptom_ids.some((id) => typeof id !== "string" || !id.trim()))
    ) {
        return "symptom_ids must be a list of supported symptom IDs.";
    }
    if (
        body.description !== undefined
        && (typeof body.description !== "string" || body.description.length > 1000)
    ) {
        return "description must be text no longer than 1000 characters.";
    }
    if (!(body.symptom_ids || []).length && !body.description?.trim()) {
        return "Select at least one symptom or describe what you are experiencing.";
    }
    return null;
};

const isSchemaResponse = (data) => (
    data?.success === true
    && Array.isArray(data.symptoms)
    && data.symptoms.length > 0
    && Number.isInteger(data.disease_count)
    && Number.isInteger(data.symptom_count)
);

const isAnalysisResponse = (data) => (
    data?.success === true
    && Array.isArray(data.recognized_symptoms)
    && Array.isArray(data.unsupported_terms)
    && Array.isArray(data.clarifications)
    && Array.isArray(data.results)
    && Array.isArray(data.accepted_evidence)
    && data.results.every((result) => (
        typeof result?.disease === "string"
        && typeof result?.probability === "number"
        && Number.isFinite(result.probability)
        && result.probability >= 0
        && result.probability <= 1
    ))
);

const sendUpstreamError = (res, error, action) => {
    console.error(`Symptom ${action} upstream error:`, error.message);
    const upstreamStatus = error.response?.status;
    const status = [400, 422].includes(upstreamStatus)
        ? 400
        : upstreamStatus === 503 || ["ECONNABORTED", "ECONNREFUSED", "ENOTFOUND"].includes(error.code)
            ? 503
            : 502;
    return res.status(status).json({
        success: false,
        message: status === 400
            ? "Please review the symptom details and try again."
            : "Symptom analysis service is temporarily unavailable.",
    });
};

router.get("/schema", protect, isCustomerOrDoctor, async (_req, res) => {
    try {
        const response = await axios.get(`${symptomServiceUrl()}/schema`, { timeout: 15000 });
        if (!isSchemaResponse(response.data)) {
            return res.status(502).json({ success: false, message: "Symptom vocabulary response is invalid." });
        }
        return res.json(response.data);
    } catch (error) {
        return sendUpstreamError(res, error, "schema");
    }
});

router.post("/analyze", protect, isCustomerOrDoctor, async (req, res) => {
    const validationError = validateAnalysisRequest(req.body);
    if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
    }
    try {
        const response = await axios.post(
            `${symptomServiceUrl()}/analyze`,
            req.body,
            {
                headers: { "Content-Type": "application/json" },
                timeout: 30000,
            },
        );
        if (!isAnalysisResponse(response.data)) {
            return res.status(502).json({ success: false, message: "Symptom analysis returned an invalid response." });
        }
        return res.json(response.data);
    } catch (error) {
        return sendUpstreamError(res, error, "analysis");
    }
});

module.exports = router;
