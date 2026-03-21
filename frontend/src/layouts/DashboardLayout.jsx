import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../contexts/authContext';
import { useDarkMode } from '../contexts/DarkModeContext';

/* ── Icon components defined FIRST so NAV array can reference them ── */
function IcoDashboard() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
}
function IcoTests() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
}
function IcoCandidates() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function IcoResults() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
}
function IcoSettings() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
}
function IcoExport() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
}

function IcoPipeline() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>;
}

function IcoProfile() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}

function IcoCalendar() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}

function IcoNotifications() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
}

const NAV = [
  { path: '/rh/dashboard', label: 'Tableau de bord', icon: IcoDashboard },
  { path: '/rh/pipeline', label: 'Pipeline de Recrutement', icon: IcoPipeline },
  { path: '/rh/tests', label: "Offres d'emploi", icon: IcoTests },
  { path: '/rh/resultats', label: 'Résultats', icon: IcoResults },
  { path: '/rh/profile', label: 'Profil', icon: IcoProfile },
  { path: '/rh/parametres', label: 'Paramètres', icon: IcoSettings },
  { path: '/rh/exports', label: 'Exports', icon: IcoExport },
];


function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setToken, setUser } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useDarkMode();

  const handleLogout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem('auth-token');
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'RH'
    : 'RH';

  const currentPage = NAV.find(n => location.pathname.startsWith(n.path));

  return (
    <div style={s.root}>
      {/* ── SIDEBAR ── */}
      <aside style={{ ...s.sidebar, width: collapsed ? 70 : 236 }}>
        {/* Brand */}
        <div style={s.brand}>
          <div style={s.brandIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#5B3FA8" />
              <path d="M2 12l10 5 10-5" stroke="#5B3FA8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          {!collapsed && (
            <span style={s.brandText}>Recruit <span style={s.brandAI}>AI</span></span>
          )}
        </div>

        <div style={s.divider} />

        {/* Navigation */}
        <nav style={s.nav}>
          {NAV.map(item => {
            const active = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                style={{
                  ...s.navItem,
                  ...(active ? s.navItemActive : {}),
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '10px 0' : '9px 14px',
                }}
              >
                <span style={{ color: active ? 'var(--purple)' : 'var(--text-muted)', flexShrink: 0 }}>
                  <Icon />
                </span>
                {!collapsed && <span style={s.navLabel}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User block at bottom */}
        <div style={s.sideBottom}>
          <div style={s.divider} />
          <div style={{
            ...s.userBlock,
            padding: collapsed ? '12px 0' : '12px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <div style={s.userAvatar}>{initials}</div>
            {!collapsed && (
              <div>
                <div style={s.userName}>{user?.firstName} {user?.lastName}</div>
                <div style={s.userRole}>HR Manager</div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button style={s.collapseBtn} onClick={() => setCollapsed(c => !c)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {collapsed
              ? <polyline points="9,18 15,12 9,6" />
              : <polyline points="15,18 9,12 15,6" />}
          </svg>
        </button>
      </aside>

      {/* ── MAIN ── */}
      <div style={s.main}>
        {/* Topbar */}
        <header style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>{currentPage?.label ?? 'Tableau de bord'}</h1>
            <p style={s.breadcrumb}>
              Recruit AI &rsaquo; {currentPage?.label ?? 'Dashboard'}
            </p>
          </div>

          <div style={s.topRight}>
            {/* Dark Mode Toggle */}
            <div style={s.darkModeToggle}>
              <button 
                style={{...s.iconBtn, background: darkMode ? '#8b5cf6' : '#e2e8f0'}}
                onClick={toggleDarkMode}
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>

            {/* Notification */}
            <button style={s.iconBtn} title="Notifications">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span style={s.badge} />
            </button>

            {/* Avatar menu */}
            <div style={{ position: 'relative' }}>
              <button style={s.avatarBtn} onClick={() => setUserMenuOpen(v => !v)}>
                <div style={s.topAvatar}>{initials}</div>
                <span style={s.avatarName}>{user?.firstName || 'RH'}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </button>

              {userMenuOpen && (
                <div style={s.dropdown}>
                  <div style={s.dropHeader}>
                    <div style={s.dropLargeAvatar}>{initials}</div>
                    <div>
                      <div style={s.dropName}>{user?.firstName} {user?.lastName}</div>
                      <div style={s.dropEmail}>{user?.email}</div>
                    </div>
                  </div>
                  <div style={s.dropDivider} />
                  <button style={s.dropItem} onClick={() => { setUserMenuOpen(false); navigate('/rh/parametres'); }}>
                    <IcoSettings /> Paramètres
                  </button>
                  <div style={s.dropDivider} />
                  <button style={{ ...s.dropItem, color: '#DC2626' }} onClick={handleLogout}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={s.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const s = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg-light)',
    fontFamily: "'Inter', sans-serif",
  },

  sidebar: {
    background: 'var(--navy)',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0, height: '100vh',
    flexShrink: 0,
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    zIndex: 20,
    boxShadow: 'var(--shadow-xl)',
  },

  brand: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '28px 20px',
    minHeight: 84,
  },
  brandIcon: {
    width: 40, height: 40,
    borderRadius: 12,
    background: 'var(--blue)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    boxShadow: 'var(--shadow-blue)',
  },
  brandText: {
    fontSize: 20, fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.04em',
    whiteSpace: 'nowrap',
  },
  brandAI: { color: 'var(--blue-light)', opacity: 0.9 },

  divider: { height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 20px' },

  nav: {
    flex: 1, padding: '24px 14px',
    display: 'flex', flexDirection: 'column', gap: 8,
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    borderRadius: 12, textDecoration: 'none',
    color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, fontWeight: 500,
    transition: 'all 0.2s ease', minHeight: 46,
    padding: '0 16px',
  },
  navItemActive: {
    background: 'var(--blue)',
    color: '#fff',
    fontWeight: 600,
    boxShadow: 'var(--shadow-blue)',
  },
  navLabel: { flex: 1, whiteSpace: 'nowrap', color: 'inherit' },

  sideBottom: { flexShrink: 0, padding: '0 14px 14px' },
  userBlock: {
    display: 'flex', alignItems: 'center', gap: 12,
    borderRadius: 16,
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '12px',
    marginTop: 12,
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  userAvatar: {
    width: 38, height: 38, borderRadius: 10,
    background: 'var(--blue-light)',
    color: 'var(--navy)', fontSize: 14, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  userName: { fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' },
  userRole: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' },

  collapseBtn: {
    width: '100%', padding: '14px 0',
    background: 'transparent',
    border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s',
    flexShrink: 0,
  },

  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },

  topbar: {
    height: 80, padding: '0 40px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--bg-white)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 10, flexShrink: 0,
  },
  pageTitle: { fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', margin: 0, letterSpacing: '-0.04em' },
  breadcrumb: { fontSize: 13, color: 'var(--text-muted)', margin: 0, marginTop: 4, fontWeight: 500 },

  topRight: { display: 'flex', alignItems: 'center', gap: 20 },
  iconBtn: {
    position: 'relative',
    width: 44, height: 44, borderRadius: 12,
    background: 'var(--bg-subtle)', border: '1px solid var(--border)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)', transition: 'all 0.2s',
  },
  darkModeToggle: {
    display: 'flex',
    alignItems: 'center',
    marginRight: 8
  },
  badge: {
    position: 'absolute', top: 12, right: 12,
    width: 8, height: 8, borderRadius: '50%',
    background: '#ef4444', border: '2px solid var(--bg-white)',
  },
  avatarBtn: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '8px 18px',
    background: 'var(--bg-subtle)', border: '1px solid var(--border)',
    borderRadius: 14, cursor: 'pointer',
    color: 'var(--text-heading)', transition: 'all 0.2s',
  },
  topAvatar: {
    width: 32, height: 32, borderRadius: 10,
    background: 'var(--blue)',
    color: '#fff', fontSize: 13, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarName: { fontSize: 14, fontWeight: 600 },

  dropdown: {
    position: 'absolute', top: 64, right: 0, width: 280,
    background: 'var(--bg-white)', border: '1px solid var(--border)',
    borderRadius: 20, overflow: 'hidden',
    boxShadow: 'var(--shadow-xl)', zIndex: 100,
    animation: 'scaleIn 0.2s ease both',
  },
  dropHeader: {
    padding: '24px',
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'var(--bg-subtle)',
    borderBottom: '1px solid var(--border)',
  },
  dropLargeAvatar: {
    width: 52, height: 52, borderRadius: 14,
    background: 'var(--blue)',
    color: '#fff', fontSize: 20, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    boxShadow: 'var(--shadow-blue)',
  },
  dropName: { fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' },
  dropEmail: { fontSize: 13, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 },
  dropDivider: { height: 1, background: 'var(--border)' },
  dropItem: {
    width: '100%', padding: '14px 24px',
    background: 'transparent', border: 'none',
    cursor: 'pointer', fontSize: 14, fontWeight: 600,
    color: 'var(--text-body)', textAlign: 'left',
    display: 'flex', alignItems: 'center', gap: 14,
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.2s',
  },

  content: { flex: 1, padding: '40px', overflow: 'auto' },
};

export default DashboardLayout;
