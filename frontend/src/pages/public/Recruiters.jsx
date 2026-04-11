import React, { useEffect, useState } from 'react';
import { Typography, Spin, Card, Button, Input, Empty, Row, Col, message, Avatar, Badge } from 'antd';
import { SearchOutlined, EnvironmentOutlined, GlobalOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getRecruiters } from '../../api/company';
import { motion } from 'framer-motion';
import { baseUrl } from '../../api/api';

const { Title, Text, Paragraph } = Typography;

export default function Recruiters() {
    const [recruiters, setRecruiters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 12
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecruiters = async () => {
            try {
                setLoading(true);
                const params = {
                    page: pagination.currentPage,
                    limit: pagination.itemsPerPage,
                    search: searchTerm,
                };
                
                const response = await getRecruiters(params);
                if (response.status) {
                    setRecruiters(response.recruiters);
                    setPagination(response.pagination || pagination);
                } else {
                    message.error('Erreur lors du chargement des recruteurs');
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecruiters();
    }, [pagination.currentPage, searchTerm]);

    return (
        <motion.div className="recruiters-page wow-public-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.page}>
            <header className="recruiters-header" style={styles.header}>
                <div style={styles.container}>
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} style={styles.heroContent}>
                        <Title style={styles.heroTitle}>Découvrez nos Recruteurs</Title>
                        <Paragraph style={styles.heroSubtitle}>
                            Entrez en contact avec les professionnels des ressources humaines qui recrutent.
                        </Paragraph>

                        <div style={styles.searchWrap}>
                            <Input 
                                size="large" 
                                placeholder="Rechercher par nom..." 
                                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                style={styles.searchInput}
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    setPagination({...pagination, currentPage: 1});
                                }}
                            />
                        </div>
                    </motion.div>
                </div>
            </header>

            <main className="recruiters-main" style={styles.main}>
                <div style={{ ...styles.container, maxWidth: 1200 }}>
                    <div style={styles.listHeader}>
                        <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                            {pagination.totalItems} Recruteur{pagination.totalItems !== 1 ? 's' : ''}
                        </Title>
                    </div>

                    {loading ? (
                        <div style={styles.loader}>
                            <Spin size="large" />
                        </div>
                    ) : recruiters.length === 0 ? (
                        <Empty description="Aucun recruteur trouvé." style={{ padding: '80px 0', background: '#fff', borderRadius: 16 }} />
                    ) : (
                        <>
                        <Row gutter={[24, 24]}>
                            {recruiters.map((recruiter, index) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={recruiter._id}>
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.05, duration: 0.3 }}
                                        whileHover={{ y: -5 }}
                                    >
                                        <Card
                                            className="recruiters-card"
                                            style={styles.recruiterCard} 
                                            bodyStyle={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                        >
                                            <Badge count={recruiter.activeJobCount > 0 ? `${recruiter.activeJobCount} offres` : 0} offset={[-10, 10]} color="#10b981">
                                                <Avatar 
                                                    size={80} 
                                                    src={recruiter.avatar ? `${baseUrl}${recruiter.avatar}` : null}
                                                    style={{ border: '3px solid #f8fafc', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}
                                                >
                                                    {recruiter.firstName?.charAt(0)}{recruiter.lastName?.charAt(0)}
                                                </Avatar>
                                            </Badge>
                                            
                                            <Title level={4} style={styles.recruiterName}>
                                                {recruiter.firstName} {recruiter.lastName}
                                            </Title>
                                            
                                            <Text style={styles.recruiterContext}>Recrutement & RH</Text>

                                            {recruiter.companyId ? (
                                                <div style={styles.companyPill}>
                                                    {recruiter.companyId.logo ? (
                                                        <Avatar src={`${baseUrl}${recruiter.companyId.logo}`} size="small" />
                                                    ) : (
                                                        <GlobalOutlined />
                                                    )}
                                                    <span style={{ fontWeight: 600 }}>{recruiter.companyId.name}</span>
                                                </div>
                                            ) : (
                                                <div style={{ height: 28, marginBottom: 16 }} />
                                            )}

                                            <Paragraph ellipsis={{ rows: 2 }} style={styles.bio}>
                                                {recruiter.bio || "Aucune description fournie par ce recruteur."}
                                            </Paragraph>
                                            
                                            <div style={styles.footerMeta}>
                                                <Text style={styles.metaItem}>
                                                    <EnvironmentOutlined style={{ marginRight: 6 }} /> 
                                                    {recruiter.city || (recruiter.companyId?.city) || 'Non spécifié'}
                                                </Text>
                                            </div>
                                            <Button
                                                type="primary"
                                                style={{ marginTop: 16, width: '100%' }}
                                                onClick={() => navigate(`/recruiters/${recruiter._id}`)}
                                            >
                                                Consulter le profil
                                            </Button>
                                        </Card>
                                    </motion.div>
                                </Col>
                            ))}
                        </Row>
                        
                        {pagination.totalPages > 1 && (
                            <div style={styles.pagination}>
                                <Button 
                                    onClick={() => setPagination({...pagination, currentPage: pagination.currentPage - 1})}
                                    disabled={pagination.currentPage === 1}
                                >
                                    Précédent
                                </Button>
                                <Text style={{ margin: '0 15px', color: '#64748b' }}>
                                    Page {pagination.currentPage} sur {pagination.totalPages}
                                </Text>
                                <Button 
                                    onClick={() => setPagination({...pagination, currentPage: pagination.currentPage + 1})}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                >
                                    Suivant
                                </Button>
                            </div>
                        )}
                        </>
                    )}
                </div>
            </main>
        </motion.div>
    );
}

const styles = {
    page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" },
    header: { background: 'linear-gradient(135deg, #0f172a 0%, #172554 100%)', padding: '60px 0 80px 0', color: '#fff' },
    container: { maxWidth: 1100, margin: '0 auto', padding: '0 24px' },
    heroContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 700, margin: '0 auto' },
    heroTitle: { color: '#fff', fontSize: 42, fontWeight: 800, marginBottom: 16 },
    heroSubtitle: { color: '#cbd5e1', fontSize: 18, marginBottom: 32 },
    searchWrap: { width: '100%', display: 'flex', justifyContent: 'center' },
    searchInput: { borderRadius: 12, flex: 1, maxWidth: 400 },
    main: { padding: '0 0 80px 0', marginTop: -40 },
    listHeader: { marginBottom: 24, padding: '0 8px' },
    loader: { display: 'flex', justifyContent: 'center', padding: 80 },
    recruiterCard: {
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        height: '100%',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    },
    recruiterName: { margin: '16px 0 4px 0', fontSize: 18, fontWeight: 700, color: '#0f172a', textAlign: 'center' },
    recruiterContext: { color: '#64748b', fontSize: 13, marginBottom: 12 },
    companyPill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: '#f1f5f9',
        padding: '4px 12px 4px 4px',
        borderRadius: 99,
        marginBottom: 16,
        color: '#334155',
        fontSize: 13
    },
    bio: { color: '#64748b', fontSize: 13, minHeight: 44, textAlign: 'center', margin: '0 0 16px 0' },
    footerMeta: { marginTop: 'auto', paddingTop: 16, borderTop: '1px dashed #e2e8f0', width: '100%', textAlign: 'center' },
    metaItem: { fontSize: 13, color: '#94a3b8' },
    pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 40, paddingTop: '20px' },
};
