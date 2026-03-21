import { useState, useEffect } from "react";
import { Table, Divider, Card, Row, Col, Tag, Space, Button, DatePicker, Select, Input, Typography, Statistic } from "antd";
import { listLogs, getLogStatistics } from "../api/logs";
import { ReloadOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const LogsList = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 20,
        action: undefined,
        severity: undefined,
        dateRange: null
    });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = { ...filters };
            if (params.dateRange) {
                params.startDate = params.dateRange[0].toISOString();
                params.endDate = params.dateRange[1].toISOString();
                delete params.dateRange;
            }
            const data = await listLogs(params);
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await getLogStatistics();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1 // Reset to first page when filters change
        }));
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'ERROR': return 'red';
            case 'WARNING': return 'orange';
            case 'INFO': return 'blue';
            default: return 'default';
        }
    };

    const getActionColor = (action) => {
        if (action.includes('LOGIN') || action.includes('CREATED')) return 'green';
        if (action.includes('UPDATED') || action.includes('CHANGED')) return 'blue';
        if (action.includes('DELETED') || action.includes('ERROR')) return 'red';
        return 'default';
    };

    const columns = [
        {
            title: 'Timestamp',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text) => new Date(text).toLocaleString(),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            width: 180
        },
        {
            title: "Action",
            dataIndex: "action",
            key: "action",
            render: (action) => (
                <Tag color={getActionColor(action)}>{action.replace(/_/g, ' ')}</Tag>
            ),
            filters: [
                { text: 'Login', value: 'USER_LOGIN' },
                { text: 'Logout', value: 'USER_LOGOUT' },
                { text: 'Created', value: 'USER_CREATED' },
                { text: 'Updated', value: 'USER_UPDATED' },
                { text: 'Password Changed', value: 'PASSWORD_CHANGED' }
            ],
            onFilter: (value, record) => record.action === value
        },
        {
            title: "User",
            dataIndex: "actorEmail",
            key: "actorEmail",
            render: (email, record) => (
                <div>
                    <div><strong>{email}</strong></div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.actorRole}
                    </Text>
                </div>
            )
        },
        {
            title: "Severity",
            dataIndex: "severity",
            key: "severity",
            render: (severity) => (
                <Tag color={getSeverityColor(severity)}>{severity}</Tag>
            ),
            filters: [
                { text: 'Info', value: 'INFO' },
                { text: 'Warning', value: 'WARNING' },
                { text: 'Error', value: 'ERROR' }
            ],
            onFilter: (value, record) => record.severity === value
        },
        {
            title: "IP Address",
            dataIndex: "ipAddress",
            key: "ipAddress",
            width: 150
        },
        {
            title: "Details",
            dataIndex: "details",
            key: "details",
            render: (details) => details ? JSON.stringify(details).substring(0, 100) + '...' : '-'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
        >
            <Title level={2} className="mb-6">Activity Logs & Audit Trail</Title>

            {/* Statistics Cards */}
            {stats && (
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic 
                                title="Total Activities" 
                                value={stats.recentActivity?.length || 0} 
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic 
                                title="Unique Actions" 
                                value={stats.stats?.length || 0} 
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic 
                                title="Error Logs" 
                                value={stats.severityStats?.find(s => s._id === 'ERROR')?.count || 0}
                                valueStyle={{ color: '#ff4d4f' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic 
                                title="Recent Activity" 
                                value={stats.recentActivity?.slice(0, 5).length || 0}
                                suffix="/ 5"
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Filters */}
            <Card className="mb-6">
                <Space wrap>
                    <RangePicker 
                        onChange={(dates) => handleFilterChange('dateRange', dates)}
                        placeholder={['Start Date', 'End Date']}
                    />
                    <Select
                        placeholder="Filter by Action"
                        style={{ width: 200 }}
                        allowClear
                        onChange={(value) => handleFilterChange('action', value)}
                    >
                        <Option value="USER_LOGIN">User Login</Option>
                        <Option value="USER_LOGOUT">User Logout</Option>
                        <Option value="USER_CREATED">User Created</Option>
                        <Option value="PASSWORD_CHANGED">Password Changed</Option>
                        <Option value="TEST_CREATED">Test Created</Option>
                        <Option value="SUBMISSION_SUBMITTED">Test Submitted</Option>
                    </Select>
                    <Select
                        placeholder="Filter by Severity"
                        style={{ width: 150 }}
                        allowClear
                        onChange={(value) => handleFilterChange('severity', value)}
                    >
                        <Option value="INFO">Info</Option>
                        <Option value="WARNING">Warning</Option>
                        <Option value="ERROR">Error</Option>
                    </Select>
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={fetchLogs}
                    >
                        Refresh
                    </Button>
                </Space>
            </Card>

            {/* Logs Table */}
            <Card>
                <Table 
                    columns={columns} 
                    dataSource={logs} 
                    rowKey="_id" 
                    loading={loading}
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: filters.page,
                        pageSize: filters.limit,
                        onChange: (page, pageSize) => {
                            setFilters(prev => ({ ...prev, page, limit: pageSize }));
                        }
                    }}
                />
            </Card>
        </motion.div>
    );
};

export default LogsList;