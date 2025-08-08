const express = require("express");
const Doctor = require("../models/doctor"); // your Doctor schema
const auth = require("../middleware/authMiddleware");
const router = express.Router();

// Protected route - Get doctor profile
router.get("/profile", auth, async (req, res) => {
    try {
        // Only allow if role is doctor
        if (req.user.role !== "doctor") {
            return res.status(403).json({ msg: "Access denied" });
        }

        const doctor = await Doctor.findById(req.user.id).select("-password");
        if (!doctor) {
            return res.status(404).json({ msg: "Doctor not found" });
        }

        res.json(doctor);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
