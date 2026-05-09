import { useEffect, useState } from 'react';
import { Table, Typography, Tag, Space, Button, Spin, message, Modal, Card, Row, Col, Statistic, Progress, List, Avatar, Tabs, Divider } from 'antd';
import { fetchMySubmissions, fetchSubmissionDetails } from '../../api/submissions';
import { EyeOutlined, TrophyOutlined, FireOutlined, BarChartOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, UserOutlined, BookOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import AdvancedJobMatchCanvas from '../../Components/AdvancedJobMatchCanvas.jsx';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const STAGE_MAP = {
    NEW: { label: 'Reçu', color: 'blue' },
    SCREENING: { label: 'Présélection', color: 'purple' },
    INTERVIEW: { label: 'Entretien', color: 'cyan' },
    OFFER: { label: 'Offre', color: 'gold' },
    HIRED: { label: 'Recruté', color: 'green' },
    REJECTED: { label: 'Non retenu', color: 'red' },
};

function getStageHistory(submission) {
    const raw = Array.isArray(submission?.stageHistory) ? submission.stageHistory : [];
    if (raw.length > 0) {
        return raw
            .map((entry) => ({
                toStage: entry?.toStage || 'NEW',
                changedAt: entry?.changedAt || null,
                note: entry?.note || '',
                source: entry?.source || 'system',
            }))
            .sort((a, b) => new Date(a.changedAt || 0) - new Date(b.changedAt || 0));
    }
    return [{
        toStage: submission?.stage || 'NEW',
        changedAt: submission?.updatedAt || submission?.createdAt || null,
        note: 'Historique simplifié (ancienne candidature)',
        source: 'system',
    }];
}

function sourceBadgeMeta(source) {
    const normalized = String(source || 'system').toLowerCase();
    if (normalized === 'hr') return { label: 'RH', color: 'purple' };
    if (normalized === 'candidate') return { label: 'Candidat', color: 'blue' };
    return { label: 'Système', color: 'default' };
}

function plagiarismTagMeta(report = {}) {
    const level = String(report?.level || 'low').toLowerCase();
    if (level === 'high') return { color: 'red', label: 'Risque élevé' };
    if (level === 'medium') return { color: 'orange', label: 'À vérifier' };
    return { color: 'green', label: 'Faible' };
}

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
            const passedTests = userSubmissions.filter(sub => (sub.totalScore ?? 0) >= 50).length;
            const failedTests = userSubmissions.filter(sub => (sub.totalScore ?? 0) < 50).length;
            const avgScore = totalTests > 0 
                ? Math.round(userSubmissions.reduce((sum, sub) => sum + (sub.totalScore || 0), 0) / totalTests)
                : 0;
            const bestScore = totalTests > 0 
                ? Math.max(...userSubmissions.map(sub => sub.totalScore || 0))
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
            title: 'CV Match',
            dataIndex: ['jobMatchAnalysis', 'score'],
            key: 'jobMatchScore',
            render: (score) => typeof score === 'number' ? (
                <Tag color={score >= 75 ? 'success' : score >= 55 ? 'warning' : 'error'}>
                    {score} / 100
                </Tag>
            ) : '-',
            sorter: (a, b) => ((a.jobMatchAnalysis?.score || 0) - (b.jobMatchAnalysis?.score || 0))
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
            title: 'Pipeline',
            dataIndex: 'stage',
            key: 'stage',
            render: (stage) => {
                const meta = STAGE_MAP[stage] || STAGE_MAP.NEW;
                return <Tag color={meta.color}>{meta.label}</Tag>;
            },
            filters: Object.entries(STAGE_MAP).map(([value, meta]) => ({ text: meta.label, value })),
            onFilter: (value, record) => record.stage === value,
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
            title: 'Plagiat',
            dataIndex: 'plagiarismReport',
            key: 'plagiarismReport',
            render: (report) => {
                const score = Number(report?.score || 0);
                const meta = plagiarismTagMeta(report);
                return <Tag color={meta.color}>{meta.label} ({score})</Tag>;
            },
            sorter: (a, b) => ((a.plagiarismReport?.score || 0) - (b.plagiarismReport?.score || 0)),
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
                                {typeof selectedDetail.jobMatchAnalysis?.score === 'number' && (
                                    <Tag color={selectedDetail.jobMatchAnalysis.score >= 75 ? 'success' : selectedDetail.jobMatchAnalysis.score >= 55 ? 'warning' : 'error'}>
                                        CV Match {selectedDetail.jobMatchAnalysis.score} / 100
                                    </Tag>
                                )}
                                {selectedDetail.plagiarismReport && (
                                    <Tag color={plagiarismTagMeta(selectedDetail.plagiarismReport).color}>
                                        Plagiat: {plagiarismTagMeta(selectedDetail.plagiarismReport).label} ({Number(selectedDetail.plagiarismReport.score || 0)})
                                    </Tag>
                                )}
                            </div>
                        </div>

                        <Tabs defaultActiveKey="1">
                            <TabPane tab="Match CV" key="cv-match">
                                <AdvancedJobMatchCanvas jobMatch={selectedDetail.jobMatchAnalysis || {}} variant="full" />
                                <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <Paragraph style={{ marginBottom: 12 }}>
                                        {selectedDetail.jobMatchAnalysis?.summary || "Aucune synthèse textuelle pour cette candidature."}
                                    </Paragraph>
                                    {(selectedDetail.jobMatchAnalysis?.matchedSkills || []).length > 0 && (
                                        <>
                                            <Text strong>Compétences alignées</Text>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0 16px' }}>
                                                {selectedDetail.jobMatchAnalysis.matchedSkills.map((skill) => (
                                                    <Tag key={skill} color="green">{skill}</Tag>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {(selectedDetail.jobMatchAnalysis?.missingSkills || []).length > 0 && (
                                        <>
                                            <Text strong>Compétences à renforcer</Text>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                                {selectedDetail.jobMatchAnalysis.missingSkills.map((skill) => (
                                                    <Tag key={skill} color="red">{skill}</Tag>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    {(selectedDetail.jobMatchAnalysis?.candidateActionPlan?.priorities || []).length > 0 && (
                                        <>
                                            <Divider style={{ margin: '14px 0' }} />
                                            <Text strong>Plan d'amélioration recommandé</Text>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                                {selectedDetail.jobMatchAnalysis.candidateActionPlan.priorities.map((item) => (
                                                    <Tag
                                                        key={`${item.skill}-${item.priority}`}
                                                        color={item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'default'}
                                                    >
                                                        {item.skill} ({item.priority})
                                                    </Tag>
                                                ))}
                                            </div>
                                            {(selectedDetail.jobMatchAnalysis?.candidateActionPlan?.nextSteps || []).length > 0 && (
                                                <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                                                    {selectedDetail.jobMatchAnalysis.candidateActionPlan.nextSteps.map((step, idx) => (
                                                        <li key={idx}>
                                                            <Text type="secondary">{step}</Text>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    )}
                                </div>
                            </TabPane>

                            <TabPane tab="🧠 Insights IA" key="insights">
                                {(() => {
                                    const jm = selectedDetail.jobMatchAnalysis || {};
                                    const enriched = jm.enrichedCvSignals || {};
                                    const insights = jm.matchEngine?.creativeInsights || [];
                                    const dims = jm.matchEngine?.dimensions || {};
                                    const actionPlan = jm.candidateActionPlan || {};
                                    return (
                                        <div style={{ display: 'grid', gap: 20, padding: '8px 0' }}>

                                            {/* Score dimensions */}
                                            {Object.keys(dims).length > 0 && (
                                                <div>
                                                    <Text strong style={{ fontSize: 14 }}>📐 Score multi-dimensionnel (14 axes)</Text>
                                                    <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                                                        {[
                                                            { key: 'technicalFit',      label: 'Adéquation technique', color: '#6366f1' },
                                                            { key: 'educationFit',      label: 'Formation',            color: '#8b5cf6' },
                                                            { key: 'certificationBoost',label: 'Certifications',       color: '#f59e0b' },
                                                            { key: 'languageFit',       label: 'Langues',              color: '#06b6d4' },
                                                            { key: 'industryAlignment', label: 'Secteur',              color: '#10b981' },
                                                            { key: 'projectEvidence',   label: 'Projets',              color: '#3b82f6' },
                                                            { key: 'quantifiedImpact',  label: 'Impact chiffré',       color: '#f97316' },
                                                            { key: 'leadershipSignal',  label: 'Leadership',           color: '#ef4444' },
                                                            { key: 'experienceFit',     label: 'Expérience',           color: '#84cc16' },
                                                        ].filter(d => typeof dims[d.key] === 'number').map(d => (
                                                            <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <Text style={{ minWidth: 150, fontSize: 12 }}>{d.label}</Text>
                                                                <Progress percent={dims[d.key]} size="small" strokeColor={d.color} style={{ flex: 1, margin: 0 }} />
                                                                <Text style={{ minWidth: 32, fontSize: 12, textAlign: 'right' }}>{dims[d.key]}</Text>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* CV Signals */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                {enriched.educationLevel && (
                                                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                                        <Text strong style={{ fontSize: 12 }}>🎓 Formation détectée</Text>
                                                        <div style={{ marginTop: 6 }}><Tag color="blue">{enriched.educationLevel}</Tag></div>
                                                    </div>
                                                )}
                                                {enriched.certifications?.length > 0 && (
                                                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                                        <Text strong style={{ fontSize: 12 }}>🏅 Certifications</Text>
                                                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                            {enriched.certifications.map(c => <Tag key={c} color="gold">{c}</Tag>)}
                                                        </div>
                                                    </div>
                                                )}
                                                {enriched.languages?.length > 0 && (
                                                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                                        <Text strong style={{ fontSize: 12 }}>🌐 Langues</Text>
                                                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                            {enriched.languages.map(l => <Tag key={l} color="cyan">{l}</Tag>)}
                                                        </div>
                                                    </div>
                                                )}
                                                {enriched.industryDomains?.length > 0 && (
                                                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                                        <Text strong style={{ fontSize: 12 }}>🏢 Secteurs</Text>
                                                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                            {enriched.industryDomains.map(d => <Tag key={d} color="purple">{d}</Tag>)}
                                                        </div>
                                                    </div>
                                                )}
                                                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                                    <Text strong style={{ fontSize: 12 }}>📊 Impact chiffré</Text>
                                                    <div style={{ marginTop: 6 }}>
                                                        {enriched.quantifiedAchievements > 0
                                                            ? <Tag color={enriched.quantifiedAchievements >= 2 ? 'green' : 'orange'}>{enriched.quantifiedAchievements} réalisation(s)</Tag>
                                                            : <Text type="secondary" style={{ fontSize: 12 }}>Non détecté — ajoutez des métriques à votre CV</Text>}
                                                    </div>
                                                </div>
                                                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                                    <Text strong style={{ fontSize: 12 }}>🎯 Leadership</Text>
                                                    <div style={{ marginTop: 6 }}>
                                                        {enriched.leadershipSignals > 0
                                                            ? <Tag color="green">{enriched.leadershipSignals} signal(s)</Tag>
                                                            : <Text type="secondary" style={{ fontSize: 12 }}>Non détecté</Text>}
                                                    </div>
                                                </div>
                                                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                                    <Text strong style={{ fontSize: 12 }}>💻 Projets & présence</Text>
                                                    <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                        {enriched.hasOpenSourceContributions && <Tag color="green">Open Source</Tag>}
                                                        {enriched.hasLiveProjects && <Tag color="green">En ligne</Tag>}
                                                        {!enriched.hasOpenSourceContributions && !enriched.hasLiveProjects && <Text type="secondary" style={{ fontSize: 12 }}>Ajoutez GitHub/portfolio</Text>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Creative insights */}
                                            {insights.length > 0 && (
                                                <div style={{ background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)', padding: 16, borderRadius: 12, border: '1px solid #ddd6fe' }}>
                                                    <Text strong style={{ fontSize: 13 }}>💡 Analyse narrative IA</Text>
                                                    <ul style={{ paddingLeft: 18, margin: '10px 0 0' }}>
                                                        {insights.map((line, i) => (
                                                            <li key={i} style={{ marginBottom: 7, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                                                                {line.replace(/\*\*/g, '')}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Action plan next steps */}
                                            {actionPlan.nextSteps?.length > 0 && (
                                                <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 12, border: '1px solid #bbf7d0' }}>
                                                    <Text strong style={{ fontSize: 13, color: '#15803d' }}>✅ Plan d'action personnalisé</Text>
                                                    <ul style={{ paddingLeft: 18, margin: '10px 0 0' }}>
                                                        {actionPlan.nextSteps.map((step, i) => (
                                                            <li key={i} style={{ marginBottom: 6, fontSize: 13, color: '#374151' }}>{step}</li>
                                                        ))}
                                                    </ul>
                                                    {actionPlan.readinessLabel && (
                                                        <Tag color={actionPlan.readinessLabel.includes('Prêt') ? 'green' : actionPlan.readinessLabel.includes('Bon') ? 'blue' : 'orange'} style={{ marginTop: 10 }}>
                                                            {actionPlan.readinessLabel}
                                                        </Tag>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </TabPane>

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

                            <TabPane tab="Par compétence" key="comp">
                                {(selectedDetail.competencyBreakdown || []).length === 0 ? (
                                    <Paragraph type="secondary">Non disponible (test uniquement QCM ou évaluation sans détail par compétence).</Paragraph>
                                ) : (
                                    <Table
                                        size="small"
                                        pagination={false}
                                        rowKey={(r, i) => `${r.competency}-${i}`}
                                        dataSource={selectedDetail.competencyBreakdown}
                                        columns={[
                                            { title: 'Compétence', dataIndex: 'competency' },
                                            {
                                                title: 'Niveau',
                                                dataIndex: 'score',
                                                width: 180,
                                                render: (s) => (
                                                    <Progress
                                                        percent={s}
                                                        size="small"
                                                        status={s >= 60 ? 'success' : s >= 40 ? 'normal' : 'exception'}
                                                    />
                                                ),
                                            },
                                            { title: 'Commentaire', dataIndex: 'comment', ellipsis: true },
                                        ]}
                                    />
                                )}
                            </TabPane>
                            
                            <TabPane tab="Détails Techniques" key="2">
                                <div style={{ padding: '20px 0' }}>
                                    <List
                                        dataSource={[
                                            { label: 'Date de passage', value: new Date(selectedDetail.createdAt).toLocaleString('fr-FR') },
                                            { label: 'Durée', value: selectedDetail.timeSpent ? `${Math.round(selectedDetail.timeSpent / 60)} minutes` : 'N/A' },
                                            { label: 'Nombre de questions', value: selectedDetail.answers?.length || 0 },
                                            { label: 'Questions correctes', value: selectedDetail.correctAnswers || 0 },
                                            {
                                                label: 'Score anti-plagiat',
                                                value: `${Number(selectedDetail?.plagiarismReport?.score || 0)} / 100 (${plagiarismTagMeta(selectedDetail?.plagiarismReport).label})`
                                            }
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
                                    <Divider />
                                    <Title level={5} style={{ marginTop: 0 }}>Historique des étapes</Title>
                                    <div style={styles.timelineWrap}>
                                        {getStageHistory(selectedDetail).map((entry, idx, arr) => {
                                            const meta = STAGE_MAP[entry.toStage] || STAGE_MAP.NEW;
                                            const sourceMeta = sourceBadgeMeta(entry.source);
                                            const isLast = idx === arr.length - 1;
                                            return (
                                                <div key={`${entry.toStage}-${idx}`} style={styles.timelineItem}>
                                                    <div style={styles.timelineRail}>
                                                        <span style={styles.timelineDot} />
                                                        {!isLast && <span style={styles.timelineLine} />}
                                                    </div>
                                                    <div style={styles.timelineContent}>
                                                        <Space wrap>
                                                            <Tag color={meta.color} style={{ margin: 0 }}>{meta.label}</Tag>
                                                            <Tag color={sourceMeta.color} style={{ margin: 0 }}>{sourceMeta.label}</Tag>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                {entry.changedAt ? new Date(entry.changedAt).toLocaleString('fr-FR') : 'Date inconnue'}
                                                            </Text>
                                                        </Space>
                                                        {entry.note ? (
                                                            <div style={{ marginTop: 4 }}>
                                                                <Text type="secondary" style={{ fontSize: 12 }}>{entry.note}</Text>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
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
    },
    timelineWrap: {
        marginTop: 12,
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        background: '#f8fafc',
        padding: '10px 12px',
    },
    timelineItem: {
        display: 'flex',
        gap: 8,
    },
    timelineRail: {
        width: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexShrink: 0,
    },
    timelineDot: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        marginTop: 6,
        background: '#3b82f6',
    },
    timelineLine: {
        width: 2,
        minHeight: 16,
        flex: 1,
        marginTop: 2,
        background: '#cbd5e1',
    },
    timelineContent: {
        flex: 1,
        minWidth: 0,
        paddingBottom: 8,
    }
};

export default CandidateResults;
