import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Spin, Card, Button, Input, Tag, Empty, Statistic, Row, Col, Divider, message, Select, Slider, Checkbox } from 'antd';
import { SearchOutlined, EnvironmentOutlined, ClockCircleOutlined, SolutionOutlined, RightOutlined, TeamOutlined, DollarOutlined, CalendarOutlined, FireOutlined, StarOutlined, FilterOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getPublicTests } from '../../api/tests';
import { motion } from 'framer-motion';
import RealTimeStats from '../../components/RealTimeStats';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function Careers() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ totalJobs: 0, activeJobs: 0, featuredJobs: 0, filteredJobs: 0 });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });
    
    // Advanced filtering state
    const [filters, setFilters] = useState({
        employmentType: [],
        location: [],
        salaryRange: [0, 100000],
        experienceLevel: [],
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });
    
    const [showFilters, setShowFilters] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const params = {
                    page: pagination.currentPage,
                    limit: pagination.itemsPerPage,
                    search: searchTerm,
                    employmentType: filters.employmentType,
                    location: filters.location,
                    minSalary: filters.salaryRange[0],
                    maxSalary: filters.salaryRange[1],
                    sortBy: filters.sortBy,
                    sortOrder: filters.sortOrder
                };
                
                const response = await getPublicTests(params);
                const jobOffers = response.tests || [];
                
                setJobs(jobOffers);
                setPagination(response.pagination || pagination);
                setStats({
                    totalJobs: response.pagination?.totalItems || jobOffers.length,
                    activeJobs: jobOffers.filter(job => (job.status || '').toUpperCase() === 'PUBLISHED').length,
                    featuredJobs: jobOffers.filter(job => job.featured).length,
                    filteredJobs: jobOffers.length
                });
            } catch (error) {
                console.error('Error fetching jobs:', error);
                message.error('Erreur lors du chargement des offres');
            } finally {
                setLoading(false);
            }
        };
        
        fetchJobs();
    }, [pagination.currentPage, searchTerm, filters]);

    // Memoized filtered jobs computation
    const filteredJobs = useMemo(() => {
        let result = jobs.filter(job => {
            // Search filter
            const matchesSearch = searchTerm === '' || 
                job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                job.jobRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (job.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (job.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            // Status filter
            const isActive = (job.status || '').toUpperCase() === 'PUBLISHED';
            
            // Employment type filter
            const matchesEmploymentType = filters.employmentType.length === 0 || 
                filters.employmentType.includes(job.employmentType);
            
            // Location filter
            const matchesLocation = filters.location.length === 0 || 
                filters.location.includes(job.location);
            
            // Salary range filter
            const jobSalary = parseInt(job.salaryRange?.replace(/[^0-9]/g, '') || '0');
            const matchesSalary = jobSalary >= filters.salaryRange[0] && jobSalary <= filters.salaryRange[1];
            
            return matchesSearch && isActive && matchesEmploymentType && matchesLocation && matchesSalary;
        });
        
        // Sort results
        result.sort((a, b) => {
            let aValue, bValue;
            
            switch(filters.sortBy) {
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'salary':
                    aValue = parseInt(a.salaryRange?.replace(/[^0-9]/g, '') || '0');
                    bValue = parseInt(b.salaryRange?.replace(/[^0-9]/g, '') || '0');
                    break;
                case 'createdAt':
                default:
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
            }
            
            if (filters.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        return result;
    }, [jobs, searchTerm, filters]);

    const featuredJobs = filteredJobs.filter(job => job.featured).slice(0, 3);
    const regularJobs = filteredJobs.filter(job => !job.featured);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={styles.page}
        >
            {/* Header Section */}
            <header style={styles.header}>
                <div style={styles.container}>
                    <motion.div 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        style={styles.brand}
                    >
                        <div style={styles.logoBox}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#ffffff" />
                                <path d="M2 12l10 5 10-5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span style={styles.brandName}>Recruit AI</span>
                    </motion.div>

                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        style={styles.heroContent}
                    >
                        <Badge>We are hiring!</Badge>
                        <Title style={styles.heroTitle}>
                            Rejoignez notre équipe et <br /> construisez le futur.
                        </Title>
                        <Paragraph style={styles.heroSubtitle}>
                            Découvrez nos offres d'emploi ouvertes. Nous cherchons des talents passionnés 
                            pour résoudre des défis complexes avec des technologies innovantes.
                        </Paragraph>

                        <div style={styles.searchWrap}>
                            <Input 
                                size="large" 
                                placeholder="Rechercher par poste, mot-clé ou ville..." 
                                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                style={styles.searchInput}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            
                            {/* Advanced Filters Toggle */}
                            <div style={styles.filterToggle}>
                                <Button 
                                    icon={<FilterOutlined />} 
                                    onClick={() => setShowFilters(!showFilters)}
                                    type={showFilters ? "primary" : "default"}
                                >
                                    Filtres Avancés
                                </Button>
                            </div>
                        </div>
                        
                        {/* Advanced Filters Panel */}
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={styles.filtersPanel}
                            >
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={8}>
                                        <div style={styles.filterGroup}>
                                            <Text strong style={styles.filterLabel}>Type de contrat</Text>
                                            <Checkbox.Group 
                                                value={filters.employmentType}
                                                onChange={(values) => setFilters({...filters, employmentType: values})}
                                                style={styles.checkboxGroup}
                                            >
                                                <Checkbox value="CDI">CDI</Checkbox>
                                                <Checkbox value="CDD">CDD</Checkbox>
                                                <Checkbox value="Freelance">Freelance</Checkbox>
                                                <Checkbox value="Stage">Stage</Checkbox>
                                            </Checkbox.Group>
                                        </div>
                                    </Col>
                                    
                                    <Col xs={24} md={8}>
                                        <div style={styles.filterGroup}>
                                            <Text strong style={styles.filterLabel}>Localisation</Text>
                                            <Checkbox.Group 
                                                value={filters.location}
                                                onChange={(values) => setFilters({...filters, location: values})}
                                                style={styles.checkboxGroup}
                                            >
                                                <Checkbox value="Remote">Remote</Checkbox>
                                                <Checkbox value="Paris">Paris</Checkbox>
                                                <Checkbox value="Lyon">Lyon</Checkbox>
                                                <Checkbox value="Marseille">Marseille</Checkbox>
                                            </Checkbox.Group>
                                        </div>
                                    </Col>
                                    
                                    <Col xs={24} md={8}>
                                        <div style={styles.filterGroup}>
                                            <Text strong style={styles.filterLabel}>Salaire (€)</Text>
                                            <Slider
                                                range
                                                min={0}
                                                max={100000}
                                                step={5000}
                                                value={filters.salaryRange}
                                                onChange={(values) => setFilters({...filters, salaryRange: values})}
                                                tipFormatter={(value) => `${value}€`}
                                            />
                                            <Text style={styles.salaryRange}>
                                                {filters.salaryRange[0]}€ - {filters.salaryRange[1]}€
                                            </Text>
                                        </div>
                                    </Col>
                                    
                                    <Col xs={24} md={12}>
                                        <div style={styles.filterGroup}>
                                            <Text strong style={styles.filterLabel}>Trier par</Text>
                                            <div style={styles.sortControls}>
                                                <Select
                                                    value={filters.sortBy}
                                                    onChange={(value) => setFilters({...filters, sortBy: value})}
                                                    style={{ width: 150, marginRight: 10 }}
                                                >
                                                    <Option value="createdAt">Date</Option>
                                                    <Option value="title">Titre</Option>
                                                    <Option value="salary">Salaire</Option>
                                                </Select>
                                                <Select
                                                    value={filters.sortOrder}
                                                    onChange={(value) => setFilters({...filters, sortOrder: value})}
                                                    style={{ width: 100 }}
                                                >
                                                    <Option value="desc">Desc</Option>
                                                    <Option value="asc">Asc</Option>
                                                </Select>
                                            </div>
                                        </div>
                                    </Col>
                                    
                                    <Col xs={24} md={12}>
                                        <div style={styles.filterActions}>
                                            <Button onClick={() => {
                                                setFilters({
                                                    employmentType: [],
                                                    location: [],
                                                    salaryRange: [0, 100000],
                                                    experienceLevel: [],
                                                    sortBy: 'createdAt',
                                                    sortOrder: 'desc'
                                                });
                                                setSearchTerm('');
                                            }}>
                                                Réinitialiser
                                            </Button>
                                            <Text style={styles.resultsCount}>
                                                {filteredJobs.length} résultat{filteredJobs.length !== 1 ? 's' : ''} trouvé{filteredJobs.length !== 1 ? 's' : ''}
                                            </Text>
                                        </div>
                                    </Col>
                                </Row>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </header>

            {/* Real-time Statistics Section */}
            <section style={styles.statsSection}>
                <div style={styles.container}>
                    <RealTimeStats />
                </div>
            </section>

            {/* Featured Jobs Section */}
            {featuredJobs.length > 0 && (
                <section style={styles.featuredSection}>
                    <div style={styles.container}>
                        <Title level={3} style={styles.sectionTitle}>
                            <FireOutlined style={{ marginRight: 12, color: '#f59e0b' }} />
                            Offres Vedettes
                        </Title>
                        <div style={styles.featuredGrid}>
                            {featuredJobs.map(job => (
                                <motion.div
                                    key={job._id}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    whileHover={{ y: -5 }}
                                >
                                    <FeaturedJobCard job={job} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Jobs List Section */}
            <main style={styles.main}>
                <div style={{ ...styles.container, maxWidth: 1200 }}>
                    <div style={styles.listHeader}>
                        <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                            Toutes les Offres ({filteredJobs.length})
                        </Title>
                        <Text type="secondary">
                            {searchTerm ? `Résultats pour "${searchTerm}"` : 'Parcourez toutes nos opportunités'}
                        </Text>
                    </div>

                    {loading ? (
                        <div style={styles.loader}>
                            <Spin size="large" />
                            <Text style={{ marginTop: 16 }}>Chargement des offres...</Text>
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <Empty 
                            description="Aucune offre ne correspond à votre recherche pour le moment." 
                            style={{ padding: '80px 0', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }} 
                        >
                            <Button type="primary" onClick={() => setSearchTerm('')}>
                                Voir toutes les offres
                            </Button>
                        </Empty>
                    ) : (
                        <div style={styles.jobList}>
                            {regularJobs.map(job => (
                                <motion.div
                                    key={job._id}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    whileHover={{ x: 5 }}
                                >
                                    <JobCard job={job} />
                                </motion.div>
                            ))}
                        </div>
                        
                        {/* Pagination Controls */}
                        {pagination.totalPages > 1 && (
                            <div style={styles.pagination}>
                                <Button 
                                    onClick={() => setPagination({...pagination, currentPage: pagination.currentPage - 1})}
                                    disabled={pagination.currentPage === 1}
                                    style={{ marginRight: 10 }}
                                >
                                    Précédent
                                </Button>
                                
                                <Text style={{ margin: '0 15px', color: '#64748b' }}>
                                    Page {pagination.currentPage} sur {pagination.totalPages}
                                </Text>
                                
                                <Button 
                                    onClick={() => setPagination({...pagination, currentPage: pagination.currentPage + 1})}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    style={{ marginLeft: 10 }}
                                >
                                    Suivant
                                </Button>
                                
                                <div style={styles.pageInfo}>
                                    <Text type="secondary">
                                        {pagination.totalItems} offres au total
                                    </Text>
                                </div>
                            </div>
                        )}
                    )}
                </div>
            </main>
        </motion.div>
    );
}

const JobCard = ({ job }) => {
    const navigate = useNavigate();
    return (
        <Card 
            style={styles.jobCard} 
            bodyStyle={{ padding: 24 }}
            onClick={() => navigate(`/careers/${job._id}`)}
            hoverable
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={styles.jobInfo}>
                    <Title level={4} style={styles.jobTitle}>{job.title}</Title>
                    <Text style={styles.jobRole}>{job.jobRole}</Text>
                    
                    <div style={styles.jobMeta}>
                        <span style={styles.metaItem}>
                            <EnvironmentOutlined style={styles.metaIcon} />
                            {job.location || 'Remote'}
                        </span>
                        <span style={styles.metaItem}>
                            <SolutionOutlined style={styles.metaIcon} />
                            {job.employmentType || 'CDI'}
                        </span>
                        <span style={styles.metaItem}>
                            <ClockCircleOutlined style={styles.metaIcon} />
                            Publié il y a {Math.floor((new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24))} jours
                        </span>
                    </div>
                </div>
                
                <div style={styles.jobAction}>
                    <Button type="primary" shape="round" icon={<RightOutlined />} iconPosition="end">
                        Voir l'offre
                    </Button>
                </div>
            </div>
        </Card>
    );
};

const FeaturedJobCard = ({ job }) => {
    const navigate = useNavigate();
    
    return (
        <Card 
            style={styles.featuredCard}
            cover={
                <div style={styles.featuredCover}>
                    <div style={styles.coverContent}>
                        <Text style={styles.featuredJobRole}>{job.jobRole}</Text>
                        <Tag color="gold" icon={<StarOutlined />}>Vedette</Tag>
                    </div>
                </div>
            }
            hoverable
            onClick={() => navigate(`/careers/${job._id}`)}
        >
            <Card.Meta
                title={
                    <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                        {job.title}
                    </Title>
                }
                description={
                    <div style={{ marginTop: 8 }}>
                        <div style={styles.featuredMeta}>
                            <Text>
                                <EnvironmentOutlined style={{ marginRight: 6 }} />
                                {job.location || 'Remote'}
                            </Text>
                            <Text style={{ marginLeft: 16 }}>
                                <SolutionOutlined style={{ marginRight: 6 }} />
                                {job.employmentType || 'CDI'}
                            </Text>
                        </div>
                        
                        {job.salaryRange && (
                            <Text style={{ display: 'block', marginTop: 8, color: '#059669', fontWeight: 500 }}>
                                <DollarOutlined style={{ marginRight: 6 }} />
                                {job.salaryRange}
                            </Text>
                        )}
                        
                        <Button 
                            type="primary" 
                            block 
                            style={{ marginTop: 16 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/careers/${job._id}`);
                            }}
                        >
                            Postuler maintenant
                        </Button>
                    </div>
                }
            />
        </Card>
    );
};

const Badge = ({ children }) => (
    <div style={styles.badge}>
        <span style={styles.badgeDot} />
        {children}
    </div>
);

const styles = {
    page: {
        minHeight: '100vh',
        background: '#f8fafc', // Slate 50
        fontFamily: "'Inter', sans-serif"
    },
    header: {
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', // Deep slate to deep violet
        padding: '24px 0 80px 0',
        color: '#fff'
    },
    container: {
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 24px',
    },
    brand: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 80,
    },
    logoBox: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)'
    },
    brandName: {
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: '-0.02em'
    },
    heroContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: 700,
        margin: '0 auto'
    },
    heroTitle: {
        color: '#fff',
        fontSize: 48,
        fontWeight: 800,
        lineHeight: 1.1,
        letterSpacing: '-0.04em',
        marginBottom: 24,
        marginTop: 24
    },
    heroSubtitle: {
        color: '#cbd5e1', // Slate 300
        fontSize: 18,
        lineHeight: 1.6,
        marginBottom: 40
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(255,255,255,0.1)',
        padding: '6px 16px',
        borderRadius: 99,
        fontSize: 14,
        fontWeight: 500,
        color: '#e2e8f0',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.05)'
    },
    badgeDot: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#10b981', // Emerald 500
        boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
    },
    searchWrap: {
        width: '100%',
        maxWidth: 700,
    },
    searchInput: {
        borderRadius: 99,
        padding: '8px 24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        marginBottom: 16
    },
    filterToggle: {
        display: 'flex',
        justifyContent: 'center'
    },
    filtersPanel: {
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        padding: 24,
        marginTop: 20,
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
    },
    filterGroup: {
        marginBottom: 20
    },
    filterLabel: {
        display: 'block',
        marginBottom: 12,
        color: '#334155',
        fontSize: 14
    },
    checkboxGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
    },
    sortControls: {
        display: 'flex',
        alignItems: 'center',
        gap: 10
    },
    salaryRange: {
        display: 'block',
        marginTop: 10,
        textAlign: 'center',
        color: '#64748b',
        fontSize: 14
    },
    filterActions: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10
    },
    resultsCount: {
        color: '#3b82f6',
        fontWeight: 500
    },
    main: {
        padding: '0 0 80px 0',
        marginTop: -40, // Overlap the header
    },
    listHeader: {
        marginBottom: 24,
        padding: '0 8px'
    },
    loader: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
    },
    jobList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20
    },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        padding: '20px 0',
        borderTop: '1px solid #e2e8f0'
    },
    pageInfo: {
        marginLeft: 20
    },
    jobCard: {
        background: '#ffffff',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
            borderColor: '#93c5fd', // Blue 300
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        }
    },
    jobInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
    },
    jobTitle: {
        margin: 0,
        fontSize: 20,
        fontWeight: 700,
        color: '#0f172a'
    },
    jobRole: {
        fontSize: 16,
        color: '#475569',
        fontWeight: 500
    },
    jobMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        marginTop: 8,
        flexWrap: 'wrap'
    },
    metaItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: '#64748b',
        fontSize: 14,
        fontWeight: 500
    },
    metaIcon: {
        color: '#94a3b8'
    },
    jobAction: {
        paddingLeft: 24,
        marginLeft: 24,
        borderLeft: '1px solid #f1f5f9'
    }
};

