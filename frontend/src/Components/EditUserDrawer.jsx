import { useState, useEffect } from 'react'
import { Drawer, Button, Form, Input, Select, DatePicker, Space, message, Avatar, Upload } from 'antd';
import dayjs from 'dayjs';
import { uploadFile } from '../api/files';
import { updateUser } from '../api/users';
import { CameraOutlined, UserOutlined } from '@ant-design/icons';

const EditUserDrawer = (props) => {
    const [form] = Form.useForm();
    const [open, setOpen] = useState(false);
    const { userDetails, refetch, setRefetch } = props;
    const [avatar, setAvatar] = useState(null);
    const [AvatarFile, setAvatarFile] = useState(null);
    const [previewAvatar, setPreviewAvatar] = useState(null);


    const showDrawer = () => {
        setOpen(true);
    };



    const onClose = () => {
        setOpen(false);
    };

    useEffect(() => {
        if (userDetails) {
            form.setFieldsValue({
                ...userDetails,

                ...(userDetails.dob && { dob: dayjs(userDetails.dob) })

            });
            setAvatar(userDetails.avatar);
        }
    }, [userDetails, form]);

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

            const data = await updateUser(userDetails._id, values, avatarFilename);
            message.success(data.message);
            onClose();
            setRefetch(!refetch);

        } catch (error) {
            message.error(error.message || 'Error updating user');
        }
    }
    return (
        <div>
            <Button type="primary" size="small" onClick={showDrawer}>
                Edit
            </Button>
            <Drawer
                title="Edit User"
                placement="right"
                onClose={onClose}
                open={open}
                width={400}
            >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: '20px' }}>
                    <Avatar size={80} src={previewAvatar || avatar && `http://localhost:3000/uploads/${avatar}` || undefined}
                        icon={!previewAvatar && !avatar && <UserOutlined style={{ fontSize: '40px' }} />} />

                    <Upload beforeUpload={beforeUpload} showUploadList={false} accept="image/*">
                        <Button icon={<CameraOutlined />}>
                            {previewAvatar ? "Change Picture" : "Upload Picture"}
                        </Button>
                    </Upload>
                </div>
                <Form onFinish={onFinish} layout="vertical" form={form}>
                    <Form.Item
                        label="First Name"
                        name="firstName"
                        rules={[{ required: true, message: 'Please enter first name' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Last Name"
                        name="lastName"
                        rules={[{ required: true, message: 'Please enter last name' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ required: true, message: 'Please enter email' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Date of Birth"
                        name="dob"
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="Account Type"
                        name="role"
                    >
                        <Select placeholder="Select a role">
                            <Select.Option value="admin">Admin</Select.Option>
                            <Select.Option value="user">User</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button onClick={onClose}>Cancel</Button>
                            <Button type="primary" htmlType="submit">
                                Submit
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    )
}

export default EditUserDrawer
