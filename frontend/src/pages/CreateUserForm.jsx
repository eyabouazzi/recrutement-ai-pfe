import React from 'react';
import { Form, Card, Row, Col, Button, Typography } from 'antd';
import { 
    ValidatedFormItem, 
    ValidatedSelect, 
    ValidatedDatePicker,
    FormSection,
    ValidatedSubmitButton
} from '../Components/FormComponents';
import { VALIDATION_RULES } from '../utils/formValidation';
import { handlePromise, showSuccess, showWarning } from '../utils/errorHandler';
import { createUser } from '../api/users';

const { Title } = Typography;

const CreateUserForm = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = React.useState(false);

    const roles = [
        { value: 'candidat', label: 'Candidate' },
        { value: 'HR', label: 'HR Manager' },
        { value: 'admin', label: 'Administrator' }
    ];

    const handleSubmit = async (values) => {
        setLoading(true);
        
        try {
            await handlePromise(
                createUser(values),
                'User Creation',
                (result) => {
                    showSuccess('User created successfully!');
                    form.resetFields();
                },
                (error, message) => {
                    showWarning(message);
                }
            );
        } finally {
            setLoading(false);
        }
    };

    const validateConfirmPassword = ({ getFieldValue }) => ({
        validator(_, value) {
            if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
            }
            return Promise.reject(new Error('Passwords do not match'));
        }
    });

    return (
        <Card style={{ maxWidth: 800, margin: '0 auto' }}>
            <Title level={3} style={{ marginBottom: '24px' }}>Create New User</Title>
            
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
            >
                <FormSection 
                    title="Personal Information"
                    description="Basic information about the user"
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <ValidatedFormItem
                                name="firstName"
                                label="First Name"
                                type="name"
                                required
                            />
                        </Col>
                        <Col span={12}>
                            <ValidatedFormItem
                                name="lastName"
                                label="Last Name"
                                type="name"
                                required
                            />
                        </Col>
                    </Row>
                    
                    <ValidatedFormItem
                        name="email"
                        label="Email Address"
                        type="email"
                        required
                    />
                    
                    <ValidatedDatePicker
                        name="dob"
                        label="Date of Birth"
                        required
                    />
                </FormSection>

                <FormSection 
                    title="Account Settings"
                    description="Configure user account and permissions"
                >
                    <ValidatedSelect
                        name="role"
                        label="Role"
                        options={roles}
                        required
                        placeholder="Select user role"
                    />
                    
                    <Row gutter={16}>
                        <Col span={12}>
                            <ValidatedFormItem
                                name="password"
                                label="Password"
                                type="password"
                                required
                                rules={[
                                    VALIDATION_RULES.password.min(8),
                                    VALIDATION_RULES.password.strength()
                                ]}
                            />
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="confirmPassword"
                                label="Confirm Password"
                                dependencies={['password']}
                                rules={[
                                    VALIDATION_RULES.required('Please confirm your password'),
                                    validateConfirmPassword
                                ]}
                            >
                                <Input.Password placeholder="Confirm password" />
                            </Form.Item>
                        </Col>
                    </Row>
                </FormSection>

                <FormSection 
                    title="Contact Information"
                    description="Additional contact details (optional)"
                >
                    <ValidatedFormItem
                        name="phone"
                        label="Phone Number"
                        type="phone"
                    />
                    
                    <ValidatedFormItem
                        name="address"
                        label="Address"
                        type="textarea"
                        placeholder="Enter full address"
                    />
                </FormSection>

                <Form.Item style={{ textAlign: 'right', marginTop: '32px' }}>
                    <Button 
                        type="default" 
                        onClick={() => form.resetFields()}
                        style={{ marginRight: '12px' }}
                    >
                        Reset
                    </Button>
                    <ValidatedSubmitButton 
                        form={form}
                        loading={loading}
                    >
                        Create User
                    </ValidatedSubmitButton>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default CreateUserForm;