import React, { useEffect, useState, useContext } from 'react';
import { Typography, Card, Button, Spin, Row, Col, Empty, message, Tag } from 'antd';
import { HeartFilled, HeartOutlined, AimOutlined, DeleteOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { getFavorites, removeFavorite } from '../../api/favorite';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { baseUrl } from '../../api/api';

const { Title, Text, Paragraph } = Typography;

export default function Favorites() {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const res = await getFavorites();
            if (res.status) {
                setFavorites(res.favorites);
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (jobId) => {
        try {
            const res = await removeFavorite(jobId);
            if (res.status) {
                message.success('Offre retirée des favoris');
                setFavorites(prev => prev.filter(f => f.jobId?._id !== jobId));
            }
        } catch (error) {
            message.error('Impossible de retirer l\'offre des favoris');
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;

    return (
        <div style={{ padding: '0 24px 40px 24px', maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 48, height: 48, borderRadius: 12, 
                    background: 'linear-gradient(135deg, #fecdd3, #f43f5e)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <HeartFilled style={{ fontSize: 24, color: '#fff' }} />
                </div>
                <div>
                    <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>Mes Favoris</Title>
                    <Text type="secondary">Retrouvez toutes vos offres d'emploi mises de côté.</Text>
                </div>
            </div>

            {favorites.length === 0 ? (
                <Empty 
                    description="Vous n'avez aucune offre en favoris." 
                    style={{ padding: '60px', background: '#fff', borderRadius: 16 }} 
                />
            ) : (
                <Row gutter={[24, 24]}>
                    <AnimatePresence>
                        {favorites.map((fav, i) => {
                            const job = fav.jobId;
                            if (!job) return null; // Defensive programming if job was deleted

                            return (
                                <Col xs={24} md={12} key={fav._id}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                        transition={{ duration: 0.3, delay: i * 0.05 }}
                                        layout
                                    >
                                        <Card 
                                            hoverable 
                                            style={{ borderRadius: 16, border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column' }}
                                            bodyStyle={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                                <div>
                                                    <Tag color={job.status === 'publish' ? 'blue' : 'default'} style={{ marginBottom: 8 }}>
                                                        {job.employmentType || 'CDI'}
                                                    </Tag>
                                                    <Title level={4} style={{ margin: 0, color: '#0f172a' }}>{job.title}</Title>
                                                    <Text style={{ color: '#64748b', fontSize: 13 }}>
                                                        {job.createdBy?.companyId?.name || 'Entreprise Confidentielle'}
                                                    </Text>
                                                </div>
                                                <Button 
                                                    type="text" 
                                                    danger 
                                                    icon={<HeartFilled style={{ color: '#f43f5e', fontSize: 20 }} />}
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(job._id); }}
                                                />
                                            </div>

                                            <div style={{ color: '#475569', fontSize: 13, marginBottom: 16, display: 'flex', gap: 16 }}>
                                                <span><EnvironmentOutlined /> {job.location || 'Non spécifié'}</span>
                                            </div>

                                            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                                                <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                                                    Sauvegardé le {new Date(fav.savedAt).toLocaleDateString()}
                                                </Text>
                                                <Button 
                                                    type="primary" 
                                                    icon={<AimOutlined />}
                                                    onClick={() => navigate(`/careers/${job._id}`)}
                                                    style={{ background: '#3b82f6', borderRadius: 8, fontWeight: 600 }}
                                                >
                                                    Voir
                                                </Button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                </Col>
                            );
                        })}
                    </AnimatePresence>
                </Row>
            )}
        </div>
    );
}
