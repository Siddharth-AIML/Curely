const express = require("express");
const router = express.Router();
const { protect, isDoctor, isCustomer } = require("../middleware/authMiddleware");
const Prescription = require("../models/prescription");
const Report = require("../models/report");
const Customer = require("../models/customer");
const TestRequest = require('../models/testRequest');
// @route   POST /api/medical/prescriptions
// @desc    Create a new prescription for a patient
// @access  Private (Doctor only)
router.post("/prescriptions", protect, isDoctor, async (req, res) => {
    console.log("Received request to create prescription. Body:", req.body);
    const { medId, medicines, notes } = req.body;

    if (!medId) {
        return res.status(400).json({ msg: "medId is missing from the request." });
    }
    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
        return res.status(400).json({ msg: "Please provide at least one medicine." });
    }

    try {
        const patient = await Customer.findOne({ med_id: medId });
        if (!patient) {
            return res.status(404).json({ msg: `Patient with medId ${medId} not found.` });
        }

        const newPrescription = new Prescription({
            doctorId: req.user.id,
            patientId: patient._id,
            med_id: medId,
            medicines,
            notes
        });

        const prescription = await newPrescription.save();
        console.log("Successfully created prescription:", prescription._id);
        res.status(201).json(prescription);

    } catch (err) {
        console.error("Error creating prescription:", err.message);
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/medical/reports
// @desc    Create a new medical report for a patient
// @access  Private (Doctor only)
router.post("/reports", protect, isDoctor, async (req, res) => {
    console.log("Received request to create report. Body:", req.body);
    const { medId, title, summary, fileUrl } = req.body;

    if (!medId) {
        return res.status(400).json({ msg: "medId is missing from the request." });
    }
    if (!title || !summary) {
        return res.status(400).json({ msg: "Please provide a title and a summary." });
    }

    try {
        const patient = await Customer.findOne({ med_id: medId });
        if (!patient) {
            return res.status(404).json({ msg: `Patient with medId ${medId} not found.` });
        }

        const newReport = new Report({
            doctorId: req.user.id,
            patientId: patient._id,
            med_id: medId,
            title,
            summary,
            fileUrl
        });

        const report = await newReport.save();
        console.log("Successfully created report:", report._id);
        res.status(201).json(report);

    } catch (err) {
        console.error("Error creating report:", err.message);
        res.status(500).send("Server Error");
    }
});


// --- GET ROUTES ---

// @route   GET /api/medical/prescriptions/:medId
router.get("/prescriptions/:medId", protect, isDoctor, async (req, res) => {
    try {
        const patient = await Customer.findOne({ med_id: req.params.medId });
        if (!patient) { return res.status(404).json({ msg: "Patient not found" }); }
        const prescriptions = await Prescription.find({ patientId: patient._id }).populate('doctorId', 'name').sort({ date: -1 });
        res.json(prescriptions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/medical/reports/:medId
router.get("/reports/:medId", protect, isDoctor, async (req, res) => {
    try {
        const patient = await Customer.findOne({ med_id: req.params.medId });
        if (!patient) { return res.status(404).json({ msg: "Patient not found" }); }
        const reports = await Report.find({ patientId: patient._id }).populate('doctorId', 'name').sort({ date: -1 });
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/medical/customer-prescriptions
router.get("/customer-prescriptions", protect, isCustomer, async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patientId: req.user.id }).populate('doctorId', 'name').sort({ date: -1 });
        res.json(prescriptions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/medical/customer-reports
router.get("/customer-reports", protect, isCustomer, async (req, res) => {
     try {
        // --- FIX APPLIED HERE ---
        // Filter reports to only show those with status: 'Completed'.
        // This ensures patients only see finalized reports, not pending ones.
        const reports = await TestRequest.find({ 
            patient: req.user.id,
            status: 'Completed' // <-- CRITICAL FILTER ADDED
        })
            .populate('doctor', 'name specialization')
            .populate('assignedLab', 'name');
        
        res.json(reports);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

