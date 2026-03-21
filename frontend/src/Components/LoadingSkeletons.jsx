import { Skeleton } from 'antd';
import { motion } from 'framer-motion';

export function LoadingSkeleton({ type = 'card', count = 1 }) {
    const skeletons = [];

    for (let i = 0; i < count; i++) {
        switch (type) {
            case 'stat':
                skeletons.push(
                    <motion.div
                        key={i}
                        style={styles.statSkeleton}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Skeleton.Avatar size={48} shape="square" active />
                        <div style={styles.statContent}>
                            <Skeleton.Input size="small" active style={{ width: 100 }} />
                            <Skeleton.Input size="large" active style={{ width: 80, marginTop: 8 }} />
                        </div>
                    </motion.div>
                );
                break;
                
            case 'card':
                skeletons.push(
                    <motion.div
                        key={i}
                        style={styles.cardSkeleton}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Skeleton active paragraph={{ rows: 4 }} />
                    </motion.div>
                );
                break;
                
            case 'list':
                skeletons.push(
                    <motion.div
                        key={i}
                        style={styles.listSkeleton}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Skeleton.Avatar size="large" active />
                        <div style={styles.listContent}>
                            <Skeleton.Input size="small" active style={{ width: 150 }} />
                            <Skeleton.Input size="small" active style={{ width: 100, marginTop: 8 }} />
                        </div>
                    </motion.div>
                );
                break;
                
            case 'table':
                skeletons.push(
                    <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Skeleton active paragraph={{ rows: 8 }} />
                    </motion.div>
                );
                break;
                
            default:
                skeletons.push(<Skeleton key={i} active />);
        }
    }

    return <>{skeletons}</>;
}

export function PageLoader() {
    return (
        <motion.div
            style={styles.pageLoader}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                style={styles.spinner}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
                <div style={styles.spinnerInner}></div>
            </motion.div>
            <motion.p
                style={styles.loaderText}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                Chargement en cours...
            </motion.p>
        </motion.div>
    );
}

export function FadeIn({ children, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            {children}
        </motion.div>
    );
}

export function SlideIn({ children, direction = 'left', delay = 0 }) {
    const directions = {
        left: { x: -30 },
        right: { x: 30 },
        up: { y: 30 },
        down: { y: -30 }
    };

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction] }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            {children}
        </motion.div>
    );
}

const styles = {
    statSkeleton: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 24,
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    },
    statContent: {
        flex: 1
    },
    cardSkeleton: {
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    },
    listSkeleton: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #f1f5f9'
    },
    listContent: {
        flex: 1
    },
    pageLoader: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh'
    },
    spinner: {
        width: 48,
        height: 48,
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        position: 'relative',
        marginBottom: 24
    },
    spinnerInner: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        border: '4px solid transparent',
        borderTop: '4px solid #8b5cf6',
        borderRadius: '50%'
    },
    loaderText: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: 500
    }
};