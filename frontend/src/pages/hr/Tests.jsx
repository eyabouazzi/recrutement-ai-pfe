import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import {
  Button,
  Input,
  Select,
  Tag,
  Empty,
  Spin,
  Tooltip,
  Space,
  Typography,
  Modal,
  App,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  BookOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteTest, getTests } from '../../api/tests';
import { AuthContext } from '../../contexts/authContext.jsx';

const { Title, Text, Paragraph } = Typography;

const STATUS = {
  PUBLISHED: { label: 'Publiée', color: 'success' },
  DRAFT: { label: 'Brouillon', color: 'warning' },
  CLOSED: { label: 'Fermée', color: 'default' },
};

function statusOf(s) {
  const u = String(s || '').toUpperCase();
  return STATUS[u] || { label: u || '—', color: 'default' };
}

export default function Tests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { user } = useContext(AuthContext);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTests();
      setTests(Array.isArray(data.tests) ? data.tests : []);
    } catch (err) {
      message.error(`Chargement : ${err.message || 'Impossible de récupérer les offres'}`);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tests.filter((t) => {
      if (statusFilter !== 'ALL' && String(t.status || '').toUpperCase() !== statusFilter) return false;
      if (!q) return true;
      const blob = `${t.title || ''} ${t.jobRole || ''} ${t.location || ''} ${t.description || ''}`.toLowerCase();
      return blob.includes(q);
    });
  }, [tests, query, statusFilter]);

  const stats = useMemo(() => {
    const pub = tests.filter((t) => String(t.status).toUpperCase() === 'PUBLISHED').length;
    const draft = tests.filter((t) => String(t.status).toUpperCase() === 'DRAFT').length;
    const questions = tests.reduce((acc, t) => acc + (Number(t.questionCount) || 0), 0);
    return { pub, draft, total: tests.length, questions };
  }, [tests]);

  const handleDelete = async (record) => {
    try {
      await deleteTest(record._id);
      setTests((prev) => prev.filter((item) => item._id !== record._id));
      message.success('Offre supprimée');
    } catch (err) {
      message.error(`Suppression : ${err.message || 'Impossible de supprimer'}`);
    }
  };

  const confirmDelete = (record) => {
    Modal.confirm({
      title: 'Supprimer cette offre ?',
      content: `Cette action est irréversible : ${record.title}`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: () => handleDelete(record),
    });
  };

  return (
    <div className="hr-tests-page" style={page.wrap}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={page.hero}
      >
        <div style={page.heroTop}>
          <div>
            <Text style={page.kicker}>Portail RH</Text>
            <Title level={2} style={page.title}>
              Offres &amp; tests
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0, maxWidth: 620 }}>
              Liste alignée sur la base MongoDB : vos offres et, si votre compte est rattaché à une entreprise, celles
              créées par les autres RH de la même équipe. Ouvrez la{' '}
              <Link to="/rh/question-bank" style={page.link}>
                banque de questions
              </Link>{' '}
              pour réinjecter des items dans une offre en un clic.
            </Paragraph>
          </div>
          <Space wrap>
            <Tooltip title="Rafraîchir depuis le serveur">
              <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
                Actualiser
              </Button>
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => navigate('/rh/tests/create')}>
              Nouvelle offre
            </Button>
          </Space>
        </div>

        <div style={page.statStrip}>
          <div style={page.statCell}>
            <span style={page.statVal}>{stats.total}</span>
            <span style={page.statLbl}>offres</span>
          </div>
          <div style={page.statCell}>
            <span style={page.statVal}>{stats.pub}</span>
            <span style={page.statLbl}>publiées</span>
          </div>
          <div style={page.statCell}>
            <span style={page.statVal}>{stats.draft}</span>
            <span style={page.statLbl}>brouillons</span>
          </div>
          <div style={page.statCell}>
            <span style={page.statVal}>{stats.questions}</span>
            <span style={page.statLbl}>questions posées</span>
          </div>
        </div>
      </motion.div>

      <div style={page.toolbar}>
        <Input
          allowClear
          size="large"
          prefix={<SearchOutlined style={{ color: 'var(--wow-sub, #83796d)' }} />}
          placeholder="Rechercher par titre, poste, lieu…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 420, borderRadius: 14 }}
        />
        <Select
          size="large"
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ minWidth: 160, borderRadius: 14 }}
          options={[
            { value: 'ALL', label: 'Tous statuts' },
            { value: 'PUBLISHED', label: 'Publiées' },
            { value: 'DRAFT', label: 'Brouillons' },
            { value: 'CLOSED', label: 'Fermées' },
          ]}
        />
      </div>

      {loading && !tests.length ? (
        <div style={page.center}>
          <Spin size="large" />
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            tests.length === 0
              ? "Aucune offre pour l'instant — créez votre premier test."
              : 'Aucun résultat pour ces filtres.'
          }
        >
          {tests.length === 0 && (
            <Button type="primary" onClick={() => navigate('/rh/tests/create')}>
              Créer une offre
            </Button>
          )}
        </Empty>
      ) : (
        <div style={page.grid}>
          <AnimatePresence mode="popLayout">
            {filtered.map((t, i) => {
              const st = statusOf(t.status);
              const qc = Number(t.questionCount) || 0;
              const creatorId = t.createdBy && typeof t.createdBy === 'object' ? t.createdBy._id : t.createdBy;
              const isMine = !creatorId || !user?._id || String(creatorId) === String(user._id);
              return (
                <motion.div
                  key={t._id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: Math.min(i * 0.04, 0.35), duration: 0.3 }}
                  style={page.card}
                >
                  <div style={page.cardHead}>
                    <div style={{ minWidth: 0 }}>
                      <Text strong ellipsis style={{ fontSize: 17, display: 'block', color: 'var(--wow-ink, #2b241b)' }}>
                        {t.title}
                      </Text>
                      <Text type="secondary" ellipsis style={{ fontSize: 13 }}>
                        {t.jobRole}
                      </Text>
                    </div>
                    <Space size={6} wrap style={{ justifyContent: 'flex-end' }}>
                      {!isMine ? (
                        <Tooltip title={t.createdBy?.firstName || t.createdBy?.lastName ? `Créé par ${[t.createdBy?.firstName, t.createdBy?.lastName].filter(Boolean).join(' ')}` : 'Créé par un collègue RH'}>
                          <Tag bordered={false} style={{ background: 'rgba(95, 111, 99, 0.12)', margin: 0 }}>
                            Équipe
                          </Tag>
                        </Tooltip>
                      ) : null}
                      <Tag color={st.color}>{st.label}</Tag>
                    </Space>
                  </div>

                  <div style={page.metaRow}>
                    <span style={page.metaItem}>
                      <EnvironmentOutlined /> {t.location || 'Remote'}
                    </span>
                    <span style={page.metaItem}>
                      <ClockCircleOutlined /> {t.timeLimit ?? 30} min
                    </span>
                    <span style={page.metaItem}>
                      <QuestionCircleOutlined />
                      <strong style={{ color: 'var(--wow-ink, #2b241b)', marginLeft: 4 }}>{qc}</strong>
                      <span style={{ marginLeft: 4 }}>question{qc !== 1 ? 's' : ''}</span>
                    </span>
                  </div>

                  {t.description ? (
                    <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ fontSize: 13, marginBottom: 0 }}>
                      {t.description}
                    </Paragraph>
                  ) : null}

                  <div style={page.cardActions}>
                    <Tooltip title="Modifier l'offre et ses questions">
                      <Button type="primary" ghost icon={<EditOutlined />} onClick={() => navigate(`/rh/tests/edit/${t._id}`)}>
                        Éditer
                      </Button>
                    </Tooltip>
                    <Link to={`/rh/question-bank?testId=${encodeURIComponent(t._id)}`}>
                      <Button icon={<BookOutlined />}>Banque</Button>
                    </Link>
                    {isMine ? (
                      <Button danger type="text" icon={<DeleteOutlined />} onClick={() => confirmDelete(t)}>
                        Supprimer
                      </Button>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

const page = {
  wrap: { padding: '8px 0 40px', maxWidth: 1180, margin: '0 auto' },
  hero: {
    marginBottom: 28,
    padding: '26px 28px',
    borderRadius: 22,
    background: 'linear-gradient(125deg, rgba(183, 154, 106, 0.2), rgba(255, 253, 249, 0.95) 55%, rgba(95, 111, 99, 0.12))',
    border: '1px solid var(--wow-border, #ddd1bf)',
    boxShadow: 'var(--wow-shadow, 0 18px 38px rgba(64, 49, 28, 0.08))',
  },
  heroTop: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontSize: 11,
    fontWeight: 800,
    color: 'var(--wow-primary-a, #8a6a3d)',
  },
  title: { margin: '6px 0 10px', color: 'var(--wow-ink, #2b241b)', fontWeight: 800 },
  link: { fontWeight: 700, color: 'var(--wow-primary-a, #8a6a3d)' },
  statStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
  },
  statCell: {
    background: 'var(--wow-card, #fffdf9)',
    border: '1px solid var(--wow-border, #ddd1bf)',
    borderRadius: 16,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  statVal: { fontSize: 22, fontWeight: 800, color: 'var(--wow-ink, #2b241b)', fontFamily: "'Sora', sans-serif" },
  statLbl: { fontSize: 12, color: 'var(--wow-sub, #83796d)', fontWeight: 600 },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 22,
    alignItems: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 18,
  },
  card: {
    borderRadius: 20,
    padding: '20px 20px 16px',
    background: 'var(--wow-card, #fffdf9)',
    border: '1px solid var(--wow-border, #ddd1bf)',
    boxShadow: 'var(--wow-shadow, 0 18px 38px rgba(64, 49, 28, 0.08))',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    minHeight: 220,
  },
  cardHead: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px 16px',
    fontSize: 13,
    color: 'var(--wow-sub, #83796d)',
  },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: 6 },
  cardActions: {
    marginTop: 'auto',
    paddingTop: 8,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    borderTop: '1px dashed rgba(221, 209, 191, 0.85)',
  },
  center: { display: 'flex', justifyContent: 'center', padding: 80 },
};
