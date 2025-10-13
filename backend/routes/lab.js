const express = require('express');
const router = express.Router();
const Lab = require('../models/lab');
// You need the Doctor middleware (isDoctor) and authentication (protect)
// if you want to restrict this route to only authenticated doctors.
const { protect, isLab, isDoctor } = require('../middleware/authMiddleware');


// @route   GET /api/lab/approved
// NOTE: If your main server file mounts this router at /api/lab,
// the full path becomes /api/lab/approved. If the frontend is calling
// /api/labs/approved, you must adjust the mounting path in your server.js
// or change the frontend API call to '/lab/approved'.
// For now, let's assume your frontend will use '/lab/approved'.


// @route   GET /api/lab/approved
// @desc    Get list of all approved labs (Used by Doctors)
// @access  Private (Doctor or Admin)
router.get('/approved', protect, async (req, res) => {
    try {
        // Query the database to find all labs with status 'Approved'
        const approvedLabs = await Lab.find({ status: 'Approved' }).select('-password -__v -date');
       
        if (approvedLabs.length === 0) {
            return res.status(200).json([]);
        }


        // Return the list of approved labs
        res.json(approvedLabs);


    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error while fetching approved labs');
    }
});




// @route   GET /api/lab/profile
// @desc    Get Lab user profile data
// @access  Private (Lab only)
router.get('/profile', protect, isLab, async (req, res) => {
    try {
        const lab = await Lab.findById(req.user.id).select('-password');
        if (!lab) {
            return res.status(404).json({ msg: 'Lab not found.' });
        }
        res.json(lab);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT /api/lab/profile
// @desc    Update Lab user profile data
// @access  Private (Lab only)
router.post('/profile', protect, isLab, async (req, res) => {
    const { name, email, phone, address } = req.body;
    try {
        const lab = await Lab.findById(req.user.id);
        if (!lab) {
            return res.status(404).json({ msg: 'Lab not found.' });
        }
       
        lab.name = name || lab.name;
        lab.email = email || lab.email;
        lab.phone = phone || lab.phone;
        lab.address = address || lab.address; // Assuming address is an object or string


        const updatedLab = await lab.save();
        res.json({
            _id: updatedLab._id,
            name: updatedLab.name,
            email: updatedLab.email,
            phone: updatedLab.phone,
            address: updatedLab.address,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;



