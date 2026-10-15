const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const isCustomerOrDoctor = (req, res, next) => {
    if (req.user?.role === "customer" || req.user?.role === "doctor") {
        return next();
    }
    return res.status(403).json({ message: "AI analysis is available to patients and doctors only." });
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.mimetype)) {
            return callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only JPG, JPEG, PNG, and WEBP images are allowed."));
        }
        callback(null, true);
    }
});

const KIDNEY_NUMERIC_FIELDS = [
    "age", "bp", "bgr", "bu", "sc", "sod", "pot", "hemo", "pcv", "wbcc", "rbcc"
];
const KIDNEY_CATEGORICAL_FIELDS = {
    sg: ["1.005", "1.010", "1.015", "1.020", "1.025"],
    al: ["0", "1", "2", "3", "4", "5"],
    su: ["0", "1", "2", "3", "4", "5"],
    rbc: ["normal", "abnormal"],
    pc: ["normal", "abnormal"],
    pcc: ["present", "notpresent"],
    ba: ["present", "notpresent"],
    htn: ["yes", "no"],
    dm: ["yes", "no"],
    cad: ["yes", "no"],
    appet: ["good", "poor"],
    pe: ["yes", "no"],
    ane: ["yes", "no"]
};
const KIDNEY_FIELDS = [
    "age", "bp", "sg", "al", "su", "rbc", "pc", "pcc", "ba", "bgr", "bu", "sc",
    "sod", "pot", "hemo", "pcv", "wbcc", "rbcc", "htn", "dm", "cad", "appet", "pe", "ane"
];

const validateKidneyPayload = (payload) => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return "A JSON object with kidney screening values is required.";
    }

    const missing = KIDNEY_FIELDS.filter((field) => !Object.prototype.hasOwnProperty.call(payload, field));
    if (missing.length) {
        return `Missing required fields: ${missing.join(", ")}.`;
    }
    const extra = Object.keys(payload).filter((field) => !KIDNEY_FIELDS.includes(field));
    if (extra.length) {
        return `Unexpected fields: ${extra.join(", ")}.`;
    }

    for (const field of KIDNEY_NUMERIC_FIELDS) {
        const value = payload[field];
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
            return `${field} must be a finite non-negative number.`;
        }
    }
    for (const [field, values] of Object.entries(KIDNEY_CATEGORICAL_FIELDS)) {
        if (typeof payload[field] !== "string" || !values.includes(payload[field])) {
            return `${field} must be one of: ${values.join(", ")}.`;
        }
    }
    return null;
};

const aiServiceUrl = () => (
    process.env.AI_SERVICE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");


router.post(
    "/skin-analysis",
    protect,
    isCustomerOrDoctor,
    upload.single("image"),
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({
                    message: "Image is required"
                });

            }


            const form = new FormData();

            form.append(
                "file",
                req.file.buffer,
                {
                    filename: req.file.originalname,
                    contentType: req.file.mimetype
                }
            );


            const response = await axios.post(
                `${process.env.AI_SERVICE_URL || "http://127.0.0.1:8000"}/predict/skin`,
                form,
                {
                    headers: form.getHeaders(),
                    timeout: 120000
                }
            );


            res.json(
                response.data
            );


        } catch (error) {

            console.error(
                "Skin AI error:",
                error.message
            );

            if (error instanceof multer.MulterError) {
                const message = error.code === "LIMIT_FILE_SIZE"
                    ? "Please choose an image smaller than 10 MB."
                    : error.message;
                return res.status(400).json({ message });
            }

            const status = error.response?.status === 400 ? 400 : 503;
            res.status(status).json({
                message: status === 400
                    ? "The selected image could not be analyzed."
                    : "Skin analysis service unavailable"
            });
        }
    }
);

router.post(
    "/brain-mri-analysis",
    protect,
    isCustomerOrDoctor,
    upload.single("file"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    message: "MRI scan is required"
                });
            }

            const form = new FormData();
            form.append("file", req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });

            const response = await axios.post(
                `${process.env.AI_SERVICE_URL || "http://127.0.0.1:8000"}/predict/brain-mri`,
                form,
                {
                    headers: form.getHeaders(),
                    timeout: 120000
                }
            );

            res.json(response.data);
        } catch (error) {
            console.error("Brain MRI AI error:", error.message);

            if (error instanceof multer.MulterError) {
                const message = error.code === "LIMIT_FILE_SIZE"
                    ? "Please choose an MRI scan smaller than 10 MB."
                    : error.message;
                return res.status(400).json({ message });
            }

            const status = error.response?.status === 400 ? 400 : 503;
            res.status(status).json({
                message: status === 400
                    ? "The selected MRI scan could not be analyzed."
                    : "Brain MRI analysis service unavailable"
            });
        }
    }
);

