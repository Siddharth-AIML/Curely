const express = require('express');
const router = express.Router();
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
        const medId = req.params.medId;
        console.log(`Searching for customer with med_id: ${medId}`); // <-- Added for debugging

        const customer = await Customer.findOne({ med_id: medId }).select('-password');
        
        if (!customer) {
            console.log(`Customer with med_id: ${medId} NOT FOUND.`); // <-- Added for debugging
            return res.status(404).json({ msg: 'Patient with this Medical ID not found' });
        }
        
        console.log(`Customer found: ${customer.name}`); // <-- Added for debugging
        res.json(customer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/doctor/all
 * @desc    Get all verified doctors
 * @access  Public
 */
router.get('/all', async (req, res) => {
    try {
        // Check all doctors first
        const allDoctors = await Doctor.find({}).select('-password');
        console.log('Total doctors in database:', allDoctors.length);
        console.log('All doctors:', allDoctors.map(d => ({ name: d.name, verification: d.verification })));

        // Then check verified doctors
        const doctors = await Doctor.find({ verification: true }).select('-password');
        console.log('Verified doctors:', doctors.length);
        
        res.json({ data: doctors });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;