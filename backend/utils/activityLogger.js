const Log = require('../models/log.model');

// Logging middleware for automatic activity tracking
const logActivity = (action, options = {}) => {
    return async (req, res, next) => {
        try {
            // Skip logging if user is not authenticated
            if (!req.user) {
                return next();
            }

            const logData = {
                action,
                actorId: req.user.id,
                actorEmail: req.user.email,
                actorRole: req.user.role,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                ...options
            };

            // Add resource information if provided
            if (req.params.id) {
                logData.resourceId = req.params.id;
            }

            // Add request body details for certain actions
            if (['USER_UPDATED', 'TEST_CREATED', 'TEST_UPDATED', 'PROFILE_UPDATED'].includes(action)) {
                logData.details = {
                    ...options.details,
                    requestBody: req.body
                };
            }

            await Log.create(logData);
        } catch (error) {
            console.error('Failed to log activity:', error);
            // Don't break the request if logging fails
        }
        
        next();
    };
};

// Manual logging function for custom activities
const logManualActivity = async (userId, userEmail, userRole, action, details = {}) => {
    try {
        const logData = {
            action,
            actorId: userId,
            actorEmail: userEmail,
            actorRole: userRole,
            details,
            severity: details.severity || 'INFO'
        };

        return await Log.create(logData);
    } catch (error) {
        console.error('Failed to log manual activity:', error);
        throw error;
    }
};

// Utility functions for common logging scenarios
const logUserLogin = (req) => logActivity('USER_LOGIN')(req, {}, () => {});
const logUserLogout = (req) => logActivity('USER_LOGOUT')(req, {}, () => {});
const logPasswordChange = (req) => logActivity('PASSWORD_CHANGED')(req, {}, () => {});
const logProfileUpdate = (req) => logActivity('PROFILE_UPDATED')(req, {}, () => {});
const logTestCreation = (req) => logActivity('TEST_CREATED', { resourceType: 'Test' })(req, {}, () => {});
const logTestUpdate = (req) => logActivity('TEST_UPDATED', { resourceType: 'Test' })(req, {}, () => {});
const logSubmission = (req) => logActivity('SUBMISSION_SUBMITTED', { resourceType: 'Submission' })(req, {}, () => {});

module.exports = {
    logActivity,
    logManualActivity,
    logUserLogin,
    logUserLogout,
    logPasswordChange,
    logProfileUpdate,
    logTestCreation,
    logTestUpdate,
    logSubmission
};