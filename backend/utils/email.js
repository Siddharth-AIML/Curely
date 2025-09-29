const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const otpStore = new Map();

/**
 * Sends a verification OTP to a patient's email on behalf of a doctor.
 * @param {string} patientEmail - The patient's email address.
 * @param {string} doctorName - The name of the doctor initiating the request.
 * @returns {void}
 */
const sendPatientVerificationEmail = async (patientEmail, doctorName) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const mailOptions = {
        from: `"Curely Verification" <${process.env.EMAIL_USER}>`,
        to: patientEmail,
        subject: 'Verification Code for Report Access',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Report Access Verification</h2>
                <p>Hello,</p>
                <p>Dr. ${doctorName} is requesting access to create a new medical report for you. Please provide them with the following One-Time Password (OTP) to proceed. This code is valid for 10 minutes.</p>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #007A5E;">${otp}</p>
                <p>If you did not expect this, please ignore this email. Do not share this code with anyone other than your doctor during your consultation.</p>
                <p>Best regards,<br/>The Curely Team</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        otpStore.set(patientEmail, { otp, timestamp: Date.now() });
        console.log(`Patient verification OTP sent to ${patientEmail}`);
    } catch (error) {
        console.error('Error sending patient OTP email:', error);
        throw new Error('Could not send patient OTP email.');
    }
};

/**
 * Verifies the provided OTP for a given email.
 * @param {string} email - The user's email address.
 * @param {string} otp - The OTP provided by the user.
 * @returns {boolean} True if the OTP is valid, false otherwise.
 */
const verifyOTP = (email, otp) => {
    const stored = otpStore.get(email);
    if (!stored) return false;

    const isExpired = (Date.now() - stored.timestamp) > 600000; // 10 minutes
    if (isExpired) {
        otpStore.delete(email);
        return false;
    }

    if (stored.otp === otp) {
        otpStore.delete(email);
        return true;
    }

    return false;
};

// We no longer need the doctor-specific OTP functions if verification is only for patients.
module.exports = { sendPatientVerificationEmail, verifyOTP };

