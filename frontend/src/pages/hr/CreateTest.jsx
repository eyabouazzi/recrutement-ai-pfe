import { useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Button,
  message,
  Typography,
  Select,
  Switch,
} from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  BgColorsOutlined,
  CheckCircleFilled,
  BulbOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons';
import { createTest, generateAutoQuestions } from '../../api/tests';

const { Title, Text, Paragraph } = Typography;

const STEPS = [
  { id: 0, label: '01 — Brief', title: 'Identité', icon: NodeIndexOutlined, hue: '#8a6a3d' },
  { id: 1, label: '02 — Spark', title: 'IA', icon: ThunderboltOutlined, hue: '#5f6f63' },
  { id: 2, label: '03 — Lift', title: 'Lancement', icon: RocketOutlined, hue: '#b38746' },
];

const spring = { type: 'spring', stiffness: 380, damping: 28 };

export default function CreateTest() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [createdTestId, setCreatedTestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [aiCount, setAiCount] = useState(5);
  const [showAnti, setShowAnti] = useState(false);

  const handleCreateTest = async (values) => {
    try {
      setLoading(true);
      const data = await createTest(values);
      setCreatedTestId(data.test._id);
      message.success('Offre enregistrée — passez à la génération ou au lancement.');
      setCurrentStep(1);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    try {
      setLoading(true);
      message.loading({ content: 'L’IA compose votre batterie de questions…', key: 'ai-gen', duration: 0 });
      const data = await generateAutoQuestions(createdTestId, aiCount);
      setGeneratedQuestions(data.questions || []);
      message.success({ content: 'Questions prêtes.', key: 'ai-gen', duration: 2 });
      setCurrentStep(2);
    } catch (err) {
      message.error({ content: err.message, key: 'ai-gen', duration: 3 });
    } finally {
      setLoading(false);
    }
  };

  const finishCreation = () => {
    message.success('Parfait — direction vos offres.');
    navigate('/rh/tests');
  };

  const goEdit = () => {
    if (createdTestId) navigate(`/rh/tests/edit/${createdTestId}`);
    else navigate('/rh/tests');
  };

  return (
    <div className="create-test-studio" style={S.shell}>
      <div style={S.aurora} aria-hidden />
      <div style={S.gridDots} aria-hidden />

      <header style={S.header}>
        <Link to="/rh/tests" style={S.back}>
          <ArrowLeftOutlined /> Retour aux offres
        </Link>
        <div style={S.headerMid}>
          <Text style={S.kicker}>Studio de création</Text>
          <Title level={2} style={S.heroTitle}>
            Forger une{' '}
            <span style={S.heroGrad}>expérience d’évaluation</span>
          </Title>
          <Paragraph style={S.heroSub}>
            Trois temps — brief métier, étincelle IA, validation. Tout reste branché sur votre base comme avant.
          </Paragraph>
        </div>
      </header>

      <nav style={S.stepRail} aria-label="Étapes">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const active = currentStep === s.id;
          const done = currentStep > s.id;
          const stepDisabled = s.id > 0 && !createdTestId;
          return (
            <button
              key={s.id}
              type="button"
              style={{
                ...S.stepBtn,
                cursor: stepDisabled ? 'not-allowed' : 'pointer',
                opacity: stepDisabled ? 0.48 : 1,
              }}
              onClick={() => {
                if (stepDisabled) return;
                if (s.id === 0) setCurrentStep(0);
                if (s.id === 1 && createdTestId) setCurrentStep(1);
                if (s.id === 2 && createdTestId) setCurrentStep(2);
              }}
              disabled={stepDisabled}
            >
              <motion.div
                style={{
                  ...S.stepOrb,
                  borderColor: active || done ? s.hue : 'rgba(221,209,191,0.7)',
                  background: active ? `${s.hue}22` : done ? `${s.hue}14` : 'rgba(255,253,249,0.5)',
                  boxShadow: active ? `0 0 0 4px ${s.hue}22` : 'none',
                }}
                animate={{ scale: active ? 1.06 : 1 }}
                transition={spring}
              >
                {done ? <CheckCircleFilled style={{ color: s.hue, fontSize: 20 }} /> : <Icon style={{ color: s.hue, fontSize: 18 }} />}
              </motion.div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ ...S.stepLabel, color: active ? 'var(--wow-ink)' : 'var(--wow-sub)' }}>{s.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--wow-ink)' }}>{s.title}</div>
              </div>
            </button>
          );
        })}
      </nav>

      <main style={S.main}>
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35 }}
            >
              <Form form={form} layout="vertical" onFinish={handleCreateTest} requiredMark="optional">
                <div style={S.bento}>
                  <motion.div style={{ ...S.card, ...S.cardHero }} whileHover={{ y: -2 }} transition={spring}>
                    <div style={S.cardTag}>Cœur de l’offre</div>
                    <Form.Item
                      label={<span style={S.lab}>Titre visible par les candidats</span>}
                      name="title"
                      rules={[{ required: true, message: 'Donnez un titre accrocheur' }]}
                    >
                      <Input size="large" placeholder="ex. Ingénieur data — assessment 45 min" style={S.inputLg} />
                    </Form.Item>
                    <Form.Item
                      label={<span style={S.lab}>Intitulé du poste (rôle métier)</span>}
                      name="jobRole"
                      rules={[{ required: true, message: 'Indiquez le rôle ciblé' }]}
                    >
                      <Input size="large" placeholder="ex. Data Engineer / ML Ops" style={S.inputLg} />
                    </Form.Item>
                    <Form.Item
                      label={<span style={S.lab}>Description & compétences</span>}
                      name="description"
                    >
                      <Input.TextArea
                        rows={5}
                        placeholder="Stack, niveau attendu, soft skills… L’IA s’en servira pour composer les questions."
                        style={S.textarea}
                      />
                    </Form.Item>
                    <Form.Item
                      label={<span style={S.lab}>Critères d’évaluation (optionnel)</span>}
                      name="evaluationCriteria"
                      tooltip="Pondération ou grille RH pour les réponses ouvertes."
                    >
                      <Input.TextArea rows={3} placeholder="ex. 40 % technique, 30 % communication, 30 % problème ouvert" style={S.textarea} />
                    </Form.Item>
                  </motion.div>

                  <div style={S.cardCol}>
                    <motion.div style={S.card} whileHover={{ y: -2 }} transition={spring}>
                      <div style={S.miniRow}>
                        <ClockCircleOutlined style={{ color: '#8a6a3d', fontSize: 18 }} />
                        <Form.Item label="Durée" name="timeLimit" rules={[{ required: true }]} initialValue={30} style={{ flex: 1, marginBottom: 0 }}>
                          <InputNumber min={5} max={180} addonAfter="min" style={{ width: '100%' }} />
                        </Form.Item>
                      </div>
                      <div style={S.miniRow}>
                        <EnvironmentOutlined style={{ color: '#5f6f63', fontSize: 18 }} />
                        <Form.Item label="Lieu" name="location" initialValue="Remote" style={{ flex: 1, marginBottom: 0 }}>
                          <Input placeholder="Paris, Remote, Tunis…" />
                        </Form.Item>
                      </div>
                    </motion.div>

                    <motion.div style={S.card} whileHover={{ y: -2 }} transition={spring}>
                      <div style={S.miniRow}>
                        <BgColorsOutlined style={{ color: '#b38746', fontSize: 18 }} />
                        <Form.Item label="Contrat" name="employmentType" initialValue="Full-time" style={{ flex: 1, marginBottom: 0 }}>
                          <Select
                            options={[
                              { value: 'Full-time', label: 'CDI' },
                              { value: 'Part-time', label: 'Temps partiel' },
                              { value: 'Contract', label: 'Freelance / Contrat' },
                              { value: 'Internship', label: 'Stage' },
                            ]}
                          />
                        </Form.Item>
                      </div>
                      <Form.Item label="Statut" name="status" initialValue="PUBLISHED" style={{ marginBottom: 0 }}>
                        <Select
                          options={[
                            { value: 'PUBLISHED', label: 'Publiée — visible carrières' },
                            { value: 'DRAFT', label: 'Brouillon' },
                            { value: 'CLOSED', label: 'Fermée' },
                          ]}
                        />
                      </Form.Item>
                    </motion.div>

                    <motion.div style={{ ...S.card, ...S.cardGlow }} whileHover={{ y: -2 }} transition={spring}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                        <span style={S.lab}><SafetyCertificateOutlined /> Anti-triche</span>
                        <Switch checked={showAnti} onChange={setShowAnti} checkedChildren="Réglages" unCheckedChildren="Simple" />
                      </div>
                      <Form.Item name="antiCheatLevel" initialValue="STANDARD" style={{ marginBottom: 8 }}>
                        <Select
                          options={[
                            { value: 'BASIC', label: 'Basic — souple' },
                            { value: 'STANDARD', label: 'Standard — recommandé' },
                            { value: 'STRICT', label: 'Strict — renforcé' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item name="minSecondsPerQuestion" initialValue={0} label="Temps min. / question (s)" tooltip="0 = désactivé">
                        <InputNumber min={0} max={600} style={{ width: '100%' }} />
                      </Form.Item>
                      {showAnti ? (
                        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                          <Form.Item name={['antiCheatConfig', 'tabSwitchWarnThreshold']} label="Avert. onglet" initialValue={3}>
                            <InputNumber min={1} max={20} style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item name={['antiCheatConfig', 'tabSwitchAutoSubmitThreshold']} label="Auto-submit" initialValue={5}>
                            <InputNumber min={2} max={30} style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item name={['antiCheatConfig', 'focusLossFlagThreshold']} label="Perte focus" initialValue={4}>
                            <InputNumber min={1} max={30} style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item name={['antiCheatConfig', 'pasteFlagThreshold']} label="Collage" initialValue={4}>
                            <InputNumber min={1} max={30} style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item name={['antiCheatConfig', 'fullscreenExitFlagThreshold']} label="Plein écran" initialValue={3}>
                            <InputNumber min={1} max={30} style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item name={['antiCheatConfig', 'requireFullscreen']} label="Plein écran requis" initialValue={false}>
                            <Select options={[{ value: false, label: 'Non' }, { value: true, label: 'Oui' }]} />
                          </Form.Item>
                        </div>
                      ) : null}
                    </motion.div>
                  </div>
                </div>

                <motion.div style={S.ctaBar} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                  <Text type="secondary">Enregistrement en base, puis étape IA.</Text>
                  <Button type="primary" size="large" htmlType="submit" loading={loading} icon={<BulbOutlined />} style={S.ctaPrimary}>
                    Enregistrer & continuer
                  </Button>
                </motion.div>
              </Form>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              style={S.sparkPanel}
            >
              <div style={S.sparkInner}>
                <motion.div
                  animate={{ rotate: [0, 6, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                  style={S.sparkGlyph}
                >
                  <ThunderboltOutlined />
                </motion.div>
                <Title level={3} style={{ color: '#fffdf9', marginTop: 16, marginBottom: 8 }}>
                  Étincelle IA
                </Title>
                <Paragraph style={{ color: 'rgba(255,253,249,0.82)', maxWidth: 420, margin: '0 auto 28px' }}>
                  Générez une première salve de questions calibrées sur votre brief — ou sautez et affinez dans l’éditeur.
                </Paragraph>
                <div style={S.countPick}>
                  {[3, 5, 8, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAiCount(n)}
                      style={{
                        ...S.countChip,
                        borderColor: aiCount === n ? 'rgba(255,253,249,0.95)' : 'rgba(255,253,249,0.22)',
                        background: aiCount === n ? 'rgba(255,253,249,0.12)' : 'transparent',
                        color: '#fffdf9',
                      }}
                    >
                      {n} Q
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
                  <Button size="large" ghost style={S.ghostLight} onClick={() => setCurrentStep(2)} disabled={loading}>
                    Passer — je composerai plus tard
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={loading}
                    onClick={handleGenerateAI}
                    style={S.sparkBtn}
                    icon={<ThunderboltOutlined />}
                  >
                    Générer {aiCount} questions
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <div style={S.liftHead}>
                <Title level={4} style={{ margin: 0 }}>Aperçu express</Title>
                <Text type="secondary">
                  {generatedQuestions.length
                    ? `${generatedQuestions.length} question(s) enregistrées sur votre offre.`
                    : 'Aucune génération IA — vous pourrez tout ajouter à la main ou depuis la banque.'}
                </Text>
              </div>
              <div style={S.previewGrid}>
                {generatedQuestions.map((q, index) => (
                  <motion.div
                    key={q._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={S.qCard}
                  >
                    <div style={S.qStripe} />
                    <div style={{ padding: '14px 16px' }}>
                      <TagPill type={q.type} />
                      <Paragraph strong style={{ marginTop: 10, marginBottom: 0, fontSize: 14, color: 'var(--wow-ink)' }}>
                        {index + 1}. {q.prompt}
                      </Paragraph>
                      {q.type === 'QCM' && q.options?.length > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {q.options.map((opt, i) => (
                            <span
                              key={i}
                              style={{
                                ...S.optPill,
                                borderColor: opt === q.correctAnswer ? 'rgba(95, 122, 89, 0.55)' : 'var(--wow-border)',
                                background: opt === q.correctAnswer ? 'rgba(95, 122, 89, 0.12)' : 'rgba(255,253,249,0.6)',
                              }}
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div style={S.ctaBar}>
                <Button size="large" onClick={() => navigate('/rh/tests')}>
                  Liste des offres
                </Button>
                <SpaceSplit>
                  <Button size="large" type="default" onClick={goEdit}>
                    Ouvrir l’éditeur complet
                  </Button>
                  <Button type="primary" size="large" onClick={finishCreation} icon={<RocketOutlined />}>
                    Terminer
                  </Button>
                </SpaceSplit>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function TagPill({ type }) {
  const map = {
    QCM: { bg: 'rgba(138,106,61,0.15)', fg: '#8a6a3d', t: 'QCM' },
    PROBLEM: { bg: 'rgba(179,135,70,0.15)', fg: '#b38746', t: 'Cas' },
    SHORT_ANSWER: { bg: 'rgba(95,111,99,0.15)', fg: '#5f6f63', t: 'Court' },
    TEXT: { bg: 'rgba(168,107,84,0.12)', fg: '#a86b54', t: 'Texte' },
  };
  const m = map[type] || { bg: '#f0f0f0', fg: '#666', t: type || '?' };
  return (
    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', background: m.bg, color: m.fg }}>
      {m.t}
    </span>
  );
}

function SpaceSplit({ children }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>{children}</div>;
}

const S = {
  shell: {
    position: 'relative',
    maxWidth: 1100,
    margin: '0 auto',
    padding: '12px 8px 56px',
    overflow: 'hidden',
  },
  aurora: {
    position: 'absolute',
    inset: '-20% -10% auto -10%',
    height: '55%',
    background:
      'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(183, 154, 106, 0.35), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(95, 111, 99, 0.18), transparent 50%), radial-gradient(ellipse 50% 35% at 0% 10%, rgba(179, 135, 70, 0.15), transparent 45%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  gridDots: {
    position: 'absolute',
    inset: 0,
    opacity: 0.35,
    backgroundImage: 'radial-gradient(rgba(43, 36, 27, 0.07) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    pointerEvents: 'none',
    zIndex: 0,
  },
  header: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 18,
    marginBottom: 28,
    textAlign: 'center',
  },
  back: {
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 700,
    fontSize: 13,
    color: 'var(--wow-primary-a, #8a6a3d)',
    textDecoration: 'none',
  },
  headerMid: { maxWidth: 720 },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    fontSize: 11,
    fontWeight: 800,
    color: 'var(--wow-primary-a, #8a6a3d)',
  },
  heroTitle: {
    margin: '10px 0 8px',
    fontWeight: 900,
    fontSize: 'clamp(1.55rem, 3.5vw, 2.15rem)',
    color: 'var(--wow-ink, #2b241b)',
    lineHeight: 1.15,
    fontFamily: "'Sora', 'Manrope', sans-serif",
  },
  heroGrad: {
    background: 'linear-gradient(120deg, #8a6a3d, #b79a6a, #5f6f63)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSub: {
    margin: 0,
    color: 'var(--wow-sub, #83796d)',
    fontSize: 15,
    maxWidth: 520,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  stepRail: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 28,
  },
  stepBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 18,
    border: '1px solid var(--wow-border, #ddd1bf)',
    background: 'rgba(255,253,249,0.72)',
    backdropFilter: 'blur(10px)',
    cursor: 'pointer',
    font: 'inherit',
    boxShadow: '0 12px 32px rgba(64,49,28,0.06)',
  },
  stepOrb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: { fontSize: 11, fontWeight: 800, letterSpacing: '0.06em' },
  main: { position: 'relative', zIndex: 1 },
  bento: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
    gap: 18,
    alignItems: 'start',
  },
  cardCol: { display: 'flex', flexDirection: 'column', gap: 14 },
  card: {
    borderRadius: 22,
    padding: '20px 22px',
    background: 'var(--wow-card, #fffdf9)',
    border: '1px solid var(--wow-border, #ddd1bf)',
    boxShadow: 'var(--wow-shadow, 0 18px 38px rgba(64,49,28,0.08))',
  },
  cardHero: { minHeight: 200 },
  cardGlow: {
    boxShadow: '0 20px 50px rgba(138, 106, 61, 0.12)',
  },
  cardTag: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#8a6a3d',
    marginBottom: 14,
  },
  lab: { fontWeight: 700, color: 'var(--wow-ink, #2b241b)' },
  inputLg: { borderRadius: 14, fontSize: 15 },
  textarea: { borderRadius: 16, resize: 'vertical' },
  miniRow: { display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 14 },
  ctaBar: {
    marginTop: 22,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    padding: '16px 20px',
    borderRadius: 18,
    border: '1px dashed rgba(138,106,61,0.35)',
    background: 'rgba(255,253,249,0.65)',
  },
  ctaPrimary: {
    borderRadius: 14,
    height: 48,
    fontWeight: 800,
    paddingInline: 28,
    boxShadow: '0 14px 32px rgba(138,106,61,0.28)',
  },
  sparkPanel: {
    borderRadius: 28,
    overflow: 'hidden',
    background: 'linear-gradient(145deg, #2b241b 0%, #40311c 42%, #5f4a32 78%, #3d4a3e 120%)',
    boxShadow: '0 32px 80px rgba(43, 36, 27, 0.35)',
    border: '1px solid rgba(255,253,249,0.08)',
  },
  sparkInner: { textAlign: 'center', padding: '48px 24px 44px' },
  sparkGlyph: {
    width: 72,
    height: 72,
    margin: '0 auto',
    borderRadius: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 34,
    color: '#fff6d4',
    background: 'linear-gradient(135deg, rgba(255,214,120,0.25), rgba(95,111,99,0.35))',
    border: '1px solid rgba(255,253,249,0.2)',
  },
  countPick: { display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  countChip: {
    minWidth: 56,
    padding: '10px 16px',
    borderRadius: 14,
    border: '2px solid',
    fontWeight: 800,
    cursor: 'pointer',
    font: 'inherit',
  },
  ghostLight: { color: '#fffdf9', borderColor: 'rgba(255,253,249,0.35)' },
  sparkBtn: {
    borderRadius: 14,
    height: 48,
    fontWeight: 800,
    border: 'none',
    background: 'linear-gradient(120deg, #e8c97a, #c9a66a)',
    color: '#2b241b',
    boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
  },
  liftHead: { marginBottom: 18 },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 14,
    marginBottom: 22,
  },
  qCard: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    background: 'var(--wow-card, #fffdf9)',
    border: '1px solid var(--wow-border, #ddd1bf)',
    boxShadow: 'var(--wow-shadow, 0 14px 32px rgba(64,49,28,0.07))',
    display: 'flex',
  },
  qStripe: {
    width: 5,
    flexShrink: 0,
    background: 'linear-gradient(180deg, #8a6a3d, #5f6f63)',
  },
  optPill: {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 10,
    border: '1px solid',
    fontWeight: 600,
  },
};
