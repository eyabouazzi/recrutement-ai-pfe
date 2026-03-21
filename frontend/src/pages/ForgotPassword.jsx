import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Row, Col } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { forgotPassword } from '../api/auth';

const { Title, Text } = Typography;

const ForgotPassword = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const data = await forgotPassword(values);
            
            if (data.status) {
                message.success(data.message || 'Password reset instructions sent to your email');
                setSubmitted(true);
            } else {
                message.error(data.message || 'Failed to process request');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            message.error(error.message || 'Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
            >
                <Card className="w-full max-w-md shadow-xl">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <Title level={3} className="mb-4">Check Your Email</Title>
                        <Text className="text-gray-600 mb-6 block">
                            We've sent password reset instructions to your email address. 
                            Please check your inbox and follow the link to reset your password.
                        </Text>
                        <Button 
                            type="primary" 
                            size="large" 
                            block
                            onClick={() => navigate('/login')}
                        >
                            Back to Login
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
                    <Title level={2} className="mb-2">Reset Password</Title>
                    <Text type="secondary">
                        Enter your email address and we'll send you instructions to reset your password
                    </Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your email!' },
                            { type: 'email', message: 'Please enter a valid email!' }
                        ]}
                    >
                        <Input 
                            prefix={<MailOutlined />} 
                            placeholder="Email Address" 
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
                            Send Reset Instructions
                        </Button>
                    </Form.Item>
                </Form>

                <div className="text-center mt-6">
                    <Link to="/login" className="text-blue-600 hover:text-blue-800 flex items-center justify-center">
                        <ArrowLeftOutlined className="mr-2" />
                        Back to Login
                    </Link>
                </div>
            </Card>
        </motion.div>
    );
};

export default ForgotPassword;