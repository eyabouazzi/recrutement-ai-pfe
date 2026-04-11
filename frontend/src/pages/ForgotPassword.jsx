import { Form, Input, Button, Typography, App as AntdApp } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { MailOutlined, ArrowLeftOutlined, CheckCircleFilled } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

function ForgotPassword() {
    const { message } = AntdApp.useApp();
    const [loading, setLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [email, setEmail] = useState('');

    async function onFinish(values) {
        setLoading(true);
        try {
            await forgotPassword({ email: values.email });
            setEmail(values.email);
            setIsSent(true);
        } catch (err) {
            message.error(err.message || "Échec de l'envoi");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.page}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={styles.card}
            >
                <Link to="/login" style={styles.backBtn}>
                    <ArrowLeftOutlined />
                </Link>

                <AnimatePresence mode="wait">
                    {!isSent ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div style={styles.header}>
                                <Title level={2} style={styles.title}>Mot de passe oublié ?</Title>
                                <Paragraph style={styles.subtitle}>
                                    Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                                </Paragraph>
                            </div>

                            <Form onFinish={onFinish} layout="vertical" requiredMark={false}>
                                <Form.Item
                                    name="email"
                                    label={<span style={styles.label}>Adresse e-mail</span>}
                                    rules={[
                                        { required: true, message: 'E-mail requis' },
                                        { type: 'email', message: 'E-mail invalide' }
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        placeholder="nom@entreprise.com"
                                        prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                                        style={styles.input}
                                        autoFocus
                                    />
                                </Form.Item>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    loading={loading}
                                    block
                                    style={styles.submitBtn}
                                >
                                    {loading ? 'Envoi...' : 'Envoyer le lien'}
                                </Button>
                            </Form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center' }}
                        >
                            <div style={styles.successIconBox}>
                                <CheckCircleFilled style={{ color: '#7c3aed', fontSize: 48 }} />
                            </div>
                            <Title level={2} style={styles.title}>Vérifiez vos e-mails</Title>
                            <Paragraph style={styles.subtitle}>
                                Nous avons envoyé un lien de réinitialisation à <br />
                                <strong style={{ color: '#111827' }}>{email}</strong>
                            </Paragraph>

                            <Button 
                                block 
                                size="large" 
                                style={styles.input}
                                onClick={() => window.open(`mailto:${email}`)}
                            >
                                Ouvrir ma boîte mail
                            </Button>

                            <div style={styles.footer}>
                                <Text type="secondary" style={{ fontSize: 14 }}>
                                    Vous n'avez rien reçu ? {' '}
                                    <span 
                                        style={styles.resendLink}
                                        onClick={() => onFinish({ email })}
                                    >
                                        Renvoyer
                                    </span>
                                </Text>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

const styles = {
    page: {
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        fontFamily: "'Inter', sans-serif",
        padding: '24px',
    },
    card: {
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        padding: '48px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb',
        position: 'relative',
    },
    backBtn: {
        position: 'absolute',
        top: '24px',
        left: '24px',
        color: '#6b7280',
        fontSize: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        transition: 'all 0.2s ease',
    },
    header: {
        textAlign: 'center',
        marginBottom: '32px',
        marginTop: '16px',
    },
    title: {
        fontSize: '28px',
        fontWeight: 700,
        color: '#111827',
        marginBottom: '12px',
        letterSpacing: '-0.01em',
    },
    subtitle: {
        fontSize: '15px',
        color: '#4b5563',
        lineHeight: 1.6,
    },
    label: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#374151',
    },
    input: {
        height: '44px',
        borderRadius: '8px',
    },
    submitBtn: {
        height: '48px',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 600,
        background: '#7c3aed',
        border: 'none',
        marginTop: '8px',
    },
    successIconBox: {
        marginBottom: '24px',
        marginTop: '16px',
    },
    footer: {
        marginTop: '32px',
    },
    resendLink: {
        color: '#7c3aed',
        fontWeight: 600,
        cursor: 'pointer',
    },
};

export default ForgotPassword;