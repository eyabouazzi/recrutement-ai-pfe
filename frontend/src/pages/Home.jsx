import { useState } from 'react';
import { motion } from 'framer-motion';

const FEATURES = [
    {
        id: 'ai-screening',
        title: "AI-Powered Candidate Screening",
        desc: "Automatically evaluate technical skills and behavioral competencies with advanced artificial intelligence. Save 85% of initial candidate sorting time.",
        badge: "AUTOMATION",
        color: '#10b981',
        icon: '🤖'
    },
    {
        id: 'pipeline',
        title: "Visual Recruitment Pipeline",
        desc: "Track every candidate through your hiring process with intuitive kanban boards. Drag-and-drop profiles seamlessly between stages.",
        badge: "VISUALIZATION",
        color: '#3b82f6',
        icon: '📊'
    },
    {
        id: 'analytics',
        title: "Advanced Analytics Dashboard",
        desc: "Measure campaign performance, time-to-hire metrics, and hiring quality with real-time reporting and actionable insights.",
        badge: "ANALYTICS",
        color: '#8b5cf6',
        icon: '📈'
    },
    {
        id: 'collaboration',
        title: "Team Collaboration Tools",
        desc: "Share notes, comment on profiles, and make collective decisions with your HR team in real-time collaborative environment.",
        badge: "COLLABORATION",
        color: '#f59e0b',
        icon: '👥'
    }
];

