const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../models/customer");
const Doctor = require("../models/doctor");
const router = express.Router();

// Customer Signup
router.post("/signup/customer", async (req, res) => {
    try {
        const { name, age, gender, email, password } = req.body;

        // Check if already exists
        let user = await Customer.findOne({ email });
        if (user) return res.status(400).json({ msg: "Customer already exists" });

        // Generate unique 6-digit med_id
        let med_id;
        let isUnique = false;
        while (!isUnique) {
            med_id = Math.floor(100000 + Math.random() * 900000).toString();
            const existing = await Customer.findOne({ med_id });
            if (!existing) isUnique = true;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create customer with med_id
        user = new Customer({ 
            name, 
            age, 
            gender, 
            email, 
            password: hashedPassword, 
            med_id 
        });
        await user.save();

        res.status(201).json({ 
            msg: "Customer registered successfully", 
            med_id: med_id 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
});

// Doctor Signup
router.post("/signup/doctor", async (req, res) => {
    try {
        const {
            name, email, phone, password, licenseNumber,
            specialization, experience, fee, country, state, city, pincode,
            clinic_name, address
        } = req.body;

        let doctor = await Doctor.findOne({ $or: [{ email }, { licenseNumber }] });
        if (doctor) return res.status(400).json({ msg: "Doctor already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        doctor = new Doctor({
            name, email, phone, password: hashedPassword, licenseNumber,
            specialization, experience, fee, country, state, city, pincode,
            clinic_name, address
        });

        await doctor.save();
        res.status(201).json({ msg: "Doctor registered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
});

// Login (common for both)
router.post("/login", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        let user;

        if (role === "customer") {
            user = await Customer.findOne({ email });
        } else if (role === "doctor") {
            user = await Doctor.findOne({ email });
        } else {
            return res.status(400).json({ msg: "Invalid role" });
        }

        if (!user) return res.status(400).json({ msg: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        // Generate token
        const token = jwt.sign(
            { id: user._id, role, verification: user.verification || false },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Include med_id in response for customers
        const response = {
            token,
            verification: user.verification || false
        };

        if (role === "customer" && user.med_id) {
            response.med_id = user.med_id;
        }

        res.json(response);

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
});

module.exports = router;
