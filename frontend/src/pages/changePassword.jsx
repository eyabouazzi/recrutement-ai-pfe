import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Divider } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api/auth';

const ChangePassword = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const data = await changePassword({
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
                confirmPassword: values.confirmPassword
            });

            if (data.status) {
                message.success('Password changed successfully!');
                form.resetFields();
                setTimeout(() => navigate('/profile'), 1500);
            } else {
                message.error(data.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Password change error:', error);
            const errorMsg = error.message || 'Error connecting to server';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}>
            <Card title="Change Password">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        label="Current Password"
                        name="oldPassword"
                        rules={[{ required: true, message: 'Please input your current password!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Current Password" />
                    </Form.Item>

                    <Divider />

                    <Form.Item
                        label="New Password"
                        name="newPassword"
                        rules={[
                            { required: true, message: 'Please input your new password!' },
                            { min: 8, message: 'Password must be at least 8 characters!' }
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
                    </Form.Item>

                    <Form.Item
                        label="Confirm New Password"
                        name="confirmPassword"
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
                        <Input.Password prefix={<LockOutlined />} placeholder="Confirm New Password" />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Change Password
                            </Button>
                            <Button onClick={() => navigate('/profile')}>
                                Cancel
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default ChangePassword;
