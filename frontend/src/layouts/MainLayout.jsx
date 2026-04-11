import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../contexts/authContext';
import UserAvatar from '../Components/UserAvatar.jsx';
import { clearStoredToken } from '../utils/authStorage';

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { path: '/', label: 'Accueil', exact: true, icon: HomeIcon },
    ],
  },
  {
    label: 'Utilisateurs',
    items: [
      { path: '/user/add', label: 'Ajouter', icon: PlusIcon },
      { path: '/user/list', label: 'Liste', icon: ListIcon },
    ],
  },
  {
    label: 'Journaux',
    items: [
      { path: '/logs/list', label: 'Logs', icon: LogIcon },
    ],
  },
  {
    label: 'Portail RH',
    items: [
      { path: '/rh/dashboard', label: 'Dashboard', icon: DashIcon },
      { path: '/rh/pipeline', label: 'Pipeline Kanban', icon: PipeIcon },
      { path: '/rh/tests', label: "Offres d'emploi", icon: TestIcon },
      { path: '/rh/candidats', label: 'Liste Candidats', icon: CandidateIcon },
      { path: '/rh/resultats', label: 'Résultats', icon: ChartIcon },
    ],
  },
];

function HomeIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></svg>; }
function PlusIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>; }
function ListIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>; }
function LogIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>; }
function DashIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>; }
function TestIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9,11 12,14 22,4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>; }
function CandidateIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function ChartIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>; }
function UserIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>; }
function KeyIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>; }
function LogoutIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>; }
function BellIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>; }
function ChevronIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6,9 12,15 18,9" /></svg>; }
function PipeIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>; }

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setToken, setUser } = useContext(AuthContext);

  const handleLogout = () => {
    setToken(null); setUser(null);
    clearStoredToken();
    navigate('/login');
  };

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="wow-admin-shell" style={s.root}>
      {/* ── SIDEBAR ── */}
      <aside className="wow-admin-sidebar" style={{ ...s.sidebar, width: collapsed ? 70 : 240 }}>
        {/* Brand */}
        <div className="wow-admin-brand" style={s.brand}>
          <div style={s.brandIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#5B3FA8" />
              <path d="M2 12l10 5 10-5" stroke="#5B3FA8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          {!collapsed && (
            <span style={s.brandText}>
              Recruit <span style={s.brandAI}>AI</span>
              <span style={s.brandTag}>Admin</span>
            </span>
          )}
        </div>
        <div style={s.divider} />

        {/* Nav groups */}
        <nav className="wow-admin-nav" style={s.nav}>
          {NAV_GROUPS.filter(group => group.label !== 'Portail RH').map(group => (
            <div key={group.label} style={s.navGroup}>
              {!collapsed && (
                <span style={s.groupLabel}>{group.label}</span>
              )}
              {group.items.map(item => {
                const active = isActive(item.path, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`wow-admin-nav-item ${active ? 'is-active' : ''}`}
                    style={{
                      ...s.navItem,
                      ...(active ? s.navItemActive : {}),
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      padding: collapsed ? '10px 0' : '8px 12px',
                    }}
                  >
                    <span style={{ color: active ? 'var(--purple)' : 'var(--text-muted)', flexShrink: 0 }}>
                      <Icon />
                    </span>
                    {!collapsed && <span style={s.navLabel}>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User block */}
        <div style={s.sideBottom}>
          <div style={s.divider} />
          <div style={{
            ...s.userBlock,
            padding: collapsed ? '12px 0' : '12px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <UserAvatar user={user} size={30} />
            {!collapsed && (
              <div>
                <div style={s.userName}>{user?.firstName} {user?.lastName}</div>
                <div style={s.userRole}>Administrateur</div>
              </div>
            )}
          </div>
        </div>

        <button className="wow-admin-collapse-btn" style={s.collapseBtn} onClick={() => setCollapsed(c => !c)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {collapsed ? <polyline points="9,18 15,12 9,6" /> : <polyline points="15,18 9,12 15,6" />}
          </svg>
        </button>
      </aside>

      {/* ── MAIN ── */}
      <div className="wow-admin-main" style={s.main}>
        <header className="wow-admin-topbar" style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>Administration</h1>
            <p style={s.pageSub}>Bienvenue, {user?.firstName || 'Admin'}</p>
          </div>
          <div className="wow-admin-top-right" style={s.topRight}>
            <button className="wow-admin-icon-btn" style={s.iconBtn}><BellIcon /></button>

            <div style={{ position: 'relative' }}>
              <button className="wow-admin-avatar-btn" style={s.avatarBtn} onClick={() => setUserMenuOpen(v => !v)}>
                <UserAvatar user={user} size={24} />
                <span style={s.avatarName}>{user?.firstName || 'Admin'}</span>
                <ChevronIcon />
              </button>

              {userMenuOpen && (
                <div className="wow-admin-dropdown" style={s.dropdown}>
                  <div style={s.dropHeader}>
                    <UserAvatar user={user} size={36} />
                    <div>
                      <div style={s.dropName}>{user?.firstName} {user?.lastName}</div>
                      <div style={s.dropEmail}>{user?.email}</div>
                    </div>
                  </div>
                  <div style={s.dropDivider} />
                  <button style={s.dropItem} onClick={() => { setUserMenuOpen(false); navigate('/admin/profile'); }}>
                    <UserIcon /> Mon profil
                  </button>
                  <button style={s.dropItem} onClick={() => { setUserMenuOpen(false); navigate('/admin/profile'); }}>
                    <KeyIcon /> Mot de passe
                  </button>
                  <div style={s.dropDivider} />
                  <button style={{ ...s.dropItem, color: '#DC2626' }} onClick={handleLogout}>
                    <LogoutIcon /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="wow-admin-content" style={s.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const s = {
  root: { display: 'flex', minHeight: '100vh', background: 'var(--bg-subtle)', fontFamily: "'DM Sans', sans-serif" },

  sidebar: {
    background: 'var(--bg-white)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 0, height: '100vh',
    flexShrink: 0, transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
    overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
  },

  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '18px 16px', minHeight: 60,
  },
  brandIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: 'var(--purple-soft)', border: '1px solid var(--purple-bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  brandText: { fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 },
  brandAI: { color: 'var(--purple)' },
  brandTag: {
    fontSize: 10, fontWeight: 700, color: 'var(--purple)',
    background: 'var(--purple-bg)', padding: '2px 7px',
    borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.04em',
  },

  divider: { height: 1, background: 'var(--border)', flexShrink: 0 },

  nav: { flex: 1, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' },
  navGroup: { display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 8 },
  groupLabel: {
    fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.07em', padding: '8px 12px 4px',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 9,
    borderRadius: 7, textDecoration: 'none',
    color: 'var(--text-body)', fontSize: 13.5, fontWeight: 500,
    transition: 'all 0.15s ease', minHeight: 36,
  },
  navItemActive: { background: 'var(--purple-soft)', color: 'var(--purple)', fontWeight: 600 },
  navLabel: { flex: 1, whiteSpace: 'nowrap', color: 'inherit' },

  sideBottom: { flexShrink: 0, padding: '0 8px 8px' },
  userBlock: {
    display: 'flex', alignItems: 'center', gap: 10,
    borderRadius: 8, background: 'var(--bg-subtle)', marginTop: 8,
  },
  userAvatar: {
    width: 30, height: 30, borderRadius: 7,
    background: 'linear-gradient(135deg, #5B3FA8, #7B5FCC)',
    color: '#fff', fontSize: 11, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  userName: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap' },
  userRole: { fontSize: 11, color: 'var(--text-muted)', marginTop: 1 },

  collapseBtn: {
    width: '100%', padding: '9px 0', background: 'transparent',
    border: 'none', borderTop: '1px solid var(--border)',
    cursor: 'pointer', color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },

  topbar: {
    height: 62, padding: '0 32px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--bg-white)', borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 10, flexShrink: 0, boxShadow: 'var(--shadow-sm)',
  },
  pageTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', margin: 0 },
  pageSub: { fontSize: 12, color: 'var(--text-muted)', margin: 0 },

  topRight: { display: 'flex', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8,
    background: 'var(--bg-subtle)', border: '1px solid var(--border)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)',
  },
  avatarBtn: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '5px 10px',
    background: 'var(--bg-subtle)', border: '1px solid var(--border)',
    borderRadius: 8, cursor: 'pointer', color: 'var(--text-heading)',
  },
  topAvatar: {
    width: 24, height: 24, borderRadius: 6,
    background: 'linear-gradient(135deg, #5B3FA8, #7B5FCC)',
    color: '#fff', fontSize: 10, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarName: { fontSize: 13, fontWeight: 600 },

  dropdown: {
    position: 'absolute', top: 44, right: 0, width: 240,
    background: 'var(--bg-white)', border: '1px solid var(--border)',
    borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-lg)',
    zIndex: 100,
  },
  dropHeader: { padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-subtle)' },
  dropAvatar: {
    width: 36, height: 36, borderRadius: 8,
    background: 'linear-gradient(135deg, #5B3FA8, #7B5FCC)',
    color: '#fff', fontSize: 13, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  dropName: { fontSize: 13.5, fontWeight: 700, color: 'var(--text-heading)' },
  dropEmail: { fontSize: 12, color: 'var(--text-muted)', marginTop: 1 },
  dropDivider: { height: 1, background: 'var(--border)' },
  dropItem: {
    width: '100%', padding: '10px 16px', background: 'transparent', border: 'none',
    cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: 'var(--text-body)',
    textAlign: 'left', display: 'flex', alignItems: 'center', gap: 9,
    fontFamily: "'DM Sans', sans-serif",
  },

  content: { flex: 1, padding: '28px 32px', overflow: 'auto' },
};

export default MainLayout;
