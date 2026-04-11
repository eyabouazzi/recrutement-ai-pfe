import React, { useEffect, useState, useDeferredValue } from 'react';
import { Typography, Spin, Card, Button, Input, Empty, Row, Col, message, Select, Tag, Modal, Rate, Badge, Tooltip, Pagination } from 'antd';
import { SearchOutlined, EnvironmentOutlined, GlobalOutlined, TeamOutlined, RightOutlined, StarOutlined, ThunderboltOutlined, EyeOutlined, AppstoreOutlined, UnorderedListOutlined, RiseOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCompanies } from '../../api/company';
import { motion, AnimatePresence } from 'framer-motion';
import { baseUrl } from '../../api/api';
import '../../styles/companies.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function Companies() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sectorFilter, setSectorFilter] = useState('');
    const [sizeFilter, setSizeFilter] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const [viewMode, setViewMode] = useState('grid');
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [featuredCompanies, setFeaturedCompanies] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 12
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchCompanies();
        fetchFeaturedCompanies();
    }, [pagination.currentPage, deferredSearchTerm, sectorFilter, sizeFilter, sortBy]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.currentPage,
                limit: pagination.itemsPerPage,
                search: deferredSearchTerm,
                sector: sectorFilter,
                size: sizeFilter,
                sort: sortBy
            };
            
            const response = await getCompanies(params);
            if (response.status) {
                let filteredCompanies = response.companies;
                
                // Client-side sorting
                if (sortBy === 'rating') {
                    filteredCompanies.sort((a, b) => {
                        const aScore = a.rating ?? a.activeJobCount ?? 0;
                        const bScore = b.rating ?? b.activeJobCount ?? 0;
                        return bScore - aScore;
                    });
                } else if (sortBy === 'size') {
                    filteredCompanies.sort((a, b) => getSizeRank(b.size) - getSizeRank(a.size));
                }
                
                setCompanies(filteredCompanies);
                setPagination(response.pagination || pagination);
            } else {
                message.error('Erreur lors du chargement des entreprises');
            }
        } catch (error) {
            console.error('Error:', error);
            message.error('Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const fetchFeaturedCompanies = async () => {
        try {
            const params = {
                page: 1,
                limit: 6,
                featured: true
            };
            const response = await getCompanies(params);
            if (response.status) {
                setFeaturedCompanies(response.companies);
            }
        } catch (error) {
            console.error('Error fetching featured:', error);
        }
    };

    const handleQuickView = (company) => {
        setSelectedCompany(company);
        setModalVisible(true);
    };

    const getSizeRank = (size) => {
        if (!size) return 0;
        if (typeof size === 'number') {
            if (size < 50) return 1;
            if (size < 250) return 2;
            return 3;
        }
        const ranks = { '1-10': 1, '11-50': 1, '51-200': 2, '201-500': 2, '500+': 3 };
        return ranks[String(size)] || 0;
    };

    const getSizeLabel = (size) => {
        if (!size) return 'N/A';
        if (typeof size === 'number') {
            if (size < 50) return 'PME';
            if (size < 250) return 'ETI';
            return 'Grande Entreprise';
        }
        if (['1-10', '11-50'].includes(size)) return 'PME';
        if (['51-200', '201-500'].includes(size)) return 'ETI';
        return 'Grande Entreprise';
    };

    const getSizeColor = (size) => {
        if (!size) return 'default';
        if (typeof size === 'number') {
            if (size < 50) return 'green';
            if (size < 250) return 'blue';
            return 'purple';
        }
        if (['1-10', '11-50'].includes(size)) return 'green';
        if (['51-200', '201-500'].includes(size)) return 'blue';
        return 'purple';
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            style={styles.page}
            className="companies-page wow-public-page"
        >
            {/* ═══════════════════════════════════ HERO SECTION ══════════════════════════════ */}
            <header className="companies-header" style={styles.header}>
                <div style={styles.container}>
                    {/* Animated Background Elements */}
                    <div className="hero-mesh" style={styles.heroMesh} />
                    <div className="hero-particles" style={styles.heroParticles} />
                    
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        transition={{ duration: 0.5 }} 
                        style={styles.heroContent}
                    >
                        <Badge.Ribbon text="🚀 +500 Entreprises" color="purple" style={styles.heroBadge}>
                            <div style={{ padding: '8px 24px', background: 'rgba(255,255,255,0.1)', borderRadius: 999, backdropFilter: 'blur(10px)' }}>
                                <ThunderboltOutlined style={{ marginRight: 8 }} />
                                Partenaires Premium
                            </div>
                        </Badge.Ribbon>
                        
                        <Title style={styles.heroTitle}>Nos entreprises partenaires</Title>
                        <Paragraph style={styles.heroSubtitle}>
                            Découvrez des entreprises innovantes et trouvez celle qui correspond à votre culture.
                        </Paragraph>

                        <div style={styles.searchWrap}>
                            <Input 
                                size="large" 
                                placeholder="Rechercher une entreprise, un poste..." 
                                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                style={styles.searchInput}
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                                }}
                                onPressEnter={() => fetchCompanies()}
                            />
                            
                            <div style={styles.filtersRow}>
                                <Select
                                    size="large"
                                    placeholder="Secteur d'activité"
                                    style={{ width: 180 }}
                                    allowClear
                                    onChange={val => {
                                        setSectorFilter(val);
                                        setPagination(prev => ({ ...prev, currentPage: 1 }));
                                    }}
                                >
                                    <Option value="IT">Informatique & Tech</Option>
                                    <Option value="Finance">Finance & Assurance</Option>
                                    <Option value="Marketing">Marketing & Communication</Option>
                                    <Option value="Rh">Ressources Humaines</Option>
                                    <Option value="Industrie">Industrie</Option>
                                    <Option value="Sante">Santé & Social</Option>
                                    <Option value="Commerce">Commerce & Vente</Option>
                                </Select>
                                
                                <Select
                                    size="large"
                                    placeholder="Taille"
                                    style={{ width: 140, marginLeft: 12 }}
                                    allowClear
                                    onChange={val => {
                                        setSizeFilter(val);
                                        setPagination(prev => ({ ...prev, currentPage: 1 }));
                                    }}
                                >
                                    <Option value="small">&lt; 50 (PME)</Option>
                                    <Option value="medium">50-250 (ETI)</Option>
                                    <Option value="large">&gt; 250 (GE)</Option>
                                </Select>
                                
                                <Select
                                    size="large"
                                    placeholder="Trier par"
                                    style={{ width: 160, marginLeft: 12 }}
                                    defaultValue="name"
                                    onChange={setSortBy}
                                >
                                    <Option value="name">Nom A-Z</Option>
                                    <Option value="rating">Meilleures notes</Option>
                                    <Option value="size">Taille</Option>
                                </Select>
                            </div>
                        </div>
                        
                        {/* Quick Stats */}
                        <motion.div 
                            style={styles.statsRow}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <div style={styles.statItem}>
                                <TeamOutlined style={styles.statIcon} />
                                <div>
                                    <div style={styles.statValue}>{pagination.totalItems}+</div>
                                    <div style={styles.statLabel}>Entreprises</div>
                                </div>
                            </div>
                            <div style={styles.statDivider} />
                            <div style={styles.statItem}>
                                <StarOutlined style={{ ...styles.statIcon, color: '#fbbf24' }} />
                                <div>
                                    <div style={styles.statValue}>4.8/5</div>
                                    <div style={styles.statLabel}>Note moyenne</div>
                                </div>
                            </div>
                            <div style={styles.statDivider} />
                            <div style={styles.statItem}>
                                <CheckCircleOutlined style={{ ...styles.statIcon, color: '#34d399' }} />
                                <div>
                                    <div style={styles.statValue}>{featuredCompanies.length}</div>
                                    <div style={styles.statLabel}>Partenaires Premium</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </header>

            {/* ═══════════════════════════ FEATURED COMPANIES ══════════════════════════════ */}
            {featuredCompanies.length > 0 && (
                <section style={styles.featuredSection}>
                    <div style={{ ...styles.container, maxWidth: 1200 }}>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Title level={2} style={styles.sectionTitle}>
                                <ThunderboltOutlined style={{ color: '#fbbf24', marginRight: 8 }} />
                                Entreprises en Vedette
                            </Title>
                        </motion.div>
                        
                        <Row gutter={[20, 20]}>
                            {featuredCompanies.map((company, index) => (
                                <Col xs={24} sm={12} md={8} lg={4} key={company._id}>
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: index * 0.1, duration: 0.4 }}
                                        whileHover={{ scale: 1.05, y: -8 }}
                                    >
                                        <Card 
                                            style={styles.featuredCard}
                                            bodyStyle={{ padding: 16 }}
                                            hoverable
                                            onClick={() => navigate(`/companies/${company._id}`)}
                                        >
                                            <div style={styles.featuredLogoWrap}>
                                                {company.logo ? (
                                                    <img src={`${baseUrl}${company.logo}`} alt={company.name} style={styles.featuredLogo} />
                                                ) : (
                                                    <div style={styles.featuredLogoPlaceholder}>{company.name.charAt(0)}</div>
                                                )}
                                            </div>
                                            <Text strong style={styles.featuredName}>{company.name}</Text>
                                            <div style={styles.featuredMeta}>
                                                <Rate disabled defaultValue={company.rating || 5} style={{ fontSize: 12 }} />
                                            </div>
                                            <Tag color="purple" style={styles.featuredTag}>Premium</Tag>
                                        </Card>
                                    </motion.div>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </section>
            )}

            {/* ═══════════════════════════ MAIN LISTINGS ══════════════════════════════ */}
            <main className="companies-main" style={styles.main}>
                <div style={{ ...styles.container, maxWidth: 1200 }}>
                    {/* List Header with View Toggle */}
                    <div style={styles.listHeader}>
                        <div style={styles.resultsInfo}>
                            <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                                <RiseOutlined style={{ marginRight: 8, color: '#6366f1' }} />
                                {pagination.totalItems} Entreprise{pagination.totalItems !== 1 ? 's' : ''}
                            </Title>
                            {(sectorFilter || sizeFilter || searchTerm) && (
                                <Button 
                                    size="small" 
                                    onClick={() => {
                                        setSectorFilter('');
                                        setSizeFilter('');
                                        setSearchTerm('');
                                        setPagination(prev => ({ ...prev, currentPage: 1 }));
                                    }}
                                >
                                    Effacer les filtres
                                </Button>
                            )}
                        </div>
                        
                        <div style={styles.viewToggle}>
                            <Tooltip title="Vue Grille">
                                <Button
                                    type={viewMode === 'grid' ? 'primary' : 'default'}
                                    icon={<AppstoreOutlined />}
                                    onClick={() => setViewMode('grid')}
                                    size="small"
                                />
                            </Tooltip>
                            <Tooltip title="Vue Liste">
                                <Button
                                    type={viewMode === 'list' ? 'primary' : 'default'}
                                    icon={<UnorderedListOutlined />}
                                    onClick={() => setViewMode('list')}
                                    size="small"
                                />
                            </Tooltip>
                        </div>
                    </div>

                    {loading ? (
                        <div style={styles.loader}>
                            <Spin size="large" />
                            <Text style={{ marginTop: 16, color: '#64748b' }}>Nous trouvons les meilleures opportunités pour vous</Text>
                        </div>
                    ) : companies.length === 0 ? (
                        <Empty 
                            description={
                                <div>
                                    <Text>Aucune entreprise trouvée.</Text>
                                    <br />
                                    <Button type="link" onClick={() => {
                                        setSectorFilter('');
                                        setSizeFilter('');
                                        setSearchTerm('');
                                        setPagination(prev => ({ ...prev, currentPage: 1 }));
                                    }}>
                                        Réinitialiser la recherche
                                    </Button>
                                </div>
                            } 
                            style={{ padding: '80px 0', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }} 
                        />
                    ) : (
                        <>
                        <Row gutter={[24, 24]}>
                            <AnimatePresence>
                            {companies.map((company, index) => (
                                <Col 
                                    xs={24} 
                                    sm={12} 
                                    md={viewMode === 'grid' ? 8 : 12} 
                                    lg={viewMode === 'grid' ? 6 : 8} 
                                    key={company._id}
                                >
                                    <motion.div
                                        initial={{ y: 20, opacity: 0, scale: 0.95 }}
                                        animate={{ y: 0, opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05, duration: 0.3 }}
                                        whileHover={{ y: -8, scale: 1.02 }}
                                    >
                                        <Card 
                                            style={{
                                                ...styles.companyCard,
                                                ...(viewMode === 'list' ? styles.companyCardList : {})
                                            }} 
                                            bodyStyle={{ padding: viewMode === 'list' ? 24 : 20 }}
                                            hoverable
                                            className="company-card-animated"
                                        >
                                            <div style={viewMode === 'list' ? styles.cardBodyRow : styles.cardBodyCol}>
                                                <div style={styles.leftSection}>
                                                    <div style={styles.logoWrap}>
                                                        {company.logo ? (
                                                            <img src={`${baseUrl}${company.logo}`} alt={company.name} style={styles.logo} />
                                                        ) : (
                                                            <div style={styles.logoPlaceholder}>
                                                                {company.name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <div style={styles.infoSection}>
                                                        <Title level={4} style={styles.companyName}>{company.name}</Title>
                                                        
                                                        <div style={styles.metaWrap}>
                                                            {company.sector && <Tag color="blue">{company.sector}</Tag>}
                                                            {company.size && (
                                                                <Tag color={getSizeColor(company.size)}>
                                                                    {getSizeLabel(company.size)} • {company.size} employés
                                                                </Tag>
                                                            )}
                                                            {company.rating && (
                                                                <Tag color="gold">
                                                                    <StarOutlined /> {company.rating}/5
                                                                </Tag>
                                                            )}
                                                        </div>
                                                        
                                                        <Paragraph ellipsis={{ rows: viewMode === 'list' ? 1 : 2 }} style={styles.description}>
                                                            {company.description || "Aucune description fournie."}
                                                        </Paragraph>
                                                    </div>
                                                </div>
                                                
                                                <div style={styles.rightSection}>
                                                    {company.city && (
                                                        <Tooltip title="Localisation">
                                                            <Text style={styles.metaItem}><EnvironmentOutlined /> {company.city}</Text>
                                                        </Tooltip>
                                                    )}
                                                    {company.website && (
                                                        <Tooltip title="Site web">
                                                            <Button type="link" icon={<GlobalOutlined />} href={company.website} target="_blank" />
                                                        </Tooltip>
                                                    )}
                                                    <div style={styles.actionsRow}>
                                                        <Button 
                                                            type="primary" 
                                                            size="small"
                                                            onClick={() => navigate(`/companies/${company._id}`)}
                                                            icon={<RightOutlined />}
                                                        >
                                                            Voir
                                                        </Button>
                                                        <Button 
                                                            size="small"
                                                            icon={<EyeOutlined />}
                                                            onClick={() => handleQuickView(company)}
                                                        >
                                                            Aperçu
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                </Col>
                            ))}
                            </AnimatePresence>
                        </Row>
                        
                        {/* Enhanced Pagination */}
                        {pagination.totalPages > 1 && (
                            <div style={styles.paginationWrapper}>
                                <Pagination
                                    current={pagination.currentPage}
                                    total={pagination.totalItems}
                                    pageSize={pagination.itemsPerPage}
                                    onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                                    showSizeChanger={false}
                                    showTotal={(total, range) => `${range[0]}-${range[1]} sur ${total} entreprises`}
                                    itemRender={(page, type, originalElement) => {
                                        if (type === 'prev') {
                                            return <Button type="text" icon={<RightOutlined rotate={180} />}>Préc</Button>;
                                        }
                                        if (type === 'next') {
                                            return <Button type="text" icon={<RightOutlined />}>Suiv</Button>;
                                        }
                                        return originalElement;
                                    }}
                                />
                            </div>
                        )}
                        </>
                    )}
                </div>
            </main>
            
            {/* Quick View Modal */}
            <Modal
                title={
                    <div style={styles.modalHeader}>
                        <div style={styles.modalLogo}>
                            {selectedCompany?.logo ? (
                                <img src={`${baseUrl}${selectedCompany.logo}`} alt={selectedCompany.name} style={styles.modalLogoImg} />
                            ) : (
                                <div style={styles.modalLogoPlaceholder}>{selectedCompany?.name.charAt(0)}</div>
                            )}
                        </div>
                        <div>
                            <Title level={3} style={{ margin: 0 }}>{selectedCompany?.name}</Title>
                            <div style={styles.modalMeta}>
                                {selectedCompany?.sector && <Tag>{selectedCompany.sector}</Tag>}
                                {selectedCompany?.size && <Tag>{getSizeLabel(selectedCompany.size)}</Tag>}
                            </div>
                        </div>
                    </div>
                }
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setModalVisible(false)}>Fermer</Button>,
                    <Button 
                        key="visit" 
                        type="primary" 
                        onClick={() => {
                            setModalVisible(false);
                            navigate(`/companies/${selectedCompany?._id}`);
                        }}
                    >
                        Voir le profil complet
                    </Button>
                ]}
                width={700}
            >
                {selectedCompany && (
                    <div style={styles.modalContent}>
                        <Paragraph style={styles.modalDescription}>
                            {selectedCompany.description || "Aucune description disponible."}
                        </Paragraph>
                        
                        <div style={styles.modalStats}>
                            {selectedCompany.city && (
                                <div style={styles.modalStat}>
                                    <EnvironmentOutlined style={styles.modalStatIcon} />
                                    <div>
                                        <div style={styles.modalStatLabel}>Ville</div>
                                        <div style={styles.modalStatValue}>{selectedCompany.city}</div>
                                    </div>
                                </div>
                            )}
                            {selectedCompany.size && (
                                <div style={styles.modalStat}>
                                    <TeamOutlined style={styles.modalStatIcon} />
                                    <div>
                                        <div style={styles.modalStatLabel}>Employés</div>
                                        <div style={styles.modalStatValue}>{selectedCompany.size}</div>
                                    </div>
                                </div>
                            )}
                            {selectedCompany.rating && (
                                <div style={styles.modalStat}>
                                    <StarOutlined style={{ ...styles.modalStatIcon, color: '#fbbf24' }} />
                                    <div>
                                        <div style={styles.modalStatLabel}>Note</div>
                                        <div style={styles.modalStatValue}>{selectedCompany.rating}/5</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
}

const styles = {
    page: { 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        fontFamily: "'Inter', sans-serif",
        overflowX: 'hidden'
    },
    header: { 
        position: 'relative',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', 
        padding: '80px 0 100px 0', 
        color: '#fff',
        overflow: 'hidden'
    },
    container: { maxWidth: 1400, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2 },
    heroContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 900, margin: '0 auto' },
    heroTitle: { 
        color: '#fff', 
        fontSize: 48, 
        fontWeight: 900, 
        marginBottom: 16,
        textShadow: '0 0 60px rgba(139, 92, 246, 0.5)',
        letterSpacing: '-0.02em'
    },
    heroSubtitle: { 
        color: '#cbd5e1', 
        fontSize: 20, 
        marginBottom: 40,
        maxWidth: 600,
        lineHeight: 1.6
    },
    searchWrap: { 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16
    },
    searchInput: { 
        borderRadius: 12, 
        flex: 1, 
        maxWidth: 600,
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.1)'
    },
    filtersRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
        marginTop: 8
    },
    statsRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        marginTop: 48,
        padding: '24px 32px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
    },
    statItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
    },
    statIcon: {
        fontSize: 28,
        color: '#a78bfa'
    },
    statValue: {
        fontSize: 24,
        fontWeight: 800,
        color: '#fff',
        lineHeight: 1
    },
    statLabel: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 4
    },
    statDivider: {
        width: 1,
        height: 40,
        background: 'rgba(255,255,255,0.1)'
    },
    main: { padding: '0 0 80px 0', marginTop: -60 },
    featuredSection: {
        padding: '40px 0',
        background: 'rgba(255,255,255,0.5)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.1)'
    },
    sectionTitle: {
        marginBottom: 24,
        fontSize: 28,
        color: '#0f172a'
    },
    featuredCard: {
        borderRadius: 16,
        border: '1px solid rgba(139, 92, 246, 0.2)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s',
        height: '100%'
    },
    featuredLogoWrap: {
        width: 56,
        height: 56,
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
        border: '2px solid rgba(139, 92, 246, 0.2)'
    },
    featuredLogo: { width: '100%', height: '100%', objectFit: 'cover' },
    featuredLogoPlaceholder: { 
        width: '100%', 
        height: '100%', 
        background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', 
        color: '#fff', 
        fontSize: 22, 
        fontWeight: 'bold', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    featuredName: {
        fontSize: 15,
        marginBottom: 8,
        color: '#0f172a',
        display: 'block'
    },
    featuredMeta: {
        marginBottom: 8
    },
    featuredTag: {
        marginTop: 8,
        border: 'none',
        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)'
    },
    listHeader: { 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        padding: '16px 20px',
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    },
    resultsInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 16
    },
    viewToggle: {
        display: 'flex',
        gap: 8
    },
    loader: { 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '80px 0',
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e2e8f0'
    },
    companyCard: {
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        height: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    },
    companyCardList: {
        minWidth: '100%'
    },
    cardBodyRow: {
        display: 'flex',
        gap: 24,
        alignItems: 'center'
    },
    cardBodyCol: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16
    },
    leftSection: {
        flex: 1,
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start'
    },
    infoSection: {
        flex: 1,
        minWidth: 0
    },
    rightSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'flex-end',
        minWidth: 140
    },
    logoWrap: { 
        width: 72, 
        height: 72, 
        flexShrink: 0,
        borderRadius: 14, 
        overflow: 'hidden', 
        border: '2px solid #f1f5f9',
        background: '#fff'
    },
    logo: { width: '100%', height: '100%', objectFit: 'contain' },
    logoPlaceholder: { 
        width: '100%', 
        height: '100%', 
        background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', 
        color: '#fff', 
        fontSize: 28, 
        fontWeight: 'bold', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    companyName: { 
        margin: '0 0 8px 0', 
        fontSize: 18, 
        fontWeight: 700, 
        color: '#0f172a',
        lineHeight: 1.3
    },
    metaWrap: { 
        marginBottom: 12,
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap'
    },
    description: { 
        color: '#64748b', 
        fontSize: 14,
        lineHeight: 1.6,
        marginBottom: 0
    },
    footerMeta: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: 'auto', 
        paddingTop: 16, 
        borderTop: '1px solid #f1f5f9' 
    },
    metaItem: { 
        fontSize: 13, 
        color: '#94a3b8', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 4 
    },
    actionsRow: {
        display: 'flex',
        gap: 8,
        marginTop: 8
    },
    paginationWrapper: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 48,
        paddingTop: 24,
        borderTop: '1px solid #e2e8f0'
    },
    pagination: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 40, 
        paddingTop: '20px', 
        borderTop: '1px solid #e2e8f0' 
    },
    modalHeader: {
        display: 'flex',
        gap: 20,
        alignItems: 'center',
        padding: '8px 0'
    },
    modalLogo: {
        width: 64,
        height: 64,
        borderRadius: 14,
        overflow: 'hidden',
        flexShrink: 0
    },
    modalLogoImg: {
        width: '100%',
        height: '100%',
        objectFit: 'contain'
    },
    modalLogoPlaceholder: {
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    modalMeta: {
        display: 'flex',
        gap: 8,
        marginTop: 8
    },
    modalContent: {
        padding: '8px 0'
    },
    modalDescription: {
        fontSize: 15,
        lineHeight: 1.7,
        color: '#334155',
        marginBottom: 24
    },
    modalStats: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        padding: '20px',
        background: 'rgba(139, 92, 246, 0.05)',
        borderRadius: 12,
        border: '1px solid rgba(139, 92, 246, 0.1)'
    },
    modalStat: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12
    },
    modalStatIcon: {
        fontSize: 24,
        color: '#a78bfa'
    },
    modalStatLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 2
    },
    modalStatValue: {
        fontSize: 16,
        fontWeight: 700,
        color: '#0f172a'
    }
};
