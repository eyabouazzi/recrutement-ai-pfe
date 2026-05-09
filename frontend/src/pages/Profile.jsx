import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Form,
    Input,
    Progress,
    Row,
    Select,
    Skeleton,
    Space,
    Statistic,
    Tag,
    Typography,
    Upload,
    message,
} from 'antd';
import {
    EnvironmentOutlined,
    FileTextOutlined,
    LockOutlined,
    MailOutlined,
    PhoneOutlined,
    SaveOutlined,
    UploadOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { AuthContext } from '../contexts/authContext';
import UserAvatar from '../Components/UserAvatar.jsx';
import { changePassword, previewProfileAnalysis, updateProfile } from '../api/auth';
import { baseUrl } from '../api/api';

const { Title, Text, Paragraph } = Typography;

const COMMON_SKILLS = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'Python', 'Java',
    'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Azure',
    'Testing', 'Communication', 'Leadership', 'UI', 'UX', 'Data Science',
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

function getCompanyStatusAlert(company) {
    if (!company?.status) return null;

    if (company.status === 'approved') {
        return {
            type: 'success',
            message: 'Entreprise approuvee',
            description: company.approvalNote || 'Votre profil entreprise est visible avec un statut valide.',
        };
    }

    if (company.status === 'rejected') {
        return {
            type: 'error',
            message: 'Entreprise a revoir',
            description: company.rejectionReason || "L'equipe de validation a demande des corrections sur votre profil entreprise.",
        };
    }

    return {
        type: 'warning',
        message: 'Validation entreprise en attente',
        description: company.approvalNote || "Completez vos informations pour accelerer la validation de votre entreprise.",
    };
}

function countWords(text) {
    return String(text || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .length;
}

function buildAnalysisSignals({ analysis, cvText, skills, experienceYears, bio, education, preferredSector, preferredLocation, preferredJobType }) {
    const safeAnalysis = analysis || {};
    const wordCount = countWords(cvText);
    const skillCount = Array.isArray(safeAnalysis.detectedSkills) ? safeAnalysis.detectedSkills.length : Array.isArray(skills) ? skills.length : 0;
    const roleCount = Array.isArray(safeAnalysis.suggestedRoles) ? safeAnalysis.suggestedRoles.length : 0;
    const recommendationCount = Array.isArray(safeAnalysis.recommendations) ? safeAnalysis.recommendations.length : 0;
    const strengthsCount = Array.isArray(safeAnalysis.strengths) ? safeAnalysis.strengths.length : 0;

    const profileFieldsFilled = [
        String(bio || '').trim(),
        String(education || '').trim(),
        String(preferredSector || '').trim(),
        String(preferredLocation || '').trim(),
        String(preferredJobType || '').trim(),
        Array.isArray(skills) && skills.length > 0 ? 'skills' : '',
        wordCount >= 40 ? 'cv' : '',
    ].filter(Boolean).length;

    const profileDepthScore = Math.min(
        100,
        Math.round(
            profileFieldsFilled * 10 +
            Math.min(30, wordCount / 12) +
            Math.min(24, skillCount * 4)
        )
    );

    const marketReadinessScore = Math.min(
        100,
        Math.round(
            20 +
            Math.min(32, skillCount * 5) +
            Math.min(18, roleCount * 6) +
            Math.min(15, strengthsCount * 4) +
            Math.min(15, Number(experienceYears || 0) * 3)
        )
    );

    return {
        wordCount,
        skillCount,
        roleCount,
        recommendationCount,
        strengthsCount,
        profileDepthScore,
        marketReadinessScore,
    };
}

function fingerprintCandidateDraft(values) {
    return JSON.stringify({
        bio: values.bio || '',
        education: values.education || '',
        experienceYears: values.experienceYears ?? 0,
        preferredJobType: values.preferredJobType || '',
        preferredSector: values.preferredSector || '',
        preferredLocation: values.preferredLocation || '',
        skills: Array.isArray(values.skills) ? values.skills : [],
        cvText: values.cvText || '',
    });
}

export default function Profile() {
    const { user, setUser } = useContext(AuthContext);
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [cvFile, setCvFile] = useState(null);
    const [companyLogoFile, setCompanyLogoFile] = useState(null);
    const [liveAnalysis, setLiveAnalysis] = useState(null);
    const [liveSignals, setLiveSignals] = useState(null);
    const [liveAnalyzing, setLiveAnalyzing] = useState(false);
    const [liveAnalysisError, setLiveAnalysisError] = useState('');
    const [liveUpdatedAt, setLiveUpdatedAt] = useState(null);
    const previewRequestRef = useRef(0);

    const isHr = user?.role === 'HR';
    const watchedBio = Form.useWatch('bio', profileForm);
    const watchedEducation = Form.useWatch('education', profileForm);
    const watchedExperienceYears = Form.useWatch('experienceYears', profileForm);
    const watchedPreferredJobType = Form.useWatch('preferredJobType', profileForm);
    const watchedPreferredSector = Form.useWatch('preferredSector', profileForm);
    const watchedPreferredLocation = Form.useWatch('preferredLocation', profileForm);
    const watchedSkills = Form.useWatch('skills', profileForm);
    const watchedCvText = Form.useWatch('cvText', profileForm);

    useEffect(() => {
        if (!user) return;

        const company = user.companyId || {};
        profileForm.setFieldsValue(
            isHr
                ? {
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    jobTitle: user.jobTitle || '',
                    companyName: company.name || '',
                    companySector: company.sector || '',
                    applicationEmail: company.applicationEmail || '',
                    companyAddress: company.address || company.city || '',
                    companyPhone: company.phone || '',
                    companyWebsite: company.website || '',
                    companyLinkedin: company.linkedin || '',
                    companyFacebook: company.socialLinks?.facebook || '',
                    companyBookingLink: company.bookingLink || '',
                }
                : {
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
                }
        );

        setAvatarFile(null);
        setCvFile(null);
        setCompanyLogoFile(null);
        setLiveAnalysis(null);
        setLiveSignals(null);
        setLiveAnalysisError('');
        setLiveUpdatedAt(null);
    }, [isHr, profileForm, user]);

    useEffect(() => {
        if (isHr || !user) return;

        const draftValues = {
            bio: watchedBio || '',
            education: watchedEducation || '',
            experienceYears: watchedExperienceYears ?? 0,
            preferredJobType: watchedPreferredJobType || '',
            preferredSector: watchedPreferredSector || '',
            preferredLocation: watchedPreferredLocation || '',
            skills: Array.isArray(watchedSkills) ? watchedSkills : [],
            cvText: watchedCvText || '',
        };

        const persistedValues = {
            bio: user.bio || '',
            education: user.education || '',
            experienceYears: user.experienceYears ?? 0,
            preferredJobType: user.preferredJobType || '',
            preferredSector: user.preferredSector || '',
            preferredLocation: user.preferredLocation || '',
            skills: Array.isArray(user.skills) ? user.skills : [],
            cvText: user.cvText || '',
        };

        const hasEnoughSignal =
            String(draftValues.cvText || '').trim().length >= 40 ||
            String(draftValues.bio || '').trim().length >= 30 ||
            String(draftValues.education || '').trim().length >= 12 ||
            draftValues.skills.length > 0;

        if (!hasEnoughSignal || fingerprintCandidateDraft(draftValues) === fingerprintCandidateDraft(persistedValues)) {
            setLiveAnalysis(null);
            setLiveSignals(null);
            setLiveAnalysisError('');
            setLiveAnalyzing(false);
            return undefined;
        }

        const timer = setTimeout(async () => {
            const requestId = previewRequestRef.current + 1;
            previewRequestRef.current = requestId;
            setLiveAnalyzing(true);
            setLiveAnalysisError('');

            try {
                const response = await previewProfileAnalysis({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    ...draftValues,
                });

                if (previewRequestRef.current !== requestId) return;
                setLiveAnalysis(response.analysis || null);
                setLiveSignals(response.signals || null);
                setLiveUpdatedAt(new Date());
            } catch (error) {
                if (previewRequestRef.current !== requestId) return;
                setLiveAnalysisError(error.message || "Impossible d'analyser le CV en direct.");
            } finally {
                if (previewRequestRef.current === requestId) {
                    setLiveAnalyzing(false);
                }
            }
        }, 700);

        return () => clearTimeout(timer);
    }, [
        isHr,
        user,
        watchedBio,
        watchedCvText,
        watchedEducation,
        watchedExperienceYears,
        watchedPreferredJobType,
        watchedPreferredLocation,
        watchedPreferredSector,
        watchedSkills,
    ]);

    const handleSaveProfile = async (values) => {
        try {
            setSavingProfile(true);
            const formData = new FormData();

            if (isHr) {
                [
                    'firstName',
                    'lastName',
                    'jobTitle',
                    'companyName',
                    'companySector',
                    'applicationEmail',
                    'companyAddress',
                    'companyPhone',
                    'companyWebsite',
                    'companyLinkedin',
                    'companyFacebook',
                    'companyBookingLink',
                ].forEach((field) => {
                    const value = values[field];
                    if (value !== undefined && value !== null) {
                        formData.append(field, value);
                    }
                });

                if (avatarFile) {
                    formData.append('avatar', avatarFile);
                }
                if (companyLogoFile) {
                    formData.append('companyLogo', companyLogoFile);
                }
            } else {
                [
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
                ].forEach((field) => {
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
            }

            const response = await updateProfile(formData);
            if (!response.status || !response.user) {
                throw new Error(response.message || 'Mise a jour impossible');
            }

            setUser(response.user);
            message.success(isHr ? 'Profil entreprise mis a jour' : 'Profil mis a jour');
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
            message.success('Mot de passe modifie');
        } catch (error) {
            message.error(error.message || 'Impossible de modifier le mot de passe');
        } finally {
            setSavingPassword(false);
        }
    };

    const analysis = user?.cvAnalysis || null;
    const cvUrl = resolveUploadUrl(user?.cvUrl);
    const companyLogoUrl = resolveUploadUrl(user?.companyId?.logo);
    const companyStatusAlert = getCompanyStatusAlert(user?.companyId);
    const displayedAnalysis = liveAnalysis || analysis;
    const displayedSignals = liveSignals || buildAnalysisSignals({
        analysis: displayedAnalysis,
        cvText: watchedCvText ?? user?.cvText ?? '',
        skills: Array.isArray(watchedSkills) ? watchedSkills : (Array.isArray(user?.skills) ? user.skills : []),
        experienceYears: watchedExperienceYears ?? user?.experienceYears ?? 0,
        bio: watchedBio ?? user?.bio ?? '',
        education: watchedEducation ?? user?.education ?? '',
        preferredSector: watchedPreferredSector ?? user?.preferredSector ?? '',
        preferredLocation: watchedPreferredLocation ?? user?.preferredLocation ?? '',
        preferredJobType: watchedPreferredJobType ?? user?.preferredJobType ?? '',
    });
    const isLiveMode = Boolean(liveAnalysis);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ maxWidth: 1180, margin: '0 auto' }}
        >
            <div style={styles.header}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        {isHr ? "Profil de l'entreprise" : 'Profil professionnel'}
                    </Title>
                    <Text type="secondary">
                        {isHr
                            ? "Gerez les informations de votre entreprise et du recruteur principal."
                            : 'Gerez vos informations, votre CV et les donnees utilisees pour le matching et l analyse RH.'}
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
                                {isHr && user?.jobTitle && (
                                    <div style={{ marginTop: 6 }}>
                                        <Tag color="blue">{user.jobTitle}</Tag>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Divider />

                        <Space wrap size={[8, 8]}>
                            <Tag color={user?.role === 'HR' ? 'blue' : 'green'}>
                                {(user?.role || 'candidat').toUpperCase()}
                            </Tag>
                            {user?.companyId?.name && (
                                <Tag color="gold">{user.companyId.name}</Tag>
                            )}
                        </Space>

                        <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                            <div style={styles.infoRow}>
                                <MailOutlined />
                                <Text>{user?.email || '-'}</Text>
                            </div>
                            <div style={styles.infoRow}>
                                <PhoneOutlined />
                                <Text>{isHr ? (user?.companyId?.phone || 'Non renseigne') : (user?.phone || 'Non renseigne')}</Text>
                            </div>
                            <div style={styles.infoRow}>
                                {isHr ? <EnvironmentOutlined /> : <UserOutlined />}
                                <Text>
                                    {isHr
                                        ? (user?.companyId?.address || user?.companyId?.city || 'Adresse non renseignee')
                                        : `${user?.city || 'Ville non renseignee'}${user?.country ? `, ${user.country}` : ''}`}
                                </Text>
                            </div>
                        </div>

                        <Divider />

                        <Upload
                            beforeUpload={(file) => {
                                setAvatarFile(file);
                                return false;
                            }}
                            maxCount={1}
                            accept=".jpg,.jpeg,.png,.webp"
                            fileList={fileListFromSelection(avatarFile)}
                            onRemove={() => {
                                setAvatarFile(null);
                                return true;
                            }}
                        >
                            <Button icon={<UploadOutlined />} block>
                                {avatarFile ? 'Photo prete a etre enregistree' : 'Changer la photo'}
                            </Button>
                        </Upload>

                        {!isHr && cvUrl && (
                            <Button
                                icon={<FileTextOutlined />}
                                style={{ marginTop: 12 }}
                                block
                                href={cvUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Telecharger le CV actuel
                            </Button>
                        )}
                    </Card>

                    <Card
                        title={<><LockOutlined /> Securite</>}
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
                                    { min: 8, message: '8 caracteres minimum' },
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
                                Mettre a jour le mot de passe
                            </Button>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card style={styles.mainCard}>
                        <Form layout="vertical" form={profileForm} onFinish={handleSaveProfile}>
                            {isHr ? (
                                <>
                                    {companyStatusAlert && (
                                        <Alert
                                            type={companyStatusAlert.type}
                                            showIcon
                                            style={{ marginBottom: 20 }}
                                            message={companyStatusAlert.message}
                                            description={companyStatusAlert.description}
                                        />
                                    )}

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="companyName"
                                                label="Nom de l'entreprise"
                                                rules={[{ required: true, message: 'Champ requis' }]}
                                            >
                                                <Input placeholder="Nom de votre entreprise" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="companySector"
                                                label="Secteur d'activite"
                                                rules={[{ required: true, message: 'Champ requis' }]}
                                            >
                                                <Input placeholder="Ex: Informatique / Telecoms" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="firstName"
                                                label="Prenom"
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
                                            <Form.Item
                                                name="applicationEmail"
                                                label="Email de reception des candidatures"
                                                rules={[
                                                    { required: true, message: 'Champ requis' },
                                                    { type: 'email', message: 'Email invalide' },
                                                ]}
                                            >
                                                <Input placeholder="nom@entreprise.com" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="jobTitle"
                                                label="Fonction"
                                                rules={[{ required: true, message: 'Champ requis' }]}
                                            >
                                                <Input placeholder="Ex: fondateur, recruteur, RH" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="companyAddress"
                                                label="Adresse"
                                                rules={[{ required: true, message: 'Champ requis' }]}
                                            >
                                                <Input placeholder="Adresse de l'entreprise" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="companyPhone"
                                                label="Telephone"
                                                rules={[{ required: true, message: 'Champ requis' }]}
                                            >
                                                <Input placeholder="+216 00 000 000" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item name="companyWebsite" label="Site web">
                                                <Input placeholder="https://example.com" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item name="companyLinkedin" label="LinkedIn">
                                                <Input placeholder="https://linkedin.com/company/..." />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item name="companyFacebook" label="Facebook">
                                                <Input placeholder="https://facebook.com/..." />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item name="companyBookingLink" label="Lien de prise de rendez-vous">
                                                <Input placeholder="https://calendly.com/your-link" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item label="Logo">
                                        <Upload
                                            beforeUpload={(file) => {
                                                setCompanyLogoFile(file);
                                                return false;
                                            }}
                                            maxCount={1}
                                            accept=".jpg,.jpeg,.png,.webp"
                                            fileList={fileListFromSelection(companyLogoFile)}
                                            onRemove={() => {
                                                setCompanyLogoFile(null);
                                                return true;
                                            }}
                                        >
                                            <Button icon={<UploadOutlined />}>
                                                {companyLogoFile ? 'Logo pret a etre enregistre' : 'Choisir un logo'}
                                            </Button>
                                        </Upload>

                                        {companyLogoFile?.name && (
                                            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                                Fichier selectionne : {companyLogoFile.name}
                                            </Text>
                                        )}

                                        {!companyLogoFile && companyLogoUrl && (
                                            <div style={styles.companyLogoPreview}>
                                                <img src={companyLogoUrl} alt="Logo entreprise" style={styles.companyLogoImage} />
                                            </div>
                                        )}
                                    </Form.Item>

                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        htmlType="submit"
                                        loading={savingProfile}
                                    >
                                        Enregistrer les modifications
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="firstName"
                                                label="Prenom"
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
                                            <Form.Item name="phone" label="Telephone">
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

                                    <Form.Item name="bio" label="Resume professionnel">
                                        <Input.TextArea rows={4} placeholder="Presentez rapidement votre profil et vos objectifs." />
                                    </Form.Item>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item name="education" label="Formation">
                                                <Input />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item name="experienceYears" label="Annees d'experience">
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
                                            <Form.Item name="preferredSector" label="Secteur vise">
                                                <Input placeholder="Frontend, Data, RH..." />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <Form.Item name="preferredLocation" label="Localisation souhaitee">
                                                <Input placeholder="Tunis, Remote..." />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item name="skills" label="Competences">
                                        <Select
                                            mode="tags"
                                            tokenSeparators={[',']}
                                            options={COMMON_SKILLS.map((skill) => ({ value: skill, label: skill }))}
                                            placeholder="Ajoutez vos competences principales"
                                        />
                                    </Form.Item>

                                    <Divider orientation="left">CV et parsing</Divider>

                                    <Alert
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: 16 }}
                                        message="Le fichier CV est conserve pour les recruteurs. L analyse lit automatiquement les PDF texte et les DOCX. Pour un scan ou une image, collez aussi le texte du CV."
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
                                            {cvFile ? 'CV pret a etre enregistre' : 'Televerser un nouveau CV'}
                                        </Button>
                                    </Upload>

                                    {(user?.cvOriginalName || cvFile?.name) && (
                                        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                            CV selectionne : {cvFile?.name || user?.cvOriginalName}
                                        </Text>
                                    )}

                                    <Form.Item
                                        name="cvText"
                                        label="Texte du CV"
                                        style={{ marginTop: 16 }}
                                    >
                                        <Input.TextArea
                                            rows={8}
                                            placeholder="Collez ici le texte de votre CV pour enrichir l'analyse IA."
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
                                </>
                            )}
                        </Form>
                    </Card>

                    {!isHr && (
                        <Card style={{ ...styles.mainCard, marginTop: 24 }}>
                            <div style={styles.analysisHeader}>
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>CV Lab en temps reel</Title>
                                    <Text type="secondary">
                                        Analyse non sauvegardee, mise a jour automatiquement pendant que vous enrichissez votre CV.
                                    </Text>
                                </div>
                                {displayedAnalysis?.experienceLevel && (
                                    <Space direction="vertical" size={6} style={{ alignItems: 'flex-end' }}>
                                        <Tag color={isLiveMode ? 'cyan' : 'blue'}>
                                            {isLiveMode ? 'Live preview' : 'Version sauvegardee'}
                                        </Tag>
                                        <Tag color="blue">{displayedAnalysis.experienceLevel}</Tag>
                                    </Space>
                                )}
                            </div>

                            <Alert
                                type={isLiveMode ? 'info' : 'success'}
                                showIcon
                                style={{ marginBottom: 16 }}
                                message={isLiveMode ? 'Le moteur analyse vos changements en direct.' : 'Aucune modification locale detectee.'}
                                description={
                                    isLiveMode
                                        ? `Apercu instantane base sur votre brouillon actuel.${liveUpdatedAt ? ` Derniere mise a jour a ${liveUpdatedAt.toLocaleTimeString('fr-FR')}.` : ''}`
                                        : 'Modifiez le texte du CV, les competences, la bio ou les preferences pour voir l analyse evoluer sans enregistrer.'
                                }
                            />

                            {liveAnalysisError && (
                                <Alert
                                    type="warning"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                    message="Analyse live indisponible temporairement"
                                    description={liveAnalysisError}
                                />
                            )}

                            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                <Col xs={24} sm={12} xl={6}>
                                    <Card size="small" style={styles.signalCard}>
                                        <Statistic title="Readiness marche" value={displayedSignals.marketReadinessScore} suffix="/100" />
                                        <Progress percent={displayedSignals.marketReadinessScore} size="small" strokeColor="#2563eb" showInfo={false} />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} xl={6}>
                                    <Card size="small" style={styles.signalCard}>
                                        <Statistic title="Profondeur profil" value={displayedSignals.profileDepthScore} suffix="/100" />
                                        <Progress percent={displayedSignals.profileDepthScore} size="small" strokeColor="#14b8a6" showInfo={false} />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} xl={6}>
                                    <Card size="small" style={styles.signalCard}>
                                        <Statistic title="Mots CV" value={displayedSignals.wordCount} />
                                        <Text type="secondary">Plus le texte est dense, plus l analyse est fine.</Text>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} xl={6}>
                                    <Card size="small" style={styles.signalCard}>
                                        <Statistic title="Competences detectees" value={displayedSignals.skillCount} />
                                        <Text type="secondary">Roles proposes: {displayedSignals.roleCount}</Text>
                                    </Card>
                                </Col>
                            </Row>

                            {liveAnalyzing && (
                                <Card size="small" style={{ marginBottom: 16 }}>
                                    <Skeleton active paragraph={{ rows: 3 }} title={false} />
                                </Card>
                            )}

                            {!displayedAnalysis ? (
                                <Alert
                                    type="warning"
                                    showIcon
                                    message="Aucune analyse disponible pour le moment."
                                    description="Ajoutez du texte CV, des competences ou une bio pour declencher le radar en temps reel."
                                />
                            ) : (
                                <>
                                    <Paragraph style={styles.analysisSummary}>
                                        {displayedAnalysis.summary || 'Aucune synthese disponible.'}
                                    </Paragraph>

                                    <Row gutter={[16, 16]}>
                                        <Col xs={24} md={12}>
                                            <Card size="small" title="Competences detectees">
                                                <Space wrap size={[8, 8]}>
                                                    {(displayedAnalysis.detectedSkills || []).length > 0 ? (
                                                        displayedAnalysis.detectedSkills.map((skill) => (
                                                            <Tag key={skill} color="green">{skill}</Tag>
                                                        ))
                                                    ) : (
                                                        <Text type="secondary">Aucune competence detectee.</Text>
                                                    )}
                                                </Space>
                                            </Card>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Card size="small" title="Roles suggeres">
                                                <Space wrap size={[8, 8]}>
                                                    {(displayedAnalysis.suggestedRoles || []).length > 0 ? (
                                                        displayedAnalysis.suggestedRoles.map((role) => (
                                                            <Tag key={role} color="purple">{role}</Tag>
                                                        ))
                                                    ) : (
                                                        <Text type="secondary">Aucun role suggere.</Text>
                                                    )}
                                                </Space>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                                        <Col xs={24} md={12}>
                                            <Card size="small" title="Points forts">
                                                <ul style={styles.simpleList}>
                                                    {(displayedAnalysis.strengths || []).map((item) => (
                                                        <li key={item}>{item}</li>
                                                    ))}
                                                </ul>
                                                {(!displayedAnalysis.strengths || displayedAnalysis.strengths.length === 0) && (
                                                    <Text type="secondary">Aucun point fort detecte.</Text>
                                                )}
                                            </Card>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Card size="small" title="Recommandations">
                                                <ul style={styles.simpleList}>
                                                    {(displayedAnalysis.recommendations || []).map((item) => (
                                                        <li key={item}>{item}</li>
                                                    ))}
                                                </ul>
                                                {(!displayedAnalysis.recommendations || displayedAnalysis.recommendations.length === 0) && (
                                                    <Text type="secondary">Aucune recommandation disponible.</Text>
                                                )}
                                            </Card>
                                        </Col>
                                    </Row>

                                    {!isLiveMode && displayedAnalysis.lastAnalyzedAt && (
                                        <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                                            Derniere analyse sauvegardee : {new Date(displayedAnalysis.lastAnalyzedAt).toLocaleString('fr-FR')}
                                        </Text>
                                    )}
                                </>
                            )}
                        </Card>
                    )}
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
    companyLogoPreview: {
        marginTop: 12,
        width: 112,
        height: 112,
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
    },
    companyLogoImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    signalCard: {
        height: '100%',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
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
