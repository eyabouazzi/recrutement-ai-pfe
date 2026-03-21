const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: false,
                message: 'Not authorized, no token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                status: false,
                message: 'User associated with this token does not exist'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        let message = 'Authentication failed';
        if (error.name === 'TokenExpiredError') {
            message = 'Token expired, please login again';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Invalid token';
        }
        return res.status(401).json({
            status: false,
            message: message,
            error: error.message
        });
    }
}

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
}

module.exports = { protect, restrictTo };
