import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Alert, Badge, Button, Card, DatePicker, Form, Input,
  Modal, Popconfirm, Progress, Select, Space, Table, Tabs, Tag, Typography, message,
} from 'antd';
import {
  NotificationOutlined, BarChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  Users,
  ClipboardCheck,
  TrendingUp,
  ShieldAlert,
  Activity,
  BarChart3,
  Target,
  Clock3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Radar,
  Kanban,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import {
  fetchDashboardStats,
  fetchPipelineData,
  fetchRecentActivity,
} from '../../api/dashboard';
import {
  approveCompany, deleteUser, getAntiCheatAnalytics,
  getAdminCompanies, getAdminStats, getAdminUsers, updateAdminUser,
} from '../../api/admin';
import { baseUrl } from '../../api/api';
import { getStoredToken } from '../../utils/authStorage';
import { AuthContext } from '../../contexts/authContext.jsx';
import { useWebSocket } from '../../contexts/WebSocketContext.jsx';
import '../../styles/dashboard-light.css';

const { RangePicker } = DatePicker;


const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
};

function formatRelative(timestamp) {
  if (!timestamp) return 'maintenant';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'maintenant';
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'maintenant';
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `il y a ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  return `il y a ${diffDays} j`;
}

function scoreColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#22c55e';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function KpiCard({ icon: Icon, label, value, sub, accent, trend, delay = 0 }) {
  return (
    <motion.div
      className="hr-dashboard-kpi-card"
      style={S.kpiCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, boxShadow: '0 18px 44px rgba(15, 23, 42, 0.10)' }}
    >
      <div style={{ ...S.kpiIcon, color: accent, background: `${accent}16` }}>
        <Icon size={18} />
      </div>
      <div style={S.kpiBody}>
        <div style={S.kpiValue}>{value}</div>
        <div style={S.kpiLabel}>{label}</div>
        {sub ? (
          <div
            style={{
              ...S.kpiSub,
              color: trend === 'up' ? '#059669' : trend === 'down' ? '#dc2626' : '#64748b',
            }}
          >
            {trend === 'up' ? <ArrowUpRight size={12} /> : trend === 'down' ? <ArrowDownRight size={12} /> : null}
            {sub}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function ScoreBars({ bars = [] }) {
  const max = Math.max(...bars.map((bar) => bar.count), 1);
  return (
    <div style={S.scoreBars}>
      {bars.map((bar, index) => (
        <div key={bar.range} style={S.scoreBarCol}>
          <motion.div
            style={{ ...S.scoreBar, background: bar.color }}
            initial={{ height: 0 }}
            animate={{ height: `${(bar.count / max) * 100}%` }}
            transition={{ delay: index * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          />
          <div style={S.scoreBarRange}>{bar.range}</div>
          <div style={{ ...S.scoreBarCount, color: bar.color }}>{bar.count}</div>
        </div>
      ))}
    </div>
  );
}

function PipelineFunnel({ stages = [] }) {
  const max = Math.max(...stages.map((stage) => stage.count), 1);
  const colors = ['#8a6a3d', '#5f6f63', '#b79a6a', '#b38746', '#5f7a59', '#9f4d3b'];
  return (
    <div style={S.funnelWrap}>
      {stages.map((stage, index) => (
        <div key={stage.key} style={S.funnelRow}>
          <div style={S.funnelLabel}>{stage.label}</div>
          <div style={S.funnelTrack}>
            <motion.div
              style={{ ...S.funnelBar, background: colors[index % colors.length] }}
              initial={{ width: 0 }}
              animate={{ width: `${(stage.count / max) * 100}%` }}
              transition={{ delay: index * 0.08, duration: 0.6 }}
            />
          </div>
          <div style={{ ...S.funnelCount, color: colors[index % colors.length] }}>{stage.count}</div>
        </div>
      ))}
    </div>
  );
}

function ConversionMetrics({ rates = {} }) {
  const items = [
    { label: 'Nouveau vers screening', value: rates.applicationToAssessment ?? 0 },
    { label: 'Screening vers entretien', value: rates.assessmentToInterview ?? 0 },
    { label: 'Entretien vers offre', value: rates.interviewToOffer ?? 0 },
    { label: 'Offre vers embauche', value: rates.offerToHire ?? 0 },
  ];

  return (
    <div style={S.metricList}>
      {items.map((item) => (
        <div key={item.label} style={S.metricRow}>
          <div style={S.metricHead}>
            <span style={S.metricLabel}>{item.label}</span>
            <span style={S.metricValue}>{item.value}%</span>
          </div>
          <div style={S.metricTrack}>
            <motion.div
              style={S.metricBar}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, item.value))}%` }}
              transition={{ duration: 0.55 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityItem({ item, index }) {
  const color = scoreColor(item.score ?? 0);
  return (
    <motion.div
      style={S.activityItem}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <div style={S.avatar}>{item.avatar || 'CA'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.activityUser}>{item.user}</div>
        <div style={S.activityText}>
          a soumis <span style={S.activityStrong}>{item.test}</span> • {formatRelative(item.timestamp)}
        </div>
      </div>
      <div style={{ ...S.activityBadge, color, background: `${color}15` }}>
        {item.score}%
      </div>
    </motion.div>
  );
}

function TopTestsTable({ items = [] }) {
  if (!items.length) {
    return <div style={S.emptyState}>Aucun test n’alimente encore ce tableau.</div>;
  }

  return (
    <div style={S.tableWrap}>
      {items.map((item) => (
        <div key={item.id} style={S.tableRow}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.tableTitle}>{item.title}</div>
            <div style={S.tableSub}>{item.jobRole || 'Rôle non renseigné'}</div>
          </div>
          <div style={S.tableMetric}>
            <span style={S.tableMetricValue}>{item.submissionsCount}</span>
            <span style={S.tableMetricLabel}>soumissions</span>
          </div>
          <div style={S.tableMetric}>
            <span style={{ ...S.tableMetricValue, color: scoreColor(item.averageScore) }}>{item.averageScore}%</span>
            <span style={S.tableMetricLabel}>score moyen</span>
          </div>
          <div style={S.tableMetric}>
            <span style={S.tableMetricValue}>{item.passRate}%</span>
            <span style={S.tableMetricLabel}>qualifiés</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightCard({ title, value, body, accent, icon: Icon }) {
  return (
    <div className="hr-dashboard-insight-card" style={S.insightCard}>
      <div style={{ ...S.insightIcon, color: accent, background: `${accent}16` }}>
        <Icon size={16} />
      </div>
      <div style={S.insightValue}>{value}</div>
      <div style={S.insightTitle}>{title}</div>
      <div style={S.insightBody}>{body}</div>
    </div>
  );
}

const QUICK_LINKS = [
  { to: '/rh/pipeline', label: 'Pipeline', sub: 'Kanban recrutement', icon: Kanban, accent: '#8a6a3d' },
  { to: '/rh/tests', label: "Offres d'emploi", sub: 'Tests et publications', icon: Briefcase, accent: '#5f6f63' },
  { to: '/rh/candidats', label: 'Candidats', sub: 'Liste et profils', icon: Users, accent: '#b38746' },
  { to: '/rh/resultats', label: 'Résultats', sub: 'Scores et exports', icon: BarChart3, accent: '#a86b54' },
];

function QuickLinkCard({ to, label, sub, icon: Icon, accent }) {
  return (
    <Link to={to} className="hr-dashboard-quick-link" style={{ textDecoration: 'none', color: 'inherit' }}>
      <motion.div
        className="hr-dashboard-quick-card"
        style={S.quickCard}
        whileHover={{ y: -3, boxShadow: '0 20px 48px rgba(64, 49, 28, 0.12)' }}
        transition={{ duration: 0.22 }}
      >
        <div style={{ ...S.quickIcon, color: accent, background: `${accent}18` }}>
          <Icon size={18} />
        </div>
        <div style={S.quickBody}>
          <div style={S.quickLabel}>{label}</div>
          <div style={S.quickSub}>{sub}</div>
        </div>
        <ChevronRight size={18} style={{ color: 'var(--wow-sub, #83796d)', flexShrink: 0 }} />
      </motion.div>
    </Link>
  );
}

export default function HRDashboard() {
  const [stats, setStats] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { realTimeStats, connected } = useWebSocket();

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchPipelineData(), fetchRecentActivity()])
      .then(([statsResponse, pipelineResponse, activityResponse]) => {
        setStats(statsResponse);
        setPipeline(pipelineResponse);
        setActivity(activityResponse.slice(0, 8));
      })
      .catch((error) => {
        console.error('Failed to load HR dashboard:', error);
      })
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    {
      icon: Users,
      label: 'Candidats suivis',
      value: stats?.totalCandidates ?? 0,
      sub: `${stats?.completedTests ?? 0} candidatures reçues`,
      accent: '#8a6a3d',
      trend: 'up',
    },
    {
      icon: ClipboardCheck,
      label: 'Tests publiés',
      value: stats?.activeTests ?? 0,
      sub: `${stats?.draftTests ?? 0} brouillons, ${stats?.closedTests ?? 0} fermés`,
      accent: '#5f6f63',
    },
    {
      icon: BarChart3,
      label: 'Score moyen',
      value: `${stats?.averageScore ?? 0}%`,
      sub: `${stats?.successRate ?? 0}% qualifiés`,
      accent: '#5f7a59',
      trend: (stats?.successRate ?? 0) >= 60 ? 'up' : 'down',
    },
    {
      icon: Radar,
      label: 'Match CV moyen',
      value: `${stats?.averageMatchScore ?? 0}%`,
      sub: 'Alignement profil / poste',
      accent: '#b79a6a',
    },
    {
      icon: Clock3,
      label: 'Temps moyen',
      value: stats?.avgCompletionMinutes ? `${stats.avgCompletionMinutes} min` : 'n/a',
      sub: `${stats?.submissionsLast7Days ?? 0} sur 7 jours`,
      accent: '#b38746',
      trend: (stats?.submissionsTrend ?? 0) >= 0 ? 'up' : 'down',
    },
    {
      icon: ShieldAlert,
      label: 'Risque élevé',
      value: stats?.highRiskCount ?? 0,
      sub: `Confiance moy. ${stats?.averageTrustScore ?? 100}/100`,
      accent: '#9f4d3b',
      trend: (stats?.highRiskCount ?? 0) > 0 ? 'down' : undefined,
    },
  ];

  if (loading) {
    return (
      <div style={S.loadingWrap}>
        <div style={S.loadingSpinner} />
        <div style={S.loadingText}>Chargement du tableau de bord…</div>
      </div>
    );
  }

  return (
    <div style={S.root} className="hr-dashboard-root">
      <motion.div className="hr-dashboard-hero" style={S.hero} {...fadeUp}>
        <div className="hr-dashboard-hero-copy" style={S.heroCopy}>
          <div style={S.eyebrow}>Pilotage recrutement</div>
          <h1 style={S.title}>Vue d&apos;ensemble</h1>
          <p style={S.subtitle}>
            Indicateurs calculés à partir de vos tests et candidatures : pipeline, niveau des candidats
            et signaux de confiance — au même style que votre espace Recruit AI.
          </p>
        </div>
        <div className="hr-dashboard-hero-side" style={S.heroSide}>
          <div className="hr-dashboard-live-pill" style={S.livePill}>
            <span style={{ ...S.liveDot, background: connected ? '#5f7a59' : '#94a3b8' }} />
            {connected ? 'Temps réel connecté' : 'Temps réel indisponible'}
          </div>
          <div className="hr-dashboard-mini-grid" style={S.heroMiniGrid}>
            <div className="hr-dashboard-mini-card" style={S.heroMiniCard}>
              <span style={S.heroMiniLabel}>Soumissions (plateforme)</span>
              <span style={S.heroMiniValue}>{realTimeStats?.totalSubmissions ?? 0}</span>
            </div>
            <div className="hr-dashboard-mini-card" style={S.heroMiniCard}>
              <span style={S.heroMiniLabel}>Dernières 24 h</span>
              <span style={S.heroMiniValue}>{realTimeStats?.recentSubmissions ?? 0}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="hr-dashboard-quick-grid" style={S.quickGrid}>
        {QUICK_LINKS.map((item) => (
          <QuickLinkCard key={item.to} {...item} />
        ))}
      </div>

      <div className="hr-dashboard-kpi-grid" style={S.kpiGrid}>
        {kpis.map((item, index) => (
          <KpiCard key={item.label} {...item} delay={index * 0.05} />
        ))}
      </div>

      <div className="hr-dashboard-main-grid" style={S.mainGrid}>
        <motion.div className="hr-dashboard-panel hr-dashboard-panel--tall" style={{ ...S.panel, ...S.panelTall }} {...fadeUp}>
          <div style={S.panelHead}>
            <div style={S.panelHeadTitle}><BarChart3 size={16} /> Distribution des scores</div>
            <div style={S.panelHeadMeta}>{stats?.completedTests ?? 0} soumissions</div>
          </div>
          <ScoreBars bars={stats?.scoreDistribution || []} />
          <div style={S.legendRow}>
            {(stats?.scoreDistribution || []).map((bar) => (
              <div key={bar.range} style={S.legendItem}>
                <span style={{ ...S.legendSwatch, background: bar.color }} />
                {bar.range}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="hr-dashboard-panel hr-dashboard-panel--tall" style={{ ...S.panel, ...S.panelTall }} {...fadeUp}>
          <div style={S.panelHead}>
            <div style={S.panelHeadTitle}><Activity size={16} /> Pipeline recrutement</div>
            <div style={S.panelHeadMeta}>{pipeline?.activeSubmissions ?? 0} dossiers</div>
          </div>
          <PipelineFunnel stages={pipeline?.formattedStages || []} />
        </motion.div>

        <motion.div className="hr-dashboard-panel" style={S.panel} {...fadeUp}>
          <div style={S.panelHead}>
            <div style={S.panelHeadTitle}><Target size={16} /> Conversions</div>
            <div style={S.panelHeadMeta}>du flux reel</div>
          </div>
          <ConversionMetrics rates={pipeline?.conversionRates || {}} />
        </motion.div>

        <motion.div className="hr-dashboard-panel" style={S.panel} {...fadeUp}>
          <div style={S.panelHead}>
            <div style={S.panelHeadTitle}><Clock3 size={16} /> Activite recente</div>
            <div style={S.panelHeadMeta}>Flux récent</div>
          </div>
          {activity.length ? (
            <div className="hr-dashboard-activity-list" style={S.activityList}>
              {activity.map((item, index) => (
                <ActivityItem key={item.id || index} item={item} index={index} />
              ))}
            </div>
          ) : (
            <div style={S.emptyState}>Aucune soumission récente à afficher.</div>
          )}
        </motion.div>
      </div>

      <div className="hr-dashboard-bottom-grid" style={S.bottomGrid}>
        <motion.div className="hr-dashboard-panel" style={{ ...S.panel, minHeight: 360 }} {...fadeUp}>
          <div style={S.panelHead}>
            <div style={S.panelHeadTitle}><FileSpreadsheet size={16} /> Tests les plus actifs</div>
            <div style={S.panelHeadMeta}>top 5</div>
          </div>
          <TopTestsTable items={stats?.topTests || []} />
        </motion.div>

        <motion.div className="hr-dashboard-panel" style={{ ...S.panel, minHeight: 360 }} {...fadeUp}>
          <div style={S.panelHead}>
            <div style={S.panelHeadTitle}><Sparkles size={16} /> Indicateurs operationnels</div>
            <div style={S.panelHeadMeta}>lecture rapide</div>
          </div>
          <div className="hr-dashboard-insight-grid" style={S.insightGrid}>
            <InsightCard
              title="Rythme des soumissions"
              value={`${stats?.submissionsTrend ?? 0}%`}
              body={`Variation sur 7 jours — ${stats?.submissionsLast7Days ?? 0} soumissions récentes.`}
              accent="#8a6a3d"
              icon={TrendingUp}
            />
            <InsightCard
              title="Candidats qualifiés"
              value={stats?.qualifiedCount ?? 0}
              body="Candidatures ayant franchi le seuil de réussite défini sur le test."
              accent="#5f7a59"
              icon={CheckCircle2}
            />
            <InsightCard
              title="Offres en cours"
              value={stats?.offersSent ?? 0}
              body="Dossiers au stade offre dans votre pipeline."
              accent="#b38746"
              icon={ClipboardCheck}
            />
            <InsightCard
              title="Embauches"
              value={stats?.hired ?? 0}
              body="Candidats marqués comme embauchés dans le suivi."
              accent="#5f6f63"
              icon={Users}
            />
          </div>
        </motion.div>
      </div>

      {/* ═══ ADMIN PANEL ═══ */}
      <AdminPanel />
    </div>
  );
}

/* ═══════════════════════════════════════════
   ADMIN PANEL — embedded in HR Dashboard
   ═══════════════════════════════════════════ */
function AdminPanel() {
  const { user } = useContext(AuthContext);
  const isPlatformAdmin = user?.role === 'admin';
  const [adminStats, setAdminStats] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState(undefined);
  const [activeAdminTab, setActiveAdminTab] = useState('companies');
  const [editingUser, setEditingUser] = useState(null);
  const [isNotifModalVisible, setIsNotifModalVisible] = useState(false);
  const [antiCheatLoading, setAntiCheatLoading] = useState(false);
  const [antiCheatData, setAntiCheatData] = useState(null);
  const [antiCheatGranularity, setAntiCheatGranularity] = useState('day');
  const [antiCheatRange, setAntiCheatRange] = useState([dayjs().subtract(29, 'day'), dayjs()]);
  const [antiCheatTrustThreshold, setAntiCheatTrustThreshold] = useState(60);
  const [antiCheatLimit, setAntiCheatLimit] = useState(20);
  const [antiCheatRecruiterId, setAntiCheatRecruiterId] = useState('');
  const [antiCheatTestId, setAntiCheatTestId] = useState('');
  const [expanded, setExpanded] = useState(false);

  const [notifForm] = Form.useForm();
  const [editUserForm] = Form.useForm();

  const loadAdminStats = async () => {
    try {
      setAdminLoading(true);
      const res = await getAdminStats();
      if (!res.status) throw new Error(res.message || res.error || 'Impossible de charger les statistiques admin.');
      if (res.status) setAdminStats(res);
    } catch (e) {
      message.error(e.message);
    }
    finally { setAdminLoading(false); }
  };

  const fetchPendingCompanies = async (searchValue = companySearch) => {
    setLoadingTable(true);
    try {
      const res = await getAdminCompanies({ status: 'pending', limit: 50, search: searchValue });
      if (!res.status) throw new Error(res.message || res.error || 'Impossible de charger les entreprises.');
      if (res.status) setCompanies(Array.isArray(res.companies) ? res.companies : []);
    } catch (e) {
      message.error(e.message);
    } finally { setLoadingTable(false); }
  };

  const fetchUsers = async (params = {}) => {
    setLoadingTable(true);
    try {
      const res = await getAdminUsers({
        limit: 50,
        search: params.search !== undefined ? params.search : userSearch,
        role: params.role !== undefined ? params.role : userRoleFilter,
      });
      if (!res.status) throw new Error(res.message || res.error || 'Impossible de charger les utilisateurs.');
      if (res.status) setUsers(Array.isArray(res.users) ? res.users : []);
    } catch (e) {
      message.error(e.message);
    } finally { setLoadingTable(false); }
  };

  const fetchAntiCheat = async () => {
    setAntiCheatLoading(true);
    try {
      const [start, end] = antiCheatRange || [];
      const res = await getAntiCheatAnalytics({
        startDate: start ? start.startOf('day').toISOString() : undefined,
        endDate: end ? end.endOf('day').toISOString() : undefined,
        granularity: antiCheatGranularity,
        trustThreshold: antiCheatTrustThreshold,
        limit: antiCheatLimit,
        recruiterId: antiCheatRecruiterId || undefined,
        testId: antiCheatTestId || undefined,
      });
      if (!res.status) throw new Error(res.message || 'Erreur');
      setAntiCheatData(res);
    } catch (e) { message.error(e.message); }
    finally { setAntiCheatLoading(false); }
  };

  const handleTabChange = (key) => {
    setActiveAdminTab(key);
    if (key === 'companies') fetchPendingCompanies();
    if (key === 'users') fetchUsers();
    if (key === 'anticheat' && !antiCheatData) fetchAntiCheat();
  };

  const handleApproveCompany = async (id, action) => {
    const note = window.prompt(
      action === 'reject' ? 'Motif de rejet (recommandé)' : 'Note d\'approbation (optionnelle)', ''
    ) || '';
    try {
      const res = await approveCompany(id, action, note);
      if (!res.status) throw new Error(res.message || 'Action impossible');
      message.success(res.message);
      fetchPendingCompanies();
      loadAdminStats();
    } catch (e) { message.error(e.message); }
  };

  const openEditUserModal = (record) => {
    setEditingUser(record);
    editUserForm.setFieldsValue({ role: record.role, companyId: record.companyId?._id || '' });
  };

  const handleSaveUser = async (values) => {
    if (!editingUser?._id) return;
    try {
      const res = await updateAdminUser(editingUser._id, { role: values.role, companyId: values.companyId || null });
      if (!res.status) throw new Error(res.message || 'Mise à jour impossible');
      message.success('Utilisateur mis à jour');
      setEditingUser(null);
      editUserForm.resetFields();
      fetchUsers();
    } catch (e) { message.error(e.message); }
  };

  const handleDeleteUser = async (record) => {
    try {
      const res = await deleteUser(record._id);
      if (!res.status) throw new Error(res.message || 'Suppression impossible');
      message.success('Utilisateur supprimé');
      fetchUsers();
    } catch (e) { message.error(e.message); }
  };

  const handleSendNotification = async (values) => {
    try {
      const response = await fetch(`${baseUrl}/admin/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getStoredToken()}` },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!data.status) throw new Error(data.message || 'Erreur lors de l\'envoi');
      message.success('Notification envoyée avec succès');
      setIsNotifModalVisible(false);
      notifForm.resetFields();
    } catch (e) { message.error(e.message); }
  };

  if (!isPlatformAdmin) {
    return null;
  }

  // Lazy-load: expand on demand
  if (!expanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          border: '1.5px dashed #c7d2fe',
          borderRadius: 18,
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(99,102,241,0.04)',
          cursor: 'pointer',
        }}
        onClick={() => { setExpanded(true); loadAdminStats(); fetchPendingCompanies(); }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'grid', placeItems: 'center', color: '#6366f1', fontSize: 18 }}>
            🛡️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>Administration plateforme</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Entreprises, utilisateurs, anti-triche, notifications</div>
          </div>
        </div>
        <Button type="primary" style={{ background: '#6366f1', borderColor: '#6366f1' }}>
          Ouvrir le panneau admin
        </Button>
      </motion.div>
    );
  }

  const adminStatCards = [
    { title: 'Utilisateurs', value: adminStats?.stats?.totalUsers || 0, color: '#6366f1' },
    { title: 'Entreprises', value: adminStats?.stats?.totalCompanies || 0, color: '#10b981' },
    { title: 'En attente', value: adminStats?.stats?.pendingCompanies || 0, color: '#f59e0b' },
    { title: 'Offres publiées', value: adminStats?.stats?.totalJobs || 0, color: '#0ea5e9' },
  ];

  const companyColumns = [
    { title: 'Nom', dataIndex: 'name', key: 'name', render: (t) => <strong>{t}</strong> },
    { title: 'Secteur', dataIndex: 'sector', key: 'sector' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Ville', dataIndex: 'city', key: 'city' },
    { title: 'Statut', dataIndex: 'status', key: 'status', render: (v) => <Tag color={v === 'approved' ? 'green' : v === 'rejected' ? 'red' : 'orange'}>{v}</Tag> },
    { title: 'Créé', dataIndex: 'createdAt', key: 'createdAt', render: (d) => new Date(d).toLocaleDateString('fr-FR') },
    {
      title: 'Actions', key: 'action',
      render: (_, r) => (
        <Space>
          <Button size="small" type="primary" style={{ background: '#10b981', borderColor: '#10b981' }} onClick={() => handleApproveCompany(r._id, 'approve')}>Approuver</Button>
          <Button size="small" danger onClick={() => handleApproveCompany(r._id, 'reject')}>Rejeter</Button>
        </Space>
      ),
    },
  ];

  const userColumns = [
    { title: 'Nom', key: 'name', render: (_, r) => `${r.firstName} ${r.lastName}` },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Rôle', dataIndex: 'role', key: 'role', render: (role) => <Tag color={role === 'HR' ? 'blue' : role === 'candidat' ? 'green' : 'red'}>{String(role || '').toUpperCase()}</Tag> },
    { title: 'Entreprise', key: 'company', render: (_, r) => r.companyId?.name || '—' },
    { title: 'Inscription', dataIndex: 'createdAt', key: 'createdAt', render: (d) => new Date(d).toLocaleDateString('fr-FR') },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditUserModal(record)}>Modifier</Button>
          <Popconfirm title="Supprimer cet utilisateur ?" description="Action définitive." okText="Supprimer" cancelText="Annuler" onConfirm={() => handleDeleteUser(record)}>
            <Button size="small" danger>Supprimer</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const acTimeColumns = [
    { title: 'Période', dataIndex: 'period', key: 'period' },
    { title: 'Soumissions', dataIndex: 'totalSubmissions', key: 'totalSubmissions' },
    { title: 'Flaggées', dataIndex: 'flaggedSubmissions', key: 'flaggedSubmissions' },
    { title: 'Taux', dataIndex: 'flaggedRate', key: 'flaggedRate', render: (v) => <Tag color={v >= 50 ? 'red' : v >= 30 ? 'orange' : 'gold'}>{Number(v || 0).toFixed(1)}%</Tag> },
    { title: 'Trust moy.', dataIndex: 'avgTrustScore', key: 'avgTrustScore', render: (v) => <Tag color={v >= 80 ? 'green' : v >= 60 ? 'orange' : 'red'}>{Number(v || 0).toFixed(1)}</Tag> },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'grid', placeItems: 'center', fontSize: 18 }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>Administration plateforme</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Gestion des entreprises, utilisateurs et analytics</div>
          </div>
        </div>
        <Space>
          <Button icon={<NotificationOutlined />} type="primary" style={{ background: '#6366f1', borderColor: '#6366f1' }} onClick={() => setIsNotifModalVisible(true)}>
            Diffuser une notification
          </Button>
          <Button onClick={() => setExpanded(false)}>Réduire</Button>
        </Space>
      </div>

      {/* Stat mini-cards */}
      {adminLoading ? (
        <div style={{ textAlign: 'center', padding: 20 }}><Typography.Text type="secondary">Chargement…</Typography.Text></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {adminStatCards.map((s) => (
            <Card key={s.title} size="small" style={{ borderRadius: 14, border: `1px solid ${s.color}22` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: 'grid', placeItems: 'center', color: s.color, fontWeight: 800, fontSize: 16 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{s.title}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Card style={{ borderRadius: 18, border: '1px solid #e2e8f0' }}>
        <Tabs activeKey={activeAdminTab} onChange={handleTabChange} items={[
          {
            key: 'companies',
            label: (
              <span>
                Entreprises en attente
                {(adminStats?.stats?.pendingCompanies || 0) > 0 && (
                  <Badge count={adminStats.stats.pendingCompanies} style={{ marginLeft: 8 }} />
                )}
              </span>
            ),
            children: (
              <div style={{ display: 'grid', gap: 12 }}>
                <Alert type="info" showIcon message="Les entreprises listées attendent votre approbation avant de publier des offres." />
                <Input.Search
                  placeholder="Rechercher une entreprise..."
                  allowClear value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  onSearch={(v) => fetchPendingCompanies(v)}
                  style={{ maxWidth: 400 }}
                />
                <Table dataSource={companies} columns={companyColumns} rowKey="_id" loading={loadingTable} size="middle" pagination={{ pageSize: 10 }} />
              </div>
            ),
          },
          {
            key: 'users',
            label: 'Tous les utilisateurs',
            children: (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Input.Search
                    placeholder="Rechercher un utilisateur..." allowClear value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onSearch={(v) => fetchUsers({ search: v })}
                    style={{ maxWidth: 300 }}
                  />
                  <Select allowClear placeholder="Filtrer par rôle" value={userRoleFilter}
                    onChange={(v) => { setUserRoleFilter(v); fetchUsers({ role: v }); }}
                    style={{ width: 200 }}
                    options={[
                      { value: 'candidat', label: 'Candidat' },
                      { value: 'HR', label: 'Recruteur' },
                      { value: 'admin', label: 'Administrateur' },
                    ]}
                  />
                  <Button onClick={() => fetchUsers()}>Actualiser</Button>
                </div>
                <Table dataSource={users} columns={userColumns} rowKey="_id" loading={loadingTable} pagination={{ pageSize: 15 }} size="middle" />
              </div>
            ),
          },
          {
            key: 'anticheat',
            label: <span><BarChartOutlined style={{ marginRight: 6 }} />Anti-Cheat Analytics</span>,
            children: (
              <div style={{ display: 'grid', gap: 14 }}>
                <Alert type="info" showIcon message="Analyse des taux de flags par période, test et recruteur." />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <RangePicker value={antiCheatRange} onChange={(v) => setAntiCheatRange(v || [])} allowClear={false} />
                  <Select value={antiCheatGranularity} onChange={setAntiCheatGranularity} style={{ width: 110 }}
                    options={[{ value: 'day', label: 'Jour' }, { value: 'week', label: 'Semaine' }, { value: 'month', label: 'Mois' }]} />
                  <Input placeholder="Trust seuil" value={antiCheatTrustThreshold} onChange={(e) => setAntiCheatTrustThreshold(e.target.value)} style={{ width: 130 }} />
                  <Input placeholder="recruiterId" value={antiCheatRecruiterId} onChange={(e) => setAntiCheatRecruiterId(e.target.value)} style={{ width: 180 }} />
                  <Input placeholder="testId" value={antiCheatTestId} onChange={(e) => setAntiCheatTestId(e.target.value)} style={{ width: 160 }} />
                  <Input placeholder="Top N" value={antiCheatLimit} onChange={(e) => setAntiCheatLimit(e.target.value)} style={{ width: 80 }} />
                  <Button type="primary" onClick={fetchAntiCheat} loading={antiCheatLoading} style={{ background: '#6366f1', borderColor: '#6366f1' }}>Calculer</Button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'Soumissions analysées', val: antiCheatData?.summary?.totalSubmissions || 0 },
                    { label: 'Flaggées', val: antiCheatData?.summary?.flaggedSubmissions || 0 },
                    { label: 'Trust moyen', val: Number(antiCheatData?.summary?.avgTrustScore || 0).toFixed(1) },
                    { label: `Low trust (< seuil)`, val: antiCheatData?.summary?.lowTrustSubmissions || 0 },
                  ].map((c) => (
                    <Card key={c.label} size="small" style={{ borderRadius: 12 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{c.val}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{c.label}</div>
                      {c.label === 'Flaggées' && <Progress percent={Number(antiCheatData?.summary?.flaggedRate || 0)} size="small" style={{ marginTop: 4 }} />}
                    </Card>
                  ))}
                </div>
                <Card size="small" title="Top flags" style={{ borderRadius: 12 }}>
                  <Space wrap>
                    {(antiCheatData?.topFlags || []).map((f) => (
                      <Tag key={f.code} color={f.highSeverity > 0 ? 'red' : f.mediumSeverity > 0 ? 'orange' : 'gold'}>{f.code}: {f.count}</Tag>
                    ))}
                    {!antiCheatData?.topFlags?.length && <Typography.Text type="secondary">Aucun flag sur la période.</Typography.Text>}
                  </Space>
                </Card>
                <Card size="small" title="Évolution dans le temps" style={{ borderRadius: 12 }}>
                  <Table size="small" rowKey={(r) => r.period} dataSource={antiCheatData?.byTime || []} columns={acTimeColumns} pagination={{ pageSize: 8 }} loading={antiCheatLoading} />
                </Card>
                <Card size="small" title="Par recruteur" style={{ borderRadius: 12 }}>
                  <Table size="small" rowKey={(r, i) => String(r.recruiterId || i)} dataSource={antiCheatData?.byRecruiter || []}
                    columns={[
                      { title: 'Recruteur', dataIndex: 'recruiterName', key: 'recruiterName', render: (v) => v || 'Inconnu' },
                      { title: 'Tests', dataIndex: 'testsCount', key: 'testsCount', width: 70 },
                      { title: 'Soumissions', dataIndex: 'totalSubmissions', key: 'totalSubmissions' },
                      { title: 'Flaggées', dataIndex: 'flaggedSubmissions', key: 'flaggedSubmissions' },
                      { title: 'Taux', dataIndex: 'flaggedRate', key: 'flaggedRate', render: (v) => <Tag color={v >= 50 ? 'red' : v >= 30 ? 'orange' : 'gold'}>{Number(v || 0).toFixed(1)}%</Tag> },
                      { title: 'Trust moy.', dataIndex: 'avgTrustScore', key: 'avgTrustScore', render: (v) => <Tag color={v >= 80 ? 'green' : v >= 60 ? 'orange' : 'red'}>{Number(v || 0).toFixed(1)}</Tag> },
                    ]}
                    pagination={{ pageSize: 8 }} loading={antiCheatLoading}
                  />
                </Card>
              </div>
            ),
          },
        ]} />
      </Card>

      {/* Notification modal */}
      <Modal title="Diffuser une notification" open={isNotifModalVisible} onCancel={() => setIsNotifModalVisible(false)} footer={null}>
        <Form form={notifForm} layout="vertical" onFinish={handleSendNotification} initialValues={{ broadcast: true, type: 'general' }}>
          <Form.Item name="broadcast" label="Destinataires">
            <Select options={[{ value: true, label: 'Tous les utilisateurs' }]} />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select options={[{ value: 'general', label: 'Information' }, { value: 'success', label: 'Succès' }, { value: 'warning', label: 'Avertissement' }]} />
          </Form.Item>
          <Form.Item name="title" label="Titre" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="message" label="Contenu" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
          <Button type="primary" htmlType="submit" block style={{ background: '#6366f1', borderColor: '#6366f1' }}>Diffuser maintenant</Button>
        </Form>
      </Modal>

      {/* Edit user modal */}
      <Modal title="Modifier l'utilisateur" open={Boolean(editingUser)} onCancel={() => { setEditingUser(null); editUserForm.resetFields(); }} footer={null}>
        <Form form={editUserForm} layout="vertical" onFinish={handleSaveUser}>
          <Form.Item label="Nom"><Input value={editingUser ? `${editingUser.firstName} ${editingUser.lastName}` : ''} disabled /></Form.Item>
          <Form.Item label="Email"><Input value={editingUser?.email || ''} disabled /></Form.Item>
          <Form.Item name="role" label="Rôle" rules={[{ required: true }]}>
            <Select options={[{ value: 'candidat', label: 'Candidat' }, { value: 'HR', label: 'Recruteur' }, { value: 'admin', label: 'Administrateur' }]} />
          </Form.Item>
          <Form.Item name="companyId" label="Entreprise liée (optionnel)" extra="Laissez vide pour dissocier.">
            <Input placeholder="ObjectId entreprise" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block style={{ background: '#6366f1', borderColor: '#6366f1' }}>Enregistrer</Button>
        </Form>
      </Modal>
    </motion.div>
  );
}

const S = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
    fontFamily: "'Manrope', 'Sora', 'Segoe UI', sans-serif",
  },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
  },
  quickCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 18px',
    borderRadius: 20,
    border: '1px solid var(--wow-border, #ddd1bf)',
    background: 'var(--wow-card, #fffdf9)',
    boxShadow: 'var(--wow-shadow, 0 18px 38px rgba(64, 49, 28, 0.08))',
    minHeight: 76,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickBody: { flex: 1, minWidth: 0 },
  quickLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: 'var(--wow-ink, #2b241b)',
    letterSpacing: '-0.02em',
  },
  quickSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--wow-sub, #83796d)',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.7fr) minmax(280px, 0.9fr)',
    gap: 18,
    padding: '28px 30px',
    borderRadius: 24,
    background:
      'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(255, 255, 255, 0.98) 40%, rgba(14, 165, 233, 0.12) 100%)',
    border: '1px solid var(--wow-border, #ddd1bf)',
    boxShadow: 'var(--wow-shadow-lg, 0 26px 56px rgba(64, 49, 28, 0.12))',
  },
  heroCopy: { display: 'flex', flexDirection: 'column', gap: 10 },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#818cf8',
  },
  title: {
    margin: 0,
    fontSize: 30,
    lineHeight: 1.04,
    fontWeight: 900,
    color: '#0f172a',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  subtitle: {
    margin: 0,
    maxWidth: 760,
    fontSize: 14,
    lineHeight: 1.7,
    color: '#64748b',
  },
  heroSide: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 16,
  },
  livePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    width: 'fit-content',
    padding: '8px 14px',
    borderRadius: 999,
    background: 'rgba(255, 253, 249, 0.88)',
    border: '1px solid var(--wow-border, #ddd1bf)',
    fontSize: 12.5,
    fontWeight: 700,
    color: 'var(--wow-ink, #2b241b)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    boxShadow: '0 0 0 6px rgba(95, 122, 89, 0.15)',
  },
  heroMiniGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
  },
  heroMiniCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '14px 16px',
    borderRadius: 18,
    background: 'var(--wow-card, #fffdf9)',
    border: '1px solid var(--wow-border, #ddd1bf)',
  },
  heroMiniLabel: {
    fontSize: 12,
    color: 'var(--wow-sub, #83796d)',
    fontWeight: 600,
  },
  heroMiniValue: {
    fontSize: 24,
    lineHeight: 1,
    fontWeight: 900,
    color: 'var(--wow-ink, #2b241b)',
    fontFamily: "'Sora', 'Manrope', sans-serif",
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  kpiCard: {
    padding: '20px 22px',
    borderRadius: 20,
    border: '1px solid var(--border)',
    background: 'var(--bg-white)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
  },
  kpiIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiBody: { flex: 1, minWidth: 0 },
  kpiValue: {
    fontSize: 28,
    lineHeight: 1,
    fontWeight: 900,
    color: '#0f172a',
    letterSpacing: '-0.04em',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  kpiLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: 700,
    color: '#64748b',
  },
  kpiSub: {
    marginTop: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    fontWeight: 600,
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 20,
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 20,
  },
  panel: {
    padding: 24,
    borderRadius: 22,
    background: 'var(--bg-white)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  panelTall: {
    minHeight: 340,
  },
  panelHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  panelHeadTitle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 15,
    fontWeight: 800,
    color: '#0f172a',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  panelHeadMeta: {
    fontSize: 12.5,
    fontWeight: 700,
    color: '#64748b',
  },
  scoreBars: {
    height: 210,
    display: 'flex',
    alignItems: 'flex-end',
    gap: 12,
    paddingTop: 12,
  },
  scoreBarCol: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  scoreBar: {
    width: '100%',
    minHeight: 10,
    borderRadius: 14,
  },
  scoreBarRange: {
    fontSize: 12,
    fontWeight: 700,
    color: '#475569',
  },
  scoreBarCount: {
    fontSize: 13,
    fontWeight: 800,
  },
  legendRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    fontWeight: 700,
    color: '#475569',
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  funnelWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  funnelRow: {
    display: 'grid',
    gridTemplateColumns: '112px minmax(0, 1fr) 42px',
    gap: 12,
    alignItems: 'center',
  },
  funnelLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#94a3b8',
  },
  funnelTrack: {
    height: 12,
    borderRadius: 999,
    background: 'rgba(148,163,184,0.18)',
    overflow: 'hidden',
  },
  funnelBar: {
    height: '100%',
    borderRadius: 999,
  },
  funnelCount: {
    fontSize: 13,
    fontWeight: 800,
    textAlign: 'right',
  },
  metricList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  metricRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  metricHead: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#334155',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--wow-primary-a, #8a6a3d)',
  },
  metricTrack: {
    height: 10,
    borderRadius: 999,
    background: 'rgba(148,163,184,0.18)',
    overflow: 'hidden',
  },
  metricBar: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #8a6a3d, #b79a6a)',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 16,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.98))',
    border: '1px solid rgba(148,163,184,0.22)',
    transition: 'border-color 0.2s',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #8a6a3d, #5f6f63)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 800,
    flexShrink: 0,
  },
  activityUser: {
    fontSize: 13.5,
    fontWeight: 800,
    color: '#0f172a',
  },
  activityText: {
    fontSize: 12.5,
    color: '#64748b',
  },
  activityStrong: {
    color: '#a5b4fc',
    fontWeight: 700,
  },
  activityBadge: {
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    flexShrink: 0,
  },
  tableWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    overflowX: 'auto',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.5fr) 96px 96px 96px',
    gap: 12,
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid rgba(99,102,241,0.1)',
  },
  tableTitle: {
    fontSize: 13.5,
    fontWeight: 800,
    color: '#0f172a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tableSub: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tableMetric: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  tableMetricValue: {
    fontSize: 14,
    fontWeight: 900,
    color: '#0f172a',
  },
  tableMetricLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  insightGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14,
  },
  insightCard: {
    padding: '16px 16px 18px',
    borderRadius: 18,
    background: 'linear-gradient(180deg, #ffffff, #f8fafc)',
    border: '1px solid rgba(148,163,184,0.22)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    transition: 'border-color 0.2s, transform 0.2s',
  },
  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightValue: {
    fontSize: 24,
    fontWeight: 900,
    color: '#0f172a',
    letterSpacing: '-0.03em',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--wow-sub, #83796d)',
  },
  insightBody: {
    fontSize: 12.5,
    lineHeight: 1.6,
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    fontWeight: 600,
    minHeight: 120,
  },
  loadingWrap: {
    minHeight: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    border: '4px solid rgba(99,102,241,0.2)',
    borderTopColor: '#6366f1',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: 600,
    color: '#64748b',
  },
};
