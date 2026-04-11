import { useState, useContext } from 'react';
import { Card, Typography, Button, Space, Modal, Input, Alert, message, Divider, Steps } from 'antd';
import { AuthContext } from '../../contexts/authContext';
import { exportMyData, deleteMyAccountData } from '../../api/auth';
import { useNavigate, Link } from 'react-router-dom';
import { DeleteOutlined, DownloadOutlined, SafetyCertificateOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { clearStoredToken } from '../../utils/authStorage';

const { Title, Paragraph, Text } = Typography;

const CONFIRM = 'SUPPRIMER_MON_COMPTE';

export default function PrivacyData() {
    const { setToken, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [exporting, setExporting] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    const handleExport = async () => {
        try {
            setExporting(true);
            const data = await exportMyData();
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json;charset=utf-8',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mes-donnees-recruit-ai-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            message.success('Export téléchargé');
        } catch (e) {
            message.error(e.message || 'Échec de l’export');
        } finally {
            setExporting(false);
        }
    };

    const handleDelete = async () => {
        if (confirmText !== CONFIRM) {
            message.warning(`Tapez exactement : ${CONFIRM}`);
            return;
        }
        try {
            setDeleting(true);
            await deleteMyAccountData(CONFIRM);
            message.success('Compte supprimé');
            setToken(null);
            setUser(null);
            clearStoredToken();
            navigate('/login', { replace: true });
        } catch (e) {
            message.error(e.message || 'Suppression impossible');
        } finally {
            setDeleting(false);
            setDeleteOpen(false);
            setConfirmText('');
        }
    };

    return (
        <div
            style={{
                maxWidth: 980,
                margin: '28px auto',
                padding: 16,
                borderRadius: 18,
                position: 'relative',
                overflow: 'hidden',
                background:
                    'radial-gradient(800px circle at 20% -10%, rgba(124,58,237,0.25), transparent 60%),' +
                    'radial-gradient(700px circle at 100% 0%, rgba(56,189,248,0.18), transparent 55%),' +
                    'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.75))',
            }}
        >
            <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                        <Title level={3} style={{ marginBottom: 6 }}>
                            <Space>
                                <SafetyCertificateOutlined style={{ color: '#7c3aed' }} />
                                Mes données (RGPD)
                            </Space>
                        </Title>
                        <Paragraph type="secondary" style={{ maxWidth: 640 }}>
                            Téléchargez une copie de vos informations, ou demandez la suppression définitive de votre compte
                            et des données de candidature associées.
                        </Paragraph>
                    </div>
                    <div>
                        <Button type="default" onClick={() => navigate('/tests')} icon={<ArrowRightOutlined />}>
                            Retour aux offres
                        </Button>
                    </div>
                </div>

                <Divider />

                <Steps
                    size="small"
                    current={deleteOpen ? 2 : 0}
                    items={[
                        { title: 'Portabilité' },
                        { title: 'Vérification' },
                        { title: 'Suppression' },
                    ]}
                />

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 16,
                        marginTop: 16,
                        alignItems: 'stretch',
                    }}
                    className="mes-donnees-grid"
                >
                    <Card
                        style={{
                            borderRadius: 16,
                            boxShadow: '0 10px 30px rgba(124,58,237,0.08)',
                            border: '1px solid rgba(124,58,237,0.15)',
                            background: 'rgba(255,255,255,0.9)',
                        }}
                        bodyStyle={{ padding: 18 }}
                        title={
                            <Space>
                                <DownloadOutlined style={{ color: '#10b981' }} />
                                Portabilité des données
                            </Space>
                        }
                    >
                        <Paragraph style={{ marginBottom: 10 }}>
                            Un export clair et lisible de vos informations et de votre historique de candidature.
                        </Paragraph>

                        <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span>
                                <div>
                                    <Text strong>Profil (sans mot de passe)</Text>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 13 }}>
                                            Nom, email, rôle, date de naissance et informations liées au compte.
                                        </Text>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <span style={{ color: '#3b82f6', fontWeight: 900 }}>✓</span>
                                <div>
                                    <Text strong>Soumissions & résultats</Text>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 13 }}>
                                            Tests passés, score, statut et feedback associés.
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                            <Alert
                                type="info"
                                showIcon
                                message="Téléchargement immédiat"
                                description="La demande génère un fichier et l’envoie directement à votre navigateur."
                            />
                            <Button type="primary" onClick={handleExport} loading={exporting} block icon={<DownloadOutlined />}>
                                Télécharger mes données
                            </Button>
                        </Space>
                    </Card>

                    <Card
                        style={{
                            borderRadius: 16,
                            boxShadow: '0 10px 30px rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.18)',
                            background: 'rgba(255,255,255,0.9)',
                        }}
                        bodyStyle={{ padding: 18 }}
                        title={
                            <Space>
                                <DeleteOutlined style={{ color: '#ef4444' }} />
                                Suppression du compte
                            </Space>
                        }
                    >
                        <Alert
                            type="warning"
                            showIcon
                            message="Action irréversible"
                            description="Vos soumissions et brouillons de test seront supprimés. Cette action ne peut pas être annulée."
                            style={{ marginBottom: 14 }}
                        />
                        <Button danger onClick={() => setDeleteOpen(true)} block>
                            Supprimer mon compte et mes données
                        </Button>

                        <div style={{ marginTop: 12 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                Besoin d'aide avant de continuer ?{' '}
                                <Link to="/contact?type=demo" style={{ color: '#7c3aed', fontWeight: 700 }}>
                                    Contactez-nous
                                </Link>
                            </Text>
                        </div>
                    </Card>
                </div>

                <Modal
                    title="Confirmer la suppression"
                    open={deleteOpen}
                    onCancel={() => {
                        setDeleteOpen(false);
                        setConfirmText('');
                    }}
                    onOk={handleDelete}
                    okText="Supprimer définitivement"
                    okButtonProps={{ danger: true, loading: deleting }}
                    cancelText="Annuler"
                >
                    <Text>
                        Pour confirmer, saisissez <Text strong>{CONFIRM}</Text> :
                    </Text>
                    <Input
                        style={{ marginTop: 12 }}
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={CONFIRM}
                    />
                    <Divider style={{ margin: '14px 0' }} />
                    <Text type="secondary" style={{ display: 'block' }}>
                        Cette action supprime aussi vos données de candidature associées.
                    </Text>
                </Modal>
            </div>
        </div>
    );
}
