import { Button, Form, Input, Select, Tabs, Space, Radio } from 'antd';

export default function CreateJob() {
  const onFinish = (values) => {
    console.log('Submit job draft:', values);
  };

  const JobDetails = (
    <Form layout="vertical" onFinish={onFinish}>
      <Form.Item label="Job title" name="title" rules={[{ required: true, message: 'Please enter job title' }]}>
        <Input placeholder="e.g. Customer Service Representative" maxLength={80} />
      </Form.Item>
      <Space size={16} style={{ display: 'flex' }}>
        <Form.Item label="Department" name="department" style={{ flex: 1 }}>
          <Select options={[{ value: 'Sales', label: 'Sales' }, { value: 'Support', label: 'Support' }]} />
        </Form.Item>
        <Form.Item label="Job code" name="code" style={{ flex: 1 }}>
          <Input />
        </Form.Item>
      </Space>
      <Form.Item label="Workplace">
        <Radio.Group>
          <Radio value="onsite">On-site</Radio>
          <Radio value="hybrid">Hybrid</Radio>
          <Radio value="remote">Remote</Radio>
        </Radio.Group>
      </Form.Item>
      <Space>
        <Button htmlType="submit">Save draft</Button>
        <Button type="primary">Publish</Button>
      </Space>
    </Form>
  );

  const ApplicationForm = (
    <div>
      <p>Configure the application form fields and requirements.</p>
    </div>
  );

  const FindCandidates = (
    <div>
      <p>Promote job, sourcing channels, and screening configuration.</p>
    </div>
  );

  const TeamMembers = (
    <div>
      <p>Assign hiring managers and collaborators.</p>
    </div>
  );

  const Workflow = (
    <div>
      <p>Define your hiring workflow and stages.</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Create new job</h2>
        <Space>
          <Button>Save draft</Button>
          <Button type="primary">Publish</Button>
        </Space>
      </div>
      <Tabs
        items={[
          { key: 'details', label: 'Job details', children: JobDetails },
          { key: 'application', label: 'Application form', children: ApplicationForm },
          { key: 'find', label: 'Find candidates', children: FindCandidates },
          { key: 'team', label: 'Team members', children: TeamMembers },
          { key: 'workflow', label: 'Workflow', children: Workflow },
        ]}
      />
    </div>
  );
}
