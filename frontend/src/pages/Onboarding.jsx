import React, { useState, useContext, useEffect } from 'react';
import { Typography, Steps, Form, Input, Select, Button, Upload, App as AntdApp, Card } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/authContext';
import { completeOnboarding } from '../api/register';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;
const { Option } = Select;

const itSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Go', 'Rust', 'TypeScript',
    'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'ASP.NET',
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra', 'Elasticsearch',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'Git', 'Linux',
    'Machine Learning', 'Data Science', 'Data Engineering', 'Cybersecurity', 'Network Engineering',
];

function Onboarding() {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const { message } = AntdApp.useApp();
    const [form] = Form.useForm();
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    useEffect(() => {
        if (user && user.onboardingDone) {
            navigate(user.role === 'HR' ? '/rh/dashboard' : '/tests');
        }
    }, [user, navigate]);

    const handleAvatarChange = (info) => {
        if (info.file) {
            const file = info.file.originFileObj || info.file;
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setAvatarPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleNext = async () => {
        try {
            if (current === 0) {
                await form.validateFields(['city', 'phone', 'education']);
            } else if (current === 1) {
                await form.validateFields(['skills', 'experienceYears']);
            } else if (current === 2) {
                const hrFields = user?.role === 'HR'
                    ? ['companyName', 'companySector', 'companySize', 'companyWebsite', 'companyCity', 'companyPhone', 'companyDescription']
                    : [];
                await form.validateFields([...hrFields, 'preferredJobType', 'preferredSector', 'preferredLocation', 'bio']);
            }
            setCurrent(current + 1);
        } catch (error) {
            console.log('Validation Failed:', error);
        }
    };

    const handlePrev = () => {
        setCurrent(current - 1);
    };

    const handleFinish = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();
            Object.keys(values).forEach((key) => {
                if (values[key] !== undefined) {
                    if (key === 'skills' && Array.isArray(values[key])) {
                        formData.append(key, values[key].join(','));
                    } else {
                        formData.append(key, values[key]);
                    }
                }
            });

            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const response = await completeOnboarding(formData);
            if (!response.status) {
                throw new Error(response.message || 'Erreur inconnue');
            }

            message.success('Profil complété avec succès !');
            setUser(response.user);

            const pendingTestId = sessionStorage.getItem('pendingTestId');
            if (response.user.role === 'candidat' && pendingTestId) {
                sessionStorage.removeItem('pendingTestId');
                navigate(`/tests/${pendingTestId}`);
                return;
            }

            navigate(response.user.role === 'HR' ? '/rh/dashboard' : '/tests');
        } catch (error) {
            message.error(error.message || 'La sauvegarde a échoué.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        {
            title: 'Personnel',
            content: (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 24 }}>
                        <Upload
                            name="avatar"
                            listType="picture-circle"
                            showUploadList={false}
                            beforeUpload={() => false}
                            onChange={handleAvatarChange}
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <CameraOutlined style={{ fontSize: 24, color: '#3b82f6' }} />
                                    <span style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>Photo</span>
                                </div>
                            )}
                        </Upload>
                        <div style={{ flex: 1 }}>
                            <Form.Item name="city" label="Ville actuelle" rules={[{ required: true, message: 'Requis' }]}>
                                <Input size="large" placeholder="Ex: Paris, Alger..." />
                            </Form.Item>
                        </div>
                    </div>
                    <Form.Item name="phone" label="Téléphone">
                        <Input size="large" placeholder="+XXX XX XX XX XX" />
                    </Form.Item>
                    <Form.Item name="education" label="Domaine de formation" rules={[{ required: true, message: 'Requis' }]}>
                        <Input size="large" placeholder="Ex: Ingénierie Informatique, Ressources Humaines..." />
                    </Form.Item>
                </motion.div>
            ),
        },
        {
            title: 'Compétences',
            content: (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <Form.Item
                        name="skills"
                        label="Compétences"
                        help="Ajoutez vos compétences pour obtenir des recommandations plus pertinentes."
                    >
                        <Select
                            mode="tags"
                            size="large"
                            placeholder="Sélectionnez ou tapez..."
                            style={{ width: '100%' }}
                            options={itSkills.map((s) => ({ value: s, label: s }))}
                        />
                    </Form.Item>
                    <Form.Item
                        name="experienceYears"
                        label="Années d'expérience"
                        rules={[{ required: true, message: 'Requis' }]}
                    >
                        <Select size="large">
                            <Option value="0">Junior / Étudiant (0 an)</Option>
                            <Option value="1">1 an</Option>
                            <Option value="2">2 ans</Option>
                            <Option value="3">3 à 5 ans</Option>
                            <Option value="5">5 à 10 ans</Option>
                            <Option value="10">Plus de 10 ans</Option>
                        </Select>
                    </Form.Item>
                </motion.div>
            ),
        },
        {
            title: 'Préférences',
            content: (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    {user?.role === 'HR' && (
                        <>
                            <Form.Item name="companyName" label="Nom de l'entreprise" rules={[{ required: true, message: 'Requis' }]}>
                                <Input size="large" placeholder="Nom officiel de l'entreprise" />
                            </Form.Item>
                            <Form.Item name="companyDescription" label="Présentation de l'entreprise">
                                <Input.TextArea rows={4} placeholder="Décrivez votre entreprise, vos métiers et votre culture..." />
                            </Form.Item>
                            <Form.Item name="companySector" label="Secteur d'activité" rules={[{ required: true, message: 'Requis' }]}>
                                <Input size="large" placeholder="Ex: Technologie, Finance, RH, Industrie..." />
                            </Form.Item>
                            <Form.Item name="companySize" label="Taille de l'entreprise">
                                <Select size="large">
                                    <Option value="1-10">1-10</Option>
                                    <Option value="11-50">11-50</Option>
                                    <Option value="51-200">51-200</Option>
                                    <Option value="201-500">201-500</Option>
                                    <Option value="500+">500+</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="companyCity" label="Ville de l'entreprise">
                                <Input size="large" placeholder="Ville du siège ou bureau principal" />
                            </Form.Item>
                            <Form.Item name="companyWebsite" label="Site web entreprise">
                                <Input size="large" placeholder="https://..." />
                            </Form.Item>
                            <Form.Item name="companyPhone" label="Téléphone entreprise">
                                <Input size="large" placeholder="+XXX XX XX XX XX" />
                            </Form.Item>
                        </>
                    )}
                    <Form.Item name="preferredJobType" label="Type de contrat recherché">
                        <Select size="large">
                            <Option value="CDI">CDI</Option>
                            <Option value="CDD">CDD</Option>
                            <Option value="Freelance">Freelance</Option>
                            <Option value="Stage">Stage</Option>
                            <Option value="Alternance">Alternance</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="preferredSector" label="Domaine / secteur recherché">
                        <Input size="large" placeholder="Ex: Développement web, Data, Marketing, Finance..." />
                    </Form.Item>
                    <Form.Item name="preferredLocation" label="Localisation préférée">
                        <Input size="large" placeholder="Où souhaitez-vous travailler ?" />
                    </Form.Item>
                    <Form.Item name="bio" label="Courte bio">
                        <Input.TextArea rows={4} placeholder="Parlez-nous brièvement de vous et de vos objectifs..." />
                    </Form.Item>
                </motion.div>
            ),
        },
    ];

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <Card style={styles.card} bordered={false}>
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <Title level={2} style={{ color: '#0f172a', fontWeight: 800 }}>
                            Bienvenue, {user?.firstName}
                        </Title>
                        <Text style={{ fontSize: 16, color: '#475569' }}>
                            Ces informations servent à personnaliser vos recommandations d'emploi et votre expérience sur la plateforme.
                        </Text>
                    </div>

                    <Steps current={current} items={steps.map((item) => ({ key: item.title, title: item.title }))} style={{ marginBottom: 40 }} />

                    <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
                        <div style={{ minHeight: 250 }}>{steps[current].content}</div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
                            <Button onClick={handlePrev} disabled={current === 0} size="large">
                                Retour
                            </Button>

                            {current < steps.length - 1 ? (
                                <Button type="primary" onClick={handleNext} size="large" style={{ background: '#2563eb' }}>
                                    Suivant
                                </Button>
                            ) : (
                                <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ background: '#2563eb' }}>
                                    Terminer et continuer
                                </Button>
                            )}
                        </div>
                    </Form>
                </Card>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
    },
    container: {
        width: '100%',
        maxWidth: 700,
    },
    card: {
        borderRadius: 20,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '40px 24px',
    },
};

export default Onboarding;
