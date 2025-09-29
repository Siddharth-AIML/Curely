const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { protect, isDoctor } = require('../middleware/authMiddleware');
const Doctor = require('../models/doctor');
const Customer = require('../models/customer');

/**
 * @route   GET /api/doctor/profile
 * @desc    Get logged-in doctor's profile
 * @access  Private (Doctor)
 */
router.get('/profile', protect, isDoctor, async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.user.id).select('-password');
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor profile not found' });
        }
        res.json(doctor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/doctor/customer/:medId
 * @desc    Find a customer by their Medical ID
 * @access  Private (Doctor)
 */
router.get('/customer/:medId', protect, isDoctor, async (req, res) => {
    try {
        const customer = await Customer.findOne({ med_id: req.params.medId }).select('-password');
        if (!customer) {
            return res.status(404).json({ msg: 'Patient with this Medical ID not found' });
        }
        res.json(customer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT /api/doctor/password
 * @desc    Update doctor password
 * @access  Private (Doctor)
 */
router.put('/password', protect, isDoctor, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const doctor = await Doctor.findById(req.user.id);
        const isMatch = await bcrypt.compare(currentPassword, doctor.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        doctor.password = await bcrypt.hash(newPassword, salt);
        await doctor.save();

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;

