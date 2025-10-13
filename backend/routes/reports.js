const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path'); // IMPORTANT: Needed for path resolution
const TestRequest = require('../models/testRequest');
const Customer = require('../models/customer');
const { protect, isDoctor, isCustomer, isLab } = require('../middleware/authMiddleware');


// ----------------------------------------------------------------------
// 1. UPDATED MULTER CONFIGURATION: USE DISK STORAGE
// ----------------------------------------------------------------------
const storage = multer.diskStorage({
    // CRITICAL FIX: Set the destination folder to the public static directory
    destination: (req, file, cb) => {
        // Assuming this file is in 'routes', '..' navigates up to the project root
        cb(null, path.join(__dirname, '..', 'uploads', 'reports')); 
    },
    
    // Set a unique filename
    filename: (req, file, cb) => {
        // The reportId is needed to link the file, get it from the URL parameter
        const reportId = req.params.reportId || 'temp'; 
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/\s/g, '_'); // Replace spaces for clean URL

        // Naming convention: <reportId>-<baseName>-<timestamp>.<ext>
        const uniqueSuffix = Date.now();
        cb(null, `${reportId}-${baseName}-${uniqueSuffix}${ext}`);
    }
});

// File filter to ensure only PDFs are uploaded
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        // Reject the file
        req.fileValidationError = 'Only PDF files are allowed.';
        cb(null, false); 
    }
};


// Configure multer with disk storage and file filter
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
        fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
    } 
});


// --- LAB ACTIONS ---


// @route   GET /api/reports/lab/pending
// @desc    Get list of all pending test requests assigned to this lab
// @access  Private (Lab only)
router.get('/lab/pending', protect, isLab, async (req, res) => {
    try {
        const pendingTests = await TestRequest.find({
            assignedLab: req.user.id,
            status: { $in: ['Requested', 'In Progress'] }
        })
        // FIX 3: Changed to 'med_id' for consistency
        .populate('patient', 'name med_id')
        .populate('doctor', 'name');

        res.json(pendingTests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/reports/upload/:reportId
// @desc    Upload the completed PDF/Image report file (Used by LabReportUpload.jsx)
// @access  Private (Lab only)
router.put('/upload/:reportId', protect, isLab, upload.single('reportFile'), async (req, res) => {
    try {
        const reportId = req.params.reportId;
        
        // Handle Multer file filter error
        if (req.fileValidationError) {
            return res.status(400).json({ msg: req.fileValidationError });
        }

        if (!req.file) {
            // Check if file was uploaded but maybe failed filter (though handled above)
            return res.status(400).json({ msg: 'No file uploaded or file type is incorrect. Please select a PDF file.' });
        }

        const report = await TestRequest.findById(reportId);

        if (!report || report.assignedLab.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Test request not found or lab not authorized.' });
        }

        // ----------------------------------------------------------------------
        // CRITICAL FIX: The file is now on disk, req.file.path points to its 
        // local server path. We construct the public URL path for the database.
        // ----------------------------------------------------------------------
        const filePath = `/uploads/reports/${req.file.filename}`;

        report.reportFilePath = filePath;
        report.status = 'Completed';
        report.completedAt = Date.now();
        
        await report.save();

        res.json({
            message: 'Report uploaded and status set to Completed.',
            reportId: report._id,
            // Return the public URL path
            filePath: filePath, 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/reports/:id/status
// @desc    Update the status of a specific test
// @access  Private (Lab only)
router.put('/:id/status', protect, isLab, async (req, res) => {
    const { newStatus } = req.body;
    const reportId = req.params.id;

    try {
        const report = await TestRequest.findById(reportId);

        if (!report || report.assignedLab.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Test request not found or lab not authorized.' });
        }
        
        // Allow status updates to 'In Progress' or 'Canceled'
        if (!['In Progress', 'Canceled'].includes(newStatus)) {
            return res.status(400).json({ msg: 'Invalid status update. Must be "In Progress" or "Canceled".' });
        }

        report.status = newStatus;
        await report.save();
        
        res.json({ message: `Test status updated to ${newStatus}`, status: report.status });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- GENERAL & VIEWER ACTIONS ---


// @route   GET /api/reports/:reportId
// @desc    Get details of a single report (Used by all roles)
// @access  Private (Needs specific permission logic)
router.get('/:reportId', protect, async (req, res) => {
    try {
        const report = await TestRequest.findById(req.params.reportId)
            // FIX 3: Changed to 'med_id' for consistency
            .populate('patient', 'name med_id')
            .populate('doctor', 'name');

        if (!report) {
            return res.status(404).json({ msg: 'Test request not found.' });
        }

        // Authorization check: must be the patient, the doctor, or the assigned lab
        const userId = req.user.id;
        if (
            report.patient.toString() !== userId &&
            report.doctor.toString() !== userId &&
            report.assignedLab.toString() !== userId
        ) {
            return res.status(403).json({ msg: 'Not authorized to view this report.' });
        }

        res.json(report);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- NEW IMPLEMENTATION ---


// @route   POST /api/reports/request
// @desc    Doctor creates a new lab test request
// @access  Private (Doctor only)
router.post('/request', protect, isDoctor, async (req, res) => {
    const { patientMedId, assignedLabId, testName, notes } = req.body;

    if (!patientMedId || !assignedLabId || !testName) {
        return res.status(400).json({ msg: 'Please provide patient ID, lab ID, and test name.' });
    }

    try {
        // 1. Find the patient's MongoDB ID using their MedID
        const patient = await Customer.findOne({ med_id: patientMedId });
        if (!patient) {
            return res.status(404).json({ msg: 'Patient not found with the provided Medical ID.' });
        }

        // 2. Create the new TestRequest
        const testRequest = await TestRequest.create({
            patient: patient._id,
            doctor: req.user.id, // ID from the authenticated doctor
            assignedLab: assignedLabId, // This should be the Lab's MongoDB ID
            testName,
            notes,
            status: 'Requested',
            // FIX 2: Added requestedAt to fix "Invalid Date" issue
            requestedAt: Date.now(),
        });

        res.status(201).json({ msg: "Test request successfully created.", testRequest });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET /api/reports/customer/my-reports
// @desc    Get all reports belonging to the authenticated customer
// @access  Private (Customer only)
router.get('/customer/my-reports', protect, isCustomer, async (req, res) => {
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


// @route   GET /api/reports/doctor/patient/:patientMedId
// @desc    Get reports for a specific patient (for doctor viewing)
// @access  Private (Doctor only)
// FIX 1: Changed parameter name for clarity, now expects Medical ID
router.get('/doctor/patient/:patientMedId', protect, isDoctor, async (req, res) => {
    const patientMedId = req.params.patientMedId; // This is the Medical ID (e.g., '795689')

    try {
        // FIX 1a: STEP 1: Find the patient's MongoDB ObjectId using their Medical ID
        const customer = await Customer.findOne({ med_id: patientMedId });

        if (!customer) {
            return res.status(404).json({ msg: 'Patient not found with that Medical ID.' });
        }
        
        const patientObjectId = customer._id; // Correct MongoDB ID

        // FIX 1b: STEP 2: Use the correct MongoDB ObjectId to find reports
        const reports = await TestRequest.find({
            patient: patientObjectId, // Use the actual ObjectId here
            doctor: req.user.id // Only show reports requested by this specific doctor
        })
        .populate('assignedLab', 'name');

        res.json(reports);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;