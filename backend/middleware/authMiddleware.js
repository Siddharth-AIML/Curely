const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    // Get token from header
    const token = req.header('authorization')?.split(' ')[1];

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const isDoctor = (req, res, next) => {
    if (req.user && req.user.role === 'doctor') {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied. Doctors only.' });
    }
};

const isCustomer = (req, res, next) => {
    if (req.user && req.user.role === 'customer') {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied. Customers only.' });
    }
};

module.exports = { protect, isDoctor, isCustomer };