router.post(
    "/diabetes-extract",
    protect,
    isCustomerOrDoctor,
    upload.single("report"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    message: "A diabetes report image is required"
                });
            }

            const form = new FormData();
            form.append("file", req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });

            const response = await axios.post(
                `${process.env.AI_SERVICE_URL || "http://127.0.0.1:8000"}/extract/diabetes-report`,
                form,
                {
                    headers: form.getHeaders(),
                    timeout: 120000
                }
            );

            res.json(response.data);
        } catch (error) {
            console.error("Diabetes OCR AI error:", error.message);

            if (error instanceof multer.MulterError) {
                const message = error.code === "LIMIT_FILE_SIZE"
                    ? "Please choose a diabetes report image smaller than 10 MB."
                    : error.message;
                return res.status(400).json({ message });
            }

            const status = error.response?.status === 400 ? 400 : 503;
            res.status(status).json({
                message: status === 400
                    ? "The diabetes report image could not be processed."
                    : "Diabetes OCR service unavailable"
            });
        }
    }
);

router.post(
    "/diabetes-predict",
    protect,
    isCustomerOrDoctor,
    async (req, res) => {
        try {
            const payload = req.body || {};

            if (!payload || typeof payload !== "object") {
                return res.status(400).json({ message: "A valid diabetes payload is required." });
            }

            const response = await axios.post(
                `${process.env.AI_SERVICE_URL || "http://127.0.0.1:8000"}/predict/diabetes`,
                payload,
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: 120000
                }
            );

            res.json(response.data);
        } catch (error) {
            console.error("Diabetes prediction AI error:", error.message);
            const isInvalidInput = [400, 422].includes(error.response?.status);
            const status = isInvalidInput ? 400 : 503;
            res.status(status).json({
                message: isInvalidInput
                    ? "Please check the diabetes assessment values and try again."
                    : "Diabetes analysis service unavailable"
            });
        }
    }
);

router.get(
    "/kidney/schema",
    protect,
    isCustomerOrDoctor,
    async (req, res) => {
        try {
            const response = await axios.get(
                `${aiServiceUrl()}/predict/kidney/schema`,
                { timeout: 15000 }
            );
            if (response.data?.success !== true || !Array.isArray(response.data?.features)) {
                return res.status(502).json({ message: "Kidney prediction schema is unavailable." });
            }
            return res.json(response.data);
        } catch (error) {
            console.error("Kidney schema AI error:", error.message);
            return res.status(503).json({ message: "Kidney prediction service unavailable." });
        }
    }
);

router.post(
    "/kidney/predict",
    protect,
    isCustomerOrDoctor,
    async (req, res) => {
        const validationMessage = validateKidneyPayload(req.body);
        if (validationMessage) {
            return res.status(400).json({ message: validationMessage });
        }

        try {
            const response = await axios.post(
                `${aiServiceUrl()}/predict/kidney`,
                req.body,
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: 120000
                }
            );

            const result = response.data;
            const probabilities = result?.class_probabilities;
            if (
                result?.success !== true
                || !["ckd", "notckd"].includes(result?.prediction)
                || typeof result?.predicted_label !== "string"
                || typeof result?.probability !== "number"
                || !Number.isFinite(result.probability)
                || result.probability < 0
                || result.probability > 1
                || !probabilities
                || typeof probabilities.ckd !== "number"
                || !Number.isFinite(probabilities.ckd)
                || probabilities.ckd < 0
                || probabilities.ckd > 1
                || typeof probabilities.notckd !== "number"
                || !Number.isFinite(probabilities.notckd)
                || probabilities.notckd < 0
                || probabilities.notckd > 1
                || Math.abs(probabilities.ckd + probabilities.notckd - 1) > 0.02
                || typeof result?.probability_label !== "string"
            ) {
                return res.status(502).json({ message: "Kidney prediction returned an invalid response." });
            }
            return res.json(result);
        } catch (error) {
            console.error("Kidney prediction AI error:", error.message);
            const status = [400, 422].includes(error.response?.status)
                ? 400
                : error.response?.status === 503 || error.code === "ECONNABORTED"
                    ? 503
                    : 502;
            return res.status(status).json({
                message: status === 400
                    ? "Please check the kidney screening values and try again."
                    : "Kidney prediction service is temporarily unavailable."
            });
        }
    }
);

module.exports = router;