import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../contexts/authContext';
import UserAvatar from '../Components/UserAvatar.jsx';
import ChatWidget from '../Components/ChatWidget.jsx';
import NotificationBell from '../Components/NotificationBell.jsx';
import { clearStoredToken } from '../utils/authStorage';
import '../styles/app-dark.css';

/* ── Icons ─────────────────────────────────────── */
const IcoDashboard = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IcoPipeline  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>;
const IcoTests     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IcoResults   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IcoProfile   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoQuestions = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoChevronL  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>;
const IcoChevronR  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>;
const IcoLogout    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

const NAV = [
  { path: '/rh/dashboard',     label: 'Tableau de bord',       icon: IcoDashboard },
  { path: '/rh/pipeline',      label: 'Pipeline',              icon: IcoPipeline  },
  { path: '/rh/tests',         label: "Offres d'emploi",       icon: IcoTests     },
  { path: '/rh/question-bank', label: 'Banque de questions',   icon: IcoQuestions },
  { path: '/rh/resultats',     label: 'Résultats',             icon: IcoResults   },
  { path: '/rh/profile',       label: 'Profil',                icon: IcoProfile   },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed]   = useState(false);
  const [menuOpen,  setMenuOpen]    = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, setToken, setUser } = useContext(AuthContext);

  const handleLogout = () => {
    setToken(null); setUser(null);
    clearStoredToken();
    navigate('/login');
  };

  const currentPage = NAV.find(n => location.pathname.startsWith(n.path));

  return (
    <div className="dark-shell rh-shell">
      {/* ── SIDEBAR ── */}
      <aside className="ds-sidebar" style={{ width: collapsed ? 64 : 230 }}>
        {/* Brand */}
        <div className="ds-brand">
          <div className="ds-brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#fff"/>
              <path d="M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          {!collapsed && (
            <span className="ds-brand-text">
              Recruit <span className="ds-brand-ai">AI</span>
            </span>
          )}
        </div>

        <div className="ds-divider" />

        {/* Nav */}
        <nav className="ds-nav">
          {NAV.map(item => {
            const active = location.pathname.startsWith(item.path);
            const Icon   = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`ds-nav-item ${active ? 'active' : ''}`}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px' : '10px 14px' }}
              >
                <Icon />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User block */}
        <div className="ds-side-bottom">
          <div className="ds-divider" />
          <div className="ds-user-block" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <UserAvatar user={user} size={34} />
            {!collapsed && (
              <div>
                <div className="ds-user-name">{user?.firstName} {user?.lastName}</div>
                <div className="ds-user-role">{user?.role === 'admin' ? 'Platform Admin' : 'HR Manager'}</div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button className="ds-collapse-btn" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? <IcoChevronR /> : <IcoChevronL />}
        </button>
      </aside>

      {/* ── MAIN ── */}
      <div className="ds-main rh-main">
        {/* Topbar */}
        <header className="ds-topbar rh-topbar">
          <div>
            <div className="ds-topbar-title">{currentPage?.label ?? 'Tableau de bord'}</div>
            <div className="ds-topbar-sub">Recruit AI › {currentPage?.label ?? 'Dashboard'}</div>
          </div>

          <div className="ds-topbar-right">
            <NotificationBell />

            <div style={{ position: 'relative' }}>
              <button className="ds-avatar-btn" onClick={() => setMenuOpen(v => !v)}>
                <UserAvatar user={user} size={28} />
                <span>{user?.firstName || 'RH'}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </button>

              {menuOpen && (
                <div className="ds-dropdown">
                  <div className="ds-drop-header">
                    <UserAvatar user={user} size={44} />
                    <div>
                      <div className="ds-drop-name">{user?.firstName} {user?.lastName}</div>
                      <div className="ds-drop-email">{user?.email}</div>
                    </div>
                  </div>
                  <button className="ds-drop-item danger" onClick={handleLogout}>
                    <IcoLogout /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="ds-content rh-content">
          <Outlet />
        </main>
      </div>

      <ChatWidget />
    </div>
  );
}
