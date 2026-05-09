import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import { AuthContext } from '../contexts/authContext.jsx';
import { login } from '../api/auth';
import { setStoredToken } from '../utils/authStorage';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── tiny SVG icons ──────────────────────────────────────────────────── */
const IcoMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const IcoLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IcoEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IcoEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const IcoArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const FEATURES = [
  'Tests de recrutement en temps réel',
  'Pipeline candidats intelligent',
  'Rapports & exports prêts à l\'emploi',
  'Rôles RH & candidat séparés',
];

const STATS = [
  { v: '4.9★', l: 'Note moyenne' },
  { v: '2.4×', l: 'Plus rapide' },
  { v: '500+', l: 'Entreprises' },
];

function getDefaultRedirectPath(role) {
  if (role === 'HR' || role === 'admin') return '/rh/dashboard';
  if (role === 'candidat') return '/tests';
  return '/';
}

export default function Login() {
  const { setToken, setUser } = useContext(AuthContext);
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [shake, setShake] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let t;
    if (cooldown > 0) t = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'E-mail requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Format invalide';
    if (!password) e.password = 'Mot de passe requis';
    else if (password.length < 8) e.password = 'Le mot de passe doit contenir au moins 8 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) { triggerShake(); return; }
    if (cooldown > 0) { message.warning(`Patientez ${cooldown}s`); return; }
    setLoading(true);
    try {
      const data = await login({ email: email.trim().toLowerCase(), password });
      setStoredToken(data.token, false);
      setToken(data.token);
      setUser(data.user);
      message.success(data.message || 'Bienvenue !');
      const pending = sessionStorage.getItem('pendingTestId');
      if (pending && data.user?.role === 'candidat') {
        sessionStorage.removeItem('pendingTestId');
        navigate(`/tests/${pending}`, { replace: true });
      } else {
        navigate(location.state?.from?.pathname || getDefaultRedirectPath(data.user?.role), { replace: true });
      }
    } catch (err) {
      triggerShake();
      if (err.message?.includes('Too many') || err.status === 429) {
        setCooldown(30);
        message.error('Trop de tentatives — réessayez dans 30s.');
      } else {
        message.error(err.message || 'Connexion échouée');
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div style={page}>
      {/* ── BACKGROUND mesh ── */}
      <div style={mesh} aria-hidden />
      <div style={gridOverlay} aria-hidden />

      {/* ── TOP NAV ── */}
      <header style={topNav}>
        <Link to="/" style={brandLink}>
          <div style={brandIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#lg1)" />
              <path d="M2 12l10 5 10-5" stroke="url(#lg2)" strokeWidth="2.2" strokeLinecap="round" />
              <defs>
                <linearGradient id="lg1" x1="2" y1="2" x2="22" y2="14" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a78bfa" /><stop offset="1" stopColor="#22d3ee" />
                </linearGradient>
                <linearGradient id="lg2" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a78bfa" /><stop offset="1" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span style={brandName}>Recruit<span style={brandAI}>AI</span></span>
        </Link>
        <div style={navActions}>
          <Link to="/" style={navGhost}>Accueil</Link>
          <Link to="/signup" style={navCta}>Créer un compte</Link>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={body}>
        {/* LEFT PANEL */}
        <motion.div style={leftPanel}
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>

          <div style={leftInner}>
            <div style={pill}>
              <span style={pillDot} />
              Expérience sécurisée &amp; certifiée
            </div>

            <h1 style={heroTitle}>
              Recrutez avec<br />
              <span style={heroGrad}>précision &amp; confiance.</span>
            </h1>

            <p style={heroPara}>
              Tests, scoring et pipeline en un seul écosystème. Moins d'outils, plus de clarté.
            </p>

            {/* Stats */}
            <div style={statRow}>
              {STATS.map(s => (
                <div key={s.l} style={statCard}>
                  <div style={statVal}>{s.v}</div>
                  <div style={statLbl}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div style={featureList}>
              {FEATURES.map(f => (
                <div key={f} style={featureRow}>
                  <div style={featureCheck}><IcoCheck /></div>
                  <span style={featureText}>{f}</span>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div style={proof}>
              <div style={avatars}>
                {['MR', 'AS', 'KB'].map((a, i) => (
                  <div key={a} style={{ ...avatar, marginLeft: i > 0 ? -10 : 0 }}>{a}</div>
                ))}
              </div>
              <div>
                <div style={stars}>★★★★★</div>
                <div style={proofTxt}>+500 recruteurs nous font confiance</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT PANEL — FORM */}
        <div style={rightPanel}>
          <motion.div style={card}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={shake ? 'shake' : ''}>

            {/* Alert from router state */}
            <AnimatePresence>
              {location.state?.message && (
                <motion.div style={alertBox}
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}>
                  ℹ️ {location.state.message}
                </motion.div>
              )}
            </AnimatePresence>

            <div style={cardHeader}>
              <h2 style={cardTitle}>Connexion</h2>
              <p style={cardSub}>Accédez à votre espace RecruitAI</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div style={field}>
                <label style={label} htmlFor="login-email">Adresse e-mail</label>
                <div style={{ position: 'relative' }}>
                  <span style={inputIcon}><IcoMail /></span>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(v => ({ ...v, email: '' })); }}
                    placeholder="vous@entreprise.com"
                    style={{ ...input, borderColor: errors.email ? '#ef4444' : undefined }}
                    autoFocus
                  />
                </div>
                {errors.email && <span style={errTxt}>{errors.email}</span>}
              </div>

              {/* Password */}
              <div style={field}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={label} htmlFor="login-pw">Mot de passe</label>
                  <Link to="/forgot-password" style={forgotLink}>Mot de passe oublié ?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={inputIcon}><IcoLock /></span>
                  <input
                    id="login-pw"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(v => ({ ...v, password: '' })); }}
                    placeholder="••••••••"
                    style={{ ...input, paddingRight: 46, borderColor: errors.password ? '#ef4444' : undefined }}
                  />
                  <button type="button" style={eyeBtn} onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? <IcoEyeOff /> : <IcoEye />}
                  </button>
                </div>
                {errors.password && <span style={errTxt}>{errors.password}</span>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || cooldown > 0}
                style={{ ...submitBtn, opacity: loading || cooldown > 0 ? 0.7 : 1 }}>
                {cooldown > 0 ? `Réessayer dans ${cooldown}s` : loading ? 'Connexion…' : (
                  <><span>Se connecter</span><IcoArrow /></>
                )}
              </button>
            </form>

            <p style={footerTxt}>
              Pas encore de compte ?{' '}
              <Link to="/signup" style={accentLink}>Créer un compte</Link>
            </p>

            <div style={dividerHr} />

            <button style={altBtn} type="button" onClick={() => navigate('/signup?role=HR')}>
              🏢 Rejoindre en tant qu'entreprise / RH
            </button>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-6px)} 30%,60%,90%{transform:translateX(6px)}
        }
        .shake { animation: shake 0.45s ease; }
        input:focus { outline: none; border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.15) !important; }
        button:focus-visible { outline: 2px solid #7c3aed; outline-offset: 2px; }
      `}</style>
    </div>
  );
}

/* ─── STYLES ────────────────────────────────────────────────────────────── */
const page = {
  minHeight: '100vh', display: 'flex', flexDirection: 'column',
  background: '#0f172a', fontFamily: "'Inter','DM Sans',system-ui,sans-serif",
  position: 'relative', overflow: 'hidden',
};
const mesh = {
  position: 'fixed', inset: 0, pointerEvents: 'none',
  background:
    'radial-gradient(ellipse 80% 55% at 15% 20%, rgba(124,58,237,0.38),transparent 55%),' +
    'radial-gradient(ellipse 65% 45% at 88% 12%, rgba(6,182,212,0.22),transparent 48%),' +
    'radial-gradient(ellipse 55% 40% at 50% 95%, rgba(99,102,241,0.22),transparent 52%)',
};
const gridOverlay = {
  position: 'fixed', inset: 0, pointerEvents: 'none',
  backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
  backgroundSize: '52px 52px',
  maskImage: 'radial-gradient(ellipse 90% 70% at 50% 40%,black 10%,transparent 72%)',
};
const topNav = {
  position: 'relative', zIndex: 10,
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 32px', height: 64,
  background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(14px)',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
};
const brandLink = { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' };
const brandIcon = {
  width: 38, height: 38, borderRadius: 11,
  background: 'linear-gradient(135deg,rgba(124,58,237,.22),rgba(6,182,212,.14))',
  border: '1px solid rgba(255,255,255,0.12)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const brandName = { fontSize: 17, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em' };
const brandAI = { background: 'linear-gradient(90deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const navActions = { display: 'flex', alignItems: 'center', gap: 8 };
const navGhost = {
  padding: '8px 14px', borderRadius: 9, fontSize: 14, fontWeight: 600,
  color: 'rgba(203,213,225,0.75)', textDecoration: 'none',
};
const navCta = {
  padding: '9px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700,
  color: '#0f172a', background: 'linear-gradient(135deg,#fff,#e2e8f0)',
  textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
};
const body = {
  flex: 1, display: 'flex', alignItems: 'stretch',
  maxWidth: 1200, margin: '0 auto', padding: '40px 28px 60px',
  gap: 60, width: '100%', position: 'relative', zIndex: 1,
};
const leftPanel = { flex: '0 0 46%', display: 'flex', alignItems: 'center' };
const leftInner = { display: 'flex', flexDirection: 'column', gap: 26, maxWidth: 440 };
const pill = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
  color: '#e9d5ff', background: 'rgba(124,58,237,0.22)',
  border: '1px solid rgba(167,139,250,0.3)', width: 'fit-content',
};
const pillDot = { width: 7, height: 7, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 12px rgba(34,211,238,0.6)', flexShrink: 0 };
const heroTitle = {
  margin: 0, fontSize: 'clamp(30px,3.4vw,46px)', fontWeight: 800,
  color: '#f8fafc', lineHeight: 1.13, letterSpacing: '-0.035em',
  fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
};
const heroGrad = {
  background: 'linear-gradient(90deg,#c4b5fd,#22d3ee)',
  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
};
const heroPara = { margin: 0, fontSize: 15.5, color: 'rgba(226,232,240,0.72)', lineHeight: 1.75 };
const statRow = { display: 'flex', gap: 11, flexWrap: 'wrap' };
const statCard = {
  flex: '1 1 90px', padding: '13px 15px', borderRadius: 14,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
};
const statVal = { fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' };
const statLbl = { fontSize: 11, color: 'rgba(226,232,240,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 };
const featureList = { display: 'flex', flexDirection: 'column', gap: 11 };
const featureRow = { display: 'flex', alignItems: 'center', gap: 10 };
const featureCheck = {
  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
  background: 'rgba(124,58,237,0.22)', border: '1px solid rgba(167,139,250,0.3)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa',
};
const featureText = { fontSize: 14, color: 'rgba(241,245,249,0.88)', fontWeight: 500 };
const proof = {
  display: 'flex', alignItems: 'center', gap: 14,
  padding: '15px 18px', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, width: 'fit-content',
};
const avatars = { display: 'flex', flexShrink: 0 };
const avatar = {
  width: 33, height: 33, borderRadius: '50%',
  background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
  color: '#fff', fontSize: 11, fontWeight: 800,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '2px solid #0f172a',
};
const stars = { fontSize: 12, color: '#fbbf24', letterSpacing: 1 };
const proofTxt = { fontSize: 13, fontWeight: 600, color: '#e2e8f0' };

/* Right / Card */
const rightPanel = { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 8 };
const card = {
  width: '100%', maxWidth: 442,
  background: 'rgba(255,255,255,0.97)',
  border: '1px solid rgba(255,255,255,0.45)',
  borderRadius: 24,
  padding: '38px 38px 32px',
  boxShadow: '0 32px 80px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.06)',
};
const alertBox = {
  background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)',
  borderRadius: 10, padding: '12px 14px', fontSize: 13.5, color: '#0369a1',
  marginBottom: 18, overflow: 'hidden',
};
const cardHeader = { marginBottom: 26 };
const cardTitle = {
  margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a',
  letterSpacing: '-0.03em', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
};
const cardSub = { margin: '5px 0 0', fontSize: 14, color: '#94a3b8' };

/* Fields */
const field = { marginBottom: 18 };
const label = { display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 };
const inputIcon = {
  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
  color: '#a78bfa', display: 'flex', pointerEvents: 'none',
};
const input = {
  width: '100%', height: 48, paddingLeft: 40, paddingRight: 16,
  borderRadius: 12, border: '1.5px solid #e2e8f0',
  fontSize: 14, color: '#0f172a', background: '#fff',
  fontFamily: 'inherit', boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};
const eyeBtn = {
  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#94a3b8', display: 'flex', padding: 4,
};
const errTxt = { display: 'block', fontSize: 12, color: '#ef4444', marginTop: 5, fontWeight: 500 };
const forgotLink = { fontSize: 13, color: '#7c3aed', fontWeight: 600, textDecoration: 'none' };
const submitBtn = {
  width: '100%', height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15.5, fontWeight: 700,
  color: '#fff', letterSpacing: '-0.01em',
  background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
  boxShadow: '0 8px 28px rgba(124,58,237,0.35)',
  transition: 'all 0.2s', fontFamily: 'inherit',
};
const footerTxt = { margin: '22px 0 0', textAlign: 'center', fontSize: 14, color: '#64748b' };
const accentLink = { color: '#7c3aed', fontWeight: 700, textDecoration: 'none' };
const dividerHr = { height: 1, background: '#f1f5f9', margin: '20px 0' };
const altBtn = {
  width: '100%', height: 46,
  borderRadius: 12, border: '1.5px solid #e2e8f0',
  background: '#f8fafc', color: '#475569',
  fontSize: 14, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'inherit', transition: 'all 0.18s',
};
