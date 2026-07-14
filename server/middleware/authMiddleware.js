const jwt = require('jsonwebtoken');
const { logAction } = require('../utils/logger');

// 1. Verify if the user is logged in at all
const protect = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Get token from "Bearer <token>"

    if (!token) {
        logAction({
            req,
            action: 'AUTH_TOKEN_MISSING',
            description: 'Protected route access attempted without a token.',
            actorType: 'system',
            success: false,
            statusCode: 401,
        });
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Add user info to the request object
        next();
    } catch (err) {
        logAction({
            req,
            action: 'AUTH_TOKEN_INVALID',
            description: 'Protected route access attempted with an invalid token.',
            actorType: 'system',
            success: false,
            statusCode: 401,
        });
        res.status(401).json({ message: "Token is not valid" });
    }
};

// 2. Check for specific roles (Admin, Instructor, Manager)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            logAction({
                req,
                action: 'AUTHORIZATION_FAILED',
                description: `User role ${req.user.role} attempted to access a restricted route.`,
                userId: req.user.id,
                actorRole: req.user.role,
                success: false,
                statusCode: 403,
            });
            return res.status(403).json({ 
                message: `User role ${req.user.role} is not authorized to access this route` 
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
