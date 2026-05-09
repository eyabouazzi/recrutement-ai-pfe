import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  message,
  Typography,
  Space,
  Modal,
  Tag,
  Empty,
  Spin,
  Segmented,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  LinkOutlined,
  FilterOutlined,
  RocketOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  listQuestionBank,
  createQuestionBankItem,
  deleteBankQuestion,
  clearQuestionBank,
  attachBankQuestion,
  getTests,
} from '../../api/tests';

const { Title, Text, Paragraph } = Typography;

const TYPE_META = {
  QCM: { label: 'QCM', hue: '#8a6a3d' },
  SHORT_ANSWER: { label: 'Court', hue: '#5f6f63' },
  PROBLEM: { label: 'Cas', hue: '#b38746' },
  TEXT: { label: 'Texte', hue: '#a86b54' },
};

function useDebounced(value, ms = 280) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function QuestionBank() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const testIdFromUrl = searchParams.get('testId') || '';

  const [items, setItems] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [attachId, setAttachId] = useState(null);
  const [attachTarget, setAttachTarget] = useState(testIdFromUrl);
  const [attachingId, setAttachingId] = useState(null);
  const [tagFilter, setTagFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 240);

  const [form] = Form.useForm();

  const setTestContext = useCallback(
    (id) => {
      const next = new URLSearchParams(searchParams);
      if (id) next.set('testId', id);
      else next.delete('testId');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const loadBank = async () => {
    const data = await listQuestionBank();
    setItems(Array.isArray(data.items) ? data.items : []);
  };

  const loadTests = async () => {
    const data = await getTests();
    setTests(Array.isArray(data.tests) ? data.tests : []);
  };

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadBank(), loadTests()]);
    } catch (e) {
      message.error(e.message || 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    setAttachTarget(testIdFromUrl);
  }, [testIdFromUrl]);

  const activeTest = useMemo(
    () => tests.find((t) => String(t._id) === String(testIdFromUrl)),
    [tests, testIdFromUrl],
  );

  const allTags = useMemo(() => {
    const s = new Set();
    items.forEach((it) => {
      (it.tags || []).forEach((x) => {
        const v = String(x || '').trim();
        if (v) s.add(v);
      });
    });
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return items.filter((it) => {
      if (typeFilter !== 'ALL' && String(it.type) !== typeFilter) return false;
      if (tagFilter !== 'ALL' && !(it.tags || []).includes(tagFilter)) return false;
      if (!q) return true;
      const blob = `${it.title || ''} ${it.prompt || ''} ${(it.tags || []).join(' ')}`.toLowerCase();
      return blob.includes(q);
    });
  }, [items, debouncedSearch, tagFilter, typeFilter]);

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
      await loadBank();
    } catch (e) {
      message.error(e.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    try {
      await deleteBankQuestion(id);
      message.success('Supprimé');
      await loadBank();
    } catch (e) {
      message.error(e.message || 'Erreur');
    }
  };

  const onClearAll = async () => {
    try {
      setClearing(true);
      await clearQuestionBank();
      message.success('Banque vidée');
      await loadBank();
    } catch (e) {
      message.error(e.message || 'Erreur');
    } finally {
      setClearing(false);
    }
  };

  const runAttach = async (bankId, testId) => {
    if (!testId) {
      message.warning('Choisissez une offre cible');
      return;
    }
    try {
      setAttachingId(String(bankId));
      await attachBankQuestion(bankId, testId);
      message.success('Question ajoutée au questionnaire du test');
      setAttachId(null);
      await loadTests();
    } catch (e) {
      message.error(e.message || 'Attache impossible');
    } finally {
      setAttachingId(null);
    }
  };

  const openAttach = (bankId) => {
    setAttachId(bankId);
    setAttachTarget(testIdFromUrl || (tests[0] && String(tests[0]._id)) || '');
  };

  return (
    <div style={S.page}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={S.hero}>
        <div style={S.heroRow}>
          <div>
            <Text style={S.kicker}>Bibliothèque vivante</Text>
            <Title level={2} style={S.title}>
              Banque de questions
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0, maxWidth: 640 }}>
              Créez des modèles réutilisables, filtrez par tags, puis injectez-les dans une offre. Depuis{' '}
              <Link to="/rh/tests" style={S.a}>
                Offres &amp; tests
              </Link>
              , le bouton « Banque » pré-remplit l&apos;offre cible ici.
            </Paragraph>
          </div>
          <Space wrap align="start">
            <Link to="/rh/tests">
              <Button size="large" icon={<ApartmentOutlined />}>
                Mes offres
              </Button>
            </Link>
            <Button size="large" icon={<ReloadOutlined />} onClick={loadAll} loading={loading}>
              Sync
            </Button>
          </Space>
        </div>

        {tests.length > 0 && (
          <div style={S.contextBar}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>
                Offre cible pour les attachements rapides
              </Text>
              <div style={{ marginTop: 8 }}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Choisir une offre…"
                  style={{ width: '100%', maxWidth: 420 }}
                  size="large"
                  value={testIdFromUrl || undefined}
                  onChange={(v) => setTestContext(v)}
                  options={tests.map((t) => ({
                    value: String(t._id),
                    label: `${t.title} — ${t.jobRole || 'poste'}`,
                  }))}
                  allowClear
                  onClear={() => setTestContext('')}
                />
              </div>
            </div>
            {activeTest ? (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                style={S.contextPill}
              >
                <RocketOutlined style={{ color: 'var(--wow-primary-a, #8a6a3d)' }} />
                <span>
                  Les actions « Attacher » iront vers <Text strong>{activeTest.title}</Text>
                </span>
                <Button type="link" size="small" onClick={() => navigate(`/rh/tests/edit/${activeTest._id}`)}>
                  Éditer le test
                </Button>
              </motion.div>
            ) : (
              <div style={S.hintMuted}>
                <LinkOutlined /> Sélectionnez une offre pour enchaîner sans modal.
              </div>
            )}
          </div>
        )}
      </motion.div>

      <div style={S.split}>
        <Card style={S.composer} title={null} variant="borderless">
          <div style={S.composerHead}>
            <PlusOutlined style={{ fontSize: 18, color: 'var(--wow-primary-a, #8a6a3d)' }} />
            <div>
              <Text strong style={{ fontSize: 16 }}>Nouvelle question</Text>
              <div style={{ fontSize: 12, color: 'var(--wow-sub, #83796d)' }}>Ajout immédiat en base</div>
            </div>
          </div>
          <Form form={form} layout="vertical" onFinish={onCreate} initialValues={{ type: 'QCM' }} style={{ marginTop: 8 }}>
            <Form.Item name="title" label="Titre interne (optionnel)">
              <Input placeholder="ex. Streams Node.js" />
            </Form.Item>
            <Form.Item name="tags" label="Tags (virgules)">
              <Input placeholder="backend, senior, node" />
            </Form.Item>
            <Form.Item name="type" label="Type" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'QCM', label: 'QCM' },
                  { value: 'SHORT_ANSWER', label: 'Réponse courte' },
                  { value: 'PROBLEM', label: 'Cas pratique' },
                  { value: 'TEXT', label: 'Texte libre' },
                ]}
              />
            </Form.Item>
            <Form.Item name="prompt" label="Énoncé" rules={[{ required: true }]}>
              <Input.TextArea rows={5} placeholder="Rédigez l'énoncé visible par le candidat…" />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(p, c) => p.type !== c.type}>
              {({ getFieldValue }) =>
                getFieldValue('type') === 'QCM' ? (
                  <>
                    <Space wrap style={{ width: '100%' }}>
                      <Form.Item name="opt1" label="A" rules={[{ required: true }]} style={{ minWidth: 140 }}>
                        <Input />
                      </Form.Item>
                      <Form.Item name="opt2" label="B" rules={[{ required: true }]} style={{ minWidth: 140 }}>
                        <Input />
                      </Form.Item>
                    </Space>
                    <Space wrap style={{ width: '100%' }}>
                      <Form.Item name="opt3" label="C" style={{ minWidth: 140 }}>
                        <Input />
                      </Form.Item>
                      <Form.Item name="opt4" label="D" style={{ minWidth: 140 }}>
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
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={saving} block size="large">
              Enregistrer dans la banque
            </Button>
          </Form>
        </Card>

        <div style={S.galleryCol}>
          <div style={S.galleryToolbar}>
            <Input
              allowClear
              size="large"
              prefix={<FilterOutlined style={{ color: 'var(--wow-sub)' }} />}
              placeholder="Filtrer énoncés et titres…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200, borderRadius: 14 }}
            />
            <Segmented
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { label: 'Tous types', value: 'ALL' },
                { label: 'QCM', value: 'QCM' },
                { label: 'Cas', value: 'PROBLEM' },
                { label: 'Court', value: 'SHORT_ANSWER' },
                { label: 'Texte', value: 'TEXT' },
              ]}
            />
          </div>
          <div style={S.tagScroller}>
            <Tag.CheckableTag
              checked={tagFilter === 'ALL'}
              onChange={(checked) => {
                if (checked) setTagFilter('ALL');
              }}
              style={S.tagMaster}
            >
              Tous tags
            </Tag.CheckableTag>
            {allTags.map((tg) => (
              <Tag.CheckableTag
                key={tg}
                checked={tagFilter === tg}
                onChange={(checked) => setTagFilter(checked ? tg : 'ALL')}
                style={{ marginBottom: 6 }}
              >
                {tg}
              </Tag.CheckableTag>
            ))}
          </div>

          <div style={S.galleryHead}>
            <Text strong>{filtered.length}</Text>
            <Text type="secondary"> entrée(s) affichée(s)</Text>
            <div style={{ flex: 1 }} />
            <Button
              danger
              type="text"
              loading={clearing}
              onClick={() => {
                Modal.confirm({
                  title: 'Vider toute la banque ?',
                  content: 'Supprime toutes vos entrées réutilisables.',
                  okText: 'Vider',
                  okType: 'danger',
                  cancelText: 'Annuler',
                  onOk: onClearAll,
                });
              }}
            >
              Tout supprimer
            </Button>
          </div>

          {loading ? (
            <div style={S.center}><Spin size="large" /></div>
          ) : filtered.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucune question ne correspond." />
          ) : (
            <div style={S.masonry}>
              <AnimatePresence mode="popLayout">
                {filtered.map((it, idx) => {
                  const meta = TYPE_META[it.type] || { label: it.type, hue: '#888' };
                  return (
                    <motion.div
                      key={it._id}
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: Math.min(idx * 0.03, 0.25) }}
                      style={S.qCard}
                    >
                      <div style={{ ...S.qStripe, background: meta.hue }} />
                      <div style={S.qBody}>
                        <div style={S.qTop}>
                          <Tag color={meta.hue}>{meta.label}</Tag>
                          <Space size={4} wrap>
                            {(it.tags || []).map((tg) => (
                              <Tag key={tg} bordered={false} style={{ background: 'rgba(183,154,106,0.12)' }}>
                                {tg}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                        {it.title ? (
                          <Text strong style={{ display: 'block', marginBottom: 6 }}>{it.title}</Text>
                        ) : null}
                        <Paragraph ellipsis={{ rows: 4 }} style={{ marginBottom: 12, fontSize: 13 }}>
                          {it.prompt}
                        </Paragraph>
                        <div style={S.qActions}>
                          <Button
                            type="primary"
                            onClick={() => {
                              if (testIdFromUrl) runAttach(it._id, testIdFromUrl);
                              else openAttach(it._id);
                            }}
                            loading={attachingId === String(it._id)}
                          >
                            Attacher au test
                          </Button>
                          <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(it._id)}>
                            Retirer
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <Modal
        title="Choisir l'offre cible"
        open={Boolean(attachId)}
        onCancel={() => !attachingId && setAttachId(null)}
        onOk={() => runAttach(attachId, attachTarget)}
        okText="Attacher"
        confirmLoading={Boolean(attachingId)}
        destroyOnClose
      >
        <Paragraph type="secondary">
          Une copie de la question sera ajoutée au questionnaire de l&apos;offre (les originaux restent dans la banque).
        </Paragraph>
        <Select
          showSearch
          optionFilterProp="label"
          style={{ width: '100%' }}
          size="large"
          value={attachTarget || undefined}
          onChange={setAttachTarget}
          placeholder="Sélectionner une offre"
          options={tests.map((t) => ({
            value: String(t._id),
            label: `${t.title} — ${t.jobRole || ''}`,
          }))}
        />
      </Modal>
    </div>
  );
}

const S = {
  page: { maxWidth: 1240, margin: '0 auto', padding: '8px 0 48px' },
  hero: {
    marginBottom: 22,
    padding: '24px 26px',
    borderRadius: 22,
    background: 'linear-gradient(118deg, rgba(95, 111, 99, 0.12), rgba(255, 253, 249, 0.96) 50%, rgba(183, 154, 106, 0.16))',
    border: '1px solid var(--wow-border, #ddd1bf)',
    boxShadow: 'var(--wow-shadow, 0 18px 38px rgba(64, 49, 28, 0.08))',
  },
  heroRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: 11,
    fontWeight: 800,
    color: 'var(--wow-primary-a, #8a6a3d)',
  },
  title: { margin: '6px 0 8px', color: 'var(--wow-ink, #2b241b)', fontWeight: 800 },
  a: { fontWeight: 700, color: 'var(--wow-primary-a, #8a6a3d)' },
  contextBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'flex-end',
    paddingTop: 8,
    borderTop: '1px dashed rgba(221, 209, 191, 0.9)',
  },
  contextPill: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderRadius: 16,
    background: 'var(--wow-card, #fffdf9)',
    border: '1px solid var(--wow-border, #ddd1bf)',
    maxWidth: 480,
    fontSize: 13,
  },
  hintMuted: {
    fontSize: 13,
    color: 'var(--wow-sub, #83796d)',
    alignSelf: 'center',
  },
  split: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: 22,
    alignItems: 'start',
  },
  composer: {
    borderRadius: 22,
    background: 'var(--wow-card, #fffdf9)',
    border: '1px solid var(--wow-border, #ddd1bf)',
    boxShadow: 'var(--wow-shadow, 0 18px 38px rgba(64, 49, 28, 0.08))',
    position: 'sticky',
    top: 12,
  },
  composerHead: { display: 'flex', gap: 12, alignItems: 'center' },
  galleryCol: { minWidth: 0 },
  galleryToolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  tagScroller: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    padding: '4px 0',
  },
  tagMaster: { marginBottom: 6, fontWeight: 700 },
  galleryHead: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  masonry: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 14,
  },
  qCard: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    display: 'flex',
    minHeight: 160,
    background: 'var(--wow-card, #fffdf9)',
    border: '1px solid var(--wow-border, #ddd1bf)',
    boxShadow: 'var(--wow-shadow, 0 12px 28px rgba(64, 49, 28, 0.06))',
  },
  qStripe: { width: 5, flexShrink: 0 },
  qBody: { padding: '14px 16px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  qTop: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 8 },
  qActions: { marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 8 },
  center: { display: 'flex', justifyContent: 'center', padding: 48 },
};
