import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Radio, Typography, App as AntdApp, Card, Row, Col, Tag } from 'antd';
import { motion } from 'framer-motion';
import { Send, Building2, Mail, User, Sparkles, Clock3, ShieldCheck } from 'lucide-react';
import { submitLead } from '../api/contact';

const { Title, Paragraph, Text } = Typography;

const TYPES = [
  { value: 'demo', label: 'Planifier une démo', desc: 'Visite guidée de la plateforme' },
  { value: 'contact', label: 'Contact général', desc: 'Question commerciale ou support' },
];

const TRUST_POINTS = [
  { icon: <Clock3 size={16} />, text: 'Réponse sous 48h ouvrées' },
  { icon: <ShieldCheck size={16} />, text: 'Données traitées en sécurité' },
  { icon: <Sparkles size={16} />, text: 'Accompagnement personnalisé' },
];

export default function Contact() {
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const [searchParams] = useSearchParams();
  const initialType = useMemo(() => {
    const t = searchParams.get('type');
    return t === 'demo' || t === 'contact' ? t : 'demo';
  }, [searchParams]);

  useEffect(() => {
    form.setFieldsValue({ type: initialType });
  }, [form, initialType]);

  async function onFinish(values) {
    try {
      await submitLead({
        type: values.type,
        email: values.email.trim().toLowerCase(),
        name: values.name?.trim() || '',
        company: values.company?.trim() || '',
        message: values.message?.trim() || '',
      });
      message.success('Message envoyé. Notre équipe vous revient très vite.');
      form.resetFields();
      form.setFieldsValue({ type: values.type });
    } catch (e) {
      message.error(e.message || 'Erreur');
    }
  }

  return (
    <div className="wow-public-page" style={{ maxWidth: 1150, margin: '0 auto', padding: '28px 24px 64px' }}>
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="pub-modern-hero">
        <Tag color="gold">Contact</Tag>
        <Title style={{ marginTop: 10, marginBottom: 8 }}>Parlons de vos besoins recrutement</Title>
        <Paragraph type="secondary" style={{ maxWidth: 760, marginBottom: 18 }}>
          Décrivez votre contexte RH et vos objectifs. Nous vous aidons à déployer un flux plus rapide et plus fiable.
        </Paragraph>
        <Row gutter={[10, 10]}>
          {TRUST_POINTS.map((point) => (
            <Col xs={24} sm={8} key={point.text}>
              <Card size="small" style={{ borderRadius: 12 }}>
                <Text type="secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {point.icon} {point.text}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </motion.section>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginTop: 16 }}>
        <Card style={{ borderRadius: 18 }}>
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{ type: initialType }}
            onFinish={onFinish}
          >
            <Form.Item name="type" label="Objet" rules={[{ required: true }]}>
              <Radio.Group optionType="button" buttonStyle="solid">
                {TYPES.map((o) => (
                  <Radio.Button key={o.value} value={o.value}>
                    <strong>{o.label}</strong> - <span>{o.desc}</span>
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item name="name" label="Nom / prénom">
                  <Input size="large" prefix={<User size={16} strokeWidth={2} />} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="E-mail professionnel"
                  rules={[
                    { required: true, message: 'E-mail requis' },
                    { type: 'email', message: 'E-mail invalide' },
                  ]}
                >
                  <Input size="large" placeholder="vous@entreprise.com" prefix={<Mail size={16} strokeWidth={2} />} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="company" label="Entreprise (optionnel)">
              <Input size="large" placeholder="Votre société" prefix={<Building2 size={16} strokeWidth={2} />} />
            </Form.Item>

            <Form.Item
              name="message"
              label="Message"
              rules={[
                { required: true, message: 'Message requis' },
                { min: 10, message: 'Au moins 10 caractères' },
              ]}
            >
              <Input.TextArea rows={6} placeholder="Décrivez vos objectifs, votre volume de recrutement et vos besoins..." showCount maxLength={5000} />
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" icon={<Send size={16} />}>
              Envoyer la demande
            </Button>
          </Form>
        </Card>
      </motion.div>
    </div>
  );
}

