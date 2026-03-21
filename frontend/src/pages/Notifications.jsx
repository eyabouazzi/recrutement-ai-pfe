import { useState, useEffect } from 'react';
import { Card, List, Avatar, Badge, Button, Typography, Space, Tag, Switch, Divider } from 'antd';
import { BellOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, SettingOutlined, DeleteOutlined, SoundOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

function Notifications() {
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'success',
            title: 'Test complété avec succès',
            message: 'Votre test "Développeur Full Stack" a été évalué. Score: 85%',
            time: 'Il y a 2 heures',
            read: false,
            icon: <CheckCircleOutlined />
        },
        {
            id: 2,
            type: 'warning',
            title: 'Nouvelle opportunité',
            message: 'Un nouveau test "Data Scientist" est disponible dans votre domaine',
            time: 'Il y a 4 heures',
            read: false,
            icon: <ExclamationCircleOutlined />
        },
        {
            id: 3,
            type: 'info',
            title: 'Rappel d\'entretien',
            message: 'Entretien avec l\'équipe technique demain à 14h00',
            time: 'Il y a 1 jour',
            read: true,
            icon: <ClockCircleOutlined />
        },
        {
            id: 4,
            type: 'success',
            title: 'Profil mis à jour',
            message: 'Votre profil a été mis à jour avec succès',
            time: 'Il y a 2 jours',
            read: true,
            icon: <CheckCircleOutlined />
        }
    ]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id) => {
        setNotifications(notifications.map(notification => 
            notification.id === id 
                ? { ...notification, read: true }
                : notification
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(notification => 
            ({ ...notification, read: true })
        ));
    };

    const deleteNotification = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'success': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'error': return '#ef4444';
            default: return '#3b82f6';
        }
    };

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
                <div style={styles.headerContent}>
                    <div style={styles.titleSection}>
                        <Badge count={unreadCount} size="small">
                            <BellOutlined style={styles.bellIcon} />
                        </Badge>
                        <div>
                            <Title level={2} style={styles.title}>Notifications</Title>
                            <Text type="secondary">
                                {unreadCount} notification{unreadCount !== 1 ? 's' : ''} non lue{unreadCount !== 1 ? 's' : ''}
                            </Text>
                        </div>
                    </div>
                    <div style={styles.actions}>
                        <Button 
                            type="primary" 
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                        >
                            Tout marquer comme lu
                        </Button>
                        <Button 
                            icon={<DeleteOutlined />} 
                            onClick={clearAll}
                            danger
                        >
                            Tout supprimer
                        </Button>
                    </div>
                </div>
            </motion.div>

            <div style={styles.content}>
                <Row gutter={24}>
                    {/* Notifications List */}
                    <Col xs={24} lg={16}>
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <Card style={styles.notificationsCard}>
                                <List
                                    dataSource={notifications}
                                    renderItem={notification => (
                                        <List.Item
                                            style={{
                                                ...styles.notificationItem,
                                                background: notification.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                                                borderLeft: notification.read ? 'none' : `4px solid ${getNotificationColor(notification.type)}`
                                            }}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar 
                                                        icon={notification.icon}
                                                        style={{
                                                            backgroundColor: notification.read 
                                                                ? '#e2e8f0' 
                                                                : getNotificationColor(notification.type),
                                                            color: notification.read ? '#94a3b8' : 'white'
                                                        }}
                                                    />
                                                }
                                                title={
                                                    <div style={styles.notificationHeader}>
                                                        <Text strong style={{
                                                            color: notification.read ? '#64748b' : '#1e293b'
                                                        }}>
                                                            {notification.title}
                                                        </Text>
                                                        {!notification.read && (
                                                            <Tag color={getNotificationColor(notification.type)} style={styles.tag}>
                                                                Nouveau
                                                            </Tag>
                                                        )}
                                                    </div>
                                                }
                                                description={
                                                    <div>
                                                        <Text style={{
                                                            color: notification.read ? '#94a3b8' : '#64748b'
                                                        }}>
                                                            {notification.message}
                                                        </Text>
                                                        <div style={styles.notificationFooter}>
                                                            <Text type="secondary" style={styles.time}>
                                                                {notification.time}
                                                            </Text>
                                                            <Space>
                                                                {!notification.read && (
                                                                    <Button 
                                                                        type="link" 
                                                                        size="small"
                                                                        onClick={() => markAsRead(notification.id)}
                                                                    >
                                                                        Marquer comme lu
                                                                    </Button>
                                                                )}
                                                                <Button 
                                                                    type="link" 
                                                                    size="small"
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => deleteNotification(notification.id)}
                                                                    danger
                                                                />
                                                            </Space>
                                                        </div>
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                                
                                {notifications.length === 0 && (
                                    <div style={styles.emptyState}>
                                        <BellOutlined style={styles.emptyIcon} />
                                        <Title level={4} style={{ color: '#6b7280', marginBottom: 8 }}>
                                            Aucune notification
                                        </Title>
                                        <Text type="secondary">
                                            Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.
                                        </Text>
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    </Col>

                    {/* Settings Panel */}
                    <Col xs={24} lg={8}>
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <Card 
                                title={
                                    <div style={styles.settingsTitle}>
                                        <SettingOutlined style={{ marginRight: 8 }} />
                                        Paramètres
                                    </div>
                                }
                                style={styles.settingsCard}
                            >
                                <div style={styles.settingItem}>
                                    <div>
                                        <Text strong>Notifications sonores</Text>
                                        <br />
                                        <Text type="secondary">Émettre un son lors de nouvelles notifications</Text>
                                    </div>
                                    <Switch 
                                        checked={soundEnabled}
                                        onChange={setSoundEnabled}
                                        checkedChildren={<SoundOutlined />}
                                    />
                                </div>
                                
                                <Divider style={{ margin: '16px 0' }} />
                                
                                <div style={styles.settingItem}>
                                    <div>
                                        <Text strong>Notifications par email</Text>
                                        <br />
                                        <Text type="secondary">Recevoir les notifications importantes par email</Text>
                                    </div>
                                    <Switch 
                                        checked={emailEnabled}
                                        onChange={setEmailEnabled}
                                    />
                                </div>
                                
                                <Divider style={{ margin: '16px 0' }} />
                                
                                <div style={styles.settingItem}>
                                    <div>
                                        <Text strong>Filtrer par type</Text>
                                        <br />
                                        <Space style={{ marginTop: 8 }}>
                                            <Tag color="success">Succès</Tag>
                                            <Tag color="warning">Avertissements</Tag>
                                            <Tag color="blue">Informations</Tag>
                                        </Space>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </Col>
                </Row>
            </div>
        </motion.div>
    );
}

const styles = {
    container: {
        padding: 24,
        fontFamily: "'Inter', sans-serif"
    },
    header: {
        marginBottom: 32
    },
    headerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
    },
    titleSection: {
        display: 'flex',
        alignItems: 'center',
        gap: 16
    },
    bellIcon: {
        fontSize: 32,
        color: '#3b82f6'
    },
    title: {
        margin: 0,
        color: '#1e293b'
    },
    actions: {
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap'
    },
    content: {
        marginTop: 24
    },
    notificationsCard: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9'
    },
    notificationItem: {
        padding: '20px 16px',
        borderRadius: 12,
        marginBottom: 12,
        transition: 'all 0.2s ease'
    },
    notificationHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    tag: {
        fontSize: 10,
        padding: '2px 8px'
    },
    notificationFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12
    },
    time: {
        fontSize: 12
    },
    emptyState: {
        textAlign: 'center',
        padding: 40
    },
    emptyIcon: {
        fontSize: 48,
        color: '#d1d5db',
        marginBottom: 16
    },
    settingsCard: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        height: 'fit-content'
    },
    settingsTitle: {
        fontSize: 16,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center'
    },
    settingItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    }
};

export default Notifications;