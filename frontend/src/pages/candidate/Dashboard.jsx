import { useEffect, useState, useContext } from 'react';
import { Card, Button, Typography, Row, Col, Spin, message, Statistic, Progress, Avatar, Tag, List, Space, Input, Select, Divider, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getPublicTests } from '../../api/tests';
import { fetchMySubmissions } from '../../api/submissions';
import { motion } from 'framer-motion';
import { AuthContext } from '../../contexts/authContext.jsx';
import UserAvatar from '../../Components/UserAvatar.jsx';
import { 
    BookOutlined, 
    ClockCircleOutlined, 
    CheckCircleOutlined, 
    BarChartOutlined,
    CalendarOutlined,
    TrophyOutlined,
    FireOutlined,
    SearchOutlined,
    FilterOutlined,
    TeamOutlined,
    DollarOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

function CandidateDashboard() {
    const { user } = useContext(AuthContext);
    const [tests, setTests] = useState([]);
    const [mySubmissions, setMySubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTests: 0,
        completedTests: 0,
        averageScore: 0,
        bestScore: 0,
        inProgress: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const navigate = useNavigate();

    const getSubmissionScore = (submission) => submission?.totalScore ?? submission?.score ?? 0;

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [testsData, submissionsData] = await Promise.all([
                getPublicTests(),
                fetchMySubmissions()
            ]);
            
            const availableTests = testsData.tests || [];
            const submissions = (submissionsData.submissions || []).map((sub) => ({
                ...sub,
                score: sub?.score ?? sub?.totalScore ?? 0,
            }));
            
            setTests(availableTests);
            setMySubmissions(submissions);
            
            // Calculate stats
            const completedTests = submissions.filter(sub => sub.status === 'GRADED').length;
            const inProgressTests = submissions.filter(sub => sub.status === 'IN_PROGRESS').length;
            const averageScore = completedTests > 0 
                ? Math.round(submissions.filter(sub => sub.status === 'GRADED')
                    .reduce((sum, sub) => sum + getSubmissionScore(sub), 0) / completedTests)
                : 0;
            const bestScore = completedTests > 0 
                ? Math.max(...submissions.filter(sub => sub.status === 'GRADED')
                    .map((sub) => getSubmissionScore(sub)))
                : 0;
            
            setStats({
                totalTests: availableTests.length,
                completedTests,
                averageScore,
                bestScore,
                inProgress: inProgressTests
            });
        } catch (error) {
            message.error(error.message || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Facile': return 'green';
            case 'Moyen': return 'orange';
            case 'Difficile': return 'red';
            default: return 'blue';
        }
    };

    const getStatusTag = (testId) => {
        const submission = mySubmissions.find(sub => 
            sub.testId?._id === testId || sub.testId === testId
        );
        
        if (submission) {
            if (submission.status === 'GRADED') {
                return (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                        Terminé ({getSubmissionScore(submission)}%)
                    </Tag>
                );
            } else if (submission.status === 'IN_PROGRESS') {
                return <Tag icon={<ClockCircleOutlined />} color="processing">En cours</Tag>;
            }
        }
        return <Tag icon={<ClockCircleOutlined />} color="default">Disponible</Tag>;
    };

    const canTakeTest = (testId) => {
        const submission = mySubmissions.find(sub => 
            sub.testId?._id === testId || sub.testId === testId
        );
        return !submission || submission.status !== 'IN_PROGRESS';
    };

    const handleStartTest = (testId) => {
        const hasCv = Boolean(user?.cvUrl) || Boolean(String(user?.cvText || '').trim());
        if (!hasCv) {
            message.info('Ajoutez votre CV dans votre profil avant de passer cette candidature technique.');
            navigate('/profile');
            return;
        }
        navigate(`/tests/${testId}`);
    };

    // Filter tests based on search and filters
    const filteredTests = tests.filter(test => {
        const matchesSearch = searchTerm === '' || 
            test.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            test.jobRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
            test.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDifficulty = filterDifficulty === 'all' || test.difficulty === filterDifficulty;
        const matchesStatus = filterStatus === 'all' || 
            (filterStatus === 'available' && !mySubmissions.some(sub => 
                (sub.testId?._id === test._id || sub.testId === test._id) && sub.status === 'IN_PROGRESS'
            )) ||
            (filterStatus === 'in-progress' && mySubmissions.some(sub => 
                (sub.testId?._id === test._id || sub.testId === test._id) && sub.status === 'IN_PROGRESS'
            ));
        
        return matchesSearch && matchesDifficulty && matchesStatus;
    });

    if (loading) {
        return (
            <div style={{ textAlign: 'center', marginTop: 50 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>Chargement du tableau de bord...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-content">
                {/* Welcome Section */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="dashboard-header"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <UserAvatar user={user} size={64} />
                        <div>
                            <Title level={2} className="dashboard-title">
                                Bonjour, Candidat!
                            </Title>
                            <Text className="dashboard-subtitle">
                                Bienvenue sur votre espace candidat. Prêt à relever de nouveaux défis ?
                            </Text>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Overview */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="stats-grid"
                >
                    <div className="stat-card primary">
                        <div className="stat-icon">
                            <BookOutlined />
                        </div>
                        <div className="stat-value">{stats.totalTests}</div>
                        <div className="stat-label">Tests Disponibles</div>
                    </div>
                    <div className="stat-card success">
                        <div className="stat-icon">
                            <CheckCircleOutlined />
                        </div>
                        <div className="stat-value">{stats.completedTests}</div>
                        <div className="stat-label">Tests Complétés</div>
                    </div>
                    <div className="stat-card warning">
                        <div className="stat-icon">
                            <ClockCircleOutlined />
                        </div>
                        <div className="stat-value">{stats.inProgress}</div>
                        <div className="stat-label">En Cours</div>
                    </div>
                    <div className="stat-card info">
                        <div className="stat-icon">
                            <TrophyOutlined />
                        </div>
                        <div className="stat-value">{stats.bestScore}%</div>
                        <div className="stat-label">Meilleur Score</div>
                    </div>
                    <div className="stat-card secondary">
                        <div className="stat-icon">
                            <BarChartOutlined />
                        </div>
                        <div className="stat-value">{stats.averageScore}%</div>
                        <div className="stat-label">Score Moyen</div>
                    </div>
                </motion.div>

            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                {/* Available Tests */}
                <Col xs={24} lg={16}>
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <Card 
                            title={
                                <div style={styles.sectionTitle}>
                                    <BookOutlined style={{ marginRight: 12, color: '#3b82f6' }} />
                                    Offres d'emploi disponibles
                                </div>
                            }
                            extra={
                                <Text type="secondary">
                                    {filteredTests.length} test{filteredTests.length !== 1 ? 's' : ''} trouvé{filteredTests.length !== 1 ? 's' : ''}
                                </Text>
                            }
                            style={styles.mainCard}
                        >
                            {/* Filters */}
                            <div style={styles.filtersSection}>
                                <Space wrap size="middle">
                                    <Input
                                        placeholder="Rechercher..."
                                        prefix={<SearchOutlined />}
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        style={{ width: 200 }}
                                    />
                                    <Select
                                        placeholder="Difficulté"
                                        value={filterDifficulty}
                                        onChange={setFilterDifficulty}
                                        style={{ width: 120 }}
                                    >
                                        <Option value="all">Toutes</Option>
                                        <Option value="Facile">Facile</Option>
                                        <Option value="Moyen">Moyen</Option>
                                        <Option value="Difficile">Difficile</Option>
                                    </Select>
                                    <Select
                                        placeholder="Statut"
                                        value={filterStatus}
                                        onChange={setFilterStatus}
                                        style={{ width: 150 }}
                                    >
                                        <Option value="all">Tous</Option>
                                        <Option value="available">Disponibles</Option>
                                        <Option value="in-progress">En cours</Option>
                                    </Select>
                                </Space>
                            </div>

                            {filteredTests.length === 0 ? (
                                <Empty 
                                    description={
                                        searchTerm || filterDifficulty !== 'all' || filterStatus !== 'all'
                                            ? "Aucun test ne correspond à vos critères de recherche"
                                            : "Aucun test disponible pour le moment"
                                    }
                                    style={{ padding: '60px 0' }}
                                >
                                    {(searchTerm || filterDifficulty !== 'all' || filterStatus !== 'all') && (
                                        <Button 
                                            type="primary" 
                                            onClick={() => {
                                                setSearchTerm('');
                                                setFilterDifficulty('all');
                                                setFilterStatus('all');
                                            }}
                                        >
                                            Réinitialiser les filtres
                                        </Button>
                                    )}
                                </Empty>
                            ) : (
                                <div style={styles.testsGrid}>
                                    {filteredTests.map(test => (
                                        <motion.div
                                            key={test._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            whileHover={{ y: -5, scale: 1.02 }}
                                        >
                                            <Card
                                                style={styles.testCard}
                                                hoverable
                                                cover={
                                                    <div style={styles.testCover}>
                                                        <div style={styles.coverContent}>
                                                            <Text style={styles.jobRole}>{test.jobRole}</Text>
                                                            <Tag color={getDifficultyColor(test.difficulty)}>
                                                                {test.difficulty}
                                                            </Tag>
                                                        </div>
                                                    </div>
                                                }
                                            >
                                                <Card.Meta
                                                    title={
                                                        <div style={styles.testTitle}>
                                                            {test.title}
                                                        </div>
                                                    }
                                                    description={
                                                        <div style={styles.testDescription}>
                                                            <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 16 }}>
                                                                {test.description}
                                                            </Paragraph>
                                                            
                                                            <div style={styles.testMeta}>
                                                                <Space size="middle">
                                                                    <Text type="secondary">
                                                                        <ClockCircleOutlined /> {test.timeLimit || 30} min
                                                                    </Text>
                                                                    <Text type="secondary">
                                                                        <TeamOutlined /> {test.questions?.length || 0} questions
                                                                    </Text>
                                                                    {test.salaryRange && (
                                                                        <Text type="secondary">
                                                                            <DollarOutlined /> {test.salaryRange}
                                                                        </Text>
                                                                    )}
                                                                </Space>
                                                            </div>
                                                            
                                                            <div style={styles.testActions}>
                                                                <div style={{ marginBottom: 12 }}>
                                                                    {getStatusTag(test._id)}
                                                                </div>
                                                                <Button 
                                                                    type="primary" 
                                                                    size="large"
                                                                    block
                                                                    onClick={() => handleStartTest(test._id)}
                                                                    disabled={!canTakeTest(test._id)}
                                                                >
                                                                    {!canTakeTest(test._id) ? 'Déjà en cours' : 'Passer le Test'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    }
                                                />
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
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
                        <Card 
                            title={
                                <div style={styles.sectionTitle}>
                                    <CalendarOutlined style={{ marginRight: 12, color: '#8b5cf6' }} />
                                    Activité Récente
                                </div>
                            }
                            style={styles.sidebarCard}
                        >
                            {mySubmissions.length === 0 ? (
                                <div style={styles.emptyStateSmall}>
                                    <FireOutlined style={{ fontSize: 32, color: '#d1d5db', marginBottom: 12 }} />
                                    <Text type="secondary">Aucune activité récente</Text>
                                    <Button 
                                        type="primary" 
                                        size="small" 
                                        block 
                                        style={{ marginTop: 16 }}
                                        onClick={() => navigate('/tests')}
                                    >
                                        Commencer un test
                                    </Button>
                                </div>
                            ) : (
                                <List
                                    dataSource={mySubmissions.slice(0, 5)}
                                    renderItem={submission => {
                                        const testTitle = submission.testId?.title || 'Test inconnu';
                                        const score = getSubmissionScore(submission);
                                        const isGraded = submission.status === 'GRADED';
                                        
                                        return (
                                            <List.Item style={styles.activityItem}>
                                                <List.Item.Meta
                                                    avatar={
                                                        <Avatar 
                                                            icon={<BookOutlined />} 
                                                            style={{ 
                                                                backgroundColor: isGraded 
                                                                    ? (score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444')
                                                                    : '#3b82f6'
                                                            }} 
                                                        />
                                                    }
                                                    title={
                                                        <div>
                                                            <Text strong ellipsis style={{ maxWidth: '100%' }}>
                                                                {testTitle}
                                                            </Text>
                                                            {isGraded && (
                                                                <Tag 
                                                                    color={score >= 70 ? 'success' : score >= 50 ? 'warning' : 'error'}
                                                                    style={{ marginLeft: 8 }}
                                                                >
                                                                    {score}%
                                                                </Tag>
                                                            )}
                                                        </div>
                                                    }
                                                    description={
                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                            {isGraded ? 'Terminé' : 'En cours'} •{' '}
                                                            {new Date(submission.createdAt).toLocaleDateString('fr-FR')}
                                                        </Text>
                                                    }
                                                />
                                            </List.Item>
                                        );
                                    }}
                                />
                            )}
                            
                            <Button 
                                type="link" 
                                block 
                                style={{ marginTop: 16 }}
                                onClick={() => navigate('/mes-resultats')}
                            >
                                Voir tous mes résultats
                            </Button>
                            
                            <Divider />
                            
                            <div style={{ padding: '0 16px' }}>
                                <Title level={5} style={{ marginBottom: 16 }}>Progrès Global</Title>
                                <Progress 
                                    percent={stats.totalTests > 0 ? Math.round((stats.completedTests / stats.totalTests) * 100) : 0}
                                    status="active"
                                    strokeColor={{
                                        '0%': '#3b82f6',
                                        '100%': '#10b981',
                                    }}
                                />
                                <Text type="secondary" style={{ display: 'block', marginTop: 8, textAlign: 'center' }}>
                                    {stats.completedTests} sur {stats.totalTests} tests complétés
                                </Text>
                            </div>
                        </Card>
                    </motion.div>
                </Col>
            </Row>
            </div>
        </div>
    );
}

const styles = {
    sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        fontSize: 15,
        fontWeight: 700,
        color: '#1e293b',
    },
    mainCard: {
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    },
    sidebarCard: {
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        height: '100%',
    },
    filtersSection: {
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: '1px solid #f1f5f9',
    },
    testsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 20,
    },
    testCard: {
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        height: '100%',
    },
    testCover: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px 16px 16px',
        minHeight: 80,
    },
    coverContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
    },
    jobRole: {
        color: '#fff',
        fontWeight: 700,
        fontSize: 14,
    },
    testTitle: {
        fontSize: 15,
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: 4,
    },
    testDescription: {
        fontSize: 13,
        color: '#64748b',
    },
    testMeta: {
        marginBottom: 12,
    },
    testActions: {
        marginTop: 12,
    },
    activityItem: {
        padding: '10px 0',
    },
    emptyStateSmall: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 0',
        textAlign: 'center',
    },
};

export default CandidateDashboard;
