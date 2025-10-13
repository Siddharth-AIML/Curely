const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    appointment_date: {
        type: Date,
        required: true
    },
    appointment_time: {
        type: String, // e.g., "10:00 AM"
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['normal', 'urgent', 'emergency'],
        default: 'normal'
    },
    type: {
        type: String,
        enum: ['video', 'clinic', 'phone'],
        required: true
    },
    status: {
        type: String,
        enum: ['requested', 'confirmed', 'completed', 'cancelled', 'declined'],
        default: 'requested'
    },
    doctor_notes: { // Notes added by the doctor after the consultation
        type: String,
        default: ''
    },
    patient_notes: { // Notes added by the patient when booking
        type: String,
        default: ''
    }
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps automatically

module.exports = mongoose.model("Appointment", appointmentSchema);
