import { Form, Input, Button, Switch, Card, Typography, message, InputNumber } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title } = Typography;

function Settings() {
    const [form] = Form.useForm();

    const onFinish = (values) => {
        console.log('Success:', values);
        message.success('Paramètres sauvegardés avec succès! (Simulation)');
    };

    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>Paramètres & Scoring</Title>

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
                        passingScore: 50
                    }}
                >
                    <Form.Item
                        label="Activer la correction automatique par l'IA"
                        name="enableAIValidation"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Form.Item
                        label="Niveau de sévérité de l'IA (1 à 10)"
                        name="aiStrictness"
                        rules={[{ required: true, message: 'Veuillez renseigner ce champ' }]}
                    >
                        <InputNumber min={1} max={10} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="Score minimal de réussite par défaut (%)"
                        name="passingScore"
                    >
                        <InputNumber min={0} max={100} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="Durée par défaut d'un test (minutes)"
                        name="defaultTestDuration"
                    >
                        <InputNumber min={5} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="Autoriser les candidats à repasser les tests"
                        name="allowRetakes"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                            Enregistrer les paramètres
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}

export default Settings;
