const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const labSchema = mongoose.Schema(
    {
        // Authentication & User Details
        name: {
            type: String,
            required: [true, 'Please add the lab name'],
        },
        email: {
            type: String,
            required: [true, 'Please add the lab email'],
            unique: true,
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
        },
        // Lab-specific identification
        labId: {
            type: String,
            required: [true, 'Please add a unique license/registration ID'],
            unique: true,
            uppercase: true,
        },
        // Role for authorization middleware
        role: {
            type: String,
            default: 'lab',
            immutable: true,
        },
        // Status for approval flow (PendingApproval.jsx)
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Suspended'],
            default: 'Pending',
        },
        // Contact and Location
        phone: {
            type: String,
        },
        address: {
            street: String,
            city: String,
            state: String,
            zip: String,
        },
    },
    {
        timestamps: true,
    }
);

// --- Instance Methods ---
/*
// Compare input password with hashed password
labSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// --- Pre-save Middleware (Encrypt password before saving) ---

labSchema.pre('save', async function (next) {
    // Only hash if the password field is being modified
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});*/


const Lab = mongoose.model('Lab', labSchema);

module.exports = Lab;