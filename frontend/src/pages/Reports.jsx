import { Card, Col, Row, Statistic } from 'antd';

export default function Reports() {
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card><Statistic title="Open jobs" value={12} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><Statistic title="Active candidates" value={42} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><Statistic title="Average score" value={76} suffix="/ 100" /></Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="Recent activity">
            <ul>
              <li>New application for Account Executive</li>
              <li>CSR test published</li>
              <li>3 candidates moved to Assessment</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
