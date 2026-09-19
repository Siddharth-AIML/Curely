const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});


router.post(
    "/skin-analysis",
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
                "http://127.0.0.1:8000/predict/skin",
                form,
                {
                    headers: form.getHeaders()
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

            res.status(500).json({
                message:
                    "Skin analysis service unavailable"
            });
        }
    }
);


module.exports = router;