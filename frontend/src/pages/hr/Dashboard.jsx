import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, List, Avatar, Tag, Space, Button, Spin, Dropdown, Menu } from 'antd';
import { UserOutlined, CheckCircleOutlined, ClockCircleOutlined, TeamOutlined, RiseOutlined, FallOutlined, TrophyOutlined, CalendarOutlined, PlusOutlined, BarChartOutlined, DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { fetchDashboardStats } from '../../api/dashboard';
import { getTests } from '../../api/tests';
import { listUsers } from '../../api/users';
import { fetchAllSubmissions } from '../../api/submissions';

const { Title, Text } = Typography;

function HRDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tests, setTests] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            setLoading(true);
            // Load all dashboard data in parallel
            const [statsData, testsData, usersData, submissionsData] = await Promise.all([
                fetchDashboardStats(),
                getTests(),
                listUsers(),
                fetchAllSubmissions()
            ]);
            
            setStats(statsData);
            setTests(testsData.tests || []);
            setCandidates(usersData.users?.filter(user => user.role === 'candidat') || []);
            setSubmissions(submissionsData.submissions || []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        loadAllData();
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    const statCards = [
        {
            title: "Total Candidats",
            value: stats?.totalCandidates || 0,
            icon: <UserOutlined />,
            color: "#3b82f6",
            trend: "+12%",
            trendUp: true
        },
        {
            title: "Tests Complétés",
            value: stats?.completedTests || 0,
            icon: <CheckCircleOutlined />,
            color: "#10b981",
            trend: "+8%",
            trendUp: true
        },
        {
            title: "En Attente",
            value: stats?.pendingTests || 0,
            icon: <ClockCircleOutlined />,
            color: "#f59e0b",
            trend: "-3%",
            trendUp: false
        },
        {
            title: "Taux de Succès",
            value: `${stats?.successRate || 0}%`,
            icon: <TrophyOutlined />,
            color: "#8b5cf6",
            trend: "+15%",
            trendUp: true
        }
    ];

    const recentActivity = [
        {
            id: 1,
            user: "Marie Dubois",
            action: "a passé le test",
            test: "Développeur Full Stack",
            time: "Il y a 2 heures",
            avatar: "MD",
            type: "success"
        },
        {
            id: 2,
            user: "Thomas Martin",
            action: "a été évalué par l'IA",
            test: "Data Scientist",
            time: "Il y a 4 heures",
            avatar: "TM",
            type: "info"
        },
        {
            id: 3,
            user: "Sophie Laurent",
            action: "a rejoint le pipeline",
            test: "Product Manager",
            time: "Il y a 1 jour",
            avatar: "SL",
            type: "warning"
        }
    ];

    return (
        <motion.div
            style={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <motion.div
                style={styles.header}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
            >
                <div>
                    <Title level={2} style={styles.title}>
                        Tableau de Bord Recrutement
                    </Title>
                    <Text type="secondary" style={styles.subtitle}>
                        Aperçu en temps réel de votre processus de recrutement
                    </Text>
                </div>
                <div style={styles.headerActions}>
                    <Button type="primary" size="large">
                        Nouveau Test
                    </Button>
                </div>
            </motion.div>

            {/* Stats Overview */}
            <motion.div
                style={styles.statsSection}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <Row gutter={[24, 24]}>
                    {statCards.map((stat, index) => (
                        <Col key={stat.title} xs={24} sm={12} lg={6}>
                            <motion.div
                                whileHover={{ y: -5, scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <Card style={{ ...styles.statCard, borderLeft: `4px solid ${stat.color}` }}>
                                    <div style={styles.statHeader}>
                                        <div style={styles.statBadge}>
                                            <span style={{ color: stat.color }}>{stat.badge}</span>
                                        </div>
                                        <div style={styles.trend}>
                                            <span style={{ color: '#10b981', fontWeight: 600 }}>
                                                <RiseOutlined /> {stat.trend}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={styles.statContent}>
                                        <div style={{
                                            ...styles.statIcon,
                                            background: `${stat.color}15`,
                                            color: stat.color
                                        }}>
                                            {stat.icon}
                                        </div>
                                        <div style={styles.statInfo}>
                                            <Statistic
                                                title={<span style={styles.statTitle}>{stat.title}</span>}
                                                value={stat.value}
                                                valueStyle={{ ...styles.statValue, color: stat.color }}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            </motion.div>

            {/* Main Content Grid */}
            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                {/* Pipeline Funnel */}
                <Col xs={24} lg={16}>
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <Card title={
                            <div style={styles.cardTitle}>
                                <TeamOutlined style={{ marginRight: 8, color: '#3b82f6' }} />
                                Pipeline de Recrutement
                            </div>
                        } style={styles.mainCard}>
                            <div style={styles.pipelineContainer}>
                                {[
                                    { stage: "Nouveaux", count: 42, color: "#dbeafe", icon: "🆕" },
                                    { stage: "En Évaluation", count: 28, color: "#ddd6fe", icon: "🧠" },
                                    { stage: "À Interviewer", count: 15, color: "#dcfce7", icon: "💬" },
                                    { stage: "Offre Envoyée", count: 8, color: "#ffedd5", icon: "📄" },
                                    { stage: "Embauchés", count: 5, color: "#fef3c7", icon: "🎉" }
                                ].map((item, index) => (
                                    <motion.div
                                        key={item.stage}
                                        style={{
                                            ...styles.pipelineStage,
                                            background: item.color
                                        }}
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div style={styles.stageHeader}>
                                            <span style={styles.stageIcon}>{item.icon}</span>
                                            <Text strong style={styles.stageName}>{item.stage}</Text>
                                        </div>
                                        <div style={styles.stageContent}>
                                            <Text style={styles.stageCount}>{item.count}</Text>
                                            <Text type="secondary" style={styles.stageLabel}>candidats</Text>
                                        </div>
                                        {index < 4 && (
                                            <div style={styles.stageConnector}>
                                                <div style={styles.connectorLine}></div>
                                                <div style={styles.connectorArrow}>→</div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                </Col>

                {/* Recent Activity */}
                <Col xs={24} lg={8}>
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <Card title={
                            <div style={styles.cardTitle}>
                                <CalendarOutlined style={{ marginRight: 8, color: '#8b5cf6' }} />
                                Activité Récente
                            </div>
                        } style={styles.sidebarCard}>
                            <List
                                dataSource={recentActivity}
                                renderItem={item => (
                                    <List.Item style={styles.activityItem}>
                                        <List.Item.Meta
                                            avatar={
                                                <Avatar style={{
                                                    backgroundColor: item.type === 'success' ? '#10b981' :
                                                        item.type === 'info' ? '#3b82f6' : '#f59e0b'
                                                }}>
                                                    {item.avatar}
                                                </Avatar>
                                            }
                                            title={
                                                <div>
                                                    <Text strong>{item.user}</Text>
                                                    <Text type="secondary" style={{ marginLeft: 8 }}>
                                                        {item.action}
                                                    </Text>
                                                </div>
                                            }
                                            description={
                                                <div style={{ marginTop: 4 }}>
                                                    <Text type="secondary">{item.test}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {item.time}
                                                    </Text>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </motion.div>
                </Col>
            </Row>

            {/* Performance Metrics */}
            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                <Col xs={24} md={12}>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <Card title={
                            <div style={styles.cardTitle}>
                                <RiseOutlined style={{ marginRight: 8, color: '#10b981' }} />
                                Taux de Conversion
                            </div>
                        } style={styles.mainCard}>
                            <div style={styles.conversionMetrics}>
                                <div style={styles.metricRow}>
                                    <Text>Visionnages → Applications</Text>
                                    <Progress percent={24} size="small" strokeColor="#3b82f6" />
                                    <Text type="secondary">24%</Text>
                                </div>
                                <div style={styles.metricRow}>
                                    <Text>Applications → Tests</Text>
                                    <Progress percent={67} size="small" strokeColor="#10b981" />
                                    <Text type="secondary">67%</Text>
                                </div>
                                <div style={styles.metricRow}>
                                    <Text>Tests → Interviews</Text>
                                    <Progress percent={45} size="small" strokeColor="#f59e0b" />
                                    <Text type="secondary">45%</Text>
                                </div>
                                <div style={styles.metricRow}>
                                    <Text>Interviews → Embauches</Text>
                                    <Progress percent={32} size="small" strokeColor="#8b5cf6" />
                                    <Text type="secondary">32%</Text>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </Col>

                <Col xs={24} md={12}>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                    >
                        <Card title={
                            <div style={styles.cardTitle}>
                                <TrophyOutlined style={{ marginRight: 8, color: '#f59e0b' }} />
                                Top Performances
                            </div>
                        } style={styles.mainCard}>
                            <div style={styles.topPerformers}>
                                {[
                                    { name: "Développeur Full Stack", score: 92, change: "+12%" },
                                    { name: "Data Scientist", score: 88, change: "+8%" },
                                    { name: "Product Manager", score: 85, change: "+15%" }
                                ].map((perf, index) => (
                                    <div key={perf.name} style={styles.performerItem}>
                                        <div style={styles.performerRank}>
                                            <Text strong style={{ fontSize: 18, color: '#3b82f6' }}>
                                                #{index + 1}
                                            </Text>
                                        </div>
                                        <div style={styles.performerInfo}>
                                            <Text strong>{perf.name}</Text>
                                            <div style={styles.performerMetrics}>
                                                <Tag color="success">{perf.score}% match</Tag>
                                                <Text type="success" style={{ fontSize: 12 }}>
                                                    {perf.change}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                </Col>
            </Row>
        </motion.div>
    );
}

const styles = {
    container: {
        padding: 24,
        fontFamily: "'Inter', sans-serif"
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32
    },
    title: {
        margin: 0,
        color: '#111827',
        fontWeight: 700
    },
    subtitle: {
        fontSize: 16
    },
    headerActions: {
        display: 'flex',
        gap: 12
    },
    
    // Stats Section
    statsSection: {
        marginBottom: 24
    },
    statCard: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        overflow: 'hidden'
    },
    statHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20
    },
    statTitle: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: 500
    },
    statValue: {
        fontSize: 28,
        fontWeight: 700
    },
    trend: {
        fontSize: 12
    },

    // Cards
    cardTitle: {
        fontSize: 16,
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

    // Pipeline
    pipelineContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16
    },
    pipelineStage: {
        padding: 20,
        borderRadius: 12,
        position: 'relative',
        border: '1px solid rgba(0,0,0,0.05)'
    },
    stageHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12
    },
    stageIcon: {
        fontSize: 20
    },
    stageName: {
        fontSize: 16,
        fontWeight: 600
    },
    stageContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    stageCount: {
        fontSize: 24,
        fontWeight: 700,
        color: '#1e293b'
    },
    stageLabel: {
        fontSize: 12
    },
    stageConnector: {
        position: 'absolute',
        right: -25,
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 4
    },
    connectorLine: {
        width: 20,
        height: 2,
        background: '#cbd5e1'
    },
    connectorArrow: {
        color: '#94a3b8',
        fontSize: 16
    },

    // Activity
    activityItem: {
        padding: '12px 0'
    },

    // Metrics
    conversionMetrics: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16
    },
    metricRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
    },

    // Performers
    topPerformers: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16
    },
    performerItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 12,
        background: '#f8fafc',
        borderRadius: 12
    },
    performerRank: {
        width: 32,
        textAlign: 'center'
    },
    performerInfo: {
        flex: 1
    },
    performerMetrics: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 4
    }
};

export default HRDashboard;