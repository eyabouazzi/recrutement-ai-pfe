import { Button, Input, Tabs, Table, Tag, Space, Select } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const jobs = [
  { key: '1', title: 'Account Executive', location: 'London, UK', dept: 'Sales', status: 'Published', applied: 18, stage: 'Assessment' },
  { key: '2', title: 'Customer Service Representative', location: 'Remote', dept: 'Support', status: 'Draft', applied: 5, stage: 'Phone Screen' },
];

const columns = [
  { title: 'Job', dataIndex: 'title', key: 'title', render: (text) => <a>{text}</a> },
  { title: 'Location', dataIndex: 'location', key: 'location' },
  { title: 'Department', dataIndex: 'dept', key: 'dept' },
  { title: 'Applied', dataIndex: 'applied', key: 'applied' },
  { title: 'Stage', dataIndex: 'stage', key: 'stage' },
  { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'Published' ? 'green' : 'default'}>{s}</Tag> },
];

export default function Jobs() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Input prefix={<SearchOutlined />} placeholder="Search jobs..." style={{ maxWidth: 360 }} />
        <Space>
          <Select defaultValue="all" style={{ width: 160 }} options={[{ value: 'all', label: 'All departments' }]} />
          <Select defaultValue="all" style={{ width: 160 }} options={[{ value: 'all', label: 'All locations' }]} />
        </Space>
        <div style={{ marginLeft: 'auto' }}>
          <Link to="/jobs/new">
            <Button type="primary" icon={<PlusOutlined />}>Create new job</Button>
          </Link>
        </div>
      </div>
      <Tabs
        items={[
          { key: 'jobs', label: 'Jobs', children: <Table columns={columns} dataSource={jobs} pagination={false} /> },
          { key: 'hiring', label: 'Hiring plan', children: <div>Hiring plan content...</div> },
        ]}
      />
    </div>
  );
}
