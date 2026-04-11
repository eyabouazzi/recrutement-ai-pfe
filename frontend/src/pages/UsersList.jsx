import { useState, useEffect } from 'react'
import { Table, Divider, Space, Button, Tag, message, Avatar } from 'antd';
import { useNavigate } from 'react-router-dom';
import EditUserDrawer from '../Components/EditUserDrawer';
import { UserOutlined } from '@ant-design/icons';
import { listUsers } from '../api/users';
import { getAvatarUrl } from '../utils/avatar.js';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [refetch, setRefetch] = useState(false);
  const navigate = useNavigate();

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (avatar) => (
        <Avatar
          src={getAvatarUrl(avatar) || undefined}
          icon={!avatar && <UserOutlined />}
        />
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (dateString) => {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
      },
    },
    {
      title: 'FirstName',
      dataIndex: 'firstName',
      key: 'firstName',
    },
    {
      title: 'LastName',
      dataIndex: 'lastName',
      key: 'lastName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Account Type',
      dataIndex: 'role',
      key: 'role',
      render: (text) => text ? <Tag color={text.toLowerCase() === 'admin' ? 'geekblue' : 'green'}>{text.toUpperCase()}</Tag> : <Tag>N/A</Tag>,
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button type='link' size='small' onClick={() => navigate(`/user/edit/${record._id}`)}>Edit</Button>
          <EditUserDrawer userDetails={record} refetch={refetch} setRefetch={setRefetch} />
        </Space>
      ),
    },
  ]

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await listUsers();
        setUsers(data.users || []);
      } catch (error) {
        message.error(error.message || 'Error fetching users');
      }
    }
    fetchData();
  }, [refetch]);

  return (
    <div>
      <h4>Users List</h4>
      <Divider />
      <Table columns={columns} dataSource={users} rowKey="_id" scroll={{ x: 'max-content' }} />
    </div>
  )
}

export default UsersList
