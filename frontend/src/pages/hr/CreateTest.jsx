import { useState } from 'react';
import { Form, Input, InputNumber, Button, Card, message, Steps, Typography, Spin, Divider, List, Tag, Space, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { createTest, generateAutoQuestions } from '../../api/tests';

const { Title, Text } = Typography;
const { Step } = Steps;

function CreateTest() {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [createdTestId, setCreatedTestId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);

    // Step 1: Create Test Info
    const handleCreateTest = async (values) => {
        try {
            setLoading(true);
            const data = await createTest(values);
            setCreatedTestId(data.test._id);
            message.success('Test created successfully. Now let\'s generate questions.');
            setCurrentStep(1);
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Generate Questions via AI
    const handleGenerateAI = async () => {
        try {
            setLoading(true);
            const count = 5; // Fixed for simple wizard, could be dynamic
            message.loading({ content: 'L\'IA génère les questions...', key: 'ai-gen' });
            const data = await generateAutoQuestions(createdTestId, count);
            setGeneratedQuestions(data.questions);
            message.success({ content: 'Questions générées avec succès!', key: 'ai-gen', duration: 2 });
            setCurrentStep(2);
        } catch (error) {
            message.error({ content: error.message, key: 'ai-gen', duration: 2 });
        } finally {
            setLoading(false);
        }
    };

    const finishCreation = () => {
        message.success('Création du test terminée!');
        navigate(`/rh/tests`);
    };

    return (
        <Card>
            <Title level={3}>Créer un Nouveau Test</Title>
            <Steps current={currentStep} style={{ marginBottom: 32, marginTop: 16 }}>
                <Step title="Détails du Test" />
                <Step title="Génération IA" />
                <Step title="Vérification" />
            </Steps>

            {currentStep === 0 && (
                <Form form={form} layout="vertical" onFinish={handleCreateTest}>
                    <Form.Item label="Titre du Test" name="title" rules={[{ required: true }]}>
                        <Input placeholder="Ex: React Mid-Level Assessment" />
                    </Form.Item>
                    <Form.Item label="Poste concerné (Job Role)" name="jobRole" rules={[{ required: true }]}>
                        <Input placeholder="Ex: Frontend Developer React" />
                    </Form.Item>
                    <Form.Item label="Description / Compétences" name="description">
                        <Input.TextArea rows={4} placeholder="Decrivez les compétences recherchées pour guider l'IA (ex: Hooks, Redux, Performance...)" />
                    </Form.Item>
                    <Form.Item
                        label="Critères d'évaluation (pour l'IA)"
                        name="evaluationCriteria"
                        tooltip="Optionnel. Ex: 40% technique, 30% communication, 30% résolution de problèmes. L'IA en tiendra compte pour le score et le feedback."
                    >
                        <Input.TextArea rows={3} placeholder="Pondération ou critères RH pour noter les réponses ouvertes..." />
                    </Form.Item>
                    <Form.Item label="Durée (minutes)" name="timeLimit" rules={[{ required: true }]} initialValue={30}>
                        <InputNumber min={5} max={180} />
                    </Form.Item>
                    <Form.Item label="Localisation" name="location" initialValue="Remote">
                        <Input placeholder="Ex: Paris, Remote, Tunis..." />
                    </Form.Item>
                    <Form.Item label="Type de contrat" name="employmentType" initialValue="Full-time">
                        <Select>
                            <Select.Option value="Full-time">CDI (Full-time)</Select.Option>
                            <Select.Option value="Part-time">Temps partiel</Select.Option>
                            <Select.Option value="Contract">Freelance / Contrat</Select.Option>
                            <Select.Option value="Internship">Stage</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="Statut de l'offre" name="status" initialValue="PUBLISHED">
                        <Select>
                            <Select.Option value="PUBLISHED">Publiée (Visible sur la page carrière)</Select.Option>
                            <Select.Option value="DRAFT">Brouillon</Select.Option>
                            <Select.Option value="CLOSED">Fermée</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Enregistrer et Suivant
                        </Button>
                    </Form.Item>
                </Form>
            )}

            {currentStep === 1 && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Title level={4}>Générer des questions avec l'IA</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                        L'IA génère un mix : environ 50 % de QCM et le reste en réponses courtes et cas pratiques, adaptés au poste.
                    </Text>
                    <Space size="large">
                        <Button onClick={() => setCurrentStep(2)}>Ignorer (Ajout manuel plus tard)</Button>
                        <Button type="primary" onClick={handleGenerateAI} loading={loading}>
                            Générer avec l'IA
                        </Button>
                    </Space>
                </div>
            )}

            {currentStep === 2 && (
                <div>
                    <Title level={4}>Aperçu des Questions</Title>
                    {generatedQuestions.length === 0 ? (
                        <Text type="secondary">Aucune question générée.</Text>
                    ) : (
                        <List
                            itemLayout="vertical"
                            dataSource={generatedQuestions}
                            renderItem={(q, index) => (
                                <List.Item>
                                    <div>
                                        <Tag color={q.type === 'QCM' ? 'blue' : q.type === 'PROBLEM' ? 'purple' : 'orange'}>{q.type || 'QCM'}</Tag>
                                        <Text strong style={{ marginLeft: 8 }}>{index + 1}. {q.prompt}</Text>
                                    </div>
                                    {q.type === 'QCM' && q.options?.length > 0 && (
                                        <div style={{ marginTop: 8 }}>
                                            {q.options.map((opt, i) => (
                                                <Tag key={i} color={opt === q.correctAnswer ? 'success' : 'default'} style={{ marginBottom: 4 }}>
                                                    {opt}
                                                </Tag>
                                            ))}
                                        </div>
                                    )}
                                </List.Item>
                            )}
                        />
                    )}
                    <Divider />
                    <Button type="primary" onClick={finishCreation} block>
                        Terminer et revenir à la liste
                    </Button>
                </div>
            )}
        </Card>
    );
}

export default CreateTest;
