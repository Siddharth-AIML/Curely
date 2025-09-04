const express = require("express");
const router = express.Router();
const { protect, isDoctor, isCustomer } = require("../middleware/authMiddleware");
const Prescription = require("../models/prescription");
const Report = require("../models/report");
const Customer = require("../models/customer");

// @route   POST api/medical/prescriptions
// @desc    Create a new prescription
router.post("/prescriptions", protect, isDoctor, async (req, res) => {
    // FIXED: Changed to expect 'medicines' to match the frontend form and database
    const { medId, medicines, notes } = req.body;

    if (!medId || !medicines || medicines.length === 0) {
        return res.status(400).json({ msg: "Please provide patient medId and at least one medicine." });
    }

    try {
        const patient = await Customer.findOne({ med_id: medId });
        if (!patient) {
            return res.status(404).json({ msg: "Patient with this med_id not found." });
        }

        const newPrescription = new Prescription({
            doctorId: req.user.id,
            patientId: patient._id,
            med_id: medId,
            // FIXED: Changed to save 'medicines'
            medicines,
            notes
        });

        const prescription = await newPrescription.save();
        res.status(201).json(prescription);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   POST api/medical/reports
// @desc    Create a new medical report
router.post("/reports", protect, isDoctor, async (req, res) => {
    const { medId, title, findings, recommendations } = req.body;
    if (!medId || !title || !findings) {
        return res.status(400).json({ msg: "Please provide patient medId, a title, and findings." });
    }
    try {
        const patient = await Customer.findOne({ med_id: medId });
        if (!patient) {
            return res.status(404).json({ msg: "Patient with this med_id not found." });
        }
        const newReport = new Report({
            doctorId: req.user.id,
            patientId: patient._id,
            med_id: medId,
            title,
            findings,
            recommendations
        });
        const report = await newReport.save();
        res.status(201).json(report);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get all prescriptions for a patient by med_id
router.get("/prescriptions/:medId", protect, isDoctor, async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ med_id: req.params.medId }).populate('doctorId', 'name');
        res.json(prescriptions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get all reports for a patient by med_id
router.get("/reports/:medId", protect, isDoctor, async (req, res) => {
    try {
        const reports = await Report.find({ med_id: req.params.medId }).populate('doctorId', 'name');
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get all prescriptions for the logged-in customer
router.get("/customer-prescriptions", protect, isCustomer, async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patientId: req.user.id }).populate('doctorId', 'name');
        res.json(prescriptions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get all reports for the logged-in customer
router.get("/customer-reports", protect, isCustomer, async (req, res) => {
    try {
        const reports = await Report.find({ patientId: req.user.id }).populate('doctorId', 'name');
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;

