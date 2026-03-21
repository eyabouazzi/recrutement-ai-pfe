import { useEffect, useState } from 'react';
import { Table, Typography, Tag, Space, Button, Spin, message, Modal, Card, Row, Col, Statistic, Progress, List, Avatar, Tabs, Divider } from 'antd';
import { fetchMySubmissions, fetchSubmissionDetails } from '../../api/submissions';
import { EyeOutlined, TrophyOutlined, FireOutlined, BarChartOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, UserOutlined, BookOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

function CandidateResults() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [stats, setStats] = useState({
        totalTests: 0,
        avgScore: 0,
        bestScore: 0,
        passedTests: 0,
        failedTests: 0
    });

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        try {
            setLoading(true);
            const data = await fetchMySubmissions();
            const userSubmissions = data.submissions || [];
            
            setSubmissions(userSubmissions);
            
            // Calculate statistics
            const totalTests = userSubmissions.length;
            const passedTests = userSubmissions.filter(sub => sub.score >= 50).length;
            const failedTests = userSubmissions.filter(sub => sub.score < 50).length;
            const avgScore = totalTests > 0 
                ? Math.round(userSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / totalTests)
                : 0;
            const bestScore = totalTests > 0 
                ? Math.max(...userSubmissions.map(sub => sub.score || 0))
                : 0;
            
            setStats({
                totalTests,
                avgScore,
                bestScore,
                passedTests,
                failedTests
            });
        } catch (error) {
            message.error(error.message || 'Impossible de charger vos résultats');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id) => {
        try {
            const data = await fetchSubmissionDetails(id);
            setSelectedDetail(data.submission);
            setModalVisible(true);
        } catch (error) {
            message.error(error.message);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return '#10b981'; // green
        if (score >= 60) return '#f59e0b'; // orange
        if (score >= 50) return '#3b82f6'; // blue
        return '#ef4444'; // red
    };

    const getScoreStatus = (score) => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        if (score >= 50) return 'processing';
        return 'error';
    };

    const columns = [
        {
            title: 'Test',
            dataIndex: ['testId', 'title'],
            key: 'testTitle',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Poste',
            dataIndex: ['testId', 'jobRole'],
            key: 'jobRole',
        },
        {
            title: 'Date de passage',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val) => new Date(val).toLocaleDateString('fr-FR'),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        },
        {
            title: 'Statut',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'GRADED' ? 'success' : 'processing'}>
                    {status === 'GRADED' ? 'Évalué' : 'En attente'}
                </Tag>
            ),
            filters: [
                { text: 'Évalué', value: 'GRADED' },
                { text: 'En attente', value: 'PENDING' }
            ],
            onFilter: (value, record) => record.status === value
        },
        {
            title: 'Score',
            dataIndex: 'totalScore',
            key: 'score',
            render: (score) => score !== null ? (
                <Tag color={getScoreStatus(score)}>
                    {score} / 100
                </Tag>
            ) : '-',
            sorter: (a, b) => (a.totalScore || 0) - (b.totalScore || 0)
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    disabled={record.status !== 'GRADED'}
                    onClick={() => handleViewDetails(record._id)}
                >
                    Voir Détails
                </Button>
            ),
        },
    ];

    if (loading) return (
        <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Chargement de vos résultats...</div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}
        >
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                style={{ marginBottom: 32 }}
            >
                <Title level={2} style={{ margin: 0 }}>Mes Résultats</Title>
                <Text type="secondary">Consultez vos performances et progrès dans les tests techniques</Text>
            </motion.div>

            {/* Statistics Overview */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{ marginBottom: 32 }}
            >
                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} lg={5}>
                        <Card style={styles.statCard}>
                            <Statistic
                                title="Tests Passés"
                                value={stats.totalTests}
                                prefix={<BookOutlined />}
                                valueStyle={{ color: '#3b82f6' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={5}>
                        <Card style={styles.statCard}>
                            <Statistic
                                title="Score Moyen"
                                value={stats.avgScore}
                                suffix="%"
                                prefix={<BarChartOutlined />}
                                valueStyle={{ color: getScoreColor(stats.avgScore) }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={5}>
                        <Card style={styles.statCard}>
                            <Statistic
                                title="Meilleur Score"
                                value={stats.bestScore}
                                suffix="%"
                                prefix={<TrophyOutlined />}
                                valueStyle={{ color: '#f59e0b' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={5}>
                        <Card style={styles.statCard}>
                            <Statistic
                                title="Réussis"
                                value={stats.passedTests}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#10b981' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={4}>
                        <Card style={styles.statCard}>
                            <Statistic
                                title="Échecs"
                                value={stats.failedTests}
                                prefix={<CloseCircleOutlined />}
                                valueStyle={{ color: '#ef4444' }}
                            />
                        </Card>
                    </Col>
                </Row>
            </motion.div>

            {/* Main Content */}
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={18}>
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <Card 
                            title={
                                <div style={styles.sectionTitle}>
                                    <BarChartOutlined style={{ marginRight: 12, color: '#3b82f6' }} />
                                    Historique des Résultats
                                </div>
                            }
                            style={styles.mainCard}
                        >
                            <Table
                                columns={columns}
                                dataSource={submissions}
                                rowKey="_id"
                                pagination={{ 
                                    pageSize: 8,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    showTotal: (total) => `Total ${total} résultats`
                                }}
                                scroll={{ x: 800 }}
                            />
                        </Card>
                    </motion.div>
                </Col>

                <Col xs={24} lg={6}>
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <Card 
                            title={
                                <div style={styles.sectionTitle}>
                                    <FireOutlined style={{ marginRight: 12, color: '#f59e0b' }} />
                                    Performance
                                </div>
                            }
                            style={styles.sidebarCard}
                        >
                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <Progress
                                    type="circle"
                                    percent={stats.avgScore}
                                    width={120}
                                    strokeColor={getScoreColor(stats.avgScore)}
                                    format={(percent) => (
                                        <span style={{ fontSize: 16, fontWeight: 'bold', color: getScoreColor(percent) }}>
                                            {percent}%
                                        </span>
                                    )}
                                />
                                <Title level={5} style={{ marginTop: 16, marginBottom: 4 }}>Score Moyen</Title>
                                <Text type="secondary">Sur tous vos tests</Text>
                            </div>

                            <Divider />

                            <div style={{ padding: '0 16px' }}>
                                <Title level={5} style={{ marginBottom: 16 }}>Distribution</Title>
                                
                                <div style={styles.distributionItem}>
                                    <Text>Excellent (80%+):</Text>
                                    <Tag color="green">
                                        {submissions.filter(s => s.totalScore >= 80).length}
                                    </Tag>
                                </div>
                                
                                <div style={styles.distributionItem}>
                                    <Text>Bon (60-79%):</Text>
                                    <Tag color="orange">
                                        {submissions.filter(s => s.totalScore >= 60 && s.totalScore < 80).length}
                                    </Tag>
                                </div>
                                
                                <div style={styles.distributionItem}>
                                    <Text>Satisfaisant (50-59%):</Text>
                                    <Tag color="blue">
                                        {submissions.filter(s => s.totalScore >= 50 && s.totalScore < 60).length}
                                    </Tag>
                                </div>
                                
                                <div style={styles.distributionItem}>
                                    <Text>Insuffisant (&lt;50%):</Text>
                                    <Tag color="red">
                                        {submissions.filter(s => s.totalScore < 50).length}
                                    </Tag>
                                </div>
                            </div>

                            <Button 
                                type="primary" 
                                block 
                                style={{ marginTop: 24 }}
                                onClick={() => window.location.href = '/tests'}
                            >
                                Passer un nouveau test
                            </Button>
                        </Card>
                    </motion.div>
                </Col>
            </Row>

            {/* Detailed Results Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar 
                            icon={<BookOutlined />} 
                            style={{ backgroundColor: '#3b82f6' }} 
                        />
                        Détails du Résultat
                    </div>
                }
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setModalVisible(false)}>
                        Fermer
                    </Button>
                ]}
                width={800}
            >
                {selectedDetail ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div style={{ marginBottom: 24 }}>
                            <Title level={4} style={{ margin: '0 0 8px 0' }}>
                                {selectedDetail.testId?.title}
                            </Title>
                            <Text type="secondary">{selectedDetail.testId?.jobRole}</Text>
                            
                            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                                <Text strong>Score Global : </Text>
                                <Tag 
                                    color={getScoreStatus(selectedDetail.totalScore)}
                                    style={{ 
                                        fontSize: 18, 
                                        padding: '4px 12px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {selectedDetail.totalScore} / 100
                                </Tag>
                            </div>
                        </div>

                        <Tabs defaultActiveKey="1">
                            <TabPane tab="Feedback IA" key="1">
                                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                    <Title level={5} style={{ color: '#3b82f6', marginBottom: 12 }}>
                                        <TrophyOutlined style={{ marginRight: 8 }} />
                                        Analyse de Performance
                                    </Title>
                                    <Paragraph 
                                        style={{ 
                                            whiteSpace: 'pre-wrap', 
                                            margin: 0, 
                                            fontSize: 15,
                                            lineHeight: 1.6
                                        }}
                                    >
                                        {selectedDetail.feedback || "Aucun feedback disponible pour ce test."}
                                    </Paragraph>
                                </div>
                            </TabPane>
                            
                            <TabPane tab="Détails Techniques" key="2">
                                <div style={{ padding: '20px 0' }}>
                                    <List
                                        dataSource={[
                                            { label: 'Date de passage', value: new Date(selectedDetail.createdAt).toLocaleString('fr-FR') },
                                            { label: 'Durée', value: selectedDetail.timeSpent ? `${Math.round(selectedDetail.timeSpent / 60)} minutes` : 'N/A' },
                                            { label: 'Nombre de questions', value: selectedDetail.answers?.length || 0 },
                                            { label: 'Questions correctes', value: selectedDetail.correctAnswers || 0 }
                                        ]}
                                        renderItem={item => (
                                            <List.Item>
                                                <List.Item.Meta
                                                    title={<Text strong>{item.label}</Text>}
                                                    description={<Text>{item.value}</Text>}
                                                />
                                            </List.Item>
                                        )}
                                    />
                                </div>
                            </TabPane>
                        </Tabs>
                    </motion.div>
                ) : <Spin />}
            </Modal>
        </motion.div>
    );
}

const styles = {
    statCard: {
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        textAlign: 'center'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center'
    },
    mainCard: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9'
    },
    sidebarCard: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        height: '100%'
    },
    distributionItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    }
};

export default CandidateResults;
