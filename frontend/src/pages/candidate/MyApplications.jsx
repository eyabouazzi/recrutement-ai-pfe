import { useEffect, useState } from 'react';
import { Typography, Card, Tag, Row, Col, Spin, Empty, Button, message, Steps, Statistic, List, Avatar, Space, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getMyApplications } from '../../api/submissions';
import { ClockCircleOutlined, SolutionOutlined, RightOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined, CalendarOutlined, BarChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

const { Title, Text, Paragraph } = Typography;

const STAGE_MAP = {
    'NEW': { label: 'Reçu', color: 'blue', step: 0, icon: UserOutlined },
    'SCREENING': { label: 'Présélection', color: 'purple', step: 1, icon: SolutionOutlined },
    'INTERVIEW': { label: 'Entretien', color: 'cyan', step: 2, icon: CalendarOutlined },
    'OFFER': { label: 'Offre', color: 'gold', step: 3, icon: CheckCircleOutlined },
    'HIRED': { label: 'Recruté', color: 'green', step: 4, icon: CheckCircleOutlined },
    'REJECTED': { label: 'Non retenu', color: 'red', step: 0, icon: CloseCircleOutlined }
};

export default function MyApplications() {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        completed: 0,
        rejected: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        try {
            setLoading(true);
            const data = await getMyApplications();
            const applications = data.applications || [];
            
            setApps(applications);
            
            // Calculate statistics
            const activeApps = applications.filter(app => 
                ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER'].includes(app.stage)
            ).length;
            const completedApps = applications.filter(app => app.stage === 'HIRED').length;
            const rejectedApps = applications.filter(app => app.stage === 'REJECTED').length;
            
            setStats({
                total: applications.length,
                active: activeApps,
                completed: completedApps,
                rejected: rejectedApps
            });
        } catch (error) {
            message.error("Erreur lors du chargement de vos candidatures");
        } finally {
            setLoading(false);
        }
    };

    const getStageProgress = (stage) => {
        const stages = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];
        return stages.indexOf(stage) + 1;
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Chargement de vos candidatures...</div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}
        >
            {/* Header Section */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                style={{ marginBottom: 32 }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>Mes Candidatures</Title>
                        <Text type="secondary">Suivez l'état d'avancement de vos dossiers en temps réel.</Text>
                    </div>
                    <Button type="primary" size="large" onClick={() => navigate('/careers')}>
                        Explorer d'autres offres
                    </Button>
                </div>
            </motion.div>

            {/* Statistics Cards */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{ marginBottom: 32 }}
            >
                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card style={styles.statCard}>
                            <Statistic
                                title="Total Candidatures"
                                value={stats.total}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#3b82f6' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card style={styles.statCard}>
                            <Statistic
                                title="En Cours"
                                value={stats.active}
                                prefix={<SolutionOutlined />}
                                valueStyle={{ color: '#8b5cf6' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card style={styles.statCard}>
                            <Statistic
                                title="Recrutés"
                                value={stats.completed}
                                prefix={<CheckCircleOutlined />}
                                valueStyle={{ color: '#10b981' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card style={styles.statCard}>
                            <Statistic
                                title="Refusés"
                                value={stats.rejected}
                                prefix={<CloseCircleOutlined />}
                                valueStyle={{ color: '#ef4444' }}
                            />
                        </Card>
                    </Col>
                </Row>
            </motion.div>

            {/* Applications List */}
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <Card 
                            title={
                                <div style={styles.sectionTitle}>
                                    <SolutionOutlined style={{ marginRight: 12, color: '#3b82f6' }} />
                                    Historique des Candidatures
                                </div>
                            }
                            style={styles.mainCard}
                        >
                            {apps.length === 0 ? (
                                <Empty 
                                    description="Vous n'avez pas encore postulé à une offre." 
                                    style={{ padding: '60px 0' }}
                                >
                                    <Button type="primary" size="large" onClick={() => navigate('/careers')}>
                                        Explorer les offres
                                    </Button>
                                </Empty>
                            ) : (
                                <List
                                    dataSource={apps}
                                    renderItem={app => {
                                        const stage = STAGE_MAP[app.stage] || STAGE_MAP['NEW'];
                                        const test = app.testId || {};
                                        const StageIcon = stage.icon;
                                        
                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                whileHover={{ x: 5 }}
                                                key={app._id}
                                            >
                                                <List.Item style={styles.applicationItem}>
                                                    <List.Item.Meta
                                                        avatar={
                                                            <Avatar 
                                                                icon={<StageIcon />} 
                                                                style={{ 
                                                                    backgroundColor: stage.color === 'red' ? '#fee2e2' : 
                                                                                     stage.color === 'green' ? '#dcfce7' : 
                                                                                     stage.color === 'blue' ? '#dbeafe' : 
                                                                                     stage.color === 'purple' ? '#f3e8ff' : 
                                                                                     stage.color === 'gold' ? '#fef3c7' : 
                                                                                     stage.color === 'cyan' ? '#cffafe' : '#f1f5f9',
                                                                    color: stage.color === 'red' ? '#dc2626' : 
                                                                           stage.color === 'green' ? '#16a34a' : 
                                                                           stage.color === 'blue' ? '#2563eb' : 
                                                                           stage.color === 'purple' ? '#9333ea' : 
                                                                           stage.color === 'gold' ? '#d97706' : 
                                                                           stage.color === 'cyan' ? '#0891b2' : '#64748b'
                                                                }} 
                                                            />
                                                        }
                                                        title={
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                                                <Text strong style={{ fontSize: 16 }}>
                                                                    {test.title || 'Test inconnu'}
                                                                </Text>
                                                                <Tag color={stage.color} icon={<StageIcon />}>
                                                                    {stage.label}
                                                                </Tag>
                                                            </div>
                                                        }
                                                        description={
                                                            <div style={{ marginTop: 8 }}>
                                                                <Text type="secondary" block>
                                                                    {test.jobRole || 'Poste non spécifié'} • {test.location || 'Remote'}
                                                                </Text>
                                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                                    Postulé le {dayjs(app.createdAt).format('DD MMMM YYYY')}
                                                                </Text>
                                                            </div>
                                                        }
                                                    />
                                                    
                                                    <div style={{ textAlign: 'right' }}>
                                                        {app.stage !== 'REJECTED' && app.stage !== 'HIRED' && (
                                                            <div style={{ marginBottom: 16, minWidth: 300 }}>
                                                                <Steps 
                                                                    size="small" 
                                                                    current={stage.step}
                                                                    labelPlacement="vertical"
                                                                    items={[
                                                                        { title: 'Reçu', icon: <UserOutlined /> },
                                                                        { title: 'Examen', icon: <SolutionOutlined /> },
                                                                        { title: 'Entretien', icon: <CalendarOutlined /> },
                                                                        { title: 'Offre', icon: <CheckCircleOutlined /> },
                                                                        { title: 'Final', icon: <CheckCircleOutlined /> }
                                                                    ]}
                                                                    style={{ maxWidth: 300 }}
                                                                />
                                                            </div>
                                                        )}
                                                        
                                                        <Button 
                                                            type="primary" 
                                                            icon={<RightOutlined />} 
                                                            onClick={() => navigate(`/mes-resultats`)}
                                                        >
                                                            Voir détails
                                                        </Button>
                                                    </div>
                                                </List.Item>
                                            </motion.div>
                                        );
                                    }}
                                />
                            )}
                        </Card>
                    </motion.div>
                </Col>
                
                {/* Sidebar */}
                <Col xs={24} lg={8}>
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <Card 
                            title={
                                <div style={styles.sectionTitle}>
                                    <BarChartOutlined style={{ marginRight: 12, color: '#8b5cf6' }} />
                                    Résumé
                                </div>
                            }
                            style={styles.sidebarCard}
                        >
                            <div style={{ textAlign: 'center', padding: 20 }}>
                                <div style={{ 
                                    width: 120, 
                                    height: 120, 
                                    borderRadius: '50%', 
                                    background: 'conic-gradient(#3b82f6 0% 40%, #10b981 40% 70%, #ef4444 70% 100%)',
                                    margin: '0 auto 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        background: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: 20,
                                        color: '#3b82f6'
                                    }}>
                                        {stats.total}
                                    </div>
                                </div>
                                <Title level={4} style={{ margin: '0 0 8px 0' }}>Candidatures Totales</Title>
                                <Text type="secondary">Depuis votre inscription</Text>
                            </div>
                            
                            <Divider />
                            
                            <div style={{ padding: '0 16px' }}>
                                <Title level={5} style={{ marginBottom: 16 }}>Statistiques</Title>
                                
                                <div style={styles.statRow}>
                                    <Text>En cours:</Text>
                                    <Tag color="blue">{stats.active}</Tag>
                                </div>
                                
                                <div style={styles.statRow}>
                                    <Text>Recrutés:</Text>
                                    <Tag color="green">{stats.completed}</Tag>
                                </div>
                                
                                <div style={styles.statRow}>
                                    <Text>Refusés:</Text>
                                    <Tag color="red">{stats.rejected}</Tag>
                                </div>
                                
                                <div style={styles.statRow}>
                                    <Text>Taux de succès:</Text>
                                    <Text strong>
                                        {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                                    </Text>
                                </div>
                            </div>
                            
                            <Button 
                                type="primary" 
                                block 
                                style={{ marginTop: 24 }}
                                onClick={() => navigate('/careers')}
                            >
                                Nouvelle candidature
                            </Button>
                        </Card>
                    </motion.div>
                </Col>
            </Row>
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
    applicationItem: {
        padding: '20px 0',
        borderBottom: '1px solid #f1f5f9'
    },
    statRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    }
};
