const mongoose = require('mongoose');

const testRequestSchema = mongoose.Schema(
    {
        // --- Request Details ---
        // Link to the Patient (Customer Model)
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Customer',
        },
        // Link to the Requesting Doctor (Doctor Model)
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Doctor',
        },
        // Link to the Assigned Lab (Lab Model)
        assignedLab: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Lab',
        },
        // --- Test Details ---
        testName: {
            type: String,
            required: [true, 'Please specify the test name (e.g., CBC, Lipid Profile)'],
        },
        notes: {
            type: String,
        },
        // --- Report Status and File ---
        status: {
            type: String,
            enum: ['Requested', 'In Progress', 'Completed', 'Canceled'],
            default: 'Requested',
        },
        // Path/URL to the final uploaded report file (PDF/Image)
        reportFilePath: {
            type: String,
            default: null,
        },
        completedAt: {
            type: Date,
        }
    },
    {
        timestamps: true,
    }
);

const TestRequest = mongoose.model('TestRequest', testRequestSchema);

module.exports = TestRequest;