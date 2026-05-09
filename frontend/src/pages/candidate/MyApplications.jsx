import { useEffect, useState } from 'react';
import { Typography, Card, Tag, Row, Col, Spin, Empty, Button, message, Steps, Statistic, List, Avatar, Space, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getMyApplications } from '../../api/submissions';
import { listMyInterviews } from '../../api/interviews';
import { ClockCircleOutlined, SolutionOutlined, RightOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined, CalendarOutlined, BarChartOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import AdvancedJobMatchCanvas from '../../Components/AdvancedJobMatchCanvas.jsx';

const { Title, Text, Paragraph } = Typography;

const STAGE_MAP = {
    'NEW': { label: 'Reçu', color: 'blue', step: 0, icon: UserOutlined },
    'SCREENING': { label: 'Présélection', color: 'purple', step: 1, icon: SolutionOutlined },
    'INTERVIEW': { label: 'Entretien', color: 'cyan', step: 2, icon: CalendarOutlined },
    'OFFER': { label: 'Offre', color: 'gold', step: 3, icon: CheckCircleOutlined },
    'HIRED': { label: 'Recruté', color: 'green', step: 4, icon: CheckCircleOutlined },
    'REJECTED': { label: 'Non retenu', color: 'red', step: 0, icon: CloseCircleOutlined }
};

function getStageHistory(app) {
    const raw = Array.isArray(app?.stageHistory) ? app.stageHistory : [];
    if (raw.length > 0) {
        return raw
            .map((entry) => ({
                fromStage: entry?.fromStage || null,
                toStage: entry?.toStage || 'NEW',
                changedAt: entry?.changedAt || entry?.createdAt || null,
                note: entry?.note || '',
                source: entry?.source || 'system',
            }))
            .sort((a, b) => new Date(a.changedAt || 0) - new Date(b.changedAt || 0));
    }

    // Backward-compatible fallback for old submissions without stage history.
    return [{
        fromStage: null,
        toStage: app?.stage || 'NEW',
        changedAt: app?.updatedAt || app?.createdAt || null,
        note: 'Historique simplifié (ancienne candidature)',
        source: 'system',
    }];
}

export default function MyApplications() {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [interviews, setInterviews] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        completed: 0,
        rejected: 0
    });
    const [expandedTimelines, setExpandedTimelines] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchApps();
        fetchInterviews();
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

    const fetchInterviews = async () => {
        try {
            const data = await listMyInterviews();
            setInterviews(data.interviews || []);
        } catch (error) {
            // Interview display is a nice-to-have for this page; don't block the whole UI.
            console.error('Error fetching interviews:', error);
        }
    };

    const getInterviewForApp = (app) => {
        const testId = app?.testId?._id || app?.testId;
        if (!testId || interviews.length === 0) return null;

        const matches = interviews.filter((it) => String(it?.testId?._id || it?.testId) === String(testId));
        if (matches.length === 0) return null;

        // Prefer upcoming scheduled interviews.
        const now = new Date();
        const upcoming = matches.find((it) => it.status === 'SCHEDULED' && new Date(it.scheduledAt) >= now);
        if (upcoming) return upcoming;

        // Otherwise show the most recent one.
        return matches.slice().sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))[0] || null;
    };

    const getStageProgress = (stage) => {
        const stages = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];
        return stages.indexOf(stage) + 1;
    };

    const toggleTimeline = (appId) => {
        setExpandedTimelines((prev) => ({ ...prev, [appId]: !prev[appId] }));
    };

    const getSourceBadge = (source) => {
        const normalized = String(source || 'system').toLowerCase();
        if (normalized === 'hr') return { label: 'RH', color: 'purple' };
        if (normalized === 'candidate') return { label: 'Candidat', color: 'blue' };
        return { label: 'Système', color: 'default' };
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
                                        const jobMatch = app.jobMatchAnalysis || {};
                                        const StageIcon = stage.icon;
                                        const stageHistory = getStageHistory(app);
                                        const isExpanded = Boolean(expandedTimelines[app._id]);
                                        const visibleHistory = isExpanded ? stageHistory : stageHistory.slice(-2);
                                        const hasHidden = stageHistory.length > visibleHistory.length;
                                        
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
                                                                {typeof jobMatch.score === 'number' && (
                                                                    <Tag color={jobMatch.score >= 75 ? 'success' : jobMatch.score >= 55 ? 'warning' : 'error'}>
                                                                        CV Match {jobMatch.score}%
                                                                    </Tag>
                                                                )}
                                                            </div>
                                                        }
                                                        description={
                                                            <div style={{ marginTop: 8 }}>
                                                                <Text type="secondary" block>
                                                                    {test.jobRole || 'Poste non spécifié'} • {test.location || 'Remote'}
                                                                </Text>
                                                                {typeof jobMatch.score === 'number' && (
                                                                    <div style={{ marginTop: 10, maxWidth: 560 }}>
                                                                        <AdvancedJobMatchCanvas jobMatch={jobMatch} variant="compact" />
                                                                    </div>
                                                                )}
                                                                {jobMatch.summary && (
                                                                    <Text type="secondary" block style={{ marginTop: 6 }}>
                                                                        {jobMatch.summary}
                                                                    </Text>
                                                                )}
                                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                                                                    Postulé le {dayjs(app.createdAt).format('DD MMMM YYYY')}
                                                                </Text>

                                                                {app.stage === 'INTERVIEW' && (
                                                                    <>
                                                                        {(() => {
                                                                            const interview = getInterviewForApp(app);
                                                                            if (!interview) {
                                                                                return (
                                                                                    <div style={{ marginTop: 10, padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8 }}>
                                                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                                                            <CalendarOutlined style={{ marginRight: 6 }} />
                                                                                            Entretien en attente de planification.
                                                                                        </Text>
                                                                                    </div>
                                                                                );
                                                                            }

                                                                            const scheduledAt = interview.scheduledAt ? dayjs(interview.scheduledAt) : null;
                                                                            const statusLabel =
                                                                                interview.status === 'SCHEDULED' ? 'Confirmé' :
                                                                                    interview.status === 'COMPLETED' ? 'Terminé' :
                                                                                        interview.status === 'CANCELLED' ? 'Annulé' : 'Entretien';
                                                                            const tagColor =
                                                                                interview.status === 'SCHEDULED' ? 'cyan' :
                                                                                    interview.status === 'COMPLETED' ? 'green' :
                                                                                        interview.status === 'CANCELLED' ? 'red' : 'blue';

                                                                            return (
                                                                                <div style={{ marginTop: 10, padding: '10px 12px', background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 8 }}>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                                                                        <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                            <CalendarOutlined />
                                                                                            {scheduledAt ? `${scheduledAt.format('DD MMMM YYYY')} à ${scheduledAt.format('HH:mm')}` : 'Date inconnue'}
                                                                                        </Text>
                                                                                        <Tag color={tagColor}>{statusLabel}</Tag>
                                                                                    </div>
                                                                                    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                                                            Type : {interview.type === 'onsite' ? 'Sur place' : interview.type === 'phone' ? 'Téléphone' : 'Visio'}
                                                                                        </Text>
                                                                                        {interview.location && (
                                                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                                                Lien / Lieu :{' '}
                                                                                                {interview.location.startsWith('http') ? (
                                                                                                    <a href={interview.location} target="_blank" rel="noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>
                                                                                                        Rejoindre l'entretien
                                                                                                    </a>
                                                                                                ) : (
                                                                                                    <strong>{interview.location}</strong>
                                                                                                )}
                                                                                            </Text>
                                                                                        )}
                                                                                        {interview.messageToCandidate && (
                                                                                            <div style={{ marginTop: 4, padding: '6px 10px', background: 'rgba(255,255,255,0.6)', borderRadius: 6, border: '1px dashed #bae6fd' }}>
                                                                                                <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                                                                                                    « {interview.messageToCandidate} »
                                                                                                </Text>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </>
                                                                )}

                                                                <div style={styles.timelineWrap}>
                                                                    <div style={styles.timelineHead}>
                                                                        <Text strong style={{ fontSize: 12 }}>Historique des étapes</Text>
                                                                        <Tag color={stage.color} style={{ margin: 0 }}>
                                                                            Étape actuelle: {stage.label}
                                                                        </Tag>
                                                                    </div>
                                                                    <div style={styles.timelineList}>
                                                                        {visibleHistory.map((entry, idx) => {
                                                                            const stageMeta = STAGE_MAP[entry.toStage] || STAGE_MAP.NEW;
                                                                            const isCurrent = idx === visibleHistory.length - 1;
                                                                            const isLast = idx === visibleHistory.length - 1;
                                                                            const label = stageMeta.label || entry.toStage || 'Etape';
                                                                            const sourceBadge = getSourceBadge(entry.source);
                                                                            return (
                                                                                <div key={`${app._id}-${entry.toStage}-${idx}`} style={styles.timelineItem}>
                                                                                    <div style={styles.timelineRail}>
                                                                                        <span style={{
                                                                                            ...styles.timelineDot,
                                                                                            boxShadow: isCurrent ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
                                                                                            backgroundColor: stageMeta.color === 'red' ? '#ef4444' :
                                                                                                stageMeta.color === 'green' ? '#22c55e' :
                                                                                                    stageMeta.color === 'blue' ? '#3b82f6' :
                                                                                                        stageMeta.color === 'purple' ? '#8b5cf6' :
                                                                                                            stageMeta.color === 'gold' ? '#f59e0b' :
                                                                                                                stageMeta.color === 'cyan' ? '#06b6d4' : '#64748b'
                                                                                        }} />
                                                                                        {!isLast && <span style={styles.timelineLine} />}
                                                                                    </div>
                                                                                    <div style={{
                                                                                        ...styles.timelineContent,
                                                                                        border: isCurrent ? '1px solid #bfdbfe' : '1px solid transparent',
                                                                                        background: isCurrent ? '#eff6ff' : 'transparent',
                                                                                        borderRadius: 8,
                                                                                        padding: isCurrent ? '6px 8px' : 0,
                                                                                    }}>
                                                                                        <div style={styles.timelineTitleRow}>
                                                                                            <Text style={styles.timelineTitle}>{label}</Text>
                                                                                            <Space size={6}>
                                                                                                <Tag color={sourceBadge.color} style={{ margin: 0, fontSize: 10 }}>
                                                                                                    {sourceBadge.label}
                                                                                                </Tag>
                                                                                                <Text type="secondary" style={styles.timelineDate}>
                                                                                                    {entry.changedAt ? dayjs(entry.changedAt).format('DD MMM YYYY, HH:mm') : 'Date inconnue'}
                                                                                                </Text>
                                                                                            </Space>
                                                                                        </div>
                                                                                        {entry.note ? (
                                                                                            <Text type="secondary" style={styles.timelineNote}>{entry.note}</Text>
                                                                                        ) : null}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    {(hasHidden || stageHistory.length > 2) && (
                                                                        <Button
                                                                            type="link"
                                                                            size="small"
                                                                            style={{ paddingInline: 0, marginTop: 4 }}
                                                                            onClick={() => toggleTimeline(app._id)}
                                                                            icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                                                                        >
                                                                            {isExpanded ? 'Réduire l’historique' : `Voir tout l’historique (${stageHistory.length})`}
                                                                        </Button>
                                                                    )}
                                                                </div>
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
    timelineWrap: {
        marginTop: 14,
        padding: '10px 12px',
        borderRadius: 10,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
    },
    timelineHead: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
    },
    timelineList: {
        marginTop: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    timelineItem: {
        display: 'flex',
        gap: 10,
    },
    timelineRail: {
        width: 14,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexShrink: 0,
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: '50%',
        marginTop: 2,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        minHeight: 14,
        marginTop: 2,
        background: '#cbd5e1',
        borderRadius: 999,
    },
    timelineContent: {
        flex: 1,
        minWidth: 0,
        paddingBottom: 4,
    },
    timelineTitleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 10,
        flexWrap: 'wrap',
    },
    timelineTitle: {
        fontSize: 12,
        fontWeight: 700,
    },
    timelineDate: {
        fontSize: 11,
    },
    timelineNote: {
        display: 'block',
        marginTop: 2,
        fontSize: 11,
    },
    statRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    }
};
