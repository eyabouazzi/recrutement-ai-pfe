import React, { useEffect, useState } from 'react'
import { Divider, Form, Input, Button, Select, DatePicker, message, Avatar, Upload } from 'antd'
import dayjs from 'dayjs';
import { useParams, useNavigate } from 'react-router-dom';
import { UserOutlined, CameraOutlined } from '@ant-design/icons';
import { uploadFile } from '../api/files';
import { updateUser, getUser } from '../api/users';
import { getAvatarUrl } from '../utils/avatar.js';
const EditUser = () => {
    const [form] = Form.useForm();
    const [avatar, setAvatar] = useState(null);
    const [AvatarFile, setAvatarFile] = useState(null);
    const [previewAvatar, setPreviewAvatar] = useState(null);

    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        async function getById() {
            try {
                const data = await getUser(id);
                form.setFieldsValue({
                    ...data.user,
                    ...(data.user.dob && { dob: dayjs(data.user.dob) })
                })
                setAvatar(data.user.avatar);
            } catch (error) {
                message.error(error.message || 'Error fetching user');
            }
        }
        if (id) {
            getById();
        }
    }, [id, form]);

    const beforeUpload = (file) => {
        setAvatarFile(file);
        setPreviewAvatar(URL.createObjectURL(file));
        return false;
    }

    async function onFinish(values) {
        try {
            let avatarFilename = avatar;
            if (AvatarFile) {
                const uploadRes = await uploadFile(AvatarFile);
                avatarFilename = uploadRes.file.fileName;
            }

            const data = await updateUser(id, values, avatarFilename);
            message.success(data.message);
            navigate('/user/list');
        } catch (error) {
            message.error(error.message || 'Error updating user');
        }
    }

    return (
        <div>
            <h4>Edit User</h4>
            <Divider />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: '20px' }}>
                <Avatar size={80} src={previewAvatar || getAvatarUrl(avatar) || undefined}
                    icon={!previewAvatar && !avatar && <UserOutlined />} />

                <Upload beforeUpload={beforeUpload} showUploadList={false} accept="image/*">
                    <Button icon={<CameraOutlined />}>
                        {previewAvatar ? "Change Picture" : "Upload Picture"}
                    </Button>
                </Upload>
            </div>
            <Form
                form={form}
                onFinish={onFinish}
                layout="vertical"
            >
                <Form.Item
                    label='FirstName'
                    name='firstName'
                    rules={[{ required: true, message: 'Please enter your first name' }]}>
                    <Input />
                </Form.Item>
                <Form.Item
                    label='LastName'
                    name='lastName'
                    rules={[{ required: true, message: 'Please enter your last name' }]}>
                    <Input />
                </Form.Item>
                <Form.Item
                    label='Email'
                    name='email'
                    rules={[{ required: true, message: 'Please enter your email' }]}>
                    <Input />
                </Form.Item>

                <Form.Item
                    label='Password'
                    name='password'
                    rules={[{ required: false, message: 'Password is required' }]}>
                    <Input.Password placeholder="Leave blank to keep current password" />
                </Form.Item>

                <Form.Item
                    label='ConfirmPassword'
                    name='confirmPassword'
                    rules={[
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('The two passwords that you entered do not match!'));
                            },
                        }),
                    ]}>
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    label='Date of birth'
                    name='dob'
                    rules={[{ required: true, message: 'Date of birth is required' }]}>
                    <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                    label='Account type'
                    name='role'
                    rules={[{ required: true, message: 'Role is required' }]}>
                    <Select placeholder="Select a role">
                        <Select.Option value="admin">Admin</Select.Option>
                        <Select.Option value="user">User</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item>
                    <Button type='primary' htmlType='submit'>
                        Edit User
                    </Button>
                </Form.Item>
            </Form>
        </div>
    )
}

export default EditUser;
