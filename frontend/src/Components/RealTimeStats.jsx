import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Spin, Tooltip, Badge } from 'antd';
import { 
    TeamOutlined, 
    FileTextOutlined, 
    CheckCircleOutlined, 
    UserOutlined,
    SyncOutlined,
    BarChartOutlined
} from '@ant-design/icons';
import { useWebSocket } from '../contexts/WebSocketContext';
import { motion } from 'framer-motion';

const RealTimeStats = ({ compact = false }) => {
    const { realTimeStats, connected } = useWebSocket();
    const [previousStats, setPreviousStats] = useState(realTimeStats);

    // Track changes for animation
    useEffect(() => {
        setPreviousStats(realTimeStats);
    }, [realTimeStats]);

    const getChangeIndicator = (current, previous, isPositive = true) => {
        if (!previous.timestamp) return null;
        const diff = current - previous;
        if (diff === 0) return null;
        
        return (
            <Tooltip title={`${diff > 0 ? '+' : ''}${diff} depuis la dernière mise à jour`}>
                <Badge 
                    count={diff > 0 ? `+${diff}` : diff}
                    style={{
                        backgroundColor: diff > 0 ? '#52c41a' : '#ff4d4f',
                        marginLeft: 8
                    }}
                />
            </Tooltip>
        );
    };

    if (!connected) {
        return (
            <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin />
                <div style={{ marginTop: 10 }}>Connexion aux statistiques en temps réel...</div>
            </div>
        );
    }

    const statsData = [
        {
            title: "Tests Publiés",
            value: realTimeStats.publishedTests,
            previous: previousStats.publishedTests,
            icon: <FileTextOutlined />,
            color: '#3b82f6',
            description: "Offres actives"
        },
        {
            title: "Candidatures",
            value: realTimeStats.totalSubmissions,
            previous: previousStats.totalSubmissions,
            icon: <TeamOutlined />,
            color: '#10b981',
            description: "Au total"
        },
        {
            title: "Utilisateurs",
            value: realTimeStats.totalUsers,
            previous: previousStats.totalUsers,
            icon: <UserOutlined />,
            color: '#8b5cf6',
            description: "Inscrits"
        },
        {
            title: "Candidatures 24h",
            value: realTimeStats.recentSubmissions,
            previous: previousStats.recentSubmissions,
            icon: <CheckCircleOutlined />,
            color: '#f59e0b',
            description: "Dernières 24 heures"
        }
    ];

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card size="small" style={{ border: '1px solid #e2e8f0' }}>
                    <Row gutter={16}>
                        {statsData.map((stat, index) => (
                            <Col span={6} key={index}>
                                <Statistic
                                    title={stat.title}
                                    value={stat.value}
                                    prefix={stat.icon}
                                    valueStyle={{ 
                                        color: stat.color,
                                        fontSize: 16,
                                        fontWeight: 600
                                    }}
                                    suffix={getChangeIndicator(stat.value, stat.previous)}
                                />
                            </Col>
                        ))}
                    </Row>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card 
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <BarChartOutlined style={{ color: '#3b82f6' }} />
                        Statistiques en Temps Réel
                        <Tooltip title="Mis à jour toutes les 5 secondes">
                            <SyncOutlined spin={connected} style={{ color: connected ? '#10b981' : '#ef4444' }} />
                        </Tooltip>
                    </div>
                }
                extra={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            backgroundColor: connected ? '#10b981' : '#ef4444' 
                        }} />
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            {connected ? 'Connecté' : 'Déconnecté'}
                        </span>
                    </div>
                }
                style={{ 
                    borderRadius: 16,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                }}
            >
                <Row gutter={[24, 24]}>
                    {statsData.map((stat, index) => (
                        <Col xs={24} sm={12} lg={6} key={index}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                whileHover={{ y: -5 }}
                            >
                                <Card 
                                    style={{
                                        borderRadius: 12,
                                        border: `1px solid ${stat.color}20`,
                                        background: `linear-gradient(135deg, ${stat.color}05 0%, ${stat.color}10 100%)`
                                    }}
                                    bodyStyle={{ padding: 20 }}
                                >
                                    <Statistic
                                        title={
                                            <div style={{ 
                                                fontSize: 14, 
                                                color: '#64748b',
                                                fontWeight: 500,
                                                marginBottom: 8
                                            }}>
                                                {stat.title}
                                            </div>
                                        }
                                        value={stat.value}
                                        prefix={
                                            <div style={{
                                                fontSize: 24,
                                                color: stat.color,
                                                marginRight: 8
                                            }}>
                                                {stat.icon}
                                            </div>
                                        }
                                        valueStyle={{
                                            color: stat.color,
                                            fontSize: 28,
                                            fontWeight: 700
                                        }}
                                        suffix={getChangeIndicator(stat.value, stat.previous)}
                                    />
                                    <div style={{
                                        fontSize: 12,
                                        color: '#94a3b8',
                                        marginTop: 8,
                                        fontStyle: 'italic'
                                    }}>
                                        {stat.description}
                                    </div>
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
                
                {realTimeStats.timestamp && (
                    <div style={{
                        textAlign: 'center',
                        marginTop: 20,
                        paddingTop: 16,
                        borderTop: '1px solid #f1f5f9',
                        color: '#64748b',
                        fontSize: 12
                    }}>
                        Dernière mise à jour : {new Date(realTimeStats.timestamp).toLocaleTimeString('fr-FR')}
                    </div>
                )}
            </Card>
        </motion.div>
    );
};

export default RealTimeStats;