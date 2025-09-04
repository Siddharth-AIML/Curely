const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
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
    med_id: {
        type: String,
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: false
    },
    title: {
        type: String,
        required: true // e.g., "Blood Test Report", "X-Ray Analysis"
    },
    summary: {
        type: String,
        required: true
    },
    // In a real application, you'd likely store a URL to a file in cloud storage (like AWS S3)
    // For simplicity, we can store a reference or a URL here.
    fileUrl: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Report", reportSchema);
