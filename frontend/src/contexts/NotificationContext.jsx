import { createContext, useContext, useState, useCallback } from 'react';
import { notification } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((config) => {
        const id = Date.now() + Math.random();
        const notificationData = {
            id,
            ...config,
            timestamp: new Date()
        };

        setNotifications(prev => [...prev, notificationData]);

        // Auto-remove after duration
        if (config.duration !== 0) {
            setTimeout(() => {
                removeNotification(id);
            }, config.duration || 5000);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, []);

    const success = useCallback((message, description, config = {}) => {
        return showNotification({
            type: 'success',
            message,
            description,
            icon: '✅',
            ...config
        });
    }, [showNotification]);

    const error = useCallback((message, description, config = {}) => {
        return showNotification({
            type: 'error',
            message,
            description,
            icon: '❌',
            ...config
        });
    }, [showNotification]);

    const warning = useCallback((message, description, config = {}) => {
        return showNotification({
            type: 'warning',
            message,
            description,
            icon: '⚠️',
            ...config
        });
    }, [showNotification]);

    const info = useCallback((message, description, config = {}) => {
        return showNotification({
            type: 'info',
            message,
            description,
            icon: 'ℹ️',
            ...config
        });
    }, [showNotification]);

    const value = {
        notifications,
        showNotification,
        removeNotification,
        success,
        error,
        warning,
        info
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationContainer notifications={notifications} onRemove={removeNotification} />
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}

function NotificationContainer({ notifications, onRemove }) {
    return (
        <div style={styles.container}>
            <AnimatePresence>
                {notifications.map((notification) => (
                    <NotificationToast
                        key={notification.id}
                        notification={notification}
                        onRemove={onRemove}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

function NotificationToast({ notification, onRemove }) {
    const getTypeStyles = (type) => {
        const stylesMap = {
            success: {
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: '1px solid #047857'
            },
            error: {
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: '1px solid #b91c1c'
            },
            warning: {
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: '1px solid #b45309'
            },
            info: {
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: '1px solid #1d4ed8'
            }
        };
        return stylesMap[type] || stylesMap.info;
    };

    return (
        <motion.div
            style={{
                ...styles.toast,
                ...getTypeStyles(notification.type)
            }}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            whileHover={{ scale: 1.02 }}
        >
            <div style={styles.toastContent}>
                <div style={styles.toastIcon}>
                    {notification.icon}
                </div>
                <div style={styles.toastText}>
                    <div style={styles.toastTitle}>{notification.message}</div>
                    {notification.description && (
                        <div style={styles.toastDescription}>{notification.description}</div>
                    )}
                </div>
                <button
                    style={styles.closeButton}
                    onClick={() => onRemove(notification.id)}
                >
                    ×
                </button>
            </div>
            {notification.duration !== 0 && (
                <motion.div
                    style={styles.progress}
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: notification.duration || 5, ease: "linear" }}
                    onAnimationComplete={() => onRemove(notification.id)}
                />
            )}
        </motion.div>
    );
}

const styles = {
    container: {
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 400
    },
    toast: {
        borderRadius: 12,
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        color: '#fff',
        overflow: 'hidden',
        minWidth: 300
    },
    toastContent: {
        display: 'flex',
        alignItems: 'flex-start',
        padding: 16,
        gap: 12
    },
    toastIcon: {
        fontSize: 20,
        flexShrink: 0,
        marginTop: 2
    },
    toastText: {
        flex: 1
    },
    toastTitle: {
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 4
    },
    toastDescription: {
        fontSize: 13,
        opacity: 0.9,
        lineHeight: 1.4
    },
    closeButton: {
        background: 'transparent',
        border: 'none',
        color: 'rgba(255,255,255,0.8)',
        fontSize: 20,
        cursor: 'pointer',
        padding: 4,
        borderRadius: 4,
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
    },
    closeButtonHover: {
        background: 'rgba(255,255,255,0.2)'
    },
    progress: {
        height: 3,
        background: 'rgba(255,255,255,0.3)',
        marginLeft: 'auto'
    }
};