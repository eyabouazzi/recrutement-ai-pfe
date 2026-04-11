import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../contexts/authContext';
import UserAvatar from '../Components/UserAvatar.jsx';
import ChatWidget from '../Components/ChatWidget.jsx';
import { clearStoredToken } from '../utils/authStorage';
import { useWebSocket } from '../contexts/WebSocketContext.jsx';

function ShieldIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>; }
function HeartIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.7 0l-1.1 1-1.1-1a5.5 5.5 0 0 0-7.8 7.8l1 1 7.9 7.9 7.8-7.9 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>; }

const NAV = [
  { path: '/tests', label: 'Offres d\'emploi', icon: TestIcon },
  { path: '/mes-candidatures', label: 'Candidatures', icon: CandidateIcon },
  { path: '/mes-resultats', label: 'Résultats', icon: ResultIcon },
  { path: '/recommendations', label: 'Recommandations IA', icon: ResultIcon },
  { path: '/favorites', label: 'Mes Favoris', icon: HeartIcon },
  { path: '/mes-donnees', label: 'Mes données', icon: ShieldIcon },
];

function TestIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>; }
function CandidateIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function ResultIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>; }
function UserIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>; }
function LogoutSvg() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>; }
function BellSvg() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>; }

function CandidateLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setToken, setUser } = useContext(AuthContext);
  const { unreadCount } = useWebSocket();
  const [menuOpen, setMenuOpen] = useState(false);
  const notificationCount = unreadCount;

  const handleLogout = () => {
    setToken(null); setUser(null);
    clearStoredToken();
    navigate('/login');
  };

  return (
    <div className="wow-candidate-shell" style={s.root}>
      {/* ── Top Header ── */}
      <header className="wow-candidate-header" style={s.header}>
        <div className="wow-candidate-header-inner" style={s.headerInner}>
          {/* Brand */}
          <Link to="/" className="wow-candidate-brand" style={s.brand}>
            <div style={s.brandIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#5B3FA8" />
                <path d="M2 12l10 5 10-5" stroke="#5B3FA8" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span style={s.brandName}>
              Recruit <span style={s.brandAI}>AI</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="wow-candidate-nav" style={s.nav}>
            {NAV.map(item => {
              const active = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`wow-candidate-nav-link ${active ? 'is-active' : ''}`}
                  style={{ ...s.navLink, ...(active ? s.navLinkActive : {}) }}
                >
                  <span style={{ color: active ? 'var(--purple)' : 'var(--text-muted)' }}><Icon /></span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="wow-candidate-right" style={s.right}>
            {/* Role badge */}
            <div style={s.roleBadge}>
              <span style={s.roleDot} />
              Candidat
            </div>

            {/* Bell */}
            <button
              className="wow-candidate-icon-btn notification-badge"
              data-count={notificationCount}
              style={s.iconBtn}
              onClick={() => navigate('/notifications')}
              title="Notifications"
            >
              <BellSvg />
            </button>

            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <button className="wow-candidate-avatar-btn" style={s.avatarBtn} onClick={() => setMenuOpen(v => !v)}>
                <UserAvatar user={user} size={24} />
                <span style={s.avatarName}>{user?.firstName}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </button>

              {menuOpen && (
                <div className="wow-candidate-dropdown" style={s.dropdown}>
                  <div style={s.dropHeader}>
                    <UserAvatar user={user} size={36} />
                    <div>
                      <div style={s.dropName}>{user?.firstName} {user?.lastName}</div>
                      <div style={s.dropEmail}>{user?.email}</div>
                    </div>
                  </div>
                  <div style={s.dropDivider} />
                  <button
                    style={s.dropItem}
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/profile');
                    }}
                  >
                    <UserIcon /> Mon profil
                  </button>
                  <button style={{ ...s.dropItem, color: '#DC2626' }} onClick={handleLogout}>
                    <LogoutSvg /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="wow-candidate-content" style={s.content}>
        <div className="wow-candidate-content-inner" style={s.contentInner}>
          <Outlet />
        </div>
      </main>

      <ChatWidget />

      <footer className="wow-candidate-footer" style={s.footer}>
        © {new Date().getFullYear()} Recruit AI Screening — Portail Candidat
      </footer>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    background: 'var(--bg-subtle)', fontFamily: "'DM Sans', sans-serif",
  },

  header: {
    background: 'var(--bg-white)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 50,
    boxShadow: 'var(--shadow-sm)',
  },
  headerInner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 32px',
    height: 62, display: 'flex', alignItems: 'center', gap: 24,
  },

  brand: { display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 },
  brandIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: 'var(--purple-soft)', border: '1px solid var(--purple-bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  brandName: { fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' },
  brandAI: { color: 'var(--purple)' },

  nav: { display: 'flex', gap: 2, flex: 1 },
  navLink: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '7px 14px', borderRadius: 7,
    fontSize: 13.5, fontWeight: 500, color: 'var(--text-body)',
    textDecoration: 'none', transition: 'all 0.15s ease',
  },
  navLinkActive: {
    background: 'var(--purple-soft)', color: 'var(--purple)', fontWeight: 600,
  },

  right: { display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' },

  roleBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 12px',
    background: 'var(--purple-bg)', color: 'var(--purple)',
    borderRadius: 99, fontSize: 12, fontWeight: 600,
  },
  roleDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--purple)', display: 'inline-block',
  },

  iconBtn: {
    width: 34, height: 34, borderRadius: 8,
    background: 'var(--bg-subtle)', border: '1px solid var(--border)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)',
  },

  avatarBtn: {
    display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px',
    background: 'var(--bg-subtle)', border: '1px solid var(--border)',
    borderRadius: 8, cursor: 'pointer', color: 'var(--text-heading)',
  },
  avatar: {
    width: 24, height: 24, borderRadius: 6,
    background: 'linear-gradient(135deg, #5B3FA8, #7B5FCC)',
    color: '#fff', fontSize: 10, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarName: { fontSize: 13, fontWeight: 600 },

  dropdown: {
    position: 'absolute', top: 42, right: 0, width: 230,
    background: 'var(--bg-white)', border: '1px solid var(--border)',
    borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', zIndex: 100,
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

  content: { flex: 1 },
  contentInner: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },

  footer: {
    textAlign: 'center', padding: '18px',
    fontSize: 12, color: 'var(--text-muted)',
    borderTop: '1px solid var(--border)',
  },
};

export default CandidateLayout;
