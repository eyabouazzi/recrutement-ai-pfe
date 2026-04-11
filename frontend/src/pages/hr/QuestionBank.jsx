import { useEffect, useState } from 'react';
import { Card, Table, Button, Form, Input, Select, message, Typography, Space, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { listQuestionBank, createQuestionBankItem, deleteBankQuestion, clearQuestionBank } from '../../api/tests';

const { Title, Text } = Typography;

export default function QuestionBank() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [form] = Form.useForm();

    const load = async () => {
        try {
            setLoading(true);
            const data = await listQuestionBank();
            setItems(data.items || []);
        } catch (e) {
            message.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const onCreate = async (values) => {
        try {
            setSaving(true);
            await createQuestionBankItem({
                title: values.title || '',
                tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
                type: values.type,
                prompt: values.prompt,
                options:
                    values.type === 'QCM'
                        ? [values.opt1, values.opt2, values.opt3, values.opt4].filter(Boolean)
                        : undefined,
                correctAnswer: values.type === 'QCM' ? values.correctAnswer : undefined,
            });
            form.resetFields();
            message.success('Question enregistrée dans la banque');
            load();
        } catch (e) {
            message.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async (id) => {
        try {
            await deleteBankQuestion(id);
            message.success('Supprimé');
            load();
        } catch (e) {
            message.error(e.message);
        }
    };

    const onClearAll = async () => {
        try {
            setClearing(true);
            await clearQuestionBank();
            message.success('Banque vidée');
            load();
        } catch (e) {
            message.error(e.message);
        } finally {
            setClearing(false);
        }
    };

    return (
        <div>
            <Title level={3}>Banque de questions</Title>
            <Text type="secondary">Réutilisez des questions sur plusieurs offres (ajout depuis la gestion de test).</Text>

            <Card title="Nouvelle entrée" style={{ marginTop: 24, maxWidth: 720 }}>
                <Form form={form} layout="vertical" onFinish={onCreate} initialValues={{ type: 'QCM' }}>
                    <Form.Item name="title" label="Titre court (optionnel)">
                        <Input placeholder="ex: Node — streams" />
                    </Form.Item>
                    <Form.Item name="tags" label="Tags (séparés par des virgules)">
                        <Input placeholder="backend, node, senior" />
                    </Form.Item>
                    <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="QCM">QCM</Select.Option>
                            <Select.Option value="SHORT_ANSWER">Rédaction courte</Select.Option>
                            <Select.Option value="PROBLEM">Cas pratique</Select.Option>
                            <Select.Option value="TEXT">Texte libre</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="prompt" label="Énoncé" rules={[{ required: true }]}>
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate={(p, c) => p.type !== c.type}>
                        {({ getFieldValue }) =>
                            getFieldValue('type') === 'QCM' ? (
                                <>
                                    <Space wrap style={{ width: '100%' }}>
                                        <Form.Item name="opt1" label="A" rules={[{ required: true }]}>
                                            <Input />
                                        </Form.Item>
                                        <Form.Item name="opt2" label="B" rules={[{ required: true }]}>
                                            <Input />
                                        </Form.Item>
                                    </Space>
                                    <Space wrap style={{ width: '100%' }}>
                                        <Form.Item name="opt3" label="C">
                                            <Input />
                                        </Form.Item>
                                        <Form.Item name="opt4" label="D">
                                            <Input />
                                        </Form.Item>
                                    </Space>
                                    <Form.Item name="correctAnswer" label="Bonne réponse (texte exact)" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                </>
                            ) : null
                        }
                    </Form.Item>
                    <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={saving}>
                        Ajouter à la banque
                    </Button>
                </Form>
            </Card>

            <Card
                title={`Entrées (${items.length})`}
                style={{ marginTop: 24 }}
                extra={
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={load}>Rafraîchir</Button>
                        <Button
                            danger
                            loading={clearing}
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Vider la banque de questions ?',
                                    content: 'Cette action supprime toutes les entrées. Vous ne pourrez pas annuler.',
                                    okText: 'Vider',
                                    cancelText: 'Annuler',
                                    onOk: onClearAll,
                                });
                            }}
                        >
                            Vider la banque
                        </Button>
                    </Space>
                }
            >
                <Table
                    loading={loading}
                    rowKey="_id"
                    dataSource={items}
                    columns={[
                        { title: 'Type', dataIndex: 'type', width: 100 },
                        { title: 'Tags', dataIndex: 'tags', render: (t) => (t || []).join(', ') },
                        { title: 'Énoncé', dataIndex: 'prompt', ellipsis: true },
                        {
                            title: '',
                            key: 'd',
                            width: 100,
                            render: (_, row) => (
                                <Button danger size="small" icon={<DeleteOutlined />} onClick={() => onDelete(row._id)}>
                                    Supprimer
                                </Button>
                            ),
                        },
                    ]}
                />
            </Card>
        </div>
    );
}
