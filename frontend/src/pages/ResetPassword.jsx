import React, { useState } from 'react';
import { Form, Input, Button, Typography, App as AntdApp } from 'antd';
import { LockOutlined, CheckCircleFilled, CloseCircleFilled, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { resetPassword } from '../api/auth';

const { Title, Text, Paragraph } = Typography;

const ResetPassword = () => {
    const [form] = Form.useForm();
    const { message } = AntdApp.useApp();
    const [loading, setLoading] = useState(false);
    const [resetComplete, setResetComplete] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const token = searchParams.get('token');

    const onFinish = async (values) => {
        if (!token) {
            message.error('Lien de réinitialisation invalide ou manquant');
            return;
        }

        setLoading(true);
        try {
            const data = await resetPassword({
                token,
                newPassword: values.newPassword,
                confirmPassword: values.confirmPassword
            });
            
            if (data.status) {
                message.success('Mot de passe réinitialisé avec succès !');
                setResetComplete(true);
                setTimeout(() => navigate('/login'), 3000);
            } else {
                message.error(data.message || 'Échec de la réinitialisation');
            }
        } catch (error) {
            message.error(error.message || 'Erreur lors de la réinitialisation');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    if (resetComplete) {
        return (
            <div style={styles.page}>
                <motion.div variants={containerVariants} initial="hidden" animate="visible" style={styles.card}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={styles.successIconBox}>
                            <CheckCircleFilled style={{ color: '#10b981', fontSize: 48 }} />
                        </div>
                        <Title level={2} style={styles.title}>C'est prêt !</Title>
                        <Paragraph style={styles.subtitle}>
                            Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
                        </Paragraph>
                        <Button type="primary" size="large" block onClick={() => navigate('/login')} style={styles.submitBtn}>
                            Se connecter maintenant
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!token) {
        return (
            <div style={styles.page}>
                <motion.div variants={containerVariants} initial="hidden" animate="visible" style={styles.card}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={styles.errorIconBox}>
                            <CloseCircleFilled style={{ color: '#ef4444', fontSize: 48 }} />
                        </div>
                        <Title level={2} style={styles.title}>Lien invalide</Title>
                        <Paragraph style={styles.subtitle}>
                            Ce lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.
                        </Paragraph>
                        <Button type="primary" size="large" block onClick={() => navigate('/forgot-password')} style={styles.submitBtn}>
                            Demander un nouveau lien
                        </Button>
                        <div style={styles.footer}>
                            <Link to="/login" style={styles.link}>Retour à la connexion</Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" style={styles.card}>
                <Link to="/login" style={styles.backBtn}>
                    <ArrowLeftOutlined />
                </Link>
                
                <div style={styles.header}>
                    <Title level={2} style={styles.title}>Nouveau mot de passe</Title>
                    <Paragraph style={styles.subtitle}>
                        Choisissez un mot de passe fort pour sécuriser votre compte.
                    </Paragraph>
                </div>

                <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
                    <Form.Item
                        name="newPassword"
                        label={<span style={styles.label}>Nouveau mot de passe</span>}
                        rules={[
                            { required: true, message: 'Mot de passe requis' },
                            { min: 8, message: 'Au moins 8 caractères' }
                        ]}
                    >
                        <Input.Password 
                            size="large"
                            placeholder="••••••••"
                            prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                            style={styles.input}
                            autoFocus
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label={<span style={styles.label}>Confirmer le mot de passe</span>}
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Confirmation requise' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Les mots de passe ne correspondent pas'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password 
                            size="large"
                            placeholder="••••••••"
                            prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                            style={styles.input}
                        />
                    </Form.Item>

                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        size="large" 
                        block
                        style={styles.submitBtn}
                    >
                        Réinitialiser le mot de passe
                    </Button>
                </Form>
            </motion.div>
        </div>
    );
};

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
    successIconBox: { marginBottom: '24px', marginTop: '16px' },
    errorIconBox: { marginBottom: '24px', marginTop: '16px' },
    footer: { marginTop: '24px' },
    link: { color: '#7c3aed', fontWeight: 600 },
};

export default ResetPassword;