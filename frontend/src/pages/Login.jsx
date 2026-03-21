import { Form, Input, Button, App as AntdApp } from 'antd';
import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/authContext.jsx';
import { login } from '../api/auth';

function Login() {
    const { setToken, setUser } = useContext(AuthContext);
    const { message } = AntdApp.useApp();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    async function onFinish(values) {
        setLoading(true);
        try {
            const data = await login(values);
            setToken(data.token);
            setUser(data.user);
            message.success(data.message || 'Bienvenue !');
            
            const pendingTestId = sessionStorage.getItem('pendingTestId');
            if (pendingTestId && data.user?.role === 'candidat') {
                sessionStorage.removeItem('pendingTestId');
                navigate(`/tests/${pendingTestId}`);
            } else if (data.user?.role === 'HR') {
                navigate('/rh/dashboard');
            } else if (data.user?.role === 'candidat') {
                navigate('/tests');
            } else {
                navigate('/');
            }
        } catch (err) {
            message.error(err.message || 'Connexion échouée');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            {/* Header */}
            <div style={s.header}>
                <h2 style={s.title}>Bienvenue !</h2>
                <p style={s.subtitle}>Connectez-vous à votre compte pour continuer.</p>
            </div>

            {/* Form */}
            <Form onFinish={onFinish} layout="vertical" style={{ marginTop: 28 }}>
                <Form.Item
                    label="Adresse e-mail"
                    name="email"
                    rules={[{ required: true, message: 'E-mail requis' }]}
                    style={s.formItem}
                >
                    <Input
                        size="large"
                        placeholder="vous@entreprise.com"
                        style={s.input}
                    />
                </Form.Item>

                <Form.Item
                    label="Mot de passe"
                    name="password"
                    rules={[{ required: true, message: 'Mot de passe requis' }]}
                    style={s.formItem}
                >
                    <Input.Password
                        size="large"
                        placeholder="••••••••"
                        style={s.input}
                    />
                </Form.Item>

                <div style={s.forgotRow}>
                    <Link to="/forgot-password" style={s.forgot}>Mot de passe oublié ?</Link>
                </div>

                <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={loading}
                        block
                        style={s.submitBtn}
                    >
                        {loading ? 'Connexion…' : 'Se connecter'}
                    </Button>
                </Form.Item>
            </Form>

            {/* Divider */}
            <div style={s.divider}>
                <span style={s.dividerLine} />
                <span style={s.dividerText}>ou</span>
                <span style={s.dividerLine} />
            </div>

            {/* Sign up link */}
            <p style={s.signupText}>
                Pas encore de compte ?{' '}
                <Link to="/signup" style={s.signupLink}>Créer un compte</Link>
            </p>
        </div>
    );
}

const s = {
    header: {
        borderBottom: '1px solid var(--border)',
        paddingBottom: 24,
        marginBottom: 0,
    },
    title: {
        fontSize: 26,
        fontWeight: 800,
        color: 'var(--text-heading)',
        letterSpacing: '-0.02em',
        margin: 0,
        lineHeight: 1.2,
    },
    subtitle: {
        fontSize: 14,
        color: 'var(--text-body)',
        margin: '8px 0 0',
        lineHeight: 1.6,
    },

    formItem: { marginBottom: 18 },
    input: {
        height: 46,
        fontSize: 14,
        fontFamily: "'DM Sans', sans-serif",
    },

    forgotRow: {
        textAlign: 'right',
        marginTop: -8,
        marginBottom: 20,
    },
    forgot: {
        fontSize: 13,
        color: 'var(--purple)',
        fontWeight: 500,
        textDecoration: 'none',
    },

    submitBtn: {
        height: 48,
        fontSize: 15,
        fontWeight: 600,
        borderRadius: 8,
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: '-0.01em',
    },

    divider: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '24px 0',
    },
    dividerLine: {
        flex: 1, height: 1, display: 'block',
        background: 'var(--border)',
    },
    dividerText: {
        fontSize: 13,
        color: 'var(--text-muted)',
        fontWeight: 500,
    },

    signupText: {
        textAlign: 'center',
        fontSize: 14,
        color: 'var(--text-body)',
    },
    signupLink: {
        color: 'var(--purple)',
        fontWeight: 600,
        textDecoration: 'none',
    },
};

export default Login;