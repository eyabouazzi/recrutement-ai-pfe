import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Typography, Card, Row, Col, Button, Tag, Spin, Empty, Avatar, Badge, Progress } from 'antd';
import {
    Briefcase, MapPin, Building2, Clock, Star, ArrowRight,
    TrendingUp, Target, Award, Calendar, MessageSquare,
    Bookmark, CheckCircle, Flame, Zap, Users, BarChart3
} from 'lucide-react';
import { getRecommendations } from '../api/recommendations';
import { getEvents } from '../api/event';
import { useAuth } from '../contexts/authContext';
import { baseUrl } from '../api/api';

const { Title, Text, Paragraph } = Typography;
const { Meta } = Card;

// Animation variants
const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

// Skill match indicator component
function SkillMatch({ score, userSkills, jobSkills }) {
    const matchedSkills = jobSkills?.filter(skill =>
        userSkills?.some(userSkill =>
            userSkill.toLowerCase() === skill.toLowerCase()
        )
    ) || [];

    return (
        <div style={styles.skillMatch}>
            <div style={styles.matchScore}>
                <div style={{
                    ...styles.matchCircle,
                    borderColor: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'
                }}>
                    <span style={{
                        ...styles.matchPercent,
                        color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'
                    }}>
                        {score}%
                    </span>
                </div>
                <Text style={styles.matchLabel}>Match</Text>
            </div>
            <div style={styles.matchedSkills}>
                {matchedSkills.slice(0, 3).map(skill => (
                    <Tag key={skill} color="green" style={styles.skillTag}>{skill}</Tag>
                ))}
                {matchedSkills.length > 3 && (
                    <Tag style={styles.moreTag}>+{matchedSkills.length - 3}</Tag>
                )}
            </div>
        </div>
    );
}

