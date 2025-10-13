const jwt = require('jsonwebtoken');

/**
 * Middleware to check for a valid JWT token and attach user payload to req.user.
 */
const protect = (req, res, next) => {
    // Get token from header (Format: Bearer <token>)
    const token = req.header('authorization')?.split(' ')[1];

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        // The JWT payload (decoded) should contain the user's role and ID.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

/**
 * Middleware to restrict access to Doctor roles only. Must follow 'protect'.
 */
const isDoctor = (req, res, next) => {
    // Check if req.user exists (from 'protect') and if the role is 'doctor'
    if (req.user && req.user.role === 'doctor') {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied. Doctors only.' });
    }
};

/**
 * Middleware to restrict access to Customer roles only. Must follow 'protect'.
 */
const isCustomer = (req, res, next) => {
    // Check if req.user exists (from 'protect') and if the role is 'customer'
    if (req.user && req.user.role === 'customer') {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied. Customers only.' });
    }
};

/**
 * Middleware to restrict access to Lab roles only. Must follow 'protect'.
 * (NEW MIDDLEWARE)
 */
const isLab = (req, res, next) => {
    // Check if req.user exists (from 'protect') and if the role is 'lab'
    if (req.user && req.user.role === 'lab') {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied. Lab personnel only.' });
    }
};

module.exports = { protect, isDoctor, isCustomer, isLab };