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
    return res.status(403).json({ message: "Skin analysis is available to patients and doctors only." });
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

module.exports = router;