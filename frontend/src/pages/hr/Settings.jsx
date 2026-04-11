import { useEffect, useContext, useState } from 'react';
import { Form, Button, Switch, Card, Typography, message, InputNumber, Tag } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { AuthContext } from '../../contexts/authContext';
import { patchPreferences, getSmtpStatus, sendSmtpTestEmail } from '../../api/auth';

const { Title, Text } = Typography;

function Settings() {
    const [form] = Form.useForm();
    const [prefsForm] = Form.useForm();
    const { user, setUser } = useContext(AuthContext);

    const [smtpConnected, setSmtpConnected] = useState(null);
    const [sendingTestEmail, setSendingTestEmail] = useState(false);

    useEffect(() => {
        if (!user) return;
        prefsForm.setFieldsValue({
            emailScoreReady: user.notificationPrefs?.emailScoreReady !== false,
            emailHrNewSubmission: user.notificationPrefs?.emailHrNewSubmission !== false,
            accessibilityMode: user.accessibilityMode === true,
        });
    }, [user, prefsForm]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        (async () => {
            try {
                setSmtpConnected(null);
                const data = await getSmtpStatus();
                if (!cancelled) setSmtpConnected(Boolean(data?.connected));
            } catch {
                if (!cancelled) setSmtpConnected(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user]);

    const onFinishPrefs = async (values) => {
        try {
            const data = await patchPreferences({
                notificationPrefs: {
                    emailScoreReady: values.emailScoreReady,
                    emailHrNewSubmission: values.emailHrNewSubmission,
                },
                accessibilityMode: values.accessibilityMode,
            });
            if (data.user) setUser(data.user);
            message.success('Préférences enregistrées');
        } catch (e) {
            message.error(e.message);
        }
    };

    const onFinish = (values) => {
        message.info(
            'Les options de scoring ci-dessous restent des repères locaux; le barème réel se règle dans chaque offre.'
        );
        console.log('Settings (local reference):', values);
    };

    const onSendTestEmail = async () => {
        try {
            setSendingTestEmail(true);
            const data = await sendSmtpTestEmail();
            message.success(data.message || 'E-mail de test envoyé');
        } catch (e) {
            message.error(e.message || e?.response?.data?.message || "Impossible d'envoyer l'e-mail de test");
        } finally {
            setSendingTestEmail(false);
            try {
                const data = await getSmtpStatus();
                setSmtpConnected(Boolean(data?.connected));
            } catch {
                // ignore
            }
        }
    };

    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>
                Paramètres
            </Title>

            {user?.role === 'HR' && (
                <Card title="Validation entreprise" style={{ maxWidth: 800, marginBottom: 24 }}>
                    <Text strong>Entreprise</Text>
                    <div style={{ marginTop: 8, marginBottom: 12 }}>
                        <Text>{user?.companyId?.name || 'Aucune entreprise liée'}</Text>
                    </div>
                    <Tag color={
                        !user?.companyId ? 'default' :
                        user.companyId.status === 'approved' ? 'green' :
                        user.companyId.status === 'rejected' ? 'red' : 'orange'
                    }>
                        {!user?.companyId ? 'NON CONFIGUREE' : (user.companyId.status || 'pending').toUpperCase()}
                    </Tag>
                    {user?.companyId?.approvalNote && (
                        <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                            Note admin: {user.companyId.approvalNote}
                        </Text>
                    )}
                    {user?.companyId?.rejectionReason && (
                        <Text style={{ display: 'block', marginTop: 12, color: '#cf1322' }}>
                            Motif de rejet: {user.companyId.rejectionReason}
                        </Text>
                    )}
                    <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                        Les offres RH fonctionnent au mieux quand le profil entreprise est complet, approuvé par un administrateur,
                        et que chaque offre contient un poste clair, une localisation, un type de contrat et des critères d'évaluation précis.
                    </Text>
                </Card>
            )}

            <Card title="Notifications et accessibilité (compte)" style={{ maxWidth: 800, marginBottom: 24 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Ces choix s'appliquent à votre compte (emails si SMTP est configuré côté serveur).
                </Text>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                    <div>
                        <Text strong>SMTP</Text>
                        <div>
                            {smtpConnected === null ? (
                                <Text type="secondary">Vérification...</Text>
                            ) : smtpConnected ? (
                                <Text type="secondary">Connecté (Gmail/SMTP)</Text>
                            ) : (
                                <Text type="secondary">Non configuré</Text>
                            )}
                        </div>
                    </div>
                    <Tag color={smtpConnected === null ? 'default' : smtpConnected ? 'green' : 'red'}>
                        {smtpConnected === null ? '-' : smtpConnected ? 'OK' : 'KO'}
                    </Tag>
                </div>

                <Button
                    type="primary"
                    onClick={onSendTestEmail}
                    loading={sendingTestEmail}
                    disabled={!smtpConnected}
                    style={{ marginBottom: 20 }}
                >
                    Envoyer un e-mail de test
                </Button>

                {smtpConnected === false && (
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                        Configurez `SMTP_HOST`, `SMTP_USER` et `SMTP_PASS` puis redémarrez le serveur.
                    </Text>
                )}

                <Form form={prefsForm} layout="vertical" onFinish={onFinishPrefs}>
                    <Form.Item
                        label="Email lorsqu'un score est disponible (candidat)"
                        name="emailScoreReady"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                    <Form.Item
                        label="Email lorsqu'un candidat termine un test (RH)"
                        name="emailHrNewSubmission"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                    <Form.Item
                        label="Mode accessibilité renforcé (pages test candidat)"
                        name="accessibilityMode"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                            Enregistrer les préférences
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            <Title level={4}>Référentiel scoring (local)</Title>
            <Card style={{ maxWidth: 800 }}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{
                        enableAIValidation: true,
                        aiStrictness: 7,
                        defaultTestDuration: 30,
                        allowRetakes: false,
                        passingScore: 50,
                    }}
                >
                    <Form.Item
                        label="Activer la correction automatique par l'IA"
                        name="enableAIValidation"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                    <Form.Item label="Niveau de sévérité de l'IA (1 à 10)" name="aiStrictness" rules={[{ required: true }]}>
                        <InputNumber min={1} max={10} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Score minimal de réussite par défaut (%)" name="passingScore">
                        <InputNumber min={0} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Durée par défaut d'un test (minutes)" name="defaultTestDuration">
                        <InputNumber min={5} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item label="Autoriser les repasses (référence locale)" name="allowRetakes" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                            Enregistrer localement
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}

export default Settings;