function Home() {
    const [activeFeature, setActiveFeature] = useState(FEATURES[0].id);
    const activeData = FEATURES.find(f => f.id === activeFeature);

    return (
        <div style={styles.root}>
            {/* Premium Hero Section */}
            <div style={styles.hero}>
                <div style={styles.heroContent}>
                    <motion.div 
                        style={styles.badge}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        AI RECRUITMENT PLATFORM
                    </motion.div>
                    
                    <motion.h1 
                        style={styles.title}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        Transform Your Hiring Process with
                        <span style={styles.highlight}> Artificial Intelligence</span>
                    </motion.h1>
                    
                    <motion.p 
                        style={styles.subtitle}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        Attract, evaluate, and hire top talent faster with our AI-powered recruitment platform. 
                        Reduce hiring time by 80% while improving candidate quality by 60%.
                    </motion.p>
                    
                    <motion.div 
                        style={styles.stats}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        <div style={styles.statItem}>
                            <div style={{...styles.statNumber, color: '#10b981'}}>80%</div>
                            <div style={styles.statLabel}>Faster Hiring</div>
                        </div>
                        <div style={styles.statItem}>
                            <div style={{...styles.statNumber, color: '#3b82f6'}}>60%</div>
                            <div style={styles.statLabel}>Better Quality</div>
                        </div>
                        <div style={styles.statItem}>
                            <div style={{...styles.statNumber, color: '#8b5cf6'}}>500+</div>
                            <div style={styles.statLabel}>Companies Trust Us</div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        style={styles.ctaButtons}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    >
                        <a href="/signup" style={{...styles.primaryButton, ...styles.buttonGlow}}>
                            Start Free Trial
                        </a>
                        <a href="/demo" style={styles.secondaryButton}>
                            Watch Demo
                        </a>
                    </motion.div>
                </div>

                {/* Professional Demo Preview */}
                <motion.div 
                    style={styles.heroDemo}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                >
                    <div style={styles.demoCard}>
                        <div style={styles.demoHeader}>
                            <div style={styles.demoDots}>
                                <span style={{background: '#ef4444'}}></span>
                                <span style={{background: '#f59e0b'}}></span>
                                <span style={{background: '#10b981'}}></span>
                            </div>
                            <div style={styles.demoUrl}>app.recruitment-ai.com</div>
                        </div>
                        <div style={styles.demoContent}>
                            <div style={styles.demoBadge}>LIVE DEMO</div>
                            <div style={styles.demoStats}>
                                <div style={styles.demoStat}>
                                    <div style={styles.demoValue}>247</div>
                                    <div style={styles.demoLabel}>Candidates Evaluated</div>
                                </div>
                                <div style={styles.demoStat}>
                                    <div style={styles.demoValue}>89%</div>
                                    <div style={styles.demoLabel}>Match Accuracy</div>
                                </div>
                                <div style={styles.demoStat}>
                                    <div style={styles.demoValue}>12 days</div>
                                    <div style={styles.demoLabel}>Avg. Time to Hire</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Features Section - Professional Grid Layout */}
            <div style={styles.featuresSection}>
                <div style={styles.sectionHeader}>
                    <motion.h2 
                        style={styles.sectionTitle}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        Powerful AI Features for Modern Recruitment
                    </motion.h2>
                    <motion.p 
                        style={styles.sectionSubtitle}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        Designed for HR teams who want to hire smarter, faster, and more effectively
                    </motion.p>
                </div>

                <div style={styles.featuresGrid}>
                    {FEATURES.map((feature, index) => (
                        <motion.div
                            key={feature.id}
                            style={{
                                ...styles.featureCard,
                                ...(activeFeature === feature.id ? styles.featureCardActive : {})
                            }}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            whileHover={{ y: -5 }}
                            onClick={() => setActiveFeature(feature.id)}
                        >
                            <div style={styles.featureHeader}>
                                <div style={{
                                    ...styles.featureBadge,
                                    background: `${feature.color}15`,
                                    color: feature.color
                                }}>
                                    {feature.badge}
                                </div>
                                <div style={styles.featureIcon}>
                                    <span style={{ fontSize: 24 }}>{feature.icon}</span>
                                </div>
                            </div>
                            
                            <h3 style={{
                                ...styles.featureTitle,
                                color: activeFeature === feature.id ? feature.color : '#1f2937'
                            }}>
                                {feature.title}
                            </h3>
                            
                            <p style={styles.featureDescription}>
                                {feature.desc}
                            </p>
                            
                            {activeFeature === feature.id && (
                                <motion.div
                                    style={styles.featureMetrics}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <div style={styles.metric}>
                                        <div style={{...styles.metricValue, color: feature.color}}>92%</div>
                                        <div style={styles.metricLabel}>Efficiency Gain</div>
                                    </div>
                                    <div style={styles.metric}>
                                        <div style={{...styles.metricValue, color: feature.color}}>45min</div>
                                        <div style={styles.metricLabel}>Time Saved/Day</div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Trust Section */}
            <div style={styles.trustSection}>
                <div style={styles.trustContent}>
                    <motion.h3 
                        style={styles.trustTitle}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        Trusted by 500+ Leading Companies Worldwide
                    </motion.h3>
                    <motion.p 
                        style={styles.trustSubtitle}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        Join industry leaders who have transformed their hiring process with AI
                    </motion.p>
                </div>
                
                <div style={styles.companyLogos}>
                    {[1,2,3,4,5,6].map(i => (
                        <motion.div
                            key={i}
                            style={styles.companyLogo}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.4 }}
                        />
                    ))}
                </div>
            </div>

            {/* Final CTA */}
            <div style={styles.finalCta}>
                <motion.div
                    style={styles.ctaContent}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 style={styles.ctaTitle}>
                        Ready to Transform Your Recruitment?
                    </h2>
                    <p style={styles.ctaSubtitle}>
                        Join hundreds of companies hiring smarter with AI-powered recruitment
                    </p>
                    <div style={styles.ctaButtonsFinal}>
                        <a href="/signup" style={{...styles.primaryButton, ...styles.buttonGlow}}>
                            Get Started Free
                        </a>
                        <a href="/contact" style={styles.secondaryButton}>
                            Schedule Demo
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

const styles = {
    root: {
        fontFamily: "'Inter', sans-serif",
        backgroundColor: '#ffffff',
        color: '#1f2937',
        overflowX: 'hidden'
    },

    // Hero Section
    hero: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '100px 5%',
        gap: 60,
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        minHeight: '90vh'
    },
    heroContent: {
        flex: 1,
        maxWidth: 600
    },
    badge: {
        display: 'inline-block',
        padding: '8px 20px',
        background: 'rgba(16, 185, 129, 0.1)',
        color: '#10b981',
        borderRadius: 99,
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 24,
        letterSpacing: '0.05em'
    },
    title: {
        fontSize: 'clamp(42px, 5vw, 64px)',
        fontWeight: 800,
        lineHeight: 1.1,
        marginBottom: 24,
        letterSpacing: '-0.03em'
    },
    highlight: {
        color: '#10b981',
        position: 'relative'
    },
    subtitle: {
        fontSize: 18,
        color: '#4b5563',
        lineHeight: 1.7,
        marginBottom: 40,
        maxWidth: 550
    },
    stats: {
        display: 'flex',
        gap: 40,
        marginBottom: 40
    },
    statItem: {
        textAlign: 'center'
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 800,
        marginBottom: 8
    },
    statLabel: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: 500
    },
    ctaButtons: {
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap'
    },
    primaryButton: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 32px',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff',
        borderRadius: 12,
        fontSize: 16,
        fontWeight: 600,
        textDecoration: 'none',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
    },
    secondaryButton: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 32px',
        background: '#fff',
        color: '#374151',
        borderRadius: 12,
        fontSize: 16,
        fontWeight: 600,
        textDecoration: 'none',
        border: '2px solid #e5e7eb',
        transition: 'all 0.3s ease'
    },
    buttonGlow: {
        boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)'
    },

    // Demo Preview
    heroDemo: {
        flex: 1,
        maxWidth: 500
    },
    demoCard: {
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
    },
    demoHeader: {
        height: 40,
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12
    },
    demoDots: {
        display: 'flex',
        gap: 8
    },
    demoUrl: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        color: '#6b7280',
        background: '#fff',
        padding: '4px 12px',
        borderRadius: 6,
        border: '1px solid #e5e7eb'
    },
    demoContent: {
        padding: 32
    },
    demoBadge: {
        display: 'inline-block',
        padding: '6px 16px',
        background: 'rgba(59, 130, 246, 0.1)',
        color: '#3b82f6',
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 24,
        letterSpacing: '0.05em'
    },
    demoStats: {
        display: 'flex',
        justifyContent: 'space-between'
    },
    demoStat: {
        textAlign: 'center'
    },
    demoValue: {
        fontSize: 28,
        fontWeight: 800,
        color: '#1f2937',
        marginBottom: 4
    },
    demoLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: 500
    },

    // Features Section
    featuresSection: {
        padding: '100px 5%',
        background: '#fff'
    },
    sectionHeader: {
        textAlign: 'center',
        marginBottom: 60,
        maxWidth: 700,
        margin: '0 auto 60px'
    },
    sectionTitle: {
        fontSize: 'clamp(32px, 4vw, 48px)',
        fontWeight: 800,
        color: '#111827',
        marginBottom: 16,
        letterSpacing: '-0.02em'
    },
    sectionSubtitle: {
        fontSize: 18,
        color: '#4b5563',
        lineHeight: 1.6
    },
    featuresGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: 32,
        maxWidth: 1400,
        margin: '0 auto'
    },
    featureCard: {
        background: '#fff',
        borderRadius: 20,
        padding: 32,
        border: '2px solid #f3f4f6',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
    },
    featureCardActive: {
        borderColor: '#10b981',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        transform: 'translateY(-5px)'
    },
    featureHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20
    },
    featureBadge: {
        padding: '6px 16px',
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.05em'
    },
    featureIcon: {
        fontSize: 24
    },
    featureTitle: {
        fontSize: 24,
        fontWeight: 700,
        marginBottom: 16,
        lineHeight: 1.3
    },
    featureDescription: {
        fontSize: 16,
        color: '#4b5563',
        lineHeight: 1.6,
        marginBottom: 24
    },
    featureMetrics: {
        display: 'flex',
        gap: 24,
        paddingTop: 20,
        borderTop: '1px solid rgba(0,0,0,0.05)'
    },
    metric: {
        textAlign: 'center',
        flex: 1
    },
    metricValue: {
        fontSize: 24,
        fontWeight: 800,
        marginBottom: 4
    },
    metricLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: 500
    },

    // Trust Section
    trustSection: {
        padding: '80px 5%',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        textAlign: 'center'
    },
    trustContent: {
        marginBottom: 40
    },
    trustTitle: {
        fontSize: 28,
        fontWeight: 700,
        color: '#111827',
        marginBottom: 12
    },
    trustSubtitle: {
        fontSize: 18,
        color: '#4b5563',
        maxWidth: 600,
        margin: '0 auto'
    },
    companyLogos: {
        display: 'flex',
        justifyContent: 'center',
        gap: 32,
        flexWrap: 'wrap'
    },
    companyLogo: {
        width: 120,
        height: 40,
        background: '#e5e7eb',
        borderRadius: 8
    },

    // Final CTA
    finalCta: {
        padding: '100px 5%',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        textAlign: 'center'
    },
    ctaContent: {
        maxWidth: 700,
        margin: '0 auto'
    },
    ctaTitle: {
        fontSize: 'clamp(32px, 4vw, 48px)',
        fontWeight: 800,
        color: '#fff',
        marginBottom: 16,
        letterSpacing: '-0.02em'
    },
    ctaSubtitle: {
        fontSize: 18,
        color: '#d1fae5',
        marginBottom: 40,
        lineHeight: 1.6
    },
    ctaButtonsFinal: {
        display: 'flex',
        gap: 16,
        justifyContent: 'center',
        flexWrap: 'wrap'
    }
};

export default Home;