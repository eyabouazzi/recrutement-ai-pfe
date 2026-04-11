import React, { useState } from 'react';
import { Divider, Form, Input, Button, message, Upload, Avatar, Card, Row, Col, Typography } from 'antd';
import { UserOutlined, CameraOutlined } from '@ant-design/icons';
import { uploadFile } from '../api/files';
import { createUser } from '../api/users';
import {
  ValidatedFormItem,
  ValidatedSelect,
  ValidatedDatePicker,
  FormSection,
  ValidatedSubmitButton,
} from '../Components/FormComponents';
import { VALIDATION_RULES } from '../utils/formValidation';
import { handlePromise, showSuccess, showWarning } from '../utils/errorHandler';

const { Title } = Typography;

const AddUser = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [AvatarFile, setAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);

  const roles = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Administrator' },
  ];

  const beforeUpload = (file) => {
    setAvatarFile(file);
    setPreviewAvatar(URL.createObjectURL(file));
    return false;
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let avatarFilename = null;
      if (AvatarFile) {
        const uploadRes = await uploadFile(AvatarFile);
        avatarFilename = uploadRes.file.fileName;
      }

      await handlePromise(
        createUser(values, avatarFilename),
        'User Creation',
        (result) => {
          showSuccess(result?.message || 'User created successfully!');
          form.resetFields();
          setAvatarFile(null);
          setPreviewAvatar(null);
        },
        (error, errorMessage) => {
          showWarning(errorMessage);
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const validateConfirmPassword = ({ getFieldValue }) => ({
    validator(_, value) {
      if (!value || getFieldValue('password') === value) return Promise.resolve();
      return Promise.reject(new Error('Passwords do not match'));
    },
  });

  return (
    <Card style={{ maxWidth: 880, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 18 }}>
        Create New User
      </Title>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <Avatar size={80} src={previewAvatar || undefined} icon={!previewAvatar && <UserOutlined />} />

        <Upload beforeUpload={beforeUpload} showUploadList={false} accept="image/*">
          <Button icon={<CameraOutlined />}>{previewAvatar ? 'Change Picture' : 'Upload Picture'}</Button>
        </Upload>
      </div>

      <Divider />

      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
        <FormSection title="Personal Information" description="Basic information about the user">
          <Row gutter={16}>
            <Col span={12}>
              <ValidatedFormItem name="firstName" label="First Name" type="name" required />
            </Col>
            <Col span={12}>
              <ValidatedFormItem name="lastName" label="Last Name" type="name" required />
            </Col>
          </Row>

          <ValidatedFormItem name="email" label="Email Address" type="email" required />
          <ValidatedDatePicker name="dob" label="Date of Birth" required />
        </FormSection>

        <FormSection title="Account Settings" description="Configure user account and permissions">
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
                rules={[VALIDATION_RULES.password.min(8), VALIDATION_RULES.password.strength()]}
              />
            </Col>
            <Col span={12}>
              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={['password']}
                rules={[VALIDATION_RULES.required('Please confirm your password'), validateConfirmPassword]}
              >
                <Input.Password placeholder="Confirm password" />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
          <Button
            type="default"
            onClick={() => {
              form.resetFields();
              setAvatarFile(null);
              setPreviewAvatar(null);
            }}
            style={{ marginRight: 12 }}
            disabled={loading}
          >
            Reset
          </Button>
          <ValidatedSubmitButton form={form} loading={loading}>
            Create User
          </ValidatedSubmitButton>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddUser;
