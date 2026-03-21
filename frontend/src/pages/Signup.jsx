import { Button, Form, Input, DatePicker, App as AntdApp, Row, Col, Select, Card, Typography, Divider } from "antd";
import { useNavigate, Link } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../contexts/authContext.jsx";
import { signup } from "../api/auth";
import { motion } from 'framer-motion';
import { UserOutlined, MailOutlined, LockOutlined, CalendarOutlined, TeamOutlined, GoogleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

function Signup() {
    const { setToken, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { message } = AntdApp.useApp();
    const [loading, setLoading] = useState(false);

    async function onFinish(values) {
        setLoading(true);
        try {
            // The backend expects dob as a string/Date so we send it as ISO string if it exists
            const payload = { ...values };
            if (payload.dob) {
                payload.dob = payload.dob.toISOString();
            }

            const data = await signup(payload);
            message.success(data.message || "Compte créé avec succès !");
            
            // Auto-login after signup
            setToken(data.token);
            setUser(data.user);
            
            // Redirect based on role
            if (data.user?.role === 'HR') {
                navigate('/rh/dashboard');
            } else {
                navigate('/tests');
            }
        } catch (error) {
            console.error(error);
            const errorMsg = error.message || "Échec de l'inscription";
            // Check if errors are an object from Zod validation
            if (typeof errorMsg === 'object') {
                const firstError = Object.values(errorMsg)[0]?.[0];
                message.error(firstError || "Échec de l'inscription à cause de données invalides");
            } else {
                message.error(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    }

    const handleGoogleSignup = () => {
        message.info('Inscription Google bientôt disponible');
    };

    return (
        <motion.div
            style={styles.container}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
                <Col xs={22} sm={20} md={16} lg={12} xl={10}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <Card style={styles.card}>
                            {/* Header Section */}
                            <div style={styles.header}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                                    style={styles.logoContainer}
                                >
                                    <div style={styles.logo}>🚀</div>
                                </motion.div>
                                <Title level={2} style={styles.title}>
                                    Créer un compte
                                </Title>
                                <Text style={styles.subtitle}>
                                    Rejoignez notre plateforme de recrutement intelligent
                                </Text>
                            </div>

                            {/* Social Signup */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                            >
                                <Button 
                                    block 
                                    size="large" 
                                    icon={<GoogleOutlined />}
                                    onClick={handleGoogleSignup}
                                    style={styles.socialButton}
                                >
                                    S'inscrire avec Google
                                </Button>
                                
                                <Divider style={styles.divider}>
                                    <Text type="secondary" style={{ fontSize: 14 }}>ou</Text>
                                </Divider>
                            </motion.div>

                            {/* Signup Form */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                <Form 
                                    form={form} 
                                    layout="vertical" 
                                    onFinish={onFinish}
                                    requiredMark={false}
                                >
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="firstName"
                                                rules={[{ required: true, message: "Le prénom est requis" }]}
                                            >
                                                <Input
                                                    size="large"
                                                    placeholder="Prénom"
                                                    prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                                                    style={styles.input}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="lastName"
                                                rules={[{ required: true, message: "Le nom est requis" }]}
                                            >
                                                <Input
                                                    size="large"
                                                    placeholder="Nom"
                                                    prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                                                    style={styles.input}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item
                                        name="email"
                                        rules={[
                                            { required: true, message: "L'e-mail est requis" },
                                            { type: "email", message: "Veuillez entrer un e-mail valide" }
                                        ]}
                                    >
                                        <Input
                                            size="large"
                                            placeholder="votre@email.com"
                                            prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                                            style={styles.input}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="dob"
                                        rules={[{ required: true, message: "La date de naissance est requise" }]}
                                    >
                                        <DatePicker 
                                            style={{ width: "100%", height: 50 }} 
                                            placeholder="Date de naissance"
                                            format="DD/MM/YYYY"
                                            suffixIcon={<CalendarOutlined style={{ color: '#94a3b8' }} />}
                                            style={styles.datePicker}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="role"
                                        rules={[{ required: true, message: "Le rôle est requis" }]}
                                        initialValue="candidat"
                                    >
                                        <Select 
                                            size="large" 
                                            placeholder="Sélectionnez votre rôle"
                                            suffixIcon={<TeamOutlined style={{ color: '#94a3b8' }} />}
                                            style={styles.select}
                                        >
                                            <Select.Option value="candidat">
                                                <div style={styles.option}>
                                                    <UserOutlined style={{ marginRight: 8 }} />
                                                    Candidat
                                                </div>
                                            </Select.Option>
                                            <Select.Option value="HR">
                                                <div style={styles.option}>
                                                    <TeamOutlined style={{ marginRight: 8 }} />
                                                    Administrateur/RH
                                                </div>
                                            </Select.Option>
                                        </Select>
                                    </Form.Item>

                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="password"
                                                rules={[
                                                    { required: true, message: "Le mot de passe est requis" }, 
                                                    { min: 6, message: "Au moins 6 caractères" }
                                                ]}
                                            >
                                                <Input.Password
                                                    size="large"
                                                    placeholder="Mot de passe"
                                                    prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                                                    style={styles.input}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="confirmPassword"
                                                dependencies={["password"]}
                                                rules={[
                                                    { required: true, message: "Veuillez confirmer votre mot de passe" },
                                                    ({ getFieldValue }) => ({
                                                        validator(_, value) {
                                                            if (!value || getFieldValue("password") === value) {
                                                                return Promise.resolve();
                                                            }
                                                            return Promise.reject(new Error("Les mots de passe ne correspondent pas"));
                                                        },
                                                    }),
                                                ]}
                                            >
                                                <Input.Password
                                                    size="large"
                                                    placeholder="Confirmer"
                                                    prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                                                    style={styles.input}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item style={{ marginBottom: 0 }}>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            size="large"
                                            loading={loading}
                                            block
                                            style={styles.submitButton}
                                        >
                                            {loading ? 'Création en cours...' : 'Créer le compte'}
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </motion.div>

                            {/* Login link */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                                style={styles.loginSection}
                            >
                                <Text type="secondary">
                                    Vous avez déjà un compte ?{' '}
                                    <Link to="/login" style={styles.loginLink}>
                                        Se connecter
                                    </Link>
                                </Text>
                            </motion.div>
                        </Card>
                    </motion.div>
                </Col>
            </Row>
        </motion.div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px 0'
    },
    card: {
        borderRadius: 20,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: 'none',
        overflow: 'hidden'
    },
    header: {
        textAlign: 'center',
        padding: '30px 20px 20px',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        marginBottom: 30
    },
    logoContainer: {
        marginBottom: 15
    },
    logo: {
        fontSize: 48,
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
    },
    title: {
        fontSize: 28,
        fontWeight: 800,
        color: '#1e293b',
        marginBottom: 8,
        letterSpacing: '-0.02em'
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        lineHeight: 1.5
    },
    socialButton: {
        borderColor: '#e2e8f0',
        color: '#334155',
        marginBottom: 20,
        borderRadius: 12,
        height: 48,
        fontWeight: 500
    },
    divider: {
        margin: '25px 0'
    },
    input: {
        borderRadius: 12,
        height: 50,
        fontSize: 16,
        borderColor: '#e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    datePicker: {
        borderRadius: 12,
        borderColor: '#e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    select: {
        borderRadius: 12,
        height: 50,
        fontSize: 16,
        borderColor: '#e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    option: {
        display: 'flex',
        alignItems: 'center'
    },
    submitButton: {
        height: 50,
        borderRadius: 12,
        fontSize: 16,
        fontWeight: 600,
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        border: 'none',
        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
        marginTop: 10
    },
    loginSection: {
        textAlign: 'center',
        paddingTop: 20,
        borderTop: '1px solid #f1f5f9'
    },
    loginLink: {
        color: '#3b82f6',
        fontWeight: 600,
        textDecoration: 'none'
    }
};

export default Signup;