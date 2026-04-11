import { useEffect, useState } from 'react';
import { Card, Button, Space, message, Typography, Spin, List, Tag, Divider, Form, Input, Select, Modal, DatePicker, InputNumber, Table } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined, RobotOutlined, LinkOutlined, ReloadOutlined, DatabaseOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
    getTestById,
    addManualQuestion,
    deleteQuestion,
    deleteTest,
    generateAutoQuestions,
    updateTest,
    regenerateQuestion,
    listQuestionBank,
    attachBankQuestion,
} from '../../api/tests';

const { Title, Text } = Typography;
const { Option } = Select;

function TestManage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addForm] = Form.useForm();
    const [infoForm] = Form.useForm();
    const [questionType, setQuestionType] = useState('QCM');
    const [submitting, setSubmitting] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [updatingInfo, setUpdatingInfo] = useState(false);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [bankOpen, setBankOpen] = useState(false);
    const [bankItems, setBankItems] = useState([]);
    const [bankLoading, setBankLoading] = useState(false);

    useEffect(() => {
        fetchTest();
    }, [id]);

    const fetchTest = async () => {
        try {
            setLoading(true);
            const data = await getTestById(id);
            setTest(data.test);
            setQuestions(data.questions);
            infoForm.setFieldsValue({
                ...data.test,
                submissionDeadline: data.test.submissionDeadline ? dayjs(data.test.submissionDeadline) : undefined,
            });
        } catch (error) {
            message.error(error.message || 'Impossible de charger le test');
            navigate('/rh/tests');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateInfo = async (values) => {
        try {
            setUpdatingInfo(true);
            const payload = {
                ...values,
                submissionDeadline: values.submissionDeadline
                    ? values.submissionDeadline.toISOString()
                    : null,
            };
            const updated = await updateTest(id, payload);
            setTest(updated.test);
            message.success('Informations mises à jour avec succès');
        } catch (error) {
            message.error(error.message || 'Erreur lors de la mise à jour');
        } finally {
            setUpdatingInfo(false);
        }
    };

    const handleAddQuestion = async (values) => {
        try {
            setSubmitting(true);
            const payload = {
                testId: id,
                type: values.type,
                prompt: values.prompt,
                options: values.type === 'QCM' ? [values.opt1, values.opt2, values.opt3, values.opt4].filter(Boolean) : undefined,
                correctAnswer: values.type === 'QCM' ? values.correctAnswer : undefined,
            };
            const data = await addManualQuestion(payload);
            setQuestions(prev => [...prev, data.question]);
            message.success('Question ajoutée avec succès!');
            addForm.resetFields();
        } catch (error) {
            message.error(error.message || 'Erreur lors de l\'ajout de la question');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteQuestion = async (qId) => {
        try {
            await deleteQuestion(qId);
            setQuestions(prev => prev.filter(q => q._id !== qId));
            message.success('Question supprimée');
        } catch (error) {
            message.error(error.message || 'Erreur lors de la suppression');
        }
    };

    const handleMarkReviewed = async (qId) => {
        try {
            const { question } = await markQuestionReviewed(qId, true);
            setQuestions((prev) => prev.map((q) => (q._id === qId ? { ...q, ...question } : q)));
            message.success('Question marquée validée pour publication');
        } catch (error) {
            message.error(error.message || 'Mise à jour impossible');
        }
    };

    const handleGenerateAI = async () => {
        try {
            setGeneratingAI(true);
            message.loading({ content: 'L\'IA génère les questions...', key: 'ai-gen' });
            const data = await generateAutoQuestions(id, 5);
            setQuestions(prev => [...prev, ...data.questions]);
            message.success({ content: `${data.questions.length} questions générées avec succès!`, key: 'ai-gen', duration: 3 });
        } catch (error) {
            message.error({ content: error.message, key: 'ai-gen', duration: 3 });
        } finally {
            setGeneratingAI(false);
        }
    };

    const openBank = async () => {
        setBankOpen(true);
        try {
            setBankLoading(true);
            const data = await listQuestionBank();
            setBankItems(data.items || []);
        } catch (e) {
            message.error(e.message);
        } finally {
            setBankLoading(false);
        }
    };

    const handleAttachBank = async (bankId) => {
        try {
            const { question } = await attachBankQuestion(bankId, id);
            setQuestions((prev) => [...prev, question]);
            message.success('Question ajoutée depuis la banque');
            setBankOpen(false);
        } catch (e) {
            message.error(e.message);
        }
    };

    const handleRegenerateQ = async (q) => {
        try {
            message.loading({ content: 'Régénération IA...', key: 'reg' });
            const data = await regenerateQuestion(q._id, '');
            setQuestions((prev) => prev.map((x) => (x._id === q._id ? data.question : x)));
            message.success({ content: 'Question mise à jour', key: 'reg' });
        } catch (e) {
            message.error({ content: e.message, key: 'reg' });
        }
    };

    const genInvite = () => {
        const code = [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join('');
        infoForm.setFieldsValue({ inviteCode: code });
        message.success('Code généré — pensez à sauvegarder.');
    };

    const copyInviteLink = () => {
        const code = infoForm.getFieldValue('inviteCode') || test?.inviteCode;
        if (!code) {
            message.warning('Définissez ou générez un code d’invitation d’abord.');
            return;
        }
        const url = `${window.location.origin}/tests/${id}?invite=${encodeURIComponent(code)}`;
        navigator.clipboard.writeText(url);
        message.success('Lien copié dans le presse-papiers');
    };

    const handleDeleteTest = async () => {
        try {
            await deleteTest(id);
            message.success('Test supprimé avec succès');
            navigate('/rh/tests');
        } catch (error) {
            message.error(error.message || 'Erreur lors de la suppression du test');
        } finally {
            setDeleteConfirmVisible(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', marginTop: 80 }}><Spin size="large" /></div>;
    }

    const qcmOptions = questionType === 'QCM' ? (
        <>
            <Form.Item label="Option A" name="opt1" rules={[{ required: true, message: 'Requis' }]}>
                <Input placeholder="Option A" />
            </Form.Item>
            <Form.Item label="Option B" name="opt2" rules={[{ required: true, message: 'Requis' }]}>
                <Input placeholder="Option B" />
            </Form.Item>
            <Form.Item label="Option C" name="opt3">
                <Input placeholder="Option C (facultatif)" />
            </Form.Item>
            <Form.Item label="Option D" name="opt4">
                <Input placeholder="Option D (facultatif)" />
            </Form.Item>
            <Form.Item label="Bonne réponse" name="correctAnswer" rules={[{ required: true, message: 'Indiquez la bonne réponse (texte exact)' }]}>
                <Input placeholder="Copiez-y la bonne réponse exacte" />
            </Form.Item>
        </>
    ) : null;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/rh/tests')}>
                        Retour
                    </Button>
                    <div>
                        <Title level={3} style={{ margin: 0 }}>{test?.title}</Title>
                        <Text type="secondary">{test?.jobRole} · {test?.timeLimit} min</Text>
                    </div>
                </div>
                <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteConfirmVisible(true)}>
                    Supprimer le test
                </Button>
            </div>

            {/* Test Info / Job Offer Details */}
            <Card title="Détails de l'offre d'emploi" style={{ marginBottom: 24 }}>
                <Form
                    form={infoForm}
                    layout="vertical"
                    onFinish={handleUpdateInfo}
                    initialValues={test}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item label="Titre" name="title" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Poste (Job Role)" name="jobRole" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Durée du test (min)" name="timeLimit" rules={[{ required: true }]}>
                            <Input type="number" />
                        </Form.Item>
                        <Form.Item label="Localisation" name="location">
                            <Input />
                        </Form.Item>
                        <Form.Item label="Type de contrat" name="employmentType">
                            <Select>
                                <Option value="Full-time">CDI (Full-time)</Option>
                                <Option value="Part-time">Temps partiel</Option>
                                <Option value="Contract">Freelance / Contrat</Option>
                                <Option value="Internship">Stage</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label="Statut de l'offre" name="status">
                            <Select>
                                <Option value="PUBLISHED">Publiée (Visible sur la page carrière)</Option>
                                <Option value="DRAFT">Brouillon</Option>
                                <Option value="CLOSED">Fermée</Option>
                            </Select>
                        </Form.Item>
                    </div>
                    <Form.Item label="Description" name="description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item
                        label="Critères d'évaluation (IA)"
                        name="evaluationCriteria"
                        tooltip="Transmis au modèle pour noter les réponses ouvertes et la synthèse par compétence."
                    >
                        <Input.TextArea rows={3} placeholder="Ex: insister sur la sécurité, la clarté, l'expérience Node.js..." />
                    </Form.Item>
                    <Divider orientation="left">Accès candidats & barème</Divider>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item label="Code d'invitation (lien privé)" name="inviteCode">
                            <Input placeholder="Vide = tout candidat authentifié" />
                        </Form.Item>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Space>
                                <Button size="small" onClick={genInvite}>Générer code</Button>
                                <Button size="small" icon={<LinkOutlined />} onClick={copyInviteLink}>Copier lien candidat</Button>
                            </Space>
                        </div>
                        <Form.Item label="Date limite de passage" name="submissionDeadline">
                            <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
                        </Form.Item>
                        <Form.Item label="Tentatives max / candidat (0 = illimité)" name="maxAttempts">
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="Score min. qualifié (%)" name="passThreshold">
                            <InputNumber min={0} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="Pondération QCM (%)" name="weightQCM">
                            <InputNumber min={0} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="Pondération ouvert (%)" name="weightOpen">
                            <InputNumber min={0} max={100} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="Délai min. / question (s)" name="minSecondsPerQuestion">
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="URL Calendly" name="calendlyUrl">
                            <Input placeholder="https://calendly.com/..." />
                        </Form.Item>
                    </div>
                    <Form.Item label="Webhook (POST après soumission)" name="webhookUrl">
                        <Input placeholder="https://..." />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={updatingInfo}>
                        Sauvegarder les modifications
                    </Button>
                </Form>
            </Card>

            {/* Questions list */}
            <Card
                title={`Questions (${questions.length})`}
                extra={
                    <Space>
                        <Button icon={<DatabaseOutlined />} onClick={openBank}>
                            Banque de questions
                        </Button>
                        <Button
                            type="primary"
                            icon={<RobotOutlined />}
                            loading={generatingAI}
                            onClick={handleGenerateAI}
                        >
                            Générer 5 questions (IA)
                        </Button>
                    </Space>
                }
                style={{ marginBottom: 24 }}
            >
                {questions.length === 0 ? (
                    <Text type="secondary">Aucune question pour l'instant. Ajoutez-en ci-dessous ou générez avec l'IA.</Text>
                ) : (
                    <List
                        dataSource={questions}
                        itemLayout="vertical"
                        renderItem={(q, index) => (
                            <List.Item
                                key={q._id}
                                extra={
                                    <Space>
                                        {!q.reviewedForPublish && (
                                            <Button
                                                size="small"
                                                type="primary"
                                                ghost
                                                icon={<CheckCircleOutlined />}
                                                onClick={() => handleMarkReviewed(q._id)}
                                            >
                                                Valider RH
                                            </Button>
                                        )}
                                        <Button
                                            size="small"
                                            icon={<ReloadOutlined />}
                                            onClick={() => handleRegenerateQ(q)}
                                        >
                                            IA
                                        </Button>
                                        <Button
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleDeleteQuestion(q._id)}
                                        >
                                            Supprimer
                                        </Button>
                                    </Space>
                                }
                            >
                                <div>
                                    <Text strong>{index + 1}. {q.prompt}</Text>
                                    <Tag color={q.type === 'QCM' ? 'blue' : q.type === 'PROBLEM' ? 'purple' : q.type === 'SHORT_ANSWER' ? 'orange' : 'default'} style={{ marginLeft: 8 }}>
                                        {q.type}
                                    </Tag>
                                    {q.reviewedForPublish ? (
                                        <Tag color="success" style={{ marginLeft: 8 }}>Validée RH</Tag>
                                    ) : null}
                                </div>
                                {q.type === 'QCM' && q.options?.length > 0 && (
                                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {q.options.map((opt, i) => (
                                            <Tag
                                                key={i}
                                                color={opt === q.correctAnswer ? 'success' : 'default'}
                                            >
                                                {opt === q.correctAnswer ? '✓ ' : ''}{opt}
                                            </Tag>
                                        ))}
                                    </div>
                                )}
                            </List.Item>
                        )}
                    />
                )}
            </Card>

            {/* Add question manually */}
            <Card title={<><PlusOutlined /> Ajouter une question manuellement</>}>
                <Form
                    form={addForm}
                    layout="vertical"
                    onFinish={handleAddQuestion}
                    initialValues={{ type: 'QCM' }}
                >
                    <Form.Item label="Type de question" name="type" rules={[{ required: true }]}>
                        <Select onChange={setQuestionType}>
                            <Option value="QCM">QCM (Choix multiple)</Option>
                            <Option value="TEXT">Texte libre (IA)</Option>
                            <Option value="SHORT_ANSWER">Rédaction courte (IA)</Option>
                            <Option value="PROBLEM">Cas / résolution de problème (IA)</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="Énoncé de la question" name="prompt" rules={[{ required: true, message: 'L\'énoncé est requis' }]}>
                        <Input.TextArea rows={3} placeholder="Tapez votre question ici..." />
                    </Form.Item>
                    {qcmOptions}
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={submitting} icon={<PlusOutlined />}>
                            Ajouter la question
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* Delete Test Confirmation */}
            <Modal
                title="Banque de questions"
                open={bankOpen}
                onCancel={() => setBankOpen(false)}
                footer={null}
                width={720}
            >
                <Table
                    loading={bankLoading}
                    size="small"
                    rowKey="_id"
                    dataSource={bankItems}
                    columns={[
                        { title: 'Type', dataIndex: 'type', width: 90 },
                        { title: 'Énoncé', dataIndex: 'prompt', ellipsis: true },
                        {
                            title: '',
                            key: 'a',
                            width: 100,
                            render: (_, row) => (
                                <Button type="primary" size="small" onClick={() => handleAttachBank(row._id)}>
                                    Ajouter au test
                                </Button>
                            ),
                        },
                    ]}
                />
            </Modal>

            <Modal
                title="Confirmer la suppression"
                open={deleteConfirmVisible}
                onOk={handleDeleteTest}
                onCancel={() => setDeleteConfirmVisible(false)}
                okText="Supprimer"
                okType="danger"
                cancelText="Annuler"
            >
                <p>Êtes-vous sûr de vouloir supprimer le test <strong>{test?.title}</strong> et toutes ses questions ? Cette action est irréversible.</p>
            </Modal>
        </div>
    );
}

export default TestManage;
