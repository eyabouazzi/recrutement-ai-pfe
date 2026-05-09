import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../contexts/authContext';
import UserAvatar from '../Components/UserAvatar.jsx';
import ChatWidget from '../Components/ChatWidget.jsx';
import NotificationBell from '../Components/NotificationBell.jsx';
import { clearStoredToken } from '../utils/authStorage';
import '../styles/app-dark.css';

/* ── Icons ─────────────────────────────────────── */
const TestIcon      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>;
const CandidateIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ResultIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const AiIcon        = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const ShieldIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const UserIcon      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const LogoutSvg     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

const NAV = [
  { path: '/tests',             label: 'Tests',              icon: TestIcon      },
  { path: '/mes-candidatures',  label: 'Candidatures',       icon: CandidateIcon },
  { path: '/mes-resultats',     label: 'Résultats',          icon: ResultIcon    },
  { path: '/recommendations',   label: 'Recommandations IA', icon: AiIcon        },
  { path: '/mes-donnees',       label: 'Mes données',        icon: ShieldIcon    },
];

export default function CandidateLayout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, setToken, setUser } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setToken(null); setUser(null);
    clearStoredToken();
    navigate('/login');
  };

  return (
    <div className="ds-candidate-shell">
      {/* ── HEADER ── */}
      <header className="ds-header">
        <div className="ds-header-inner">
          {/* Brand */}
          <Link to="/" className="ds-header-brand">
            <div className="ds-header-brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#fff"/>
                <path d="M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="ds-header-brand-name">
              Recruit <span className="ds-header-brand-ai">AI</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="ds-header-nav">
            {NAV.map(item => {
              const active = location.pathname.startsWith(item.path);
              const Icon   = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`ds-header-nav-link ${active ? 'active' : ''}`}
                >
                  <Icon />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ds-header-right">
            <div className="ds-role-badge">
              <span className="ds-role-dot" />
              Candidat
            </div>

            <NotificationBell />

            <div style={{ position: 'relative' }}>
              <button
                className="ds-avatar-btn"
                onClick={() => setMenuOpen(v => !v)}
              >
                <UserAvatar user={user} size={24} />
                <span>{user?.firstName}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </button>

              {menuOpen && (
                <div className="ds-dropdown">
                  <div className="ds-drop-header">
                    <UserAvatar user={user} size={36} />
                    <div>
                      <div className="ds-drop-name">{user?.firstName} {user?.lastName}</div>
                      <div className="ds-drop-email">{user?.email}</div>
                    </div>
                  </div>
                  <button className="ds-drop-item" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                    <UserIcon /> Mon profil
                  </button>
                  <button className="ds-drop-item danger" onClick={handleLogout}>
                    <LogoutSvg /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="ds-candidate-content">
        <div className="ds-candidate-content-inner">
          <Outlet />
        </div>
      </main>

      <ChatWidget />

      <footer className="ds-candidate-footer">
        © {new Date().getFullYear()} Recruit AI — Portail Candidat
      </footer>
    </div>
  );
}
