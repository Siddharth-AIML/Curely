const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
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
        const doctors = await Doctor.find().select(
            'name specialization experience fee clinic_name city'
        );
        res.json(doctors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


/**
 * @route   PUT /api/customer/password
 * @desc    Update customer password
 * @access  Private (Customer)
 */
router.put('/password', protect, isCustomer, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const customer = await Customer.findById(req.user.id);
        const isMatch = await bcrypt.compare(currentPassword, customer.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        customer.password = await bcrypt.hash(newPassword, salt);
        await customer.save();

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

