const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../models/customer");
const Doctor = require("../models/doctor");
const Lab = require("../models/lab");
const router = express.Router();

// Helper function to generate JWT token (matching your existing structure)
const generateToken = (user, role) => {
    // Note: Assuming 'lab' uses 'status' field, 'doctor' uses 'verification' or 'status', and 'customer' is immediately verified.
    const isVerified = user.verification || user.status === 'Approved' || (role === 'customer');
    return jwt.sign(
        { id: user._id, role, verification: isVerified },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// --- Customer Signup ---
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

// --- Doctor Signup ---
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
            // Status defaults to 'Pending' in the model
        });

        await doctor.save();
        res.status(201).json({ msg: "Doctor registered successfully. Awaiting admin approval." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
});

// --- Lab Signup (FIXED) ---
router.post("/signup/lab", async (req, res) => {
    try {
        // 💡 FIXED: Destructuring all required fields from the frontend
        const { name, email, password, labId, phone, address } = req.body;

        if (!name || !email || !password || !labId || !phone || !address) {
            return res.status(400).json({ msg: "Please enter all required fields for the lab." });
        }

        let lab = await Lab.findOne({ $or: [{ email }, { labId }] });
        if (lab) return res.status(400).json({ msg: "Lab with this email or ID already exists." });
        
        const hashedPassword = await bcrypt.hash(password, 10);

        // 💡 FIXED: Including phone and address in the Lab constructor
        lab = new Lab({
            name, 
            email, 
            password: hashedPassword, 
            labId,
            phone,
            address
            // Status defaults to 'Pending' in the model
        });

        await lab.save();
        res.status(201).json({ 
            msg: "Lab registered successfully. Account is pending admin approval.",
            labId: lab.labId,
            verification: false // Explicitly state for frontend redirect logic
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
});

// --- Login (common for Customer, Doctor, and Lab) ---
router.post("/login", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        let user;

        if (!role) {
            return res.status(400).json({ msg: "Role must be specified for login." });
        }

        // 1. Find User by Role
        if (role === "customer") {
            user = await Customer.findOne({ email });
        } else if (role === "doctor") {
            user = await Doctor.findOne({ email });
        } else if (role === "lab") {
            user = await Lab.findOne({ email });
        } else {
            return res.status(400).json({ msg: "Invalid role" });
        }

        if (!user) return res.status(400).json({ msg: "User not found" });

        // 2. Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        // 3. Check Account Status (Prevent login if unapproved/pending)
        // Doctor check for 'Pending' status (or lack of verification field)
        const isDoctorPending = role === 'doctor' && (user.verification !== true);
        // Lab check for anything other than 'Approved' status
        const isLabPending = role === 'lab' && user.status !== 'Approved';
        
        if (isDoctorPending) {
            // Note: Your frontend login logic redirects to /pending-approval if verification is false/missing.
            // Returning a 400 here allows the client to handle the pending state gracefully.
            return res.status(400).json({ 
                msg: "Doctor account is  admin verification.",
                verification: false
            });
        }
        if (isLabPending) {
            return res.status(400).json({ 
                msg: `Lab account status is ${user.status}. Login denied.`,
                verification: false
            });
        }

        // 4. Generate token
        const token = generateToken(user, role);

        // 5. Prepare Response
        const response = {
            token,
            role,
            name: user.name,
            // Include status logic: Approved if customer, or if status is 'Approved' for providers
            verification: (role === 'customer') || (user.status === 'Approved') || (user.verification === 'Approved') 
        };

        if (role === "customer" && user.med_id) {
            response.med_id = user.med_id;
        }
        if (role === "lab" && user.labId) {
            response.labId = user.labId;
        }

        res.json(response);

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
});

module.exports = router;
