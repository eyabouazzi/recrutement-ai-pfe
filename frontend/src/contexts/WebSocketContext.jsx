import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './authContext';
import { App as AntdApp } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import { getUnreadCount as getUnreadCountApi } from '../api/appNotification';

const WebSocketContext = createContext();

const getNotificationKey = (notification) => {
    if (!notification) return null;
    return (
        notification._id ||
        notification.id ||
        `${notification.type || 'general'}-${notification.timestamp || ''}-${notification.title || ''}-${notification.message || ''}`
    );
};

const appendNotification = (previous, incoming) => {
    const key = getNotificationKey(incoming);
    if (!key) return [...previous, incoming];

    const alreadyExists = previous.some((item) => getNotificationKey(item) === key);
    if (alreadyExists) return previous;

    return [...previous, incoming];
};

const getAllowedNotificationTypes = (role) => {
    if (role === 'HR') {
        return new Set(['CANDIDATE_SUBMITTED', 'SUBMISSION_CREATED', 'SUSPICIOUS_PASTE_ACTIVITY', 'CHEATING_ALERT', 'general']);
    }
    if (role === 'candidat') {
        return new Set(['APPLICATION_STATUS_CHANGED', 'INTERVIEW_SCHEDULED', 'NEW_MATCH_RECOMMENDATION', 'general']);
    }
    return null;
};

const shouldReceiveNotificationForRole = (notification, role) => {
    if (!notification || !role) return false;
    const targetRole = String(notification.targetRole || notification?.data?.targetRole || '').trim();
    if (targetRole && targetRole !== 'all' && targetRole !== role) return false;
    if (targetRole === role || targetRole === 'all') return true;
    const allowedTypes = getAllowedNotificationTypes(role);
    if (!allowedTypes) return true;
    const type = String(notification.type || 'general');
    return allowedTypes.has(type);
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

export const WebSocketProvider = ({ children }) => {
    const { message } = AntdApp.useApp();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [realTimeStats, setRealTimeStats] = useState({
        totalTests: 0,
        publishedTests: 0,
        totalSubmissions: 0,
        totalUsers: 0,
        recentSubmissions: 0,
        timestamp: null,
    });
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useAuth();
    const socketRef = useRef(null);

    useEffect(() => {
        const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
        const newSocket = io(base, {
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: 8,
            reconnectionDelay: 800,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setConnected(true);
            if (user) {
                const uid = user._id ?? user.id;
                newSocket.emit('register', {
                    userId: uid,
                    role: user.role,
                });
            }
        });

        newSocket.on('disconnect', () => {
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            setConnected(false);
        });

        newSocket.on('statsUpdate', (stats) => {
            setRealTimeStats(stats);
        });

        newSocket.on('applicationNotification', (notification) => {
            if (!shouldReceiveNotificationForRole(notification, user?.role)) return;
            setNotifications((prev) => appendNotification(prev, notification));
            if (notification?.read !== true) {
                setUnreadCount((prev) => prev + 1);
            }

            switch (notification?.type) {
                case 'SUBMISSION_CREATED':
                    message.success({
                        content: `Test "${notification?.data?.testTitle || 'Test'}" termine (${notification?.data?.score ?? 'n/a'}%)`,
                        icon: <SoundOutlined />,
                        duration: 5,
                    });
                    break;
                case 'CANDIDATE_SUBMITTED': {
                    const testTitle = notification?.data?.testTitle || 'Test';
                    const score = notification?.data?.score != null ? `${notification.data.score}%` : 'n/a';
                    message.info({
                        content: `Un candidat a termine "${testTitle}" (score: ${score})`,
                        icon: <SoundOutlined />,
                        duration: 6,
                    });
                    break;
                }
                case 'SUSPICIOUS_PASTE_ACTIVITY': {
                    const candidateName = notification?.data?.candidateName || 'Un candidat';
                    const score = notification?.data?.plagiarismScore != null
                        ? ` (score plagiat: ${notification.data.plagiarismScore})`
                        : '';
                    message.warning({
                        content: `${candidateName} a un comportement suspect de collage${score}`,
                        icon: <SoundOutlined />,
                        duration: 7,
                    });
                    break;
                }
                case 'CHEATING_ALERT': {
                    const candidateName = notification?.data?.candidateName || 'Un candidat';
                    const trustScore = notification?.data?.trustScore;
                    const trustLabel = Number.isFinite(Number(trustScore))
                        ? ` (trust score: ${trustScore})`
                        : '';
                    message.error({
                        content: `Alerte triche: ${candidateName}${trustLabel}`,
                        icon: <SoundOutlined />,
                        duration: 8,
                    });
                    break;
                }
                case 'APPLICATION_STATUS_CHANGED':
                    message.info({
                        content: 'Statut de votre candidature mis a jour',
                        icon: <SoundOutlined />,
                        duration: 5,
                    });
                    break;
                case 'INTERVIEW_SCHEDULED':
                    message.success({
                        content: 'Entretien programme',
                        icon: <SoundOutlined />,
                        duration: 6,
                    });
                    break;
                case 'NEW_MATCH_RECOMMENDATION': {
                    const score = notification?.data?.score != null ? `${notification.data.score}%` : '';
                    message.info({
                        content: score ? `Nouvelle opportunite correspondante (${score})` : 'Nouvelle opportunite correspondante',
                        icon: <SoundOutlined />,
                        duration: 6,
                    });
                    break;
                }
                default:
                    message.info(notification?.title || notification?.message || 'Nouvelle notification recue');
            }
        });

        newSocket.on('notificationUnreadCount', (payload) => {
            if (payload?.unreadCount == null) return;
            setUnreadCount(Number(payload.unreadCount) || 0);
        });

        // Backward compatibility with legacy event channel.
        newSocket.on('hrNotification', (payload) => {
            if (user?.role !== 'HR') return;
            setNotifications((prev) => appendNotification(prev, { ...payload, channel: 'hr' }));
            if (payload?.type === 'CANDIDATE_SUBMITTED') {
                const title = payload?.data?.testTitle || 'Test';
                const score = payload?.data?.score != null ? `${payload.data.score}%` : 'n/a';
                message.info({
                    content: `Un candidat a termine "${title}" (score: ${score})`,
                    icon: <SoundOutlined />,
                    duration: 6,
                });
            }
        });

        return () => {
            newSocket.close();
        };
    }, [user]);

    const emitEvent = (eventName, data) => {
        if (socket && connected) {
            socket.emit(eventName, data);
        }
    };

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        let cancelled = false;
        getUnreadCountApi()
            .then((response) => {
                if (cancelled) return;
                if (response?.status) {
                    setUnreadCount(Number(response.unreadCount) || 0);
                }
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [user]);

    const value = {
        socket,
        connected,
        realTimeStats,
        notifications,
        unreadCount,
        emitEvent,
        clearNotifications,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};
