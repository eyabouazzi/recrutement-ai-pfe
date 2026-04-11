import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

function AuthLayout() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';

  return (
    <div className="wow-auth-shell" style={s.root}>
      <div style={s.mesh} aria-hidden />
      <div style={s.gridOverlay} aria-hidden />

      <header className="wow-auth-topbar" style={s.topNav}>
        <div className="wow-auth-nav-inner" style={s.navInner}>
          <Link to="/" className="wow-auth-brand" style={s.brand}>
            <div style={s.brandIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#authG1)" />
                <path d="M2 12l10 5 10-5" stroke="url(#authG2)" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="authG1" x1="2" y1="2" x2="22" y2="14">
                    <stop stopColor="#7c3aed" />
                    <stop offset="1" stopColor="#06b6d4" />
                  </linearGradient>
                  <linearGradient id="authG2" x1="2" y1="12" x2="22" y2="12">
                    <stop stopColor="#7c3aed" />
                    <stop offset="1" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span style={s.brandName}>
              Recruit<span style={s.brandAI}>AI</span>
            </span>
          </Link>

          <nav className="wow-auth-nav" style={s.navLinks}>
            <Link to="/" style={s.navMuted}>
              Accueil
            </Link>
            <Link to="/login" style={{ ...s.navLink, ...(isLogin ? s.navLinkActive : {}) }}>
              Connexion
            </Link>
            <Link to="/signup" style={s.navBtn}>
              S&apos;inscrire
            </Link>
          </nav>
        </div>
      </header>

      <div className="wow-auth-content" style={s.content}>
        <div className="auth-layout-left wow-auth-left" style={s.leftPanel}>
          <motion.div
            className="wow-auth-left-inner"
            style={s.leftInner}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={s.badge}>
              <span style={s.badgeDot} />
              Expérience sécurisée
            </div>

            <h1 style={s.heroTitle}>
              Recrutez avec précision.
              <br />
              <span style={s.heroAccent}>Décidez avec confiance.</span>
            </h1>

            <p style={s.heroParagraph}>
              Tests, scoring et pipeline en un seul écosystème. Moins d&apos;outils, plus de clarté pour
              vos équipes et vos candidats.
            </p>

            <div style={s.statRow}>
              {[
                { v: '4.9', l: 'Note moyenne' },
                { v: '2.4×', l: 'Plus rapide' },
                { v: 'SOC2', l: 'Ready' },
              ].map((x) => (
                <div key={x.l} style={s.statCard}>
                  <div style={s.statVal}>{x.v}</div>
                  <div style={s.statLbl}>{x.l}</div>
                </div>
              ))}
            </div>

            <div style={s.features}>
              {[
                'Analyse des réponses en temps réel',
                'Rôles RH & candidat séparés',
                'Exports et rapports prêts à présenter',
              ].map((f, i) => (
                <div key={i} style={s.featureRow}>
                  <div style={s.featureCheck}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={s.featureText}>{f}</span>
                </div>
              ))}
            </div>

            <div style={s.testimonial}>
              <div style={s.testimonialAvatars}>
                {['MR', 'AS', 'KB'].map((a, i) => (
                  <div key={a} style={{ ...s.avatar, marginLeft: i > 0 ? -10 : 0 }}>
                    {a}
                  </div>
                ))}
              </div>
              <div>
                <div style={s.stars}>★★★★★</div>
                <div style={s.testimonialText}>+500 recruteurs nous font confiance</div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="wow-auth-right" style={s.rightPanel}>
          <motion.div
            className="wow-auth-form-card"
            style={s.formCard}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'DM Sans', 'Inter', sans-serif",
  },

  mesh: {
    position: 'fixed',
    inset: 0,
    background:
      'radial-gradient(ellipse 90% 60% at 10% 20%, rgba(124, 58, 237, 0.35), transparent 50%),' +
      'radial-gradient(ellipse 70% 50% at 90% 10%, rgba(6, 182, 212, 0.22), transparent 45%),' +
      'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(99, 102, 241, 0.2), transparent 50%)',
    pointerEvents: 'none',
  },

  gridOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),' +
      'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
    backgroundSize: '56px 56px',
    maskImage: 'radial-gradient(ellipse 90% 70% at 50% 40%, black 15%, transparent 70%)',
    pointerEvents: 'none',
  },

  topNav: {
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  navInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 28px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(6,182,212,0.15))',
    border: '1px solid rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 17,
    fontWeight: 800,
    color: '#f8fafc',
    letterSpacing: '-0.03em',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  brandAI: {
    background: 'linear-gradient(90deg, #7c3aed, #22d3ee)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  navMuted: {
    padding: '8px 14px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(226,232,240,0.75)',
    textDecoration: 'none',
    transition: 'color 0.15s',
  },
  navLink: {
    padding: '8px 14px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(226,232,240,0.85)',
    textDecoration: 'none',
  },
  navLinkActive: {
    color: '#fff',
    fontWeight: 600,
    background: 'rgba(255,255,255,0.08)',
  },
  navBtn: {
    padding: '10px 18px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
    textDecoration: 'none',
    background: 'linear-gradient(135deg, #fff, #e2e8f0)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
  },

  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'stretch',
    maxWidth: 1200,
    margin: '0 auto',
    padding: '48px 28px 64px',
    gap: 56,
    width: '100%',
  },

  leftPanel: {
    flex: '0 0 46%',
    alignItems: 'center',
  },
  leftInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    maxWidth: 440,
  },

  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    color: '#e9d5ff',
    background: 'rgba(124, 58, 237, 0.25)',
    border: '1px solid rgba(167, 139, 250, 0.35)',
    width: 'fit-content',
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#22d3ee',
    boxShadow: '0 0 12px rgba(34, 211, 238, 0.6)',
  },

  heroTitle: {
    fontSize: 'clamp(32px, 3.5vw, 48px)',
    fontWeight: 800,
    color: '#f8fafc',
    lineHeight: 1.12,
    letterSpacing: '-0.035em',
    margin: 0,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  heroAccent: {
    background: 'linear-gradient(90deg, #c4b5fd, #22d3ee)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  },
  heroParagraph: {
    fontSize: 16,
    color: 'rgba(226,232,240,0.75)',
    lineHeight: 1.75,
    margin: 0,
  },

  statRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: '1 1 100px',
    padding: '14px 16px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  statVal: {
    fontSize: 22,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.02em',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  statLbl: {
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(226,232,240,0.55)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginTop: 4,
  },

  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  featureRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'rgba(124, 58, 237, 0.25)',
    border: '1px solid rgba(167, 139, 250, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(241,245,249,0.9)',
    fontWeight: 500,
  },

  testimonial: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    width: 'fit-content',
  },
  testimonialAvatars: {
    display: 'flex',
    flexShrink: 0,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #0f172a',
  },
  stars: {
    fontSize: 13,
    color: '#fbbf24',
    letterSpacing: 1,
  },
  testimonialText: {
    fontSize: 13,
    fontWeight: 600,
    color: '#e2e8f0',
  },

  rightPanel: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  formCard: {
    background: 'rgba(255,255,255,0.97)',
    border: '1px solid rgba(255,255,255,0.5)',
    borderRadius: 24,
    padding: '40px 40px 36px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
  },
};

export default AuthLayout;
