import { useEffect, useState } from 'react';
import { Card, Button, Space, message, Typography, Spin, List, Tag, Divider, Form, Input, Select, Modal } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined, RobotOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getTestById, addManualQuestion, deleteQuestion, deleteTest, generateAutoQuestions, updateTest } from '../../api/tests';

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

    useEffect(() => {
        fetchTest();
    }, [id]);

    const fetchTest = async () => {
        try {
            setLoading(true);
            const data = await getTestById(id);
            setTest(data.test);
            setQuestions(data.questions);
            infoForm.setFieldsValue(data.test);
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
            const updated = await updateTest(id, values);
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
                    <Button type="primary" htmlType="submit" loading={updatingInfo}>
                        Sauvegarder les modifications
                    </Button>
                </Form>
            </Card>

            {/* Questions list */}
            <Card
                title={`Questions (${questions.length})`}
                extra={
                    <Button
                        type="primary"
                        icon={<RobotOutlined />}
                        loading={generatingAI}
                        onClick={handleGenerateAI}
                    >
                        Générer 5 questions (IA)
                    </Button>
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
                                    <Button
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleDeleteQuestion(q._id)}
                                    >
                                        Supprimer
                                    </Button>
                                }
                            >
                                <div>
                                    <Text strong>{index + 1}. {q.prompt}</Text>
                                    <Tag color={q.type === 'QCM' ? 'blue' : 'orange'} style={{ marginLeft: 8 }}>
                                        {q.type}
                                    </Tag>
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
                            <Option value="TEXT">Texte libre (évalué par IA)</Option>
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
