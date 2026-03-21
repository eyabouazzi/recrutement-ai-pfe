import React from 'react';
import { Form, Input, InputNumber, Select, DatePicker, Checkbox, Radio, Switch } from 'antd';
import { VALIDATION_RULES } from '../utils/formValidation';

// Enhanced form item with built-in validation
export function ValidatedFormItem({ 
    name, 
    label, 
    rules = [], 
    type = 'text', 
    required = false,
    placeholder,
    help,
    ...props 
}) {
    // Build validation rules
    const validationRules = [...rules];
    
    if (required) {
        validationRules.unshift(VALIDATION_RULES.required(`${label || name} is required`));
    }
    
    // Add type-specific validations
    switch (type) {
        case 'email':
            validationRules.push(VALIDATION_RULES.email());
            break;
        case 'password':
            validationRules.push(
                VALIDATION_RULES.password.min(6),
                VALIDATION_RULES.password.strength()
            );
            break;
        case 'phone':
            validationRules.push(VALIDATION_RULES.phone());
            break;
        case 'name':
            validationRules.push(
                VALIDATION_RULES.name.min(2),
                VALIDATION_RULES.name.lettersOnly()
            );
            break;
        default:
            break;
    }
    
    // Render appropriate input component
    const renderInput = () => {
        const inputProps = {
            placeholder: placeholder || `Enter ${label || name}`,
            ...props
        };
        
        switch (type) {
            case 'textarea':
                return <Input.TextArea {...inputProps} />;
            case 'password':
                return <Input.Password {...inputProps} />;
            case 'number':
                return <InputNumber style={{ width: '100%' }} {...inputProps} />;
            case 'email':
            case 'text':
            default:
                return <Input {...inputProps} />;
        }
    };
    
    return (
        <Form.Item
            name={name}
            label={label}
            rules={validationRules}
            help={help}
            {...props}
        >
            {renderInput()}
        </Form.Item>
    );
}

// Enhanced select component with validation
export function ValidatedSelect({ 
    name, 
    label, 
    options = [], 
    required = false,
    placeholder,
    mode, // 'multiple' | 'tags'
    ...props 
}) {
    const rules = required ? [VALIDATION_RULES.required(`${label || name} is required`)] : [];
    
    return (
        <Form.Item
            name={name}
            label={label}
            rules={rules}
        >
            <Select
                placeholder={placeholder || `Select ${label || name}`}
                mode={mode}
                {...props}
            >
                {options.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                        {option.label}
                    </Select.Option>
                ))}
            </Select>
        </Form.Item>
    );
}

// Enhanced date picker with validation
export function ValidatedDatePicker({ 
    name, 
    label, 
    required = false,
    placeholder,
    picker = 'date', // 'date' | 'week' | 'month' | 'quarter' | 'year'
    ...props 
}) {
    const rules = required ? [VALIDATION_RULES.required(`${label || name} is required`)] : [];
    
    return (
        <Form.Item
            name={name}
            label={label}
            rules={rules}
        >
            <DatePicker
                placeholder={placeholder || `Select ${label || name}`}
                picker={picker}
                style={{ width: '100%' }}
                {...props}
            />
        </Form.Item>
    );
}

// Enhanced checkbox group with validation
export function ValidatedCheckboxGroup({ 
    name, 
    label, 
    options = [],
    required = false,
    ...props 
}) {
    const rules = required ? [{
        validator: (_, value) => {
            if (!value || value.length === 0) {
                return Promise.reject(new Error(`${label || name} is required`));
            }
            return Promise.resolve();
        }
    }] : [];
    
    return (
        <Form.Item
            name={name}
            label={label}
            rules={rules}
        >
            <Checkbox.Group {...props}>
                {options.map(option => (
                    <Checkbox key={option.value} value={option.value}>
                        {option.label}
                    </Checkbox>
                ))}
            </Checkbox.Group>
        </Form.Item>
    );
}

// Enhanced radio group with validation
export function ValidatedRadioGroup({ 
    name, 
    label, 
    options = [],
    required = false,
    ...props 
}) {
    const rules = required ? [VALIDATION_RULES.required(`${label || name} is required`)] : [];
    
    return (
        <Form.Item
            name={name}
            label={label}
            rules={rules}
        >
            <Radio.Group {...props}>
                {options.map(option => (
                    <Radio key={option.value} value={option.value}>
                        {option.label}
                    </Radio>
                ))}
            </Radio.Group>
        </Form.Item>
    );
}

// Form section with title and description
export function FormSection({ title, description, children, style = {} }) {
    return (
        <div style={{ marginBottom: '32px', ...style }}>
            {title && (
                <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    marginBottom: '8px',
                    color: '#334155'
                }}>
                    {title}
                </h3>
            )}
            {description && (
                <p style={{ 
                    color: '#64748b', 
                    marginBottom: '24px',
                    fontSize: '14px'
                }}>
                    {description}
                </p>
            )}
            {children}
        </div>
    );
}

// Submit button with validation state
export function ValidatedSubmitButton({ 
    form, 
    children, 
    loading = false,
    ...props 
}) {
    const [hasErrors, setHasErrors] = React.useState(false);
    
    React.useEffect(() => {
        const subscription = form.watch(() => {
            form.validateFields({ validateOnly: true })
                .then(() => setHasErrors(false))
                .catch(() => setHasErrors(true));
        });
        
        return () => subscription.unsubscribe();
    }, [form]);
    
    return (
        <button
            type="submit"
            disabled={hasErrors || loading}
            style={{
                backgroundColor: hasErrors || loading ? '#cbd5e1' : '#2563eb',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: hasErrors || loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                ...props.style
            }}
            {...props}
        >
            {loading ? 'Submitting...' : children}
        </button>
    );
}