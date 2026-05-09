import { getMessageApi, getNotificationApi } from './antdApp';

// Error codes mapping for better user messages
const ERROR_CODES = {
    // Authentication errors
    'UNAUTHORIZED': 'You need to be logged in to perform this action',
    'FORBIDDEN': 'You don\'t have permission to perform this action',
    'INVALID_CREDENTIALS': 'Invalid email or password',
    'TOKEN_EXPIRED': 'Your session has expired. Please log in again',
    
    // Validation errors
    'VALIDATION_ERROR': 'Please check your input and try again',
    'REQUIRED_FIELD': 'This field is required',
    'INVALID_EMAIL': 'Please enter a valid email address',
    'PASSWORD_TOO_SHORT': 'Password must be at least 6 characters long',
    
    // Resource errors
    'RESOURCE_NOT_FOUND': 'The requested resource was not found',
    'RESOURCE_ALREADY_EXISTS': 'This resource already exists',
    
    // Server errors
    'SERVER_ERROR': 'Something went wrong on our end. Please try again',
    'NETWORK_ERROR': 'Network connection failed. Please check your internet connection',
    
    // Rate limiting
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please try again later'
};

// Error severity levels
const SEVERITY = {
    LOW: 'info',
    MEDIUM: 'warning', 
    HIGH: 'error'
};

// Enhanced error handler class
class ErrorHandler {
    constructor() {
        this.defaultOptions = {
            duration: 4.5,
            placement: 'topRight'
        };
    }

    get messageApi() {
        return getMessageApi();
    }

    get notificationApi() {
        return getNotificationApi();
    }

    // Handle API errors
    handleApiError(error, context = '') {
        const errorMessage = this.extractErrorMessage(error);
        const severity = this.determineSeverity(error);
        
        // Log error for debugging (in production, send to error tracking service)
        console.error(`API Error${context ? ` in ${context}` : ''}:`, {
            message: errorMessage,
            status: error.response?.status,
            url: error.config?.url,
            timestamp: new Date().toISOString()
        });

        // Show user-friendly message (skip generic network popups)
        if (!this.isSilentNetworkError(error)) {
            this.showNotification(errorMessage, severity, context);
        }
        
        return errorMessage;
    }

    isSilentNetworkError(error) {
        return !error.response && !!error.request;
    }

    // Extract meaningful error message from various error formats
    extractErrorMessage(error) {
        // Axios error response
        if (error.response) {
            const { data, status } = error.response;
            
            // Check for specific error codes
            if (data?.code && ERROR_CODES[data.code]) {
                return ERROR_CODES[data.code];
            }
            
            // Check for message in response data
            if (data?.message) {
                return data.message;
            }
            if (data?.error) {
                return data.error;
            }
            
            // Check for validation errors
            if (data?.errors) {
                const firstError = Object.values(data.errors)[0]?.[0];
                if (firstError) return firstError;
            }
            
            // HTTP status based messages
            switch (status) {
                case 400: return ERROR_CODES.VALIDATION_ERROR;
                case 401: return ERROR_CODES.UNAUTHORIZED;
                case 403: return ERROR_CODES.FORBIDDEN;
                case 404: return ERROR_CODES.RESOURCE_NOT_FOUND;
                case 429: return ERROR_CODES.RATE_LIMIT_EXCEEDED;
                case 500: return ERROR_CODES.SERVER_ERROR;
                default: return `HTTP ${status}: Something went wrong`;
            }
        }
        
        // Network error
        if (error.request) {
            return ERROR_CODES.NETWORK_ERROR;
        }
        
        // Other errors
        return error.message || 'An unexpected error occurred';
    }

    // Determine error severity
    determineSeverity(error) {
        if (!error.response) return SEVERITY.HIGH; // Network errors are severe
        
        const { status } = error.response;
        
        if (status >= 500) return SEVERITY.HIGH;
        if (status >= 400) return SEVERITY.MEDIUM;
        return SEVERITY.LOW;
    }

    // Show notification with appropriate styling
    showNotification(messageText, severity, context = '') {
        const config = {
            ...this.defaultOptions,
            message: context ? `${context} Error` : 'Error',
            description: messageText,
            duration: severity === SEVERITY.HIGH ? 0 : this.defaultOptions.duration // Persistent for high severity
        };

        switch (severity) {
            case SEVERITY.HIGH:
                this.notificationApi?.error?.(config);
                break;
            case SEVERITY.MEDIUM:
                this.notificationApi?.warning?.(config);
                break;
            case SEVERITY.LOW:
                this.notificationApi?.info?.(config);
                break;
        }
    }

    // Handle form validation errors
    handleFormErrors(errors, formInstance) {
        if (!errors || !formInstance) return;

        const formattedErrors = {};
        
        // Convert API validation errors to form errors
        Object.keys(errors).forEach(field => {
            const fieldErrors = errors[field];
            if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
                formattedErrors[field] = {
                    value: formInstance.getFieldValue(field),
                    errors: fieldErrors.map(msg => new Error(msg))
                };
            }
        });

        if (Object.keys(formattedErrors).length > 0) {
            formInstance.setFields(Object.values(formattedErrors));
        }
    }

    // Show success message
    showSuccess(messageText, context = '') {
        this.messageApi?.success?.(context ? `${context}: ${messageText}` : messageText);
    }

    // Show info message
    showInfo(messageText, context = '') {
        this.messageApi?.info?.(context ? `${context}: ${messageText}` : messageText);
    }

    // Show warning message
    showWarning(messageText, context = '') {
        this.messageApi?.warning?.(context ? `${context}: ${messageText}` : messageText);
    }

    // Handle promise rejections gracefully
    async handlePromise(promise, context = '', onSuccess = null, onError = null) {
        try {
            const result = await promise;
            if (onSuccess) onSuccess(result);
            return result;
        } catch (error) {
            const errorMessage = this.handleApiError(error, context);
            if (onError) onError(error, errorMessage);
            throw error;
        }
    }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Export utility functions
export const handleApiError = (error, context) => errorHandler.handleApiError(error, context);
export const showSuccess = (message, context) => errorHandler.showSuccess(message, context);
export const showInfo = (message, context) => errorHandler.showInfo(message, context);
export const showWarning = (message, context) => errorHandler.showWarning(message, context);
export const handleFormErrors = (errors, formInstance) => errorHandler.handleFormErrors(errors, formInstance);
export const handlePromise = (promise, context, onSuccess, onError) => 
    errorHandler.handlePromise(promise, context, onSuccess, onError);

export default errorHandler;
