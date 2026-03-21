import { useState, useEffect } from 'react';
import { Card, Progress, Typography, Row, Col, Statistic, Tag, Button, Space, List, Avatar } from 'antd';
import { RadarChartOutlined, StarOutlined, TrophyOutlined, FireOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

function SkillsAssessment() {
    const [skills, setSkills] = useState([
        { name: 'JavaScript', level: 85, category: 'Frontend', lastAssessed: '2024-01-15' },
        { name: 'React', level: 78, category: 'Frontend', lastAssessed: '2024-01-15' },
        { name: 'Node.js', level: 72, category: 'Backend', lastAssessed: '2024-01-10' },
        { name: 'Python', level: 65, category: 'Backend', lastAssessed: '2024-01-12' },
        { name: 'SQL', level: 70, category: 'Database', lastAssessed: '2024-01-08' },
        { name: 'UI/UX Design', level: 60, category: 'Design', lastAssessed: '2024-01-14' },
        { name: 'Project Management', level: 55, category: 'Soft Skills', lastAssessed: '2024-01-11' },
        { name: 'Communication', level: 80, category: 'Soft Skills', lastAssessed: '2024-01-13' }
    ]);

    const [recommendedTests, setRecommendedTests] = useState([
        { id: 1, title: 'Advanced JavaScript Concepts', difficulty: 'Difficile', category: 'Frontend', recommended: true },
        { id: 2, title: 'React Performance Optimization', difficulty: 'Moyen', category: 'Frontend', recommended: true },
        { id: 3, title: 'Database Design Principles', difficulty: 'Moyen', category: 'Database', recommended: true },
        { id: 4, title: 'Leadership and Team Management', difficulty: 'Facile', category: 'Soft Skills', recommended: true }
    ]);

    const getCategoryColor = (category) => {
        const colors = {
            'Frontend': 'blue',
            'Backend': 'green',
            'Database': 'purple',
            'Design': 'pink',
            'Soft Skills': 'orange'
        };
        return colors[category] || 'default';
    };

    const getLevelStatus = (level) => {
        if (level >= 80) return { color: '#10b981', text: 'Expert' };
        if (level >= 60) return { color: '#3b82f6', text: 'Avancé' };
        if (level >= 40) return { color: '#f59e0b', text: 'Intermédiaire' };
        return { color: '#ef4444', text: 'Débutant' };
    };

    const overallScore = Math.round(skills.reduce((sum, skill) => sum + skill.level, 0) / skills.length);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={styles.container}
        >
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                style={styles.header}
            >
                <div>
                    <Title level={2} style={styles.title}>
                        <RadarChartOutlined style={{ marginRight: 12 }} />
                        Évaluation des Compétences
                    </Title>
                    <Text type="secondary">
                        Suivez votre progression et identifiez les domaines à améliorer
                    </Text>
                </div>
                <Button type="primary" icon={<StarOutlined />}>
                    Nouvelle Évaluation
                </Button>
            </motion.div>

            {/* Overall Score */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={styles.overallScore}
            >
                <Card style={styles.scoreCard}>
                    <div style={styles.scoreContent}>
                        <div>
                            <Text style={styles.scoreLabel}>Score Global</Text>
                            <div style={styles.scoreValue}>{overallScore}%</div>
                            <Text type="secondary">Basé sur {skills.length} compétences</Text>
                        </div>
                        <div style={styles.scoreProgress}>
                            <Progress
                                type="circle"
                                percent={overallScore}
                                width={120}
                                strokeWidth={8}
                                strokeColor={{
                                    '0%': '#10b981',
                                    '50%': '#3b82f6',
                                    '100%': '#8b5cf6'
                                }}
                            />
                        </div>
                    </div>
                </Card>
            </motion.div>

            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                {/* Skills Breakdown */}
                <Col xs={24} lg={16}>
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <Card 
                            title={
                                <div style={styles.sectionTitle}>
                                    <FireOutlined style={{ marginRight: 12, color: '#f59e0b' }} />
                                    Détail des Compétences
                                </div>
                            }
                            style={styles.mainCard}
                        >
                            <List
                                dataSource={skills}
                                renderItem={skill => {
                                    const status = getLevelStatus(skill.level);
                                    return (
                                        <List.Item style={styles.skillItem}>
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar 
                                                        style={{ 
                                                            backgroundColor: status.color,
                                                            minWidth: 40
                                                        }}
                                                    >
                                                        {skill.level}%
                                                    </Avatar>
                                                }
                                                title={
                                                    <div style={styles.skillHeader}>
                                                        <Text strong style={{ fontSize: 16 }}>
                                                            {skill.name}
                                                        </Text>
                                                        <Tag color={getCategoryColor(skill.category)}>
                                                            {skill.category}
                                                        </Tag>
                                                    </div>
                                                }
                                                description={
                                                    <div style={styles.skillDetails}>
                                                        <Progress 
                                                            percent={skill.level} 
                                                            strokeColor={status.color}
                                                            showInfo={false}
                                                            strokeWidth={6}
                                                        />
                                                        <div style={styles.skillFooter}>
                                                            <Text type="secondary">
                                                                Niveau: <Text strong style={{ color: status.color }}>
                                                                    {status.text}
                                                                </Text>
                                                            </Text>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                Dernière évaluation: {skill.lastAssessed}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    );
                                }}
                            />
                        </Card>
                    </motion.div>
                </Col>

                {/* Recommendations */}
                <Col xs={24} lg={8}>
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <Card 
                            title={
                                <div style={styles.sectionTitle}>
                                    <TrophyOutlined style={{ marginRight: 12, color: '#8b5cf6' }} />
                                    Tests Recommandés
                                </div>
                            }
                            style={styles.sidebarCard}
                        >
                            <div style={styles.recommendations}>
                                {recommendedTests.map(test => (
                                    <div key={test.id} style={styles.recommendationItem}>
                                        <div>
                                            <Text strong>{test.title}</Text>
                                            <div style={styles.testMeta}>
                                                <Tag color={getCategoryColor(test.category)}>
                                                    {test.category}
                                                </Tag>
                                                <Tag>{test.difficulty}</Tag>
                                            </div>
                                        </div>
                                        <Button 
                                            type="primary" 
                                            size="small"
                                            icon={<CheckCircleOutlined />}
                                            style={{ marginTop: 8 }}
                                        >
                                            Commencer
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={styles.improvementTips}>
                                <Title level={5} style={{ color: '#3b82f6', marginBottom: 12 }}>
                                    <StarOutlined style={{ marginRight: 8 }} />
                                    Conseils d'Amélioration
                                </Title>
                                <ul style={styles.tipsList}>
                                    <li>Pratiquez régulièrement avec des projets concrets</li>
                                    <li>Participez à des communautés de développeurs</li>
                                    <li>Suivez des formations spécialisées</li>
                                    <li>Mettez à jour vos compétences technologiques</li>
                                </ul>
                            </div>
                        </Card>
                    </motion.div>
                </Col>
            </Row>

            {/* Category Breakdown */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                style={{ marginTop: 24 }}
            >
                <Card 
                    title={
                        <div style={styles.sectionTitle}>
                            <RadarChartOutlined style={{ marginRight: 12 }} />
                            Répartition par Catégorie
                        </div>
                    }
                    style={styles.categoryCard}
                >
                    <Row gutter={[16, 16]}>
                        {Object.entries(
                            skills.reduce((acc, skill) => {
                                if (!acc[skill.category]) {
                                    acc[skill.category] = { total: 0, count: 0 };
                                }
                                acc[skill.category].total += skill.level;
                                acc[skill.category].count += 1;
                                return acc;
                            }, {})
                        ).map(([category, data]) => {
                            const average = Math.round(data.total / data.count);
                            const status = getLevelStatus(average);
                            return (
                                <Col xs={24} sm={12} md={8} lg={6} key={category}>
                                    <Card size="small" style={styles.categoryStat}>
                                        <Statistic
                                            title={
                                                <Tag color={getCategoryColor(category)} style={{ marginBottom: 8 }}>
                                                    {category}
                                                </Tag>
                                            }
                                            value={average}
                                            suffix="%"
                                            valueStyle={{ color: status.color, fontSize: 20 }}
                                        />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {data.count} compétence{data.count > 1 ? 's' : ''}
                                        </Text>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </Card>
            </motion.div>
        </motion.div>
    );
}

const styles = {
    container: {
        padding: 24,
        fontFamily: "'Inter', sans-serif"
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        flexWrap: 'wrap',
        gap: 20
    },
    title: {
        margin: 0,
        color: '#1e293b'
    },
    overallScore: {
        marginBottom: 24
    },
    scoreCard: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
    },
    scoreContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    scoreLabel: {
        fontSize: 18,
        color: '#64748b',
        display: 'block',
        marginBottom: 8
    },
    scoreValue: {
        fontSize: 48,
        fontWeight: 800,
        color: '#1e293b',
        margin: '8px 0'
    },
    scoreProgress: {
        marginLeft: 20
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center'
    },
    mainCard: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9'
    },
    sidebarCard: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        height: '100%'
    },
    categoryCard: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9'
    },
    skillItem: {
        padding: '16px 0',
        borderBottom: '1px solid #f1f5f9'
    },
    skillHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    skillDetails: {
        width: '100%'
    },
    skillFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8
    },
    recommendations: {
        marginBottom: 24
    },
    recommendationItem: {
        padding: 16,
        border: '1px solid #f1f5f9',
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: '#f8fafc'
    },
    testMeta: {
        marginTop: 8,
        display: 'flex',
        gap: 8
    },
    improvementTips: {
        padding: 16,
        backgroundColor: '#f0f9ff',
        borderRadius: 12,
        border: '1px solid #bae6fd'
    },
    tipsList: {
        paddingLeft: 20,
        margin: 0,
        color: '#64748b'
    },
    categoryStat: {
        textAlign: 'center',
        border: '1px solid #f1f5f9'
    }
};

export default SkillsAssessment;