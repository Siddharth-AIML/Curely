const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    instructions: { type: String, required: true },
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    patientId: { // This will store the customer's ObjectId
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    med_id: { // Storing med_id for easy lookup
        type: String,
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment', // Assuming you have an Appointment model
        required: false // Optional, but good for linking
    },
    medicines: [medicineSchema],
    notes: { type: String },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Prescription", prescriptionSchema);
