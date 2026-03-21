import React, { useState } from 'react'
import { Divider, Form, Input, Button, Select, DatePicker, message, Upload, Avatar } from 'antd'
import { UserOutlined, CameraOutlined } from '@ant-design/icons';
import { uploadFile } from '../api/files';
import { createUser } from '../api/users';
const AddUser = () => {
  const [AvatarFile, setAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const beforeUpload = (file) => {
    setAvatarFile(file);
    setPreviewAvatar(URL.createObjectURL(file));
    return false;
  }

  async function onFinish(values) {
    try {
      //upload file
      let avatarFilename = null;
      if (AvatarFile) {

        const uploadRes = await uploadFile(AvatarFile);
        avatarFilename = uploadRes.file.fileName;
      }
      const data = await createUser(values, avatarFilename);
      message.success(data.message);
    } catch (error) {
      message.error(error.message || "somthing went wrong ");
    }
  }

  return (
    <div>
      <h4>Create User</h4>
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: '20px' }}>
        <Avatar size={80} src={previewAvatar || undefined}
          icon={!previewAvatar && <UserOutlined />} />

        <Upload beforeUpload={beforeUpload} showUploadList={false} accept="image/*">
          <Button icon={<CameraOutlined />}>
            {previewAvatar ? "Change Picture" : "Upload Picture"}
          </Button>
        </Upload>
      </div>
      <Form onFinish={onFinish}
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
          rules={[{ required: true, message: 'Password is required' }]}>
          <Input.Password />
        </Form.Item>


        <Form.Item
          label='ConfirmPassword'
          name='confirmPassword'
          rules={[{ required: true, message: 'Confirme Password is required' }]}>
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
            Create User
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default AddUser
