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

// Public route - Get all approved doctors (for appointment booking)
router.get("/get-doctor", async (req, res) => {
    try {
        // Get all doctors with verification = true and exclude sensitive data
        const doctors = await Doctor.find({ 
            
        }).select("-password");

        if (!doctors || doctors.length === 0) {
            return res.status(404).json({ msg: "No approved doctors found" });
        }

        res.json(doctors);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error" });
    }
});

// Alternative route - Get all doctors (protected)
router.get("/all", auth, async (req, res) => {
    try {
        const doctors = await Doctor.find().select("-password");
        
        if (!doctors || doctors.length === 0) {
            return res.status(404).json({ msg: "No doctors found" });
        }

        res.json(doctors);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error" });
    }
});

module.exports = router;
