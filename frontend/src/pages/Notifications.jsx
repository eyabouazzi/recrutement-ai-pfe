import { useState, useEffect, useCallback } from 'react';
import {
    Card,
    List,
    Avatar,
    Badge,
    Button,
    Typography,
    Space,
    Tag,
    Switch,
    Divider,
    Row,
    Col,
    message,
} from 'antd';
import {
    BellOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    SettingOutlined,
    DeleteOutlined,
    SoundOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useWebSocket } from '../contexts/WebSocketContext';
import {
    getNotifications as getNotificationsApi,
    markAsRead as markAsReadApi,
    markAllAsRead as markAllAsReadApi,
    deleteNotification as deleteNotificationApi,
} from '../api/appNotification';

const { Title, Text } = Typography;

const isObjectIdLike = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

const toUiType = (rawType) => {
    switch (rawType) {
        case 'SUBMISSION_CREATED':
        case 'score_ready':
        case 'success':
        case 'INTERVIEW_SCHEDULED':
        case 'NEW_MATCH_RECOMMENDATION':
            return 'success';
        case 'warning':
            return 'warning';
        case 'error':
            return 'error';
        default:
            return 'info';
    }
};

const toDefaultTitle = (rawType) => {
    switch (rawType) {
        case 'SUBMISSION_CREATED':
            return 'Test termine';
        case 'APPLICATION_STATUS_CHANGED':
            return 'Statut mis a jour';
        case 'CANDIDATE_SUBMITTED':
            return 'Nouvelle soumission';
        case 'INTERVIEW_SCHEDULED':
            return 'Entretien programme';
        case 'NEW_MATCH_RECOMMENDATION':
            return 'Nouveau match';
        case 'score_ready':
            return 'Score disponible';
        default:
            return 'Notification';
    }
};

const toDefaultMessage = (rawType, notification) => {
    if (rawType === 'SUBMISSION_CREATED') {
        const testTitle = notification?.data?.testTitle || 'Test';
        const score = notification?.data?.score != null ? `${notification.data.score}%` : 'n/a';
        return `Le test "${testTitle}" est termine. Score: ${score}`;
    }
    if (rawType === 'APPLICATION_STATUS_CHANGED') {
        return 'Votre candidature a ete mise a jour.';
    }
    if (rawType === 'CANDIDATE_SUBMITTED') {
        const testTitle = notification?.data?.testTitle || 'Test';
        return `Un candidat a termine "${testTitle}".`;
    }
    if (rawType === 'INTERVIEW_SCHEDULED') {
        return 'Un entretien a ete planifie pour votre candidature.';
    }
    if (rawType === 'NEW_MATCH_RECOMMENDATION') {
        const testTitle = notification?.data?.testTitle || 'Opportunite';
        const score = notification?.data?.score != null ? `${notification.data.score}%` : '';
        return score ? `"${testTitle}" correspond a votre profil (${score}).` : `"${testTitle}" correspond a votre profil.`;
    }
    return '';
};

const toIcon = (uiType) => {
    switch (uiType) {
        case 'success':
            return <CheckCircleOutlined />;
        case 'warning':
        case 'error':
            return <ExclamationCircleOutlined />;
        default:
            return <ClockCircleOutlined />;
    }
};

const normalizeNotification = (notification, idx = 0) => {
    const rawType = String(notification?.type || 'general');
    const uiType = toUiType(rawType);

    const rawDate = notification?.createdAt || notification?.timestamp;
    const date = rawDate ? new Date(rawDate) : null;
    const isValidDate = date && !Number.isNaN(date.getTime());
    const timestampMs = isValidDate ? date.getTime() : Date.now();
    const time = isValidDate ? date.toLocaleString() : '';

    const fromId = notification?._id ? String(notification._id) : null;
    const fromAliasId = notification?.id ? String(notification.id) : null;
    const backendId = fromId || (isObjectIdLike(fromAliasId) ? fromAliasId : null);
    const id = backendId || fromAliasId || `${rawType}-${timestampMs}-${idx}`;

    return {
        id,
        backendId,
        rawType,
        type: uiType,
        title: notification?.title || toDefaultTitle(rawType),
        message: notification?.message || toDefaultMessage(rawType, notification),
        time,
        timestampMs,
        read: Boolean(notification?.read),
        icon: toIcon(uiType),
    };
};

