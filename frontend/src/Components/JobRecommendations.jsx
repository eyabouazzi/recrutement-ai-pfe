import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, RefreshCw, Briefcase, MapPin, Clock,
  TrendingUp, Award, Target, ChevronRight, Star,
  Brain, Zap, LayoutGrid, List, ArrowUpRight, CheckCircle
} from 'lucide-react';
import { getRecommendations, refreshRecommendations, getProfileInsights } from '../api/recommendations';

/* ── helpers ─────────────────────────────────────────────────── */
const scoreColor = (s) => s >= 80 ? '#10b981' : s >= 60 ? '#6366f1' : s >= 40 ? '#f59e0b' : '#94a3b8';
const scoreLabel = (s) => s >= 80 ? 'Excellent' : s >= 60 ? 'Bon match' : s >= 40 ? 'Partiel' : 'Faible';

/* ── InsightStat ─────────────────────────────────────────────── */
function InsightStat({ icon: Icon, value, label }) {
  return (
    <div style={S.insightStat}>
      <div style={S.insightIcon}><Icon size={16} /></div>
      <div style={S.insightVal}>{value}</div>
      <div style={S.insightLbl}>{label}</div>
    </div>
  );
}

/* ── RecCard ─────────────────────────────────────────────────── */
function RecCard({ rec, index, viewMode }) {
  const sc = rec.score ?? 0;
  const clr = scoreColor(sc);
  const isGrid = viewMode === 'grid';

  return (
    <motion.div
      style={{ ...S.recCard, ...(isGrid ? {} : S.recCardList) }}
      initial={{ opacity: 0, y: isGrid ? 20 : 0, x: isGrid ? 0 : -16 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: isGrid ? -4 : 0, boxShadow: '0 16px 48px rgba(124,58,237,0.12)', transition: { duration: 0.2 } }}
    >
      {/* Score badge */}
      <div style={{ ...S.scoreBadge, '--sc': clr, flexDirection: isGrid ? 'column' : 'row', minWidth: isGrid ? 'auto' : 120 }}>
        <div style={{ ...S.scoreCircle, borderColor: clr, color: clr }}>
          <span style={S.scoreNum}>{sc}%</span>
        </div>
        <span style={{ ...S.scoreTag, color: clr, background: `${clr}18` }}>{scoreLabel(sc)}</span>
        {!isGrid && <span style={S.scoreMatchLbl}>Match</span>}
      </div>

      {/* Content */}
      <div style={S.recBody}>
        <div style={S.recTopRow}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.recTitle}>
              {rec.test?.title ?? 'Opportunité d\'emploi'}
            </div>
            {rec.test?.jobRole && (
              <div style={S.recRole}>{rec.test.jobRole}</div>
            )}
          </div>
          <Star size={15} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />
        </div>

        {rec.reason && (
          <p style={S.recReason}>{rec.reason}</p>
        )}

        {/* Matched skills */}
        {rec.matchedSkills?.length > 0 && (
          <div style={S.skillTags}>
            {rec.matchedSkills.slice(0, 4).map((sk, i) => (
              <span key={i} style={S.skillTag}>{sk}</span>
            ))}
            {rec.matchedSkills.length > 4 && (
              <span style={{ ...S.skillTag, color: '#94a3b8', borderColor: '#e2e8f0' }}>
                +{rec.matchedSkills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div style={S.recMeta}>
          {rec.test?.location && (
            <span style={S.metaPill}><MapPin size={11} /> {rec.test.location}</span>
          )}
          {rec.test?.employmentType && (
            <span style={S.metaPill}><Clock size={11} /> {rec.test.employmentType}</span>
          )}
          {rec.test?.difficulty && (
            <span style={S.metaPill}><TrendingUp size={11} /> {rec.test.difficulty}</span>
          )}
        </div>

        <button style={S.viewBtn}>
          Voir l'offre <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export default function JobRecommendations({ compact = false }) {
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const [recsRes, insRes] = await Promise.all([
        getRecommendations().catch(() => ({})),
        getProfileInsights().catch(() => ({})),
      ]);
      if (recsRes?.status) setRecommendations(recsRes.recommendations ?? []);
      if (insRes?.status) setInsights(insRes.insights);
    } catch (err) {
      setError('Impossible de charger les recommandations.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true); setError(null);
      const res = await refreshRecommendations();
      if (res?.status) setRecommendations(res.recommendations ?? []);
    } catch {
      setError('Erreur lors du rafraîchissement.');
    } finally {
      setRefreshing(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={S.loadWrap}>
        {[...Array(compact ? 3 : 6)].map((_, i) => (
          <div key={i} style={S.skeleton} />
        ))}
      </div>
    );
  }

  /* ── Compact mode ── */
  if (compact) {
    return (
      <div style={S.compactWrap}>
        <div style={S.compactHead}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} style={{ color: '#7c3aed' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>Recommandés pour vous</span>
          </div>
          <button style={S.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.9s linear infinite' : 'none' }} />
          </button>
        </div>
        {recommendations.length === 0 ? (
          <div style={S.emptySmall}>Complétez des tests pour obtenir des recommandations.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recommendations.slice(0, 3).map((rec, i) => {
              const sc = rec.score ?? 0;
              const clr = scoreColor(sc);
              return (
                <motion.div
                  key={rec.testId ?? i}
                  style={S.compactItem}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div style={{ ...S.compactScore, color: clr, background: `${clr}18`, border: `1px solid ${clr}30` }}>
                    {sc}%
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rec.test?.title ?? 'Offre d\'emploi'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rec.reason}
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ── Full page ── */
  return (
    <div style={S.root}>
      {/* Profile Insights banner */}
      {insights && (
        <motion.div
          style={S.insightsBanner}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={S.insightsLeft}>
            <div style={S.insightsBrainIcon}><Brain size={24} /></div>
            <div>
              <div style={S.insightsTitle}>Analyse de votre profil</div>
              <div style={S.insightsSub}>Basée sur vos résultats de tests et compétences détectées</div>
            </div>
          </div>
          <div style={S.insightsStats}>
            <InsightStat icon={Award} value={insights.experienceLevel ?? '—'} label="Niveau" />
            <InsightStat icon={Target} value={insights.totalSubmissions ?? 0} label="Tests complétés" />
            <InsightStat icon={TrendingUp} value={`${insights.averageScore ?? 0}%`} label="Score moyen" />
            <InsightStat icon={Zap} value={insights.skills?.length ?? 0} label="Compétences" />
          </div>

          {insights.topSkills?.length > 0 && (
            <div style={S.topSkillsRow}>
              <span style={S.topSkillsLabel}>Top compétences :</span>
              {insights.topSkills.map((sk, i) => (
                <span key={i} style={S.topSkillTag}>{sk.skill} ({sk.avgScore}%)</span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Header row */}
      <div style={S.headerRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={S.headerIcon}><Sparkles size={20} /></div>
          <div>
            <h1 style={S.pageTitle}>Offres recommandées</h1>
            <p style={S.pageSub}>{recommendations.length} offre{recommendations.length !== 1 ? 's' : ''} correspondent à votre profil</p>
          </div>
        </div>

        <div style={S.actions}>
          {/* View toggle */}
          <div style={S.viewToggle}>
            <button
              style={{ ...S.viewBtn2, ...(viewMode === 'grid' ? S.viewBtnActive : {}) }}
              onClick={() => setViewMode('grid')}
              title="Grille"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              style={{ ...S.viewBtn2, ...(viewMode === 'list' ? S.viewBtnActive : {}) }}
              onClick={() => setViewMode('list')}
              title="Liste"
            >
              <List size={15} />
            </button>
          </div>

          <button style={S.refreshBtnPrimary} onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.9s linear infinite' : 'none' }} />
            {refreshing ? 'Actualisation…' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={S.errorBanner}>{error}</div>
      )}

      {/* Empty state */}
      {recommendations.length === 0 && !error ? (
        <motion.div
          style={S.emptyWrap}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={S.emptyIcon}><Briefcase size={40} /></div>
          <h3 style={S.emptyTitle}>Aucune recommandation pour l'instant</h3>
          <p style={S.emptySub}>Complétez des tests pour que notre IA puisse analyser votre profil et vous proposer les meilleures offres.</p>
          <button style={S.emptyBtn} onClick={handleRefresh} disabled={refreshing}>
            <Sparkles size={15} />
            Générer mes recommandations
          </button>
        </motion.div>
      ) : (
        /* Recommendations grid/list */
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            style={viewMode === 'grid' ? S.grid : S.listCol}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {recommendations.map((rec, i) => (
              <RecCard key={rec.testId ?? i} rec={rec} index={i} viewMode={viewMode} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
const S = {
  root: {
    display: 'flex', flexDirection: 'column', gap: 24,
    fontFamily: "'Inter', sans-serif",
  },

  /* Insights banner */
  insightsBanner: {
    padding: '28px 32px',
    borderRadius: 20,
    background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 55%, #0e7490 100%)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    boxShadow: '0 8px 32px rgba(124,58,237,0.35)',
  },
  insightsLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  insightsBrainIcon: {
    width: 52, height: 52, borderRadius: 16,
    background: 'rgba(255,255,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  insightsTitle: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  insightsSub: { fontSize: 13.5, color: 'rgba(255,255,255,0.72)', marginTop: 3 },
  insightsStats: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  insightStat: {
    flex: '1 1 120px',
    padding: '14px 18px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(8px)',
    display: 'flex', flexDirection: 'column', gap: 5,
  },
  insightIcon: { color: 'rgba(255,255,255,0.7)' },
  insightVal: { fontSize: 22, fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  insightLbl: { fontSize: 11.5, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 },
  topSkillsRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  topSkillsLabel: { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
  topSkillTag: {
    padding: '4px 12px', borderRadius: 999,
    background: 'rgba(255,255,255,0.18)',
    fontSize: 12.5, fontWeight: 600,
  },

  /* Header row */
  headerRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 16, flexWrap: 'wrap',
  },
  headerIcon: {
    width: 46, height: 46, borderRadius: 14,
    background: 'rgba(124,58,237,0.1)', color: '#7c3aed',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: {
    margin: 0, fontSize: 22, fontWeight: 800,
    color: 'var(--text-heading)', letterSpacing: '-0.03em',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  pageSub: { margin: '3px 0 0', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 },

  actions: { display: 'flex', alignItems: 'center', gap: 10 },

  viewToggle: {
    display: 'flex', gap: 2,
    background: 'var(--bg-subtle)', borderRadius: 10,
    padding: 3, border: '1px solid var(--border)',
  },
  viewBtn2: {
    width: 34, height: 34, borderRadius: 8,
    border: 'none', cursor: 'pointer',
    background: 'transparent', color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  },
  viewBtnActive: {
    background: 'var(--bg-white)', color: '#7c3aed',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },

  refreshBtnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 18px', borderRadius: 11,
    background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
    color: '#fff', border: 'none', cursor: 'pointer',
    fontSize: 13.5, fontWeight: 700,
    boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
    transition: 'opacity 0.2s', fontFamily: "'Inter', sans-serif",
  },

  /* Error */
  errorBanner: {
    padding: '14px 20px', borderRadius: 12,
    background: '#fef2f2', border: '1px solid #fecaca',
    color: '#dc2626', fontSize: 13.5, fontWeight: 500,
  },

  /* Empty state */
  emptyWrap: {
    padding: '64px 32px', borderRadius: 20,
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border)',
    textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    background: 'var(--bg-white)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)',
  },
  emptyTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-0.02em' },
  emptySub: { margin: 0, fontSize: 14, color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.6 },
  emptyBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '13px 24px', borderRadius: 12,
    background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
    color: '#fff', border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: 700, fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
  },

  /* Grid / List */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 18,
  },
  listCol: { display: 'flex', flexDirection: 'column', gap: 12 },

  /* Rec card */
  recCard: {
    background: 'var(--bg-white)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
  },
  recCardList: { flexDirection: 'row' },

  /* Score badge */
  scoreBadge: {
    padding: '20px 20px 16px',
    background: 'var(--bg-subtle)',
    display: 'flex', alignItems: 'center', gap: 10,
    borderBottom: '1px solid var(--border)',
  },
  scoreCircle: {
    width: 60, height: 60, borderRadius: '50%',
    border: '3px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  scoreNum: { fontSize: 14, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  scoreTag: {
    padding: '3px 10px', borderRadius: 999,
    fontSize: 11.5, fontWeight: 700, letterSpacing: '0.02em',
    display: 'inline-block',
  },
  scoreMatchLbl: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 },

  /* Card body */
  recBody: {
    padding: '18px 20px',
    display: 'flex', flexDirection: 'column', gap: 10, flex: 1,
  },
  recTopRow: { display: 'flex', alignItems: 'flex-start', gap: 8 },
  recTitle: {
    fontSize: 15.5, fontWeight: 700, color: 'var(--text-heading)',
    letterSpacing: '-0.02em', fontFamily: "'Plus Jakarta Sans', sans-serif",
    marginBottom: 2,
  },
  recRole: { fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 500 },
  recReason: {
    margin: 0, fontSize: 13.5, lineHeight: 1.55,
    color: 'var(--text-body)',
    display: '-webkit-box', WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },

  /* Skills */
  skillTags: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  skillTag: {
    padding: '3px 10px', borderRadius: 7,
    fontSize: 11.5, fontWeight: 600,
    color: '#7c3aed', background: 'rgba(124,58,237,0.08)',
    border: '1px solid rgba(124,58,237,0.15)',
  },

  /* Meta */
  recMeta: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  metaPill: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 10px', borderRadius: 7,
    fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)',
    background: 'var(--bg-subtle)', border: '1px solid var(--border-light)',
  },

  /* View btn */
  viewBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 4, padding: '10px',
    borderRadius: 10, border: '1px solid var(--border)',
    background: 'var(--bg-subtle)', color: 'var(--text-body)',
    fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s', fontFamily: "'Inter', sans-serif",
    width: '100%',
  },

  /* Loading skeletons */
  loadWrap: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
  },
  skeleton: {
    height: 260, borderRadius: 20,
    background: 'linear-gradient(90deg, var(--bg-subtle) 25%, var(--border) 50%, var(--bg-subtle) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },

  /* Compact */
  compactWrap: {
    padding: 20, borderRadius: 18,
    background: 'rgba(124,58,237,0.04)',
    border: '1px solid rgba(124,58,237,0.12)',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  compactHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  compactItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', borderRadius: 12,
    background: 'var(--bg-white)',
    border: '1px solid var(--border)', cursor: 'pointer',
  },
  compactScore: {
    padding: '5px 10px', borderRadius: 8,
    fontSize: 12, fontWeight: 800,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    flexShrink: 0,
  },
  emptySmall: { fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' },

  refreshBtn: {
    width: 30, height: 30, borderRadius: 8,
    background: 'transparent', border: '1px solid var(--border)',
    cursor: 'pointer', color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};
