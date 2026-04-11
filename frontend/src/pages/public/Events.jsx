import React, { useEffect, useState, useContext } from 'react';
import { Typography, Spin, Card, Button, Input, Empty, Row, Col, message, Select, Tag } from 'antd';
import { SearchOutlined, CalendarOutlined, GlobalOutlined, EnvironmentOutlined, UserOutlined, ClockCircleOutlined, BankOutlined } from '@ant-design/icons';
import { getEvents, registerToEvent } from '../../api/event';
import { AuthContext } from '../../contexts/authContext';
import { motion } from 'framer-motion';
import { baseUrl } from '../../api/api';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function Events() {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('');
    const [upcoming, setUpcoming] = useState('true');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });

    useEffect(() => {
        fetchEvents();
    }, [pagination.currentPage, filterType, upcoming]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.currentPage,
                limit: pagination.itemsPerPage,
                type: filterType,
                upcoming: upcoming
            };
            
            const response = await getEvents(params);
            if (response.status) {
                setEvents(response.events);
                setPagination(response.pagination || pagination);
            } else {
                message.error('Erreur lors du chargement des événements');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (eventId) => {
        if (!token) {
            message.warning('Veuillez vous connecter pour vous inscrire à cet événement.');
            navigate('/login');
            return;
        }

        try {
            const res = await registerToEvent(eventId);
            if (res.status) {
                message.success('Inscription validée avec succès ! 🎉');
                fetchEvents(); // reload to update attendees count
            } else {
                message.error(res.message);
            }
        } catch (error) {
            message.error(error.message);
        }
    };

    const eventTypes = {
        'job_fair': { color: 'magenta', label: 'Forum Emploi' },
        'webinar': { color: 'blue', label: 'Webinaire' },
        'workshop': { color: 'volcano', label: 'Atelier' },
        'hackathon': { color: 'green', label: 'Hackathon' },
        'networking': { color: 'purple', label: 'Networking' },
        'other': { color: 'default', label: 'Autre' }
    };

    return (
        <motion.div className="events-page wow-public-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.page}>
            <header className="events-header" style={styles.header}>
                <div style={styles.container}>
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} style={styles.heroContent}>
                        <Title style={styles.heroTitle}>Événements & Rencontres</Title>
                        <Paragraph style={styles.heroSubtitle}>
                            Participez à nos événements de recrutement, webinaires et ateliers pour booster votre carrière.
                        </Paragraph>

                        <div style={styles.searchWrap}>
                            <Select
                                size="large"
                                value={upcoming}
                                style={{ width: 180, marginRight: 16 }}
                                onChange={val => { setUpcoming(val); setPagination({...pagination, currentPage: 1}); }}
                            >
                                <Option value="true">À venir uniquement</Option>
                                <Option value="false">Tous les événements</Option>
                            </Select>
                            
                            <Select
                                size="large"
                                placeholder="Type d'événement"
                                style={{ width: 220 }}
                                allowClear
                                onChange={val => { setFilterType(val); setPagination({...pagination, currentPage: 1}); }}
                            >
                                <Option value="job_fair">Forums Emploi</Option>
                                <Option value="webinar">Webinaires en ligne</Option>
                                <Option value="workshop">Ateliers</Option>
                                <Option value="hackathon">Hackathons</Option>
                            </Select>
                        </div>
                    </motion.div>
                </div>
            </header>

            <main className="events-main" style={styles.main}>
                <div style={{ ...styles.container, maxWidth: 1000 }}>
                    <div style={styles.listHeader}>
                        <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                            {pagination.totalItems} Événement{pagination.totalItems !== 1 ? 's' : ''} trouvé{pagination.totalItems !== 1 ? 's' : ''}
                        </Title>
                    </div>

                    {loading ? (
                        <div style={styles.loader}>
                            <Spin size="large" />
                        </div>
                    ) : events.length === 0 ? (
                        <Empty description="Aucun événement prévu pour le moment." style={{ padding: '80px 0', background: '#fff', borderRadius: 16 }} />
                    ) : (
                        <div style={styles.eventList}>
                            {events.map((evt, index) => {
                                const evtDate = new Date(evt.date);
                                const isPast = evtDate < new Date();
                                
                                return (
                                    <motion.div
                                        key={evt._id}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.1, duration: 0.3 }}
                                    >
                                        <Card className="events-card" style={styles.eventCard} bodyStyle={{ padding: 24 }}>
                                            <div style={styles.eventRow}>
                                                <div style={styles.dateCol}>
                                                    <div style={styles.dateMonth}>{evtDate.toLocaleString('fr-FR', { month: 'short' }).toUpperCase()}</div>
                                                    <div style={styles.dateDay}>{evtDate.getDate()}</div>
                                                </div>
                                                
                                                <div style={styles.contentCol}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div>
                                                            <div style={{ marginBottom: 8 }}>
                                                                <Tag color={eventTypes[evt.type]?.color || 'blue'}>
                                                                    {eventTypes[evt.type]?.label || evt.type}
                                                                </Tag>
                                                                {evt.isOnline && <Tag color="cyan"><GlobalOutlined /> En ligne</Tag>}
                                                                {isPast && <Tag color="default">Terminé</Tag>}
                                                            </div>
                                                            <Title level={4} style={styles.evtTitle}>{evt.title}</Title>
                                                        </div>
                                                        
                                                        {evt.organizerCompany && (
                                                            <div style={styles.companyBadge}>
                                                                {evt.organizerCompany.logo ? (
                                                                    <img src={`${baseUrl}${evt.organizerCompany.logo}`} alt="logo" style={styles.compLogo} />
                                                                ) : (
                                                                    <BankOutlined style={{ fontSize: 24, color: '#94a3b8' }} />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={styles.evtMeta}>
                                                        <span style={styles.metaItem}>
                                                            <ClockCircleOutlined /> {evtDate.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span style={styles.metaItem}>
                                                            {evt.isOnline ? <GlobalOutlined /> : <EnvironmentOutlined />}
                                                            {evt.isOnline ? 'Lien Visio fourni après inscription' : evt.location}
                                                        </span>
                                                        <span style={styles.metaItem}>
                                                            <UserOutlined /> {evt.attendees?.length || 0} participant(s)
                                                        </span>
                                                    </div>

                                                    <Paragraph style={styles.evtDesc} ellipsis={{ rows: 2 }}>
                                                        {evt.description}
                                                    </Paragraph>
                                                </div>

                                                <div style={styles.actionCol}>
                                                    <Button 
                                                        type="primary" 
                                                        size="large" 
                                                        block
                                                        disabled={isPast || (evt.maxAttendees > 0 && evt.attendees?.length >= evt.maxAttendees)}
                                                        onClick={() => handleRegister(evt._id)}
                                                    >
                                                        {isPast ? 'Terminé' : (evt.maxAttendees > 0 && evt.attendees?.length >= evt.maxAttendees) ? 'Complet' : 'S\'inscrire'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </motion.div>
    );
}

const styles = {
    page: { minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" },
    header: { background: 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)', padding: '60px 0 80px 0', color: '#fff' },
    container: { margin: '0 auto', padding: '0 24px' },
    heroContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 700, margin: '0 auto' },
    heroTitle: { color: '#fff', fontSize: 42, fontWeight: 800, marginBottom: 16 },
    heroSubtitle: { color: '#cbd5e1', fontSize: 18, marginBottom: 32 },
    searchWrap: { display: 'flex', justifyContent: 'center' },
    main: { padding: '0 0 80px 0', marginTop: -40 },
    listHeader: { marginBottom: 24 },
    loader: { display: 'flex', justifyContent: 'center', padding: 80 },
    eventList: { display: 'flex', flexDirection: 'column', gap: 20 },
    eventCard: {
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s ease',
    },
    eventRow: { display: 'flex', gap: 24, alignItems: 'center' },
    dateCol: {
        width: 80,
        height: 100,
        background: '#f1f5f9',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
    },
    dateMonth: { color: '#ef4444', fontWeight: 700, fontSize: 13, letterSpacing: 1 },
    dateDay: { color: '#0f172a', fontWeight: 800, fontSize: 28, lineHeight: 1 },
    contentCol: { flex: 1 },
    evtTitle: { margin: '0 0 8px 0', fontSize: 20, color: '#0f172a', fontWeight: 700 },
    evtMeta: { display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' },
    metaItem: { display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 14, fontWeight: 500 },
    evtDesc: { color: '#475569', fontSize: 15, margin: 0 },
    companyBadge: { width: 50, height: 50, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    compLogo: { width: '100%', height: '100%', objectFit: 'cover' },
    actionCol: { width: 140, paddingLeft: 24, borderLeft: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center' }
};
