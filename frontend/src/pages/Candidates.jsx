import { Input, Table, Tag, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const data = [
  { key: '1', name: 'Alex Johnson', job: 'Account Executive', status: 'In Review', score: 82 },
  { key: '2', name: 'Sofia Martinez', job: 'CSR', status: 'Phone Screen', score: 74 },
];

const columns = [
  { title: 'Candidate', dataIndex: 'name', key: 'name' },
  { title: 'Job', dataIndex: 'job', key: 'job' },
  { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color="blue">{s}</Tag> },
  { title: 'Score', dataIndex: 'score', key: 'score' },
];

export default function Candidates() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Input prefix={<SearchOutlined />} placeholder="Search candidates..." style={{ maxWidth: 360 }} />
        <Space>
          <Select defaultValue="all" style={{ width: 160 }} options={[{ value: 'all', label: 'All jobs' }]} />
          <Select defaultValue="all" style={{ width: 160 }} options={[{ value: 'all', label: 'All statuses' }]} />
        </Space>
      </div>
      <Table columns={columns} dataSource={data} pagination={false} />
    </div>
  );
}
