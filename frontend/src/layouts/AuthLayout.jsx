import { Outlet, Link, useLocation } from 'react-router-dom';

function AuthLayout() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';

  return (
    <div style={s.root}>
      {/* Background decorations */}
      <div style={s.bgOrb1} />
      <div style={s.bgOrb2} />

      {/* Top nav */}
      <header style={s.topNav}>
        <div style={s.navInner}>
          <Link to="/" style={s.brand}>
            <div style={s.brandIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#5B3FA8" opacity="0.9" />
                <path d="M2 17l10 5 10-5" stroke="#5B3FA8" strokeWidth="2" strokeLinecap="round" />
                <path d="M2 12l10 5 10-5" stroke="#5B3FA8" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span style={s.brandName}>Recruit <span style={s.brandAI}>AI</span></span>
          </Link>

          <nav style={s.navLinks}>
            <Link to="/login" style={{ ...s.navLink, ...(isLogin ? s.navLinkActive : {}) }}>Se connecter</Link>
            <Link to="/signup" style={s.navBtn}>Commencer →</Link>
          </nav>
        </div>
      </header>

      {/* Main: two-column */}
      <div style={s.content}>
        {/* Left: branding */}
        <div style={s.leftPanel}>
          <div style={s.leftInner}>
            {/* Badge */}
            <div style={s.badge}>
              <span style={s.badgeDot} />
              Plateforme de recrutement IA
            </div>

            <h1 style={s.heroTitle}>
              Recrutez plus vite,<br />
              <span style={s.heroAccent}>avec l'IA.</span>
            </h1>

            <p style={s.heroParagraph}>
              Analysez et classifiez les candidats automatiquement.
              Gagnez du temps et prenez de meilleures décisions de recrutement.
            </p>

            {/* Feature list */}
            <div style={s.features}>
              {[
                'Analyse des CV par IA en quelques secondes',
                'Score de correspondance automatique',
                'Réduction des biais de recrutement',
                'Tableaux de bord en temps réel',
              ].map((f, i) => (
                <div key={i} style={s.featureRow}>
                  <div style={s.featureCheck}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#5B3FA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={s.featureText}>{f}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div style={s.testimonial}>
              <div style={s.testimonialAvatars}>
                {['MR', 'AS', 'KB'].map((a, i) => (
                  <div key={i} style={{ ...s.avatar, marginLeft: i > 0 ? -10 : 0 }}>{a}</div>
                ))}
              </div>
              <div>
                <div style={s.stars}>★★★★★</div>
                <div style={s.testimonialText}>+500 recruteurs font confiance à notre plateforme</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: form card */}
        <div style={s.rightPanel}>
          <div style={s.formCard}>
            <Outlet />
          </div>
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
    background: 'var(--bg-light)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
  },

  bgOrb1: {
    position: 'fixed',
    top: -200, right: -200,
    width: 600, height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(91,63,168,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'fixed',
    bottom: -300, left: -200,
    width: 700, height: 700,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(91,63,168,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },

  /* Top nav */
  topNav: {
    background: 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  navInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 32px',
    height: 60,
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
    width: 36, height: 36,
    borderRadius: 10,
    background: 'var(--purple-soft)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid var(--purple-bg)',
  },
  brandName: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--text-heading)',
    letterSpacing: '-0.02em',
  },
  brandAI: {
    color: 'var(--purple)',
  },
  navLinks: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  navLink: {
    padding: '6px 16px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-body)',
    textDecoration: 'none',
    transition: 'color 0.15s',
  },
  navLinkActive: {
    color: 'var(--purple)',
    fontWeight: 600,
  },
  navBtn: {
    padding: '8px 18px',
    background: 'var(--purple)',
    color: '#fff',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.15s',
    boxShadow: '0 4px 12px rgba(91,63,168,0.25)',
  },

  /* Two-column content */
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    maxWidth: 1200,
    margin: '0 auto',
    padding: '48px 32px',
    gap: 80,
    width: '100%',
  },

  leftPanel: {
    flex: '0 0 50%',
  },
  leftInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
  },

  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    background: 'var(--purple-bg)',
    color: 'var(--purple)',
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 600,
    width: 'fit-content',
  },
  badgeDot: {
    width: 7, height: 7,
    borderRadius: '50%',
    background: 'var(--purple)',
    display: 'inline-block',
  },

  heroTitle: {
    fontSize: 'clamp(32px, 3.5vw, 48px)',
    fontWeight: 800,
    color: 'var(--text-heading)',
    lineHeight: 1.15,
    letterSpacing: '-0.03em',
    margin: 0,
  },
  heroAccent: {
    color: 'var(--purple)',
  },
  heroParagraph: {
    fontSize: 16,
    color: 'var(--text-body)',
    lineHeight: 1.7,
    maxWidth: 440,
    margin: 0,
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
    width: 22, height: 22,
    borderRadius: '50%',
    background: 'var(--purple-bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    color: 'var(--text-body)',
    fontWeight: 500,
  },

  testimonial: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 20px',
    background: 'var(--bg-white)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    boxShadow: 'var(--shadow-sm)',
    width: 'fit-content',
  },
  testimonialAvatars: {
    display: 'flex',
    flexShrink: 0,
  },
  avatar: {
    width: 32, height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--purple), var(--purple-light))',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid var(--bg-white)',
  },
  stars: {
    fontSize: 13,
    color: '#F59E0B',
    letterSpacing: 1,
  },
  testimonialText: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-heading)',
  },

  rightPanel: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  formCard: {
    background: 'var(--bg-white)',
    border: '1px solid var(--border)',
    borderRadius: 24,
    padding: '40px 40px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 8px 40px rgba(4,20,52,0.08), 0 2px 8px rgba(4,20,52,0.04)',
    animation: 'scaleIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
  },
};

export default AuthLayout;
