const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    specialization: { type: String, required: true },
    experience: { type: Number, required: true }, // in years
    fee: { type: Number, required: true }, // consultation fee
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    clinic_name: { type: String, required: true },
    address: { type: String, required: true },
    verification: {type: Boolean, default: false}
});

module.exports = mongoose.model("Doctor", DoctorSchema);
