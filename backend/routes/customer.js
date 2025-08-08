const express = require("express");
const Customer = require("../models/customer");
const auth = require("../middleware/authMiddleware");
const router = express.Router();

// Protected route - Get customer profile
router.get("/profile", auth, async (req, res) => {
    try {
        // Only allow if role is customer
        if (req.user.role !== "customer") {
            return res.status(403).json({ msg: "Access denied" });
        }

        const customer = await Customer.findById(req.user.id).select("-password");
        res.json(customer);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

module.exports = router;
