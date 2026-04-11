import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, ClipboardCheck, TrendingUp, Award, Activity,
  BarChart3, Target, Clock, ArrowUpRight, ArrowDownRight,
  Zap, CheckCircle, AlertCircle
} from 'lucide-react';
import {
  fetchDashboardStats,
  fetchPipelineData,
  fetchRecentActivity,
} from '../../api/dashboard';

/* ── Animation ─────────────────────────────────────────────────────────── */
const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
};

/* ── KPI Card ──────────────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, color, trend, delay = 0 }) {
  return (
    <motion.div
      style={S.kpiCard}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, boxShadow: '0 16px 48px rgba(124,58,237,0.13)' }}
    >
      <div style={{ ...S.kpiIcon, background: `${color}18`, color }}>
        <Icon size={20} />
      </div>
      <div style={S.kpiBody}>
        <div style={S.kpiValue}>{value ?? '—'}</div>
        <div style={S.kpiLabel}>{label}</div>
        {sub != null && (
          <div style={{ ...S.kpiSub, color: trend === 'up' ? '#059669' : trend === 'down' ? '#dc2626' : '#64748b' }}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : trend === 'down' ? <ArrowDownRight size={12} /> : null}
            {sub}
          </div>
        )}
      </div>
      <div style={{ ...S.kpiGlow, background: `radial-gradient(circle, ${color}22, transparent 70%)` }} />
    </motion.div>
  );
}

/* ── Pipeline Funnel ───────────────────────────────────────────────────── */
function PipelineFunnel({ stages }) {
  const stageLabels = {
    new: 'Nouveaux', in_assessment: 'En évaluation',
    interview_scheduled: 'Entretien', offer_pending: 'Offre en attente',
    offer_accepted: 'Offre acceptée', hired: 'Embauché'
  };
  const colors = ['#7c3aed', '#6366f1', '#3b82f6', '#0ea5e9', '#10b981', '#34d399'];
  const entries = Object.entries(stages);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div style={S.funnelWrap}>
      {entries.map(([key, count], i) => (
        <div key={key} style={S.funnelRow}>
          <div style={S.funnelLabel}>{stageLabels[key] || key}</div>
          <div style={S.funnelBarTrack}>
            <motion.div
              style={{ ...S.funnelBar, background: colors[i] }}
              initial={{ width: 0 }}
              animate={{ width: `${(count / max) * 100}%` }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div style={{ ...S.funnelCount, color: colors[i] }}>{count}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Activity Item ─────────────────────────────────────────────────────── */
function ActivityItem({ item, index }) {
  const score = item.score ?? 0;
  const scoreColor = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626';
  return (
    <motion.div
      style={S.activityItem}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <div style={S.activityAvatar}>{item.avatar || '??'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.activityUser}>{item.user}</div>
        <div style={S.activitySub}>a soumis « {item.test} »</div>
      </div>
      {item.score != null && (
        <div style={{ ...S.activityScore, color: scoreColor, background: `${scoreColor}14` }}>
          {score}%
        </div>
      )}
    </motion.div>
  );
}

/* ── Score Bar Chart ───────────────────────────────────────────────────── */
function ScoreBars() {
  const bars = [
    { range: '0–20', count: 5, color: '#ef4444' },
    { range: '21–40', count: 12, color: '#f97316' },
    { range: '41–60', count: 28, color: '#eab308' },
    { range: '61–80', count: 45, color: '#22c55e' },
    { range: '81–100', count: 32, color: '#10b981' },
  ];
  const max = Math.max(...bars.map(b => b.count));
  return (
    <div style={S.scoreBars}>
      {bars.map((b, i) => (
        <div key={b.range} style={S.scoreBarCol}>
          <motion.div
            style={{ ...S.scoreBar, background: b.color }}
            initial={{ height: 0 }}
            animate={{ height: `${(b.count / max) * 100}%` }}
            transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
          <div style={S.scoreBarLabel}>{b.range}</div>
          <div style={{ ...S.scoreBarCount, color: b.color }}>{b.count}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Conversion Rates ─────────────────────────────────────────────────── */
function ConversionMetrics({ rates }) {
  const items = [
    { label: 'Application → Évaluation', value: rates.applicationToAssessment ?? 0 },
    { label: 'Évaluation → Entretien', value: rates.assessmentToInterview ?? 0 },
    { label: 'Entretien → Offre', value: rates.interviewToOffer ?? 0 },
    { label: 'Offre → Embauche', value: rates.offerToHire ?? 0 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map((item, i) => (
        <div key={item.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-body)' }}>{item.label}</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--purple)' }}>{item.value}%</span>
          </div>
          <div style={S.convTrack}>
            <motion.div
              style={S.convBar}
              initial={{ width: 0 }}
              animate={{ width: `${item.value}%` }}
              transition={{ delay: i * 0.1, duration: 0.65 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Dashboard ────────────────────────────────────────────────────── */
export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchPipelineData(), fetchRecentActivity()])
      .then(([s, p, a]) => {
        setStats(s);
        setPipeline(p);
        setActivity(a.slice(0, 8));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { icon: Users, label: 'Candidats total', value: stats?.totalCandidates ?? '—', color: '#7c3aed', sub: 'actifs sur la plateforme', trend: 'up' },
    { icon: ClipboardCheck, label: 'Tests soumis', value: stats?.completedTests ?? '—', color: '#06b6d4', sub: `${stats?.totalTests ?? 0} tests créés`, trend: 'up' },
    { icon: TrendingUp, label: 'Taux de réussite', value: stats?.successRate != null ? `${stats.successRate}%` : '—', color: '#10b981', sub: 'score ≥ 70%', trend: stats?.successRate >= 60 ? 'up' : 'down' },
    { icon: Zap, label: 'Tests actifs', value: stats?.activeTests ?? '—', color: '#f59e0b', sub: 'ouverts aux candidats' },
  ];

  if (loading) {
    return (
      <div style={S.loadWrap}>
        <div style={S.loadSpinner} />
        <p style={{ color: 'var(--text-muted)', marginTop: 16, fontSize: 14 }}>Chargement du tableau de bord…</p>
      </div>
    );
  }

  return (
    <div style={S.root}>
      {/* ── Page header ── */}
      <motion.div style={S.pageHead} {...fadeUp}>
        <div>
          <h1 style={S.pageTitle}>Tableau de bord</h1>
          <p style={S.pageSub}>Vue d'ensemble de votre activité de recrutement en temps réel.</p>
        </div>
        <div style={S.liveChip}>
          <div style={S.liveDot} />
          Live
        </div>
      </motion.div>

      {/* ── KPI Row ── */}
      <div style={S.kpiGrid}>
        {kpis.map((k, i) => <KpiCard key={k.label} {...k} delay={i * 0.07} />)}
      </div>

      {/* ── Main Charts Row ── */}
      <div style={S.twoCol}>

        {/* Score distribution */}
        <motion.div style={S.card} {...fadeUp} transition={{ delay: 0.2, duration: 0.5 }}>
          <div style={S.cardHead}>
            <BarChart3 size={17} style={{ color: 'var(--purple)' }} />
            <span style={S.cardTitle}>Distribution des scores</span>
          </div>
          <ScoreBars />
          <div style={S.cardLegend}>
            <span style={{ color: '#ef4444' }}>■ Faible</span>
            <span style={{ color: '#eab308' }}>■ Moyen</span>
            <span style={{ color: '#22c55e' }}>■ Bon</span>
            <span style={{ color: '#10b981' }}>■ Excellent</span>
          </div>
        </motion.div>

        {/* Pipeline funnel */}
        <motion.div style={S.card} {...fadeUp} transition={{ delay: 0.28, duration: 0.5 }}>
          <div style={S.cardHead}>
            <Activity size={17} style={{ color: '#06b6d4' }} />
            <span style={S.cardTitle}>Pipeline de recrutement</span>
          </div>
          {pipeline?.stages ? (
            <PipelineFunnel stages={pipeline.stages} />
          ) : (
            <div style={S.empty}>Aucune donnée de pipeline disponible.</div>
          )}
        </motion.div>
      </div>

      {/* ── Bottom Row ── */}
      <div style={S.twoCol}>

        {/* Conversion rates */}
        <motion.div style={S.card} {...fadeUp} transition={{ delay: 0.35, duration: 0.5 }}>
          <div style={S.cardHead}>
            <Target size={17} style={{ color: '#10b981' }} />
            <span style={S.cardTitle}>Taux de conversion</span>
          </div>
          {pipeline?.conversionRates ? (
            <ConversionMetrics rates={pipeline.conversionRates} />
          ) : (
            <div style={S.empty}>Données indisponibles.</div>
          )}
        </motion.div>

        {/* Recent activity */}
        <motion.div style={S.card} {...fadeUp} transition={{ delay: 0.42, duration: 0.5 }}>
          <div style={S.cardHead}>
            <Clock size={17} style={{ color: '#f59e0b' }} />
            <span style={S.cardTitle}>Activité récente</span>
          </div>
          {activity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {activity.map((item, i) => <ActivityItem key={item.id || i} item={item} index={i} />)}
            </div>
          ) : (
            <div style={S.empty}>
              <CheckCircle size={32} style={{ color: '#10b981', marginBottom: 12 }} />
              <div>Aucune activité récente.</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>
                Les soumissions de candidats apparaîtront ici.
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Quick stats summary ── */}
      {stats && (
        <motion.div style={S.summaryBand} {...fadeUp} transition={{ delay: 0.5 }}>
          {[
            { icon: Award, value: `${stats.successRate ?? 0}%`, label: 'Taux de réussite global', color: '#10b981' },
            { icon: ClipboardCheck, value: stats.pendingTests ?? 0, label: 'Tests en attente', color: '#f59e0b' },
            { icon: Users, value: stats.hired ?? 0, label: 'Candidats embauchés', color: '#7c3aed' },
            { icon: AlertCircle, value: stats.offersSent ?? 0, label: 'Offres envoyées', color: '#06b6d4' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              style={S.summaryItem}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.07 }}
            >
              <div style={{ ...S.summaryIcon, color: item.color, background: `${item.color}14` }}>
                <item.icon size={16} />
              </div>
              <div style={{ ...S.summaryVal, color: item.color }}>{item.value}</div>
              <div style={S.summaryLbl}>{item.label}</div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
const S = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    fontFamily: "'Inter', sans-serif",
  },

  pageHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  pageTitle: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    color: 'var(--text-heading)',
    letterSpacing: '-0.04em',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  pageSub: {
    margin: '4px 0 0',
    fontSize: 14,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  liveChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '6px 14px',
    borderRadius: 999,
    fontSize: 12.5,
    fontWeight: 700,
    color: '#059669',
    background: 'rgba(5,150,105,0.1)',
    border: '1px solid rgba(5,150,105,0.2)',
  },
  liveDot: {
    width: 7, height: 7,
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 8px rgba(16,185,129,0.7)',
    animation: 'pulse 2s infinite',
  },

  // KPI Grid
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
  },
  kpiCard: {
    position: 'relative',
    padding: '22px 24px',
    borderRadius: 18,
    background: 'var(--bg-white)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    overflow: 'hidden',
    cursor: 'default',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  kpiIcon: {
    width: 46, height: 46,
    borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  kpiBody: { flex: 1, minWidth: 0 },
  kpiValue: {
    fontSize: 28,
    fontWeight: 900,
    color: 'var(--text-heading)',
    letterSpacing: '-0.04em',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    lineHeight: 1,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: 4,
  },
  kpiSub: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    fontSize: 12,
    fontWeight: 500,
  },
  kpiGlow: {
    position: 'absolute',
    bottom: -30, right: -20,
    width: 120, height: 120,
    borderRadius: '50%',
    opacity: 0.7,
    pointerEvents: 'none',
  },

  // Cards
  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 20,
  },
  card: {
    padding: 28,
    borderRadius: 20,
    background: 'var(--bg-white)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  cardHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 16,
    borderBottom: '1px solid var(--border-light)',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-heading)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  cardLegend: {
    display: 'flex',
    gap: 16,
    fontSize: 12,
    fontWeight: 600,
    flexWrap: 'wrap',
  },
  empty: {
    textAlign: 'center',
    padding: '32px 16px',
    color: 'var(--text-muted)',
    fontSize: 14,
    fontWeight: 500,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  // Score bars
  scoreBars: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    height: 160,
    padding: '0 4px',
  },
  scoreBarCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 6,
  },
  scoreBar: {
    width: '100%',
    borderRadius: '6px 6px 2px 2px',
    minHeight: 6,
    transition: 'opacity 0.2s',
  },
  scoreBarLabel: { fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center' },
  scoreBarCount: { fontSize: 11.5, fontWeight: 800 },

  // Funnel
  funnelWrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  funnelRow: { display: 'flex', alignItems: 'center', gap: 12 },
  funnelLabel: { width: 140, fontSize: 12.5, fontWeight: 500, color: 'var(--text-muted)', flexShrink: 0 },
  funnelBarTrack: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    background: 'var(--bg-subtle)',
    overflow: 'hidden',
  },
  funnelBar: {
    height: '100%',
    borderRadius: 8,
    minWidth: 4,
    opacity: 0.85,
  },
  funnelCount: { width: 36, textAlign: 'right', fontSize: 13, fontWeight: 800, flexShrink: 0 },

  // Conversion
  convTrack: {
    height: 8,
    borderRadius: 999,
    background: 'var(--bg-subtle)',
    overflow: 'hidden',
  },
  convBar: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
    minWidth: 4,
  },

  // Activity
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 12,
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border-light)',
  },
  activityAvatar: {
    width: 34, height: 34,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityUser: { fontSize: 13.5, fontWeight: 600, color: 'var(--text-heading)' },
  activitySub: { fontSize: 12, color: 'var(--text-muted)', marginTop: 1 },
  activityScore: {
    padding: '3px 10px',
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 700,
    flexShrink: 0,
  },

  // Summary band
  summaryBand: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 16,
    padding: '24px 28px',
    borderRadius: 20,
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border-light)',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    textAlign: 'center',
  },
  summaryIcon: {
    width: 40, height: 40,
    borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  summaryVal: {
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: '-0.04em',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    lineHeight: 1,
  },
  summaryLbl: {
    fontSize: 12.5,
    fontWeight: 500,
    color: 'var(--text-muted)',
  },

  // Loading
  loadWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  loadSpinner: {
    width: 40, height: 40,
    border: '3px solid var(--border)',
    borderTopColor: 'var(--purple)',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
  },
};
