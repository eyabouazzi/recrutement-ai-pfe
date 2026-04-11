import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Radio, Typography, App as AntdApp } from 'antd';
import { motion } from 'framer-motion';
import { Send, Building2, Mail, User } from 'lucide-react';
import { submitLead } from '../api/contact';

const { Title, Paragraph } = Typography;

const TYPES = [
  { value: 'demo', label: 'Planifier une démo', desc: 'Visite guidée de la plateforme' },
  { value: 'contact', label: 'Contact général', desc: 'Question commerciale ou support' },
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
      message.success('Envoyé ! Merci pour votre confiance.');
      form.resetFields();
      form.setFieldsValue({ type: values.type });
    } catch (e) {
      message.error(e.message || 'Erreur');
    }
  }

  return (
    <div className="contact-page">
      <motion.div
        className="contact-inner"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="contact-head">
          <Title level={1} className="contact-title">
            Parlons de votre recrutement
          </Title>
          <Paragraph className="contact-lead">
            Décrivez votre contexte : nous vous répondons sous 2 jours ouvrés (ou plus vite pour une démo).
          </Paragraph>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ type: initialType }}
          onFinish={onFinish}
          className="contact-form"
        >
          <Form.Item name="type" label="Objet" rules={[{ required: true }]}>
            <Radio.Group optionType="button" buttonStyle="solid" className="contact-type-radio">
              {TYPES.map((o) => (
                <Radio.Button key={o.value} value={o.value}>
                  <strong>{o.label}</strong>
                  <span className="contact-type-desc">{o.desc}</span>
                </Radio.Button>
              ))}
            </Radio.Group>
          </Form.Item>

          <Form.Item name="name" label="Nom / prénom">
            <Input size="large" prefix={<User size={16} strokeWidth={2} />} />
          </Form.Item>

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
            <Input.TextArea rows={5} placeholder="Taille de l’équipe RH, besoins, outils actuels…" showCount maxLength={5000} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block icon={<Send size={16} />} className="contact-submit">
              Envoyer
            </Button>
          </Form.Item>
        </Form>
      </motion.div>
    </div>
  );
}