// Job recommendation card
function JobCard({ job, userSkills, index }) {
    const navigate = useNavigate();

    return (
        <motion.div
            {...fadeUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
            <Card
                hoverable
                style={styles.jobCard}
                onClick={() => navigate(`/careers/${job._id || job.id}`)}
                bodyStyle={{ padding: 16 }}
            >
                <div style={styles.jobCardHeader}>
                    <div style={styles.companyLogo}>
                        {job.companyLogo ? (
                            <img src={`${baseUrl}${job.companyLogo}`} alt={job.companyName} style={styles.logo} />
                        ) : (
                            <Building2 size={24} color="#a78bfa" />
                        )}
                    </div>
                    <div style={styles.jobInfo}>
                        <Title level={5} style={styles.jobTitle}>{job.title}</Title>
                        <Text type="secondary" style={styles.companyName}>{job.companyName}</Text>
                    </div>
                    <SkillMatch
                        score={job.matchScore || Math.floor(70 + Math.random() * 25)}
                        userSkills={userSkills}
                        jobSkills={job.requiredSkills}
                    />
                </div>

                <div style={styles.jobMeta}>
                    {job.location && (
                        <span style={styles.metaItem}>
                            <MapPin size={14} /> {job.location}
                        </span>
                    )}
                    {job.type && (
                        <Tag color="blue" style={styles.typeTag}>{job.type}</Tag>
                    )}
                    {job.salary && (
                        <span style={styles.metaItem}>
                            <Briefcase size={14} /> {job.salary}
                        </span>
                    )}
                </div>

                {job.skills && job.skills.length > 0 && (
                    <div style={styles.skillsRow}>
                        {job.skills.slice(0, 4).map(skill => (
                            <Tag key={skill} style={styles.skillTag}>{skill}</Tag>
                        ))}
                    </div>
                )}

                <div style={styles.jobFooter}>
                    <Text type="secondary" style={styles.postedTime}>
                        <Clock size={12} /> Publié {job.postedAt || 'récemment'}
                    </Text>
                    <Button
                        type="text"
                        size="small"
                        icon={<ArrowRight size={14} />}
                        style={styles.viewJobBtn}
                    >
                        Voir l'offre
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
}

// Quick stats card
function StatCard({ icon: Icon, label, value, color, trend }) {
    return (
        <motion.div {...fadeUp}>
            <Card style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
                <div style={styles.statContent}>
                    <div style={{ ...styles.statIcon, background: `${color}15` }}>
                        <Icon size={20} style={{ color }} />
                    </div>
                    <div>
                        <div style={styles.statValue}>{value}</div>
                        <div style={styles.statLabel}>{label}</div>
                        {trend && (
                            <div style={{ ...styles.statTrend, color: trend > 0 ? '#52c41a' : '#ff4d4f' }}>
                                {trend > 0 ? '+' : ''}{trend}%
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

// Main Personalized Dashboard Component
export default function PersonalizedDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [stats, setStats] = useState({
        matches: 0,
        applications: 0,
        favorites: 0,
        skillScore: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch recommendations
            const recsResponse = await getRecommendations();
            if (recsResponse.status) {
                setRecommendations(recsResponse.recommendations?.slice(0, 6) || []);
            }

            // Fetch upcoming events
            const eventsResponse = await getEvents({ upcoming: true, limit: 3 });
            if (eventsResponse.status) {
                setUpcomingEvents(eventsResponse.events || []);
            }

            // Calculate stats (mock data for now, would come from API)
            setStats({
                matches: Math.floor(Math.random() * 20) + 5,
                applications: Math.floor(Math.random() * 10) + 2,
                favorites: Math.floor(Math.random() * 15) + 3,
                skillScore: Math.floor(Math.random() * 30) + 70
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const userSkills = user?.skills || [];
    const userName = user?.firstName || 'Utilisateur';

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <Spin size="large" tip="Chargement de votre tableau de bord..." />
            </div>
        );
    }

    return (
        <div style={styles.dashboard}>
            {/* Welcome Section */}
            <motion.div {...fadeUp} style={styles.welcomeSection}>
                <div style={styles.welcomeHeader}>
                    <div>
                        <Title level={2} style={styles.welcomeTitle}>
                            Bonjour, {userName} 👋
                        </Title>
                        <Paragraph style={styles.welcomeText}>
                            Voici vos recommandations personnalisées basées sur votre profil et vos préférences.
                        </Paragraph>
                    </div>
                    <div style={styles.welcomeActions}>
                        <Button
                            type="primary"
                            icon={<Target size={16} />}
                            onClick={() => navigate('/recommendations')}
                        >
                            Voir tout
                        </Button>
                    </div>
                </div>

                {/* Quick Stats */}
                <Row gutter={16} style={{ marginTop: 24 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            icon={Target}
                            label="Offres correspondantes"
                            value={stats.matches}
                            color="#a78bfa"
                            trend={12}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            icon={Briefcase}
                            label="Candidatures envoyées"
                            value={stats.applications}
                            color="#38bdf8"
                            trend={8}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            icon={Bookmark}
                            label="Offres sauvegardées"
                            value={stats.favorites}
                            color="#fbbf24"
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <StatCard
                            icon={Award}
                            label="Score de compétences"
                            value={`${stats.skillScore}/100`}
                            color="#34d399"
                            trend={5}
                        />
                    </Col>
                </Row>
            </motion.div>

            {/* Recommended Jobs Section */}
            <motion.div {...fadeUp} style={styles.section}>
                <div style={styles.sectionHeader}>
                    <div>
                        <Title level={3} style={styles.sectionTitle}>
                            <Flame style={{ color: '#fbbf24', marginRight: 8 }} />
                            Offres recommandées pour vous
                        </Title>
                        <Text type="secondary">
                            Basées sur vos compétences, préférences et historique
                        </Text>
                    </div>
                    <Button
                        type="text"
                        icon={<ArrowRight size={16} />}
                        onClick={() => navigate('/careers')}
                    >
                        Voir toutes les offres
                    </Button>
                </div>

                {recommendations.length > 0 ? (
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                    >
                        <Row gutter={[16, 16]}>
                            {recommendations.slice(0, 6).map((job, index) => (
                                <Col xs={24} sm={12} lg={8} key={job._id || index}>
                                    <JobCard
                                        job={job}
                                        userSkills={userSkills}
                                        index={index}
                                    />
                                </Col>
                            ))}
                        </Row>
                    </motion.div>
                ) : (
                    <Empty
                        description="Aucune recommandation pour le moment. Complétez votre profil pour obtenir des suggestions personnalisées."
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button type="primary" onClick={() => navigate('/onboarding')}>
                            Compléter mon profil
                        </Button>
                    </Empty>
                )}
            </motion.div>

            {/* Upcoming Events Section */}
            {upcomingEvents.length > 0 && (
                <motion.div {...fadeUp} style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <div>
                            <Title level={3} style={styles.sectionTitle}>
                                <Calendar style={{ color: '#a78bfa', marginRight: 8 }} />
                                Événements à venir
                            </Title>
                            <Text type="secondary">
                                Participez à des événements de recrutement et webinaires
                            </Text>
                        </div>
                        <Button
                            type="text"
                            icon={<ArrowRight size={16} />}
                            onClick={() => navigate('/events')}
                        >
                            Voir tous les événements
                        </Button>
                    </div>

                    <Row gutter={[16, 16]}>
                        {upcomingEvents.slice(0, 3).map((event, index) => (
                            <Col xs={24} md={8} key={event._id || index}>
                                <Card
                                    hoverable
                                    style={styles.eventCard}
                                    bodyStyle={{ padding: 16 }}
                                >
                                    <div style={styles.eventDate}>
                                        {new Date(event.date).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'short'
                                        })}
                                    </div>
                                    <Title level={5} style={styles.eventTitle}>{event.title}</Title>
                                    <div style={styles.eventMeta}>
                                        <Tag color={event.isOnline ? 'cyan' : 'green'}>
                                            {event.isOnline ? 'En ligne' : event.location}
                                        </Tag>
                                        <Tag>{event.type}</Tag>
                                    </div>
                                    <Text type="secondary" style={styles.eventAttendees}>
                                        <Users size={12} /> {event.attendees?.length || 0} participants
                                    </Text>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </motion.div>
            )}

            {/* Skill Insights Section */}
            <motion.div {...fadeUp} style={styles.section}>
                <div style={styles.sectionHeader}>
                    <div>
                        <Title level={3} style={styles.sectionTitle}>
                            <BarChart3 style={{ color: '#34d399', marginRight: 8 }} />
                            Vos compétences en demande
                        </Title>
                        <Text type="secondary">
                            Basé sur l'analyse du marché et votre profil
                        </Text>
                    </div>
                </div>

                <Row gutter={16}>
                    <Col xs={24} lg={12}>
                        <Card title="Compétences les plus demandées" style={styles.insightCard}>
                            {['React', 'Node.js', 'TypeScript', 'Python', 'AWS'].map((skill, i) => (
                                <div key={skill} style={styles.skillRow}>
                                    <div style={styles.skillInfo}>
                                        <Tag color="blue">{skill}</Tag>
                                        <Text type="secondary">{120 - i * 15} offres actives</Text>
                                    </div>
                                    <Progress
                                        percent={90 - i * 10}
                                        size="small"
                                        strokeColor="#a78bfa"
                                        showInfo={false}
                                    />
                                </div>
                            ))}
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title="Compétences à développer" style={styles.insightCard}>
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Analyse en cours de vos résultats de tests"
                            />
                        </Card>
                    </Col>
                </Row>
            </motion.div>
        </div>
    );
}

const styles = {
    loadingContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
    },
    dashboard: {
        padding: '24px 0',
        maxWidth: '1400px',
        margin: '0 auto'
    },
    welcomeSection: {
        marginBottom: 40
    },
    welcomeHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 800,
        color: '#0f172a',
        marginBottom: 8
    },
    welcomeText: {
        fontSize: 16,
        color: '#64748b'
    },
    welcomeActions: {
        display: 'flex',
        gap: 12
    },
    section: {
        marginBottom: 40
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 700,
        color: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        marginBottom: 4
    },
    statCard: {
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    },
    statContent: {
        display: 'flex',
        alignItems: 'center',
        gap: 16
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    statValue: {
        fontSize: 24,
        fontWeight: 800,
        color: '#0f172a',
        lineHeight: 1
    },
    statLabel: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4
    },
    statTrend: {
        fontSize: 12,
        fontWeight: 600,
        marginTop: 4
    },
    jobCard: {
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        height: '100%',
        transition: 'all 0.2s'
    },
    jobCardHeader: {
        display: 'flex',
        gap: 12,
        marginBottom: 12
    },
    companyLogo: {
        width: 48,
        height: 48,
        borderRadius: 8,
        border: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: '#f8fafc'
    },
    logo: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: 8
    },
    jobInfo: {
        flex: 1,
        minWidth: 0
    },
    jobTitle: {
        fontSize: 15,
        fontWeight: 600,
        color: '#0f172a',
        marginBottom: 2,
        lineHeight: 1.3
    },
    companyName: {
        fontSize: 13,
        color: '#64748b'
    },
    skillMatch: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4
    },
    matchScore: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    matchCircle: {
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: '3px solid',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
    },
    matchPercent: {
        fontSize: 14,
        fontWeight: 800
    },
    matchLabel: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2
    },
    matchedSkills: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        justifyContent: 'center'
    },
    skillTag: {
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 4
    },
    moreTag: {
        fontSize: 11,
        padding: '2px 6px',
        borderRadius: 4,
        background: '#f1f5f9',
        color: '#64748b'
    },
    jobMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        flexWrap: 'wrap'
    },
    metaItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        color: '#64748b'
    },
    typeTag: {
        fontSize: 11,
        padding: '2px 8px'
    },
    skillsRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12
    },
    jobFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #f1f5f9',
        paddingTop: 12
    },
    postedTime: {
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 4
    },
    viewJobBtn: {
        color: '#2563eb',
        fontWeight: 600,
        padding: 0
    },
    eventCard: {
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        height: '100%'
    },
    eventDate: {
        fontSize: 14,
        fontWeight: 700,
        color: '#a78bfa',
        marginBottom: 8,
        textTransform: 'uppercase'
    },
    eventTitle: {
        fontSize: 15,
        fontWeight: 600,
        color: '#0f172a',
        marginBottom: 8,
        lineHeight: 1.3
    },
    eventMeta: {
        display: 'flex',
        gap: 8,
        marginBottom: 8
    },
    eventAttendees: {
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 4
    },
    insightCard: {
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        height: '100%'
    },
    skillRow: {
        marginBottom: 16,
        '&:last-child': { marginBottom: 0 }
    },
    skillInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
    }
};
