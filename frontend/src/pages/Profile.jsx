import React, { useContext, useEffect, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Form,
    Input,
    Row,
    Select,
    Space,
    Tag,
    Typography,
    Upload,
    message
} from 'antd';
import {
    FileTextOutlined,
    LockOutlined,
    MailOutlined,
    PhoneOutlined,
    SaveOutlined,
    UploadOutlined,
    UserOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { AuthContext } from '../contexts/authContext';
import UserAvatar from '../Components/UserAvatar.jsx';
import { changePassword, updateProfile } from '../api/auth';
import { baseUrl } from '../api/api';

const { Title, Text, Paragraph } = Typography;

const COMMON_SKILLS = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'Python', 'Java',
    'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Azure',
    'Testing', 'Communication', 'Leadership', 'UI', 'UX', 'Data Science'
];

function fileListFromSelection(file) {
    if (!file) return [];
    return [{
        uid: String(file.uid || file.name || Date.now()),
        name: file.name || 'document',
        status: 'done',
    }];
}

function resolveUploadUrl(filePath) {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
    return `${baseUrl}${filePath}`;
}

export default function Profile() {
    const { user, setUser } = useContext(AuthContext);
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [cvFile, setCvFile] = useState(null);

    useEffect(() => {
        if (!user) return;
        profileForm.setFieldsValue({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            city: user.city || '',
            country: user.country || '',
            bio: user.bio || '',
            education: user.education || '',
            experienceYears: user.experienceYears ?? 0,
            preferredJobType: user.preferredJobType || '',
            preferredSector: user.preferredSector || '',
            preferredLocation: user.preferredLocation || '',
            skills: Array.isArray(user.skills) ? user.skills : [],
            cvText: user.cvText || '',
        });
        setAvatarFile(null);
        setCvFile(null);
    }, [user, profileForm]);

    const handleSaveProfile = async (values) => {
        try {
            setSavingProfile(true);
            const formData = new FormData();

            const fields = [
                'firstName',
                'lastName',
                'phone',
                'city',
                'country',
                'bio',
                'education',
                'experienceYears',
                'preferredJobType',
                'preferredSector',
                'preferredLocation',
                'cvText',
            ];

            fields.forEach((field) => {
                const value = values[field];
                if (value !== undefined && value !== null) {
                    formData.append(field, value);
                }
            });

            if (Array.isArray(values.skills)) {
                formData.append('skills', values.skills.join(','));
            }

            formData.append('analyzeCv', 'true');

            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }
            if (cvFile) {
                formData.append('cv', cvFile);
            }

            const response = await updateProfile(formData);
            if (!response.status || !response.user) {
                throw new Error(response.message || 'Mise à jour impossible');
            }

            setUser(response.user);
            message.success('Profil mis à jour');
        } catch (error) {
            message.error(error.message || 'Impossible de sauvegarder le profil');
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = async (values) => {
        try {
            setSavingPassword(true);
            await changePassword(values);
            passwordForm.resetFields();
            message.success('Mot de passe modifié');
        } catch (error) {
            message.error(error.message || 'Impossible de modifier le mot de passe');
        } finally {
            setSavingPassword(false);
        }
    };

    const analysis = user?.cvAnalysis || null;
    const cvUrl = resolveUploadUrl(user?.cvUrl);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ maxWidth: 1180, margin: '0 auto' }}
        >
            <div style={styles.header}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Profil professionnel</Title>
                    <Text type="secondary">
                        Gérez vos informations, votre CV et les données utilisées pour le matching et l’analyse RH.
                    </Text>
                </div>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <Card style={styles.sideCard}>
                        <div style={styles.avatarBlock}>
                            <UserAvatar user={user} size={108} />
                            <div>
                                <Title level={4} style={{ marginBottom: 4 }}>
                                    {user?.firstName} {user?.lastName}
                                </Title>
                                <Text type="secondary">{user?.email}</Text>
                            </div>
                        </div>

                        <Divider />

                        <Space wrap size={[8, 8]}>
                            <Tag color={user?.role === 'HR' ? 'blue' : user?.role === 'admin' ? 'red' : 'green'}>
                                {(user?.role || 'user').toUpperCase()}
                            </Tag>
                            {user?.companyId?.name && (
                                <Tag color="gold">{user.companyId.name}</Tag>
                            )}
                        </Space>

                        <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                            <div style={styles.infoRow}>
                                <MailOutlined />
                                <Text>{user?.email || '—'}</Text>
                            </div>
                            <div style={styles.infoRow}>
                                <PhoneOutlined />
                                <Text>{user?.phone || 'Non renseigné'}</Text>
                            </div>
                            <div style={styles.infoRow}>
                                <UserOutlined />
                                <Text>{user?.city || 'Ville non renseignée'}{user?.country ? `, ${user.country}` : ''}</Text>
                            </div>
                        </div>

                        <Divider />

                        <Upload
                            beforeUpload={(file) => {
                                setAvatarFile(file);
                                return false;
                            }}
                            maxCount={1}
                            accept=".jpg,.jpeg,.png"
                            fileList={fileListFromSelection(avatarFile)}
                            onRemove={() => {
                                setAvatarFile(null);
                                return true;
                            }}
                        >
                            <Button icon={<UploadOutlined />} block>
                                {avatarFile ? 'Avatar prêt à être enregistré' : 'Changer la photo'}
                            </Button>
                        </Upload>

                        {cvUrl && (
                            <Button
                                icon={<FileTextOutlined />}
                                style={{ marginTop: 12 }}
                                block
                                href={cvUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Télécharger le CV actuel
                            </Button>
                        )}
                    </Card>

                    <Card
                        title={<><LockOutlined /> Sécurité</>}
                        style={{ ...styles.sideCard, marginTop: 24 }}
                    >
                        <Form layout="vertical" form={passwordForm} onFinish={handlePasswordChange}>
                            <Form.Item
                                name="oldPassword"
                                label="Mot de passe actuel"
                                rules={[{ required: true, message: 'Champ requis' }]}
                            >
                                <Input.Password />
                            </Form.Item>
                            <Form.Item
                                name="newPassword"
                                label="Nouveau mot de passe"
                                rules={[
                                    { required: true, message: 'Champ requis' },
                                    { min: 8, message: '8 caractères minimum' }
                                ]}
                            >
                                <Input.Password />
                            </Form.Item>
                            <Form.Item
                                name="confirmPassword"
                                label="Confirmation"
                                dependencies={['newPassword']}
                                rules={[
                                    { required: true, message: 'Champ requis' },
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
                                <Input.Password />
                            </Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={savingPassword}
                                block
                            >
                                Mettre à jour le mot de passe
                            </Button>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card style={styles.mainCard}>
                        <Form layout="vertical" form={profileForm} onFinish={handleSaveProfile}>
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="firstName"
                                        label="Prénom"
                                        rules={[{ required: true, message: 'Champ requis' }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        name="lastName"
                                        label="Nom"
                                        rules={[{ required: true, message: 'Champ requis' }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item name="email" label="Email">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="phone" label="Téléphone">
                                        <Input />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item name="city" label="Ville">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="country" label="Pays">
                                        <Input />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="bio" label="Résumé professionnel">
                                <Input.TextArea rows={4} placeholder="Présentez rapidement votre profil et vos objectifs." />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item name="education" label="Formation">
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item name="experienceYears" label="Années d'expérience">
                                        <Select
                                            options={[
                                                { value: 0, label: '0' },
                                                { value: 1, label: '1' },
                                                { value: 2, label: '2' },
                                                { value: 3, label: '3' },
                                                { value: 5, label: '5' },
                                                { value: 8, label: '8' },
                                                { value: 10, label: '10+' },
                                            ]}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col xs={24} md={8}>
                                    <Form.Item name="preferredJobType" label="Type de contrat">
                                        <Input placeholder="CDI, Stage, Freelance..." />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item name="preferredSector" label="Secteur visé">
                                        <Input placeholder="Frontend, Data, RH..." />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item name="preferredLocation" label="Localisation souhaitée">
                                        <Input placeholder="Tunis, Remote..." />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="skills" label="Compétences">
                                <Select
                                    mode="tags"
                                    tokenSeparators={[',']}
                                    options={COMMON_SKILLS.map((skill) => ({ value: skill, label: skill }))}
                                    placeholder="Ajoutez vos compétences principales"
                                />
                            </Form.Item>

                            <Divider orientation="left">CV & parsing</Divider>

                            <Alert
                                type="info"
                                showIcon
                                style={{ marginBottom: 16 }}
                                message="Le fichier CV est conservé pour les recruteurs. Le champ “Texte du CV” améliore l’analyse sémantique par l’IA, surtout pour les PDF."
                            />

                            <Upload
                                beforeUpload={(file) => {
                                    setCvFile(file);
                                    return false;
                                }}
                                maxCount={1}
                                fileList={fileListFromSelection(cvFile)}
                                onRemove={() => {
                                    setCvFile(null);
                                    return true;
                                }}
                            >
                                <Button icon={<UploadOutlined />}>
                                    {cvFile ? 'CV prêt à être enregistré' : 'Téléverser un nouveau CV'}
                                </Button>
                            </Upload>

                            {(user?.cvOriginalName || cvFile?.name) && (
                                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                    CV sélectionné : {cvFile?.name || user?.cvOriginalName}
                                </Text>
                            )}

                            <Form.Item
                                name="cvText"
                                label="Texte du CV"
                                style={{ marginTop: 16 }}
                            >
                                <Input.TextArea
                                    rows={8}
                                    placeholder="Collez ici le texte de votre CV pour enrichir l’analyse IA."
                                />
                            </Form.Item>

                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                htmlType="submit"
                                loading={savingProfile}
                            >
                                Enregistrer le profil
                            </Button>
                        </Form>
                    </Card>

                    <Card style={{ ...styles.mainCard, marginTop: 24 }}>
                        <div style={styles.analysisHeader}>
                            <div>
                                <Title level={4} style={{ margin: 0 }}>Analyse sémantique du CV</Title>
                                <Text type="secondary">
                                    Synthèse utilisée pour le matching et la lecture recruteur.
                                </Text>
                            </div>
                            {analysis?.experienceLevel && (
                                <Tag color="blue">{analysis.experienceLevel}</Tag>
                            )}
                        </div>

                        {!analysis ? (
                            <Alert
                                type="warning"
                                showIcon
                                message="Aucune analyse disponible pour le moment."
                                description="Ajoutez un CV ou collez son texte, puis enregistrez le profil pour lancer l’analyse."
                            />
                        ) : (
                            <>
                                <Paragraph style={styles.analysisSummary}>
                                    {analysis.summary || 'Aucune synthèse disponible.'}
                                </Paragraph>

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={12}>
                                        <Card size="small" title="Compétences détectées">
                                            <Space wrap size={[8, 8]}>
                                                {(analysis.detectedSkills || []).length > 0 ? (
                                                    analysis.detectedSkills.map((skill) => (
                                                        <Tag key={skill} color="green">{skill}</Tag>
                                                    ))
                                                ) : (
                                                    <Text type="secondary">Aucune compétence détectée.</Text>
                                                )}
                                            </Space>
                                        </Card>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Card size="small" title="Rôles suggérés">
                                            <Space wrap size={[8, 8]}>
                                                {(analysis.suggestedRoles || []).length > 0 ? (
                                                    analysis.suggestedRoles.map((role) => (
                                                        <Tag key={role} color="purple">{role}</Tag>
                                                    ))
                                                ) : (
                                                    <Text type="secondary">Aucun rôle suggéré.</Text>
                                                )}
                                            </Space>
                                        </Card>
                                    </Col>
                                </Row>

                                <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                                    <Col xs={24} md={12}>
                                        <Card size="small" title="Points forts">
                                            <ul style={styles.simpleList}>
                                                {(analysis.strengths || []).map((item) => (
                                                    <li key={item}>{item}</li>
                                                ))}
                                            </ul>
                                            {(!analysis.strengths || analysis.strengths.length === 0) && (
                                                <Text type="secondary">Aucun point fort détecté.</Text>
                                            )}
                                        </Card>
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Card size="small" title="Recommandations">
                                            <ul style={styles.simpleList}>
                                                {(analysis.recommendations || []).map((item) => (
                                                    <li key={item}>{item}</li>
                                                ))}
                                            </ul>
                                            {(!analysis.recommendations || analysis.recommendations.length === 0) && (
                                                <Text type="secondary">Aucune recommandation disponible.</Text>
                                            )}
                                        </Card>
                                    </Col>
                                </Row>

                                {analysis.lastAnalyzedAt && (
                                    <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                                        Dernière analyse : {new Date(analysis.lastAnalyzedAt).toLocaleString('fr-FR')}
                                    </Text>
                                )}
                            </>
                        )}
                    </Card>
                </Col>
            </Row>
        </motion.div>
    );
}

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    sideCard: {
        borderRadius: 18,
        border: '1px solid #e2e8f0',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
    },
    mainCard: {
        borderRadius: 18,
        border: '1px solid #e2e8f0',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
    },
    avatarBlock: {
        display: 'flex',
        alignItems: 'center',
        gap: 18,
    },
    infoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: '#475569',
    },
    analysisHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    analysisSummary: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 1.7,
        marginBottom: 16,
    },
    simpleList: {
        paddingLeft: 18,
        margin: 0,
        color: '#334155',
        display: 'grid',
        gap: 8,
    },
};
