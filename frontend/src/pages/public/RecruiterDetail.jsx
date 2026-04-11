import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Card, Col, Empty, Row, Spin, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, GlobalOutlined, UserOutlined } from '@ant-design/icons';
import { getRecruiterById } from '../../api/company';
import { baseUrl } from '../../api/api';

const { Title, Paragraph, Text } = Typography;

export default function RecruiterDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [recruiter, setRecruiter] = useState(null);
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await getRecruiterById(id);
                if (!res.status) throw new Error(res.message || 'Impossible de charger le profil recruteur');
                setRecruiter(res.recruiter);
                setJobs(res.jobs || []);
            } catch (error) {
                message.error(error.message || 'Erreur de chargement');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return <div style={styles.loader}><Spin size="large" /></div>;
    if (!recruiter) return <Empty description="Recruteur introuvable" style={{ padding: '80px 0' }} />;

    return (
        <div className="recruiter-detail-page wow-public-page" style={styles.page}>
            <div className="recruiter-detail-container" style={styles.container}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/recruiters')} style={{ marginBottom: 24 }}>
                    Retour aux recruteurs
                </Button>

                <Card className="recruiter-detail-hero-card" style={styles.heroCard}>
                    <div style={styles.hero}>
                        <Avatar
                            size={96}
                            src={recruiter.avatar ? `${baseUrl}${recruiter.avatar}` : null}
                            icon={<UserOutlined />}
                        />
                        <div style={{ flex: 1 }}>
                            <Title level={2} style={{ marginBottom: 8 }}>
                                {recruiter.firstName} {recruiter.lastName}
                            </Title>
                            <div style={styles.metaRow}>
                                <Tag color="blue">Recruteur</Tag>
                                {recruiter.city && <Tag color="green"><EnvironmentOutlined /> {recruiter.city}</Tag>}
                                {recruiter.companyId?.name && <Tag color="purple">{recruiter.companyId.name}</Tag>}
                            </div>
                            <Paragraph style={{ color: '#475569', fontSize: 15 }}>
                                {recruiter.bio || "Ce recruteur n'a pas encore ajouté de présentation publique."}
                            </Paragraph>
                            {recruiter.companyId?._id && (
                                <Button onClick={() => navigate(`/companies/${recruiter.companyId._id}`)}>
                                    Voir l'entreprise
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                {recruiter.companyId && (
                    <Card className="recruiter-detail-card" style={{ ...styles.card, marginBottom: 24 }}>
                        <Title level={4}>Entreprise associée</Title>
                        <Text strong>{recruiter.companyId.name}</Text>
                        <Paragraph style={{ marginTop: 8, color: '#475569' }}>
                            {recruiter.companyId.description || 'Aucune description disponible.'}
                        </Paragraph>
                        {recruiter.companyId.website && (
                            <Button type="link" href={recruiter.companyId.website} target="_blank" icon={<GlobalOutlined />} style={{ paddingLeft: 0 }}>
                                Site web de l'entreprise
                            </Button>
                        )}
                    </Card>
                )}

                <div style={styles.sectionHeader}>
                    <Title level={3} style={{ margin: 0 }}>Offres gérées par ce recruteur</Title>
                    <Text type="secondary">{jobs.length} offre(s)</Text>
                </div>

                {jobs.length === 0 ? (
                    <Empty description="Aucune offre publique n'est associée à ce recruteur." />
                ) : (
                    <Row gutter={[16, 16]}>
                        {jobs.map((job) => (
                            <Col xs={24} md={12} key={job._id}>
                                <Card className="recruiter-detail-card" style={styles.card}>
                                    <Title level={4} style={{ marginBottom: 8 }}>{job.title}</Title>
                                    <Text type="secondary">{job.jobRole}</Text>
                                    <div style={styles.metaRow}>
                                        {job.location && <Tag>{job.location}</Tag>}
                                        {job.employmentType && <Tag color="cyan">{job.employmentType}</Tag>}
                                    </div>
                                    <Button type="primary" onClick={() => navigate(`/careers/${job._id}`)}>
                                        Consulter l'offre
                                    </Button>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', background: '#f8fafc', padding: '32px 0 64px' },
    container: { maxWidth: 1100, margin: '0 auto', padding: '0 24px' },
    loader: { display: 'flex', justifyContent: 'center', padding: 80 },
    heroCard: { borderRadius: 20, marginBottom: 24, border: '1px solid #e2e8f0' },
    hero: { display: 'flex', gap: 24, alignItems: 'flex-start' },
    metaRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    card: { borderRadius: 16, border: '1px solid #e2e8f0' },
};
