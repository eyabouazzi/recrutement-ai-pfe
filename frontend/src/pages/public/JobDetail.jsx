import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Tag, Spin, Card, Divider, message } from 'antd';
import { EnvironmentOutlined, ClockCircleOutlined, SolutionOutlined, ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons';
import { getPublicTests } from '../../api/tests';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function JobDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await getPublicTests();
                const found = response.tests.find(t => t._id === id);
                if (found) {
                    setJob(found);
                } else {
                    message.error("Offre introuvable");
                    navigate('/careers');
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id, navigate]);

    if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
    if (!job) return null;

    const handleApply = () => {
        sessionStorage.setItem('pendingTestId', job._id);
        navigate('/login');
    };

    return (
        <div style={s.page}>
            <div style={s.container}>
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => navigate('/careers')}
                    style={{ marginBottom: 24 }}
                >
                    Retour aux offres
                </Button>

                <div style={s.layout}>
                    <div style={s.main}>
                        <div style={s.header}>
                            <Tag color="blue" style={{ marginBottom: 12 }}>{job.employmentType || 'CDI'}</Tag>
                            <Title style={{ margin: 0, fontSize: 36 }}>{job.title}</Title>
                            <Text type="secondary" style={{ fontSize: 18 }}>{job.jobRole}</Text>
                        </div>

                        <div style={s.metaGrid}>
                            <div style={s.metaCard}>
                                <EnvironmentOutlined style={s.metaIcon} />
                                <div>
                                    <Text strong block>Localisation</Text>
                                    <Text type="secondary">{job.location || 'Remote'}</Text>
                                </div>
                            </div>
                            <div style={s.metaCard}>
                                <ClockCircleOutlined style={s.metaIcon} />
                                <div>
                                    <Text strong block>Type de contrat</Text>
                                    <Text type="secondary">{job.employmentType || 'Temps plein'}</Text>
                                </div>
                            </div>
                            <div style={s.metaCard}>
                                <CalendarOutlined style={s.metaIcon} />
                                <div>
                                    <Text strong block>Publié le</Text>
                                    <Text type="secondary">{dayjs(job.createdAt).format('DD MMM YYYY')}</Text>
                                </div>
                            </div>
                        </div>

                        <Divider />

                        <div style={s.description}>
                            <Title level={4}>Description du poste</Title>
                            <Paragraph style={{ fontSize: 16, lineHeight: 1.8, color: '#4b5563' }}>
                                {job.description}
                            </Paragraph>
                        </div>
                    </div>

                    <div style={s.sidebar}>
                        <Card style={s.applyCard}>
                            <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>Prêt à postuler ?</Title>
                            <Text block style={{ textAlign: 'center', marginBottom: 32, color: '#64748b' }}>
                                Le processus inclut une évaluation technique de {job.timeLimit} minutes pour valider vos compétences.
                            </Text>
                            <Button 
                                type="primary" 
                                size="large" 
                                block 
                                onClick={handleApply}
                                style={s.applyBtn}
                            >
                                Postuler maintenant
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

const s = {
    page: { background: '#f8fafc', minHeight: '100vh', padding: '40px 0' },
    container: { maxWidth: 1000, margin: '0 auto', padding: '0 24px' },
    layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40 },
    main: { background: '#fff', padding: 40, borderRadius: 16, border: '1px solid #e2e8f0' },
    header: { marginBottom: 40 },
    metaGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 },
    metaCard: { display: 'flex', gap: 12, alignItems: 'flex-start' },
    metaIcon: { color: '#2563eb', fontSize: 20, marginTop: 4 },
    description: { marginTop: 40 },
    sidebar: {},
    applyCard: { borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' },
    applyBtn: { height: 50, borderRadius: 12, fontWeight: 700, fontSize: 16 }
};
