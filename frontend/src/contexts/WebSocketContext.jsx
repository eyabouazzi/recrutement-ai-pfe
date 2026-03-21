import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './authContext';
import { message } from 'antd';
import { SoundOutlined } from '@ant-design/icons';

const WebSocketContext = createContext();

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [realTimeStats, setRealTimeStats] = useState({
        totalTests: 0,
        publishedTests: 0,
        totalSubmissions: 0,
        totalUsers: 0,
        recentSubmissions: 0,
        timestamp: null
    });
    const { user } = useAuth();
    const socketRef = useRef(null);

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io('http://localhost:3000', {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        // Connection events
        newSocket.on('connect', () => {
            console.log('WebSocket connected');
            setConnected(true);
            
            // Register user if authenticated
            if (user) {
                newSocket.emit('register', {
                    userId: user.id,
                    role: user.role
                });
            }
        });

        newSocket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            setConnected(false);
        });

        // Real-time statistics updates
        newSocket.on('statsUpdate', (stats) => {
            setRealTimeStats(stats);
        });

        // Application notifications
        newSocket.on('applicationNotification', (notification) => {
            setNotifications(prev => [...prev, notification]);
            
            // Show toast notification
            switch(notification.type) {
                case 'SUBMISSION_CREATED':
                    message.success({
                        content: `Test "${notification.data.testTitle}" terminé avec succès (${notification.data.score}%)`,
                        icon: <SoundOutlined />,
                        duration: 5
                    });
                    break;
                case 'APPLICATION_STATUS_CHANGED':
                    message.info({
                        content: `Statut de votre candidature mis à jour`,
                        icon: <SoundOutlined />,
                        duration: 5
                    });
                    break;
                default:
                    message.info('Nouvelle notification reçue');
            }
        });

        // Cleanup
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
    };

    const value = {
        socket,
        connected,
        realTimeStats,
        notifications,
        emitEvent,
        clearNotifications
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};