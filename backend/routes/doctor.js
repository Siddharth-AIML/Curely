const express = require('express');
const router = express.Router();
const { protect, isDoctor } = require('../middleware/authMiddleware');
const Doctor = require('../models/doctor');
const Customer = require('../models/customer');
const { sendPatientVerificationEmail, verifyOTP } = require('../utils/email');

// ... (GET /profile and GET /customer/:medId routes remain the same)
router.get('/profile', protect, isDoctor, async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.user.id).select('-password');
        res.json(doctor);
    } catch (err) { res.status(500).send('Server Error'); }
});

router.get('/customer/:medId', protect, isDoctor, async (req, res) => {
    try {
        const customer = await Customer.findOne({ med_id: req.params.medId }).select('-password');
        if (!customer) return res.status(404).json({ msg: 'Patient not found' });
        res.json(customer);
    } catch (err) { res.status(500).send('Server Error'); }
});


/**
 * @route   POST /api/doctor/send-patient-otp
 * @desc    Send a verification OTP to the specified patient's email
 * @access  Private (Doctor)
 */
router.post('/send-patient-otp', protect, isDoctor, async (req, res) => {
    const { medId } = req.body;
    if (!medId) return res.status(400).json({ msg: 'Patient Medical ID is required.' });

    try {
        const patient = await Customer.findOne({ med_id: medId });
        const doctor = await Doctor.findById(req.user.id);

        if (!patient || !doctor) {
            return res.status(404).json({ msg: 'Patient or Doctor not found.' });
        }
        
        await sendPatientVerificationEmail(patient.email, doctor.name);
        res.json({ msg: `A verification code has been sent to ${patient.name}'s registered email.` });
    } catch (err) {
        res.status(500).json({ msg: 'Failed to send OTP.' });
    }
});

/**
 * @route   POST /api/doctor/verify-patient-otp
 * @desc    Verify the OTP for a specific patient
 * @access  Private (Doctor)
 */
router.post('/verify-patient-otp', protect, isDoctor, async (req, res) => {
    const { medId, otp } = req.body;
    if (!medId || !otp) {
        return res.status(400).json({ msg: 'Medical ID and OTP are required.' });
    }
    try {
        const patient = await Customer.findOne({ med_id: medId });
        if (!patient) return res.status(404).json({ msg: 'Patient not found.' });

        const isValid = verifyOTP(patient.email, otp);
        if (isValid) {
            res.json({ msg: 'Verification successful. You may now proceed.' });
        } else {
            res.status(400).json({ msg: 'Invalid or expired OTP.' });
        }
    } catch (err) {
        res.status(500).json({ msg: 'Server error during OTP verification.' });
    }
});

module.exports = router;

