const express = require('express');
const router = express.Router();
const { protect, isCustomer } = require('../middleware/authMiddleware');
const Customer = require('../models/customer');
const Doctor = require('../models/doctor');

/**
 * @route   GET /api/customer/profile
 * @desc    Get logged-in customer's profile
 * @access  Private (Customer)
 */
router.get('/profile', protect, isCustomer, async (req, res) => {
    try {
        const customer = await Customer.findById(req.user.id).select('-password');
        if (!customer) {
            return res.status(404).json({ msg: 'Customer profile not found' });
        }
        res.json(customer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/customer/doctors
 * @desc    Get all verified doctors for customers to view
 * @access  Private (Customer)
 */
router.get('/doctors', protect, isCustomer, async (req, res) => {
    try {
        // Find doctors who are verified and select only public-facing information
        const doctors = await Doctor.find({ isVerified: true }).select(
            'name specialization experience fee clinic_name city'
        );
        res.json(doctors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
