import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Row, Col } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { resetPassword } from '../api/auth';

const { Title, Text } = Typography;

const ResetPassword = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [resetComplete, setResetComplete] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Get token from URL params
    const token = searchParams.get('token');

    const onFinish = async (values) => {
        if (!token) {
            message.error('Invalid or missing reset token');
            return;
        }

        setLoading(true);
        try {
            const data = await resetPassword({
                token,
                newPassword: values.newPassword,
                confirmPassword: values.confirmPassword
            });
            
            if (data.status) {
                message.success('Password reset successfully!');
                setResetComplete(true);
                setTimeout(() => navigate('/login'), 3000);
            } else {
                message.error(data.message || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            message.error(error.message || 'Error resetting password');
        } finally {
            setLoading(false);
        }
    };

    if (resetComplete) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
            >
                <Card className="w-full max-w-md shadow-xl">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircleOutlined className="text-2xl text-green-600" />
                        </div>
                        <Title level={3} className="mb-4">Password Reset Successful!</Title>
                        <Text className="text-gray-600 mb-6 block">
                            Your password has been successfully reset. You can now log in with your new password.
                        </Text>
                        <Text className="text-gray-500">
                            Redirecting to login page...
                        </Text>
                    </div>
                </Card>
            </motion.div>
        );
    }

    if (!token) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
            >
                <Card className="w-full max-w-md shadow-xl">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <Title level={3} className="mb-4">Invalid Reset Link</Title>
                        <Text className="text-gray-600 mb-6 block">
                            The password reset link is invalid or has expired. Please request a new password reset.
                        </Text>
                        <Button 
                            type="primary" 
                            size="large"
                            onClick={() => navigate('/forgot-password')}
                        >
                            Request New Reset
                        </Button>
                    </div>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
        >
            <Card className="w-full max-w-md shadow-xl">
                <div className="text-center mb-8">
                    <Title level={2} className="mb-2">Set New Password</Title>
                    <Text type="secondary">
                        Create a new password for your account
                    </Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[
                            { required: true, message: 'Please input your new password!' },
                            { min: 6, message: 'Password must be at least 6 characters!' }
                        ]}
                    >
                        <Input.Password 
                            prefix={<LockOutlined />} 
                            placeholder="New Password" 
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="Confirm New Password"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Please confirm your new password!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('The two passwords do not match!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password 
                            prefix={<LockOutlined />} 
                            placeholder="Confirm New Password" 
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading}
                            size="large" 
                            block
                        >
                            Reset Password
                        </Button>
                    </Form.Item>
                </Form>

                <div className="text-center mt-6">
                    <Link to="/login" className="text-blue-600 hover:text-blue-800">
                        Back to Login
                    </Link>
                </div>
            </Card>
        </motion.div>
    );
};

export default ResetPassword;