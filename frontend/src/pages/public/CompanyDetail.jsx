import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Col, Empty, Row, Spin, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, GlobalOutlined, TeamOutlined } from '@ant-design/icons';
import { getCompanyById } from '../../api/company';
import { baseUrl } from '../../api/api';

const { Title, Paragraph, Text } = Typography;

export default function CompanyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState(null);
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await getCompanyById(id);
                if (!res.status) throw new Error(res.message || 'Impossible de charger le profil entreprise');
                setCompany(res.company);
                setJobs(res.jobs || []);
            } catch (error) {
                message.error(error.message || 'Erreur de chargement');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) {
        return <div style={styles.loader}><Spin size="large" /></div>;
    }

    if (!company) {
        return <Empty description="Entreprise introuvable" style={{ padding: '80px 0' }} />;
    }

    return (
        <div className="company-detail-page wow-public-page" style={styles.page}>
            <div className="company-detail-container" style={styles.container}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/companies')} style={{ marginBottom: 24 }}>
                    Retour aux entreprises
                </Button>

                <Card className="company-detail-hero-card" style={styles.heroCard}>
                    <div style={styles.hero}>
                        <div style={styles.logoWrap}>
                            {company.logo ? (
                                <img src={`${baseUrl}${company.logo}`} alt={company.name} style={styles.logo} />
                            ) : (
                                <div style={styles.logoFallback}>{company.name?.charAt(0)}</div>
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <Title level={2} style={{ marginBottom: 8 }}>{company.name}</Title>
                            <div style={styles.metaRow}>
                                {company.sector && <Tag color="blue">{company.sector}</Tag>}
                                {company.size && <Tag color="purple"><TeamOutlined /> {company.size}</Tag>}
                                {company.city && <Tag color="green"><EnvironmentOutlined /> {company.city}</Tag>}
                            </div>
                            <Paragraph style={{ color: '#475569', fontSize: 15 }}>
                                {company.description || "Aucune description publique n'a encore été ajoutée."}
                            </Paragraph>
                            {company.website && (
                                <Button type="link" href={company.website} target="_blank" icon={<GlobalOutlined />} style={{ paddingLeft: 0 }}>
                                    Visiter le site web
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                <div style={styles.sectionHeader}>
                    <Title level={3} style={{ margin: 0 }}>Recruteurs</Title>
                    <Text type="secondary">{(company.hrUsers || []).length} profil(s) visible(s)</Text>
                </div>
                <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                    {(company.hrUsers || []).map((hr) => (
                        <Col xs={24} md={12} lg={8} key={hr._id}>
                            <Card className="company-detail-card" style={styles.card}>
                                <Title level={5} style={{ marginBottom: 6 }}>{hr.firstName} {hr.lastName}</Title>
                                <Text type="secondary">Recrutement / RH</Text>
                                <div style={{ marginTop: 16 }}>
                                    <Button onClick={() => navigate(`/recruiters/${hr._id}`)}>Voir le profil</Button>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                <div style={styles.sectionHeader}>
                    <Title level={3} style={{ margin: 0 }}>Offres d'emploi publiées</Title>
                    <Text type="secondary">{jobs.length} offre(s)</Text>
                </div>
                {jobs.length === 0 ? (
                    <Empty description="Aucune offre publique disponible pour cette entreprise." />
                ) : (
                    <Row gutter={[16, 16]}>
                        {jobs.map((job) => (
                            <Col xs={24} md={12} key={job._id}>
                                <Card className="company-detail-card" style={styles.card}>
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
    heroCard: { borderRadius: 20, marginBottom: 32, border: '1px solid #e2e8f0' },
    hero: { display: 'flex', gap: 24, alignItems: 'flex-start' },
    logoWrap: { width: 96, height: 96, borderRadius: 20, overflow: 'hidden', flexShrink: 0, background: '#eef2ff' },
    logo: { width: '100%', height: '100%', objectFit: 'cover' },
    logoFallback: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: '#4338ca' },
    metaRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    card: { borderRadius: 16, border: '1px solid #e2e8f0' },
};