const mergeNotifications = (current, incoming) => {
    const byId = new Map(current.map((item) => [item.id, item]));

    incoming.forEach((item) => {
        const existing = byId.get(item.id);
        if (existing) {
            byId.set(item.id, {
                ...item,
                backendId: item.backendId || existing.backendId,
                read: existing.read || item.read,
            });
            return;
        }
        byId.set(item.id, item);
    });

    return Array.from(byId.values()).sort((a, b) => b.timestampMs - a.timestampMs);
};

function Notifications() {
    const { notifications: liveNotifications, clearNotifications } = useWebSocket();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);

    const loadNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getNotificationsApi({ page: 1, limit: 100 });
            if (!response?.status) {
                throw new Error(response?.message || response?.error || 'Chargement impossible');
            }

            const normalized = (response.notifications || []).map((item, idx) => normalizeNotification(item, idx));
            setNotifications((prev) => mergeNotifications(prev, normalized));
        } catch (error) {
            message.error(error.message || 'Impossible de charger les notifications');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    useEffect(() => {
        if (!Array.isArray(liveNotifications) || liveNotifications.length === 0) return;
        const normalizedLive = liveNotifications.map((item, idx) => normalizeNotification(item, idx));
        setNotifications((prev) => mergeNotifications(prev, normalizedLive));
    }, [liveNotifications]);

    const unreadCount = notifications.filter((notification) => !notification.read).length;

    const markAsRead = async (id) => {
        const target = notifications.find((item) => item.id === id);
        if (!target || target.read) return;

        setNotifications((prev) =>
            prev.map((item) => (item.id === id ? { ...item, read: true } : item))
        );

        if (target.backendId) {
            const response = await markAsReadApi(target.backendId);
            if (!response?.status) {
                message.error(response?.message || response?.error || 'Action impossible');
            }
        }
    };

    const markAllAsRead = async () => {
        setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));

        const hasPersistent = notifications.some((item) => item.backendId);
        if (!hasPersistent) return;

        const response = await markAllAsReadApi();
        if (!response?.status) {
            message.error(response?.message || response?.error || 'Action impossible');
        }
    };

    const deleteNotification = async (id) => {
        const target = notifications.find((item) => item.id === id);

        setNotifications((prev) => prev.filter((item) => item.id !== id));

        if (target?.backendId) {
            const response = await deleteNotificationApi(target.backendId);
            if (!response?.status) {
                message.error(response?.message || response?.error || 'Suppression impossible');
            }
        }
    };

    const clearAll = async () => {
        const backendIds = notifications
            .map((item) => item.backendId)
            .filter(Boolean);

        if (backendIds.length > 0) {
            await Promise.allSettled(backendIds.map((id) => deleteNotificationApi(id)));
        }

        setNotifications([]);
        clearNotifications();
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'success':
                return '#10b981';
            case 'warning':
                return '#f59e0b';
            case 'error':
                return '#ef4444';
            default:
                return '#3b82f6';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={styles.container}
        >
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
                        <Button type="primary" onClick={markAllAsRead} disabled={unreadCount === 0}>
                            Tout marquer comme lu
                        </Button>
                        <Button icon={<DeleteOutlined />} onClick={clearAll} danger>
                            Tout supprimer
                        </Button>
                    </div>
                </div>
            </motion.div>

            <div style={styles.content}>
                <Row gutter={24}>
                    <Col xs={24} lg={16}>
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <Card style={styles.notificationsCard}>
                                <List
                                    loading={loading}
                                    dataSource={notifications}
                                    renderItem={(notificationItem) => (
                                        <List.Item
                                            style={{
                                                ...styles.notificationItem,
                                                background: notificationItem.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                                                borderLeft: notificationItem.read
                                                    ? 'none'
                                                    : `4px solid ${getNotificationColor(notificationItem.type)}`,
                                            }}
                                        >
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar
                                                        icon={notificationItem.icon}
                                                        style={{
                                                            backgroundColor: notificationItem.read
                                                                ? '#e2e8f0'
                                                                : getNotificationColor(notificationItem.type),
                                                            color: notificationItem.read ? '#94a3b8' : 'white',
                                                        }}
                                                    />
                                                }
                                                title={
                                                    <div style={styles.notificationHeader}>
                                                        <Text strong style={{ color: notificationItem.read ? '#64748b' : '#1e293b' }}>
                                                            {notificationItem.title}
                                                        </Text>
                                                        {!notificationItem.read && (
                                                            <Tag color={getNotificationColor(notificationItem.type)} style={styles.tag}>
                                                                Nouveau
                                                            </Tag>
                                                        )}
                                                    </div>
                                                }
                                                description={
                                                    <div>
                                                        <Text style={{ color: notificationItem.read ? '#94a3b8' : '#64748b' }}>
                                                            {notificationItem.message}
                                                        </Text>
                                                        <div style={styles.notificationFooter}>
                                                            <Text type="secondary" style={styles.time}>
                                                                {notificationItem.time}
                                                            </Text>
                                                            <Space>
                                                                {!notificationItem.read && (
                                                                    <Button
                                                                        type="link"
                                                                        size="small"
                                                                        onClick={() => markAsRead(notificationItem.id)}
                                                                    >
                                                                        Marquer comme lu
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    type="link"
                                                                    size="small"
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => deleteNotification(notificationItem.id)}
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

                                {!loading && notifications.length === 0 && (
                                    <div style={styles.emptyState}>
                                        <BellOutlined style={styles.emptyIcon} />
                                        <Title level={4} style={{ color: '#6b7280', marginBottom: 8 }}>
                                            Aucune notification
                                        </Title>
                                        <Text type="secondary">
                                            Vous etes a jour. Les nouvelles notifications apparaitront ici.
                                        </Text>
                                    </div>
                                )}
                            </Card>
                        </motion.div>
                    </Col>

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
                                        Parametres
                                    </div>
                                }
                                style={styles.settingsCard}
                            >
                                <div style={styles.settingItem}>
                                    <div>
                                        <Text strong>Notifications sonores</Text>
                                        <br />
                                        <Text type="secondary">Emettre un son lors de nouvelles notifications</Text>
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
                                    <Switch checked={emailEnabled} onChange={setEmailEnabled} />
                                </div>

                                <Divider style={{ margin: '16px 0' }} />

                                <div style={styles.settingItem}>
                                    <div>
                                        <Text strong>Filtrer par type</Text>
                                        <br />
                                        <Space style={{ marginTop: 8 }}>
                                            <Tag color="success">Succes</Tag>
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
        fontFamily: "'Inter', sans-serif",
    },
    header: {
        marginBottom: 32,
    },
    headerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
    },
    titleSection: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
    },
    bellIcon: {
        fontSize: 32,
        color: '#3b82f6',
    },
    title: {
        margin: 0,
        color: '#1e293b',
    },
    actions: {
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
    },
    content: {
        marginTop: 24,
    },
    notificationsCard: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
    },
    notificationItem: {
        padding: '20px 16px',
        borderRadius: 12,
        marginBottom: 12,
        transition: 'all 0.2s ease',
    },
    notificationHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    tag: {
        fontSize: 10,
        padding: '2px 8px',
    },
    notificationFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    time: {
        fontSize: 12,
    },
    emptyState: {
        textAlign: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 48,
        color: '#d1d5db',
        marginBottom: 16,
    },
    settingsCard: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f1f5f9',
        height: 'fit-content',
    },
    settingsTitle: {
        fontSize: 16,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
    },
    settingItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
};

export default Notifications;
