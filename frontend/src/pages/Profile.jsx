import React, { useState, useEffect, useContext } from 'react';
import { Card, Form, Input, Button, Row, Col, Avatar, Modal, Upload, message, Typography, Divider, Tag } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, EditOutlined, LockOutlined, UploadOutlined, SaveOutlined, CalendarOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { AuthContext } from '../contexts/authContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Profile = () => {
    const { user, refreshUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [avatarModalVisible, setAvatarModalVisible] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);

    useEffect(() => {
        if (user) {
            profileForm.setFieldsValue({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                dob: user.dob || '',
                address: user.address || '',
                city: user.city || '',
                state: user.state || '',
                zip: user.zip || '',
                country: user.country || '',
                bio: user.bio || ''
            });
        }
    }, [user, profileForm]);

    const handleProfileUpdate = async (values) => {
        setLoading(true);
        try {
            // In a real app, you'd call your API here
            // await updateUserProfile(values);
            // await refreshUser();
            message.success('Profile updated successfully!');
        } catch (error) {
            message.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (values) => {
        setLoading(true);
        try {
            // In a real app, you'd call your API here
            // await changePassword(values);
            passwordForm.resetFields();
            message.success('Password changed successfully!');
        } catch (error) {
            message.error('Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (file) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('You can only upload JPG/PNG file!');
            return false;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must smaller than 2MB!');
            return false;
        }

        setAvatarLoading(true);
        try {
            // Simulate upload - in real app, you'd send to your backend
            await new Promise(resolve => setTimeout(resolve, 1500));
            message.success('Avatar updated successfully!');
            setAvatarModalVisible(false);
        } catch (error) {
            message.error('Failed to upload avatar');
        } finally {
            setAvatarLoading(false);
        }
        return false; // Prevent default upload behavior
    };

    const uploadProps = {
        beforeUpload: handleAvatarUpload,
        showUploadList: false,
        accept: '.jpg,.jpeg,.png'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6"
        >
            <Title level={2} className="mb-6">Profile Settings</Title>
            
            <Row gutter={[24, 24]}>
                {/* Profile Information Card */}
                <Col xs={24} lg={16}>
                    <Card 
                        title={<span><UserOutlined className="mr-2" />Personal Information</span>}
                        className="shadow-sm"
                    >
                        <Form
                            form={profileForm}
                            layout="vertical"
                            onFinish={handleProfileUpdate}
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="firstName"
                                        label="First Name"
                                        rules={[{ required: true, message: 'Please enter your first name' }]}
                                    >
                                        <Input placeholder="Enter your first name" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="lastName"
                                        label="Last Name"
                                        rules={[{ required: true, message: 'Please enter your last name' }]}
                                    >
                                        <Input placeholder="Enter your last name" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            
                            <Form.Item
                                name="email"
                                label="Email Address"
                                rules={[
                                    { required: true, message: 'Please enter your email' },
                                    { type: 'email', message: 'Please enter a valid email' }
                                ]}
                            >
                                <Input placeholder="Enter your email address" disabled />
                                <Text type="secondary" className="mt-1">Email cannot be changed</Text>
                            </Form.Item>
                            
                            <Form.Item
                                name="phone"
                                label="Phone Number"
                            >
                                <Input placeholder="Enter your phone number" />
                            </Form.Item>
                            
                            <Form.Item
                                name="dob"
                                label="Date of Birth"
                            >
                                <Input placeholder="YYYY-MM-DD" />
                            </Form.Item>
                            
                            <Form.Item
                                name="address"
                                label="Address"
                            >
                                <Input placeholder="Enter your address" />
                            </Form.Item>
                            
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="city"
                                        label="City"
                                    >
                                        <Input placeholder="Enter your city" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="state"
                                        label="State/Province"
                                    >
                                        <Input placeholder="Enter your state" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="zip"
                                        label="ZIP/Postal Code"
                                    >
                                        <Input placeholder="Enter ZIP code" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="country"
                                        label="Country"
                                    >
                                        <Input placeholder="Enter your country" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            
                            <Form.Item
                                name="bio"
                                label="Bio"
                            >
                                <Input.TextArea 
                                    placeholder="Tell us about yourself..." 
                                    rows={4}
                                    maxLength={500}
                                    showCount
                                />
                            </Form.Item>
                            
                            <Form.Item>
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    loading={loading}
                                    icon={<SaveOutlined />}
                                >
                                    Save Changes
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                {/* Avatar and Password Card */}
                <Col xs={24} lg={8}>
                    {/* Avatar Card */}
                    <Card className="mb-6 shadow-sm text-center">
                        <div className="mb-4">
                            <Avatar 
                                size={120} 
                                icon={<UserOutlined />}
                                src={user?.avatar ? 'http://localhost:3000/uploads/avatar/' + user.avatar : undefined}
                                className="mb-3"
                            />
                            <br />
                            <Button 
                                type="link" 
                                onClick={() => setAvatarModalVisible(true)}
                                icon={<EditOutlined />}
                            >
                                Change Avatar
                            </Button>
                        </div>
                        <Divider />
                        <div>
                            <Text strong>{user?.firstName} {user?.lastName}</Text>
                            <br />
                            <Text type="secondary">{user?.email}</Text>
                            <br />
                            <Tag color={user?.role === 'ADMIN' ? "geekblue" : "green"} className="mt-2">
                                {user?.role}
                            </Tag>
                            <br />
                            <Text type="secondary" className="mt-2">
                                <CalendarOutlined /> Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </Text>
                        </div>
                    </Card>

                    {/* Password Change Card */}
                    <Card 
                        title={<span><LockOutlined className="mr-2" />Security</span>}
                        className="shadow-sm"
                    >
                        <Form
                            form={passwordForm}
                            layout="vertical"
                            onFinish={handlePasswordChange}
                        >
                            <Form.Item
                                name="currentPassword"
                                label="Current Password"
                                rules={[{ required: true, message: 'Please enter your current password' }]}
                            >
                                <Input.Password placeholder="Enter current password" />
                            </Form.Item>
                            
                            <Form.Item
                                name="newPassword"
                                label="New Password"
                                rules={[
                                    { required: true, message: 'Please enter a new password' },
                                    { min: 6, message: 'Password must be at least 6 characters' }
                                ]}
                            >
                                <Input.Password placeholder="Enter new password" />
                            </Form.Item>
                            
                            <Form.Item
                                name="confirmPassword"
                                label="Confirm New Password"
                                dependencies={['newPassword']}
                                rules={[
                                    { required: true, message: 'Please confirm your new password' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('newPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Passwords do not match'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password placeholder="Confirm new password" />
                            </Form.Item>
                            
                            <Form.Item>
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    loading={loading}
                                    block
                                >
                                    Change Password
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>

            {/* Avatar Upload Modal */}
            <Modal
                title="Upload New Avatar"
                open={avatarModalVisible}
                onCancel={() => setAvatarModalVisible(false)}
                footer={null}
            >
                <div className="text-center p-4">
                    <Upload {...uploadProps}>
                        <Button 
                            icon={<UploadOutlined />} 
                            loading={avatarLoading}
                            size="large"
                        >
                            Select Image
                        </Button>
                    </Upload>
                    <div className="mt-4">
                        <Text type="secondary">
                            Upload a JPG or PNG image (max 2MB)
                        </Text>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
};

export default Profile;