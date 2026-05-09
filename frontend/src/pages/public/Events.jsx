import { useContext, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Empty, Row, Select, Spin, Tag, Typography, message } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, GlobalOutlined, UserOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getEvents, registerToEvent } from '../../api/event';
import { AuthContext } from '../../contexts/authContext';
import '../../styles/public-showcase.css';

const { Title, Paragraph, Text } = Typography;

const EVENT_LABELS = {
  job_fair: { color: 'magenta', label: 'Forum Emploi' },
  webinar: { color: 'blue', label: 'Webinaire' },
  workshop: { color: 'orange', label: 'Atelier' },
  hackathon: { color: 'green', label: 'Hackathon' },
  networking: { color: 'purple', label: 'Networking' },
};

export default function Events() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [upcoming, setUpcoming] = useState('true');

  const loadEvents = async () => {
    setLoading(true);
    const res = await getEvents({
      page: 1,
      limit: 40,
      type: type === 'all' ? '' : type,
      upcoming,
    });
    setEvents(Array.isArray(res?.events) ? res.events : []);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, [type, upcoming]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events]
  );

  const onRegister = async (eventId) => {
    if (!token) {
      message.warning('Connectez-vous pour vous inscrire.');
      navigate('/login');
      return;
    }
    const res = await registerToEvent(eventId);
    if (res?.status) {
      message.success('Inscription confirmée.');
      loadEvents();
      return;
    }
    message.error(res?.message || 'Inscription impossible');
  };

  return (
    <div className="showcase-page" style={{ maxWidth: 1100 }}>
      <motion.section className="showcase-hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <span className="showcase-eyebrow"><Sparkles size={14} /> Live moments</span>
        <Title style={{ marginTop: 10, marginBottom: 8 }}>Rencontres, webinaires et sessions carrière</Title>
        <Paragraph type="secondary" style={{ maxWidth: 760, marginBottom: 18 }}>
          Calendrier interactif alimenté depuis la base de données, avec inscription en 1 clic.
        </Paragraph>
        <Row gutter={[12, 12]} className="showcase-toolbar">
          <Col xs={24} sm={12}>
            <Select
              size="large"
              value={upcoming}
              onChange={setUpcoming}
              style={{ width: '100%' }}
              options={[
                { value: 'true', label: 'Événements à venir' },
                { value: 'false', label: 'Tous les événements' },
              ]}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Select
              size="large"
              value={type}
              onChange={setType}
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: 'Tous les types' },
                { value: 'job_fair', label: 'Forum emploi' },
                { value: 'webinar', label: 'Webinaire' },
                { value: 'workshop', label: 'Atelier' },
                { value: 'hackathon', label: 'Hackathon' },
              ]}
            />
          </Col>
        </Row>
      </motion.section>

      <div style={{ marginTop: 22, marginBottom: 14 }}>
        <Text strong>{sortedEvents.length} événement{sortedEvents.length > 1 ? 's' : ''}</Text>
      </div>

      {loading ? (
        <div style={{ padding: 70, textAlign: 'center' }}><Spin size="large" /></div>
      ) : sortedEvents.length === 0 ? (
        <Empty description="Aucun événement disponible actuellement." style={{ padding: '60px 0' }} />
      ) : (
        <Row gutter={[16, 16]}>
          {sortedEvents.map((evt) => {
            const date = new Date(evt.date);
            const typeData = EVENT_LABELS[evt.type] || { color: 'default', label: evt.type || 'Événement' };
            const isPast = date < new Date();
            const isFull = evt.maxAttendees > 0 && (evt.attendees?.length || 0) >= evt.maxAttendees;
            return (
              <Col xs={24} md={12} key={evt._id}>
                <Card hoverable className="showcase-card">
                  <Tag color={typeData.color} className="showcase-pill">{typeData.label}</Tag>
                  <Title level={5} style={{ marginTop: 10, marginBottom: 8 }}>{evt.title}</Title>
                  <Paragraph type="secondary" ellipsis={{ rows: 2 }}>{evt.description}</Paragraph>
                  <div className="showcase-meta">
                    <Text type="secondary"><CalendarOutlined /> {date.toLocaleDateString('fr-FR')}</Text>
                    <Text type="secondary"><ClockCircleOutlined /> {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                    <Text type="secondary">
                      {evt.isOnline ? <GlobalOutlined /> : <EnvironmentOutlined />} {evt.isOnline ? 'En ligne' : (evt.location || 'Sur site')}
                    </Text>
                    <Text type="secondary"><UserOutlined /> {evt.attendees?.length || 0} inscrits</Text>
                  </div>
                  <Button
                    type="primary"
                    block
                    disabled={isPast || isFull}
                    onClick={() => onRegister(evt._id)}
                  >
                    {isPast ? 'Terminé' : isFull ? 'Complet' : "S'inscrire"}
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}

