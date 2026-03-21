import React, { createContext, useContext, useReducer } from 'react';
import { Spin, Alert } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';

// Loading states reducer
const loadingReducer = (state, action) => {
    switch (action.type) {
        case 'START_LOADING':
            return {
                ...state,
                [action.key]: {
                    isLoading: true,
                    message: action.message || 'Loading...',
                    type: action.loadingType || 'spinner'
                }
            };
        case 'STOP_LOADING':
            return {
                ...state,
                [action.key]: {
                    isLoading: false,
                    message: '',
                    type: 'spinner'
                }
            };
        case 'SET_GLOBAL_LOADING':
            return {
                ...state,
                global: {
                    isLoading: action.isLoading,
                    message: action.message || 'Loading...',
                    fullscreen: action.fullscreen || false
                }
            };
        default:
            return state;
    }
};

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
    const [loadingStates, dispatch] = useReducer(loadingReducer, {
        global: { isLoading: false, message: '', fullscreen: false }
    });

    const startLoading = (key, message, loadingType = 'spinner') => {
        dispatch({ type: 'START_LOADING', key, message, loadingType });
    };

    const stopLoading = (key) => {
        dispatch({ type: 'STOP_LOADING', key });
    };

    const setGlobalLoading = (isLoading, message, fullscreen = false) => {
        dispatch({ type: 'SET_GLOBAL_LOADING', isLoading, message, fullscreen });
    };

    const isLoading = (key) => {
        return loadingStates[key]?.isLoading || false;
    };

    const value = {
        loadingStates,
        startLoading,
        stopLoading,
        setGlobalLoading,
        isLoading
    };

    return (
        <LoadingContext.Provider value={value}>
            {children}
            <GlobalLoadingOverlay loadingStates={loadingStates} />
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within LoadingProvider');
    }
    return context;
}

// Global loading overlay component
function GlobalLoadingOverlay({ loadingStates }) {
    const { global } = loadingStates;
    
    if (!global.isLoading) return null;

    return (
        <AnimatePresence>
            {global.isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={styles.overlay}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        style={styles.container}
                    >
                        {global.fullscreen ? (
                            <FullScreenLoader message={global.message} />
                        ) : (
                            <InlineLoader message={global.message} />
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Full screen loader
function FullScreenLoader({ message }) {
    return (
        <div style={styles.fullScreenLoader}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={styles.spinner}
            >
                <div style={styles.spinnerInner}></div>
            </motion.div>
            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.message}
            >
                {message}
            </motion.h3>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={styles.subMessage}
            >
                Please wait...
            </motion.p>
        </div>
    );
}

// Inline loader
function InlineLoader({ message }) {
    return (
        <div style={styles.inlineLoader}>
            <Spin size="large" />
            <p style={styles.inlineMessage}>{message}</p>
        </div>
    );
}

// Loading wrapper component for individual sections
export function LoadingWrapper({ 
    loadingKey, 
    children, 
    loadingMessage = 'Loading...', 
    minHeight = 200,
    showSkeleton = false 
}) {
    const { isLoading, startLoading, stopLoading } = useLoading();
    
    const isLoadingState = isLoading(loadingKey);

    return (
        <div style={{ ...styles.wrapper, minHeight }}>
            <AnimatePresence>
                {isLoadingState ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={styles.loadingWrapper}
                    >
                        {showSkeleton ? (
                            <SkeletonLoader />
                        ) : (
                            <div style={styles.centered}>
                                <Spin size="large" />
                                <p style={styles.inlineMessage}>{loadingMessage}</p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Skeleton loader component
function SkeletonLoader() {
    return (
        <div style={styles.skeletonContainer}>
            <div style={styles.skeletonHeader}>
                <div style={{ ...styles.skeletonAvatar }}></div>
                <div style={styles.skeletonText}>
                    <div style={{ ...styles.skeletonLine, width: '60%' }}></div>
                    <div style={{ ...styles.skeletonLine, width: '40%', marginTop: 8 }}></div>
                </div>
            </div>
            <div style={styles.skeletonContent}>
                <div style={{ ...styles.skeletonLine, width: '100%' }}></div>
                <div style={{ ...styles.skeletonLine, width: '80%', marginTop: 12 }}></div>
                <div style={{ ...styles.skeletonLine, width: '90%', marginTop: 12 }}></div>
            </div>
        </div>
    );
}

// Hook for easy loading management
export function useLoadingManager(key, autoStart = false) {
    const { startLoading, stopLoading, isLoading } = useLoading();
    
    const start = (message) => startLoading(key, message);
    const stop = () => stopLoading(key);
    const loading = isLoading(key);
    
    // Auto-start loading if requested
    React.useEffect(() => {
        if (autoStart) {
            start();
            return () => stop();
        }
    }, [autoStart]);
    
    return { start, stop, loading };
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
    },
    container: {
        textAlign: 'center'
    },
    fullScreenLoader: {
        textAlign: 'center',
        padding: 40
    },
    spinner: {
        width: 64,
        height: 64,
        border: '6px solid #e2e8f0',
        borderTop: '6px solid #3b82f6',
        borderRadius: '50%',
        position: 'relative',
        margin: '0 auto 24px'
    },
    spinnerInner: {
        position: 'absolute',
        top: -6,
        left: -6,
        right: -6,
        bottom: -6,
        border: '6px solid transparent',
        borderTop: '6px solid #8b5cf6',
        borderRadius: '50%'
    },
    message: {
        fontSize: 24,
        fontWeight: 600,
        color: '#334155',
        margin: '0 0 8px 0'
    },
    subMessage: {
        fontSize: 16,
        color: '#64748b',
        margin: 0
    },
    inlineLoader: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16
    },
    inlineMessage: {
        fontSize: 16,
        color: '#64748b',
        margin: 0
    },
    wrapper: {
        position: 'relative'
    },
    loadingWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    centered: {
        textAlign: 'center'
    },
    skeletonContainer: {
        width: '100%',
        padding: 24,
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #f1f5f9'
    },
    skeletonHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24
    },
    skeletonAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'loading 1.5s infinite'
    },
    skeletonText: {
        flex: 1
    },
    skeletonLine: {
        height: 16,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        borderRadius: 4,
        animation: 'loading 1.5s infinite'
    },
    skeletonContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
    }
};

// Add keyframes for skeleton animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
`;
document.head.appendChild(styleSheet);