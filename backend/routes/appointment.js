const express = require("express");
const router = express.Router();
const { protect, isCustomer, isDoctor } = require("../middleware/authMiddleware");
const Appointment = require("../models/appointment");
const Doctor = require("../models/doctor");

// @route   POST /api/appointments
// @desc    Customer requests a new appointment
// @access  Private (Customer)
router.post("/", protect, isCustomer, async (req, res) => {
    const { doctorId, appointment_date, appointment_time, reason, type, patient_notes } = req.body;

    if (!doctorId || !appointment_date || !appointment_time || !reason || !type) {
        return res.status(400).json({ msg: "Please provide all required appointment details." });
    }

    try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ msg: "Doctor not found." });
        }

        const newAppointment = new Appointment({
            doctorId,
            patientId: req.user.id,
            appointment_date,
            appointment_time,
            reason,
            type,
            patient_notes,
            status: 'requested' // All new appointments start as 'requested'
        });

        const appointment = await newAppointment.save();
        res.status(201).json(appointment);

    } catch (err) {
        console.error("Error creating appointment:", err.message);
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/appointments/doctor
// @desc    Get all appointments for the logged-in doctor
// @access  Private (Doctor)
router.get("/doctor", protect, isDoctor, async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctorId: req.user.id })
            .populate('patientId', 'name med_id') // Populate patient details
            .sort({ appointment_date: -1 });
        res.json(appointments);
    } catch (err) {
        console.error("Error fetching doctor appointments:", err.message);
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/appointments/customer
// @desc    Get all appointments for the logged-in customer
// @access  Private (Customer)
router.get("/customer", protect, isCustomer, async (req, res) => {
    try {
        const appointments = await Appointment.find({ patientId: req.user.id })
            .populate('doctorId', 'name specialization') // Populate doctor details
            .sort({ appointment_date: -1 });
        res.json(appointments);
    } catch (err) {
        console.error("Error fetching customer appointments:", err.message);
        res.status(500).send("Server Error");
    }
});

// @route   PUT /api/appointments/:id/status
// @desc    Update the status of an appointment (confirm, decline, etc.)
// @access  Private (Doctor)
router.put("/:id/status", protect, isDoctor, async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'completed', 'declined', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ msg: "A valid status must be provided." });
    }

    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ msg: "Appointment not found." });
        }

        if (appointment.doctorId.toString() !== req.user.id) {
            return res.status(401).json({ msg: "Not authorized to update this appointment." });
        }

        appointment.status = status;
        await appointment.save();
        res.json(appointment);

    } catch (err) {
        console.error("Error updating appointment status:", err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;

