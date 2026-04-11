import React from 'react';
import { Form } from 'antd';
import { useState, useCallback, useEffect } from 'react';

// Validation rules constants
export const VALIDATION_RULES = {
    // Required fields
    required: (message = 'This field is required') => ({
        required: true,
        message
    }),
    
    // Email validation
    email: (message = 'Please enter a valid email address') => ({
        type: 'email',
        message
    }),
    
    // Password validation
    password: {
        min: (min = 6, message = `Password must be at least ${min} characters`) => ({
            min,
            message
        }),
        max: (max = 128, message = `Password must be less than ${max} characters`) => ({
            max,
            message
        }),
        strength: (message = 'Password must contain at least one uppercase letter, one lowercase letter, and one number') => ({
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            message
        })
    },
    
    // Name validation
    name: {
        min: (min = 2, message = `Name must be at least ${min} characters`) => ({
            min,
            message
        }),
        max: (max = 50, message = `Name must be less than ${max} characters`) => ({
            max,
            message
        }),
        lettersOnly: (message = 'Name can only contain letters, spaces, hyphens, and apostrophes') => ({
            pattern: /^[a-zA-Z\s\-']+$/,
            message
        })
    },
    
    // Phone validation
    phone: (message = 'Please enter a valid phone number') => ({
        pattern: /^[\+]?[1-9][\d]{0,15}$/,
        message
    }),
    
    // Date validation
    date: {
        past: (message = 'Date must be in the past') => ({
            validator: (_, value) => {
                if (!value || value.isBefore(new Date())) {
                    return Promise.resolve();
                }
                return Promise.reject(new Error(message));
            }
        }),
        future: (message = 'Date must be in the future') => ({
            validator: (_, value) => {
                if (!value || value.isAfter(new Date())) {
                    return Promise.resolve();
                }
                return Promise.reject(new Error(message));
            }
        })
    },
    
    // Number validation
    number: {
        min: (min, message = `Value must be at least ${min}`) => ({
            type: 'number',
            min,
            message
        }),
        max: (max, message = `Value must be less than or equal to ${max}`) => ({
            type: 'number',
            max,
            message
        }),
        integer: (message = 'Please enter a whole number') => ({
            pattern: /^-?\d+$/,
            message
        })
    },
    
    // Custom validations
    custom: {
        confirmPassword: (fieldName = 'password', message = 'Passwords do not match') => ({
            validator: (_, value) => {
                const form = Form.useFormInstance();
                if (!value || form.getFieldValue(fieldName) === value) {
                    return Promise.resolve();
                }
                return Promise.reject(new Error(message));
            }
        }),
        
        unique: async (checkFunction, message = 'This value is already taken') => ({
            validator: async (_, value) => {
                if (!value) return Promise.resolve();
                const isUnique = await checkFunction(value);
                if (isUnique) {
                    return Promise.resolve();
                }
                return Promise.reject(new Error(message));
            }
        })
    }
};

// Validation hook for forms
export function useFormValidation() {
    const [errors, setErrors] = useState({});
    const [isValid, setIsValid] = useState(false);
    
    const validateField = useCallback((fieldName, value, rules) => {
        const fieldErrors = [];
        
        rules.forEach(rule => {
            if (rule.required && (!value || value.toString().trim() === '')) {
                fieldErrors.push(rule.message || 'This field is required');
            }
            
            if (rule.pattern && value && !rule.pattern.test(value)) {
                fieldErrors.push(rule.message || 'Invalid format');
            }
            
            if (rule.min !== undefined && value && value.length < rule.min) {
                fieldErrors.push(rule.message || `Minimum length is ${rule.min}`);
            }
            
            if (rule.max !== undefined && value && value.length > rule.max) {
                fieldErrors.push(rule.message || `Maximum length is ${rule.max}`);
            }
            
            if (rule.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                fieldErrors.push(rule.message || 'Invalid email format');
            }
            
            if (rule.type === 'number' && value && isNaN(Number(value))) {
                fieldErrors.push(rule.message || 'Must be a number');
            }
        });
        
        return fieldErrors;
    }, []);
    
    const validateForm = useCallback((formData, validationRules) => {
        const newErrors = {};
        let formIsValid = true;
        
        Object.keys(validationRules).forEach(fieldName => {
            const value = formData[fieldName];
            const rules = validationRules[fieldName];
            const fieldErrors = validateField(fieldName, value, rules);
            
            if (fieldErrors.length > 0) {
                newErrors[fieldName] = fieldErrors;
                formIsValid = false;
            }
        });
        
        setErrors(newErrors);
        setIsValid(formIsValid);
        return { isValid: formIsValid, errors: newErrors };
    }, [validateField]);
    
    const clearErrors = useCallback((fieldName) => {
        if (fieldName) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        } else {
            setErrors({});
        }
    }, []);
    
    return {
        errors,
        isValid,
        validateField,
        validateForm,
        clearErrors
    };
}

// Real-time validation component
export function RealTimeValidator({ fieldName, rules, children }) {
    const [fieldErrors, setFieldErrors] = useState([]);
    const form = Form.useFormInstance();
    
    useEffect(() => {
        const fieldValue = form.getFieldValue(fieldName);
        if (fieldValue !== undefined) {
            const errors = [];
            rules.forEach(rule => {
                if (rule.required && (!fieldValue || fieldValue.toString().trim() === '')) {
                    errors.push(rule.message || 'This field is required');
                }
                // Add other validation rules as needed
            });
            setFieldErrors(errors);
        }
    }, [form.getFieldValue(fieldName)]);
    
    return children(fieldErrors);
}

// Validation summary component
export function ValidationSummary({ errors }) {
    if (!errors || Object.keys(errors).length === 0) return null;
    const containerStyle = {
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '16px',
    };
    const titleStyle = { color: '#dc2626', margin: '0 0 8px 0' };
    const listStyle = { margin: 0, paddingLeft: '20px' };
    const itemStyle = { color: '#dc2626', marginBottom: '4px' };

    return React.createElement(
        'div',
        { style: containerStyle },
        React.createElement('h4', { style: titleStyle }, 'Please fix the following errors:'),
        React.createElement(
            'ul',
            { style: listStyle },
            Object.entries(errors).map(([field, fieldErrors]) =>
                React.createElement(
                    'li',
                    { key: field, style: itemStyle },
                    React.createElement('strong', null, `${field}: `),
                    (fieldErrors || []).join(', ')
                )
            )
        )
    );
}