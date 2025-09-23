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
router.get('/doctors', protect, async (req, res) => {
    try {
        const doctors = await Doctor.find({ isVerified: true }).select('-password');
        res.json({ data: doctors });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
