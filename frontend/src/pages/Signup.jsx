import { useState, useContext } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import { AuthContext } from '../contexts/authContext';
import { signup } from '../api/auth';
import { setStoredToken } from '../utils/authStorage';
import { motion } from 'framer-motion';

/* ─── SVG icons ─────────────────────────────────────────────────────────── */
const IcoUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IcoMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IcoLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IcoEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IcoEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

/* ─── Password validator ─────────────────────────────────────────────────── */
function validatePassword(pw, firstName = '', lastName = '') {
  const errors = [];
  if (!pw || pw.length < 8) errors.push('Minimum 8 caractères');
  if (!/[A-Z]/.test(pw || '')) errors.push('Au moins une majuscule');
  if (!/[a-z]/.test(pw || '')) errors.push('Au moins une minuscule');
  if (!/[0-9]/.test(pw || '')) errors.push('Au moins un chiffre');
  const n = (pw || '').toLowerCase();
  if (firstName && n.includes(firstName.toLowerCase())) errors.push('Ne doit pas contenir votre prénom');
  if (lastName && n.includes(lastName.toLowerCase())) errors.push('Ne doit pas contenir votre nom');
  return errors;
}

const PW_RULES = [
  { label: '8 caractères minimum', test: v => v.length >= 8 },
  { label: 'Une majuscule', test: v => /[A-Z]/.test(v) },
  { label: 'Une minuscule', test: v => /[a-z]/.test(v) },
  { label: 'Un chiffre', test: v => /[0-9]/.test(v) },
];

const STEPS = [
  { id: 'role',    label: 'Votre profil' },
  { id: 'info',   label: 'Informations' },
  { id: 'secure', label: 'Sécurité' },
];

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken, setUser } = useContext(AuthContext);
  const { message } = AntdApp.useApp();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState(searchParams.get('role') === 'HR' ? 'HR' : 'candidat');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };
  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.firstName.trim()) e.firstName = 'Prénom requis';
      if (!form.lastName.trim()) e.lastName = 'Nom requis';
      if (!form.email.trim()) e.email = 'E-mail requis';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format invalide';
    }
    if (step === 2) {
      const pwErrors = validatePassword(form.password, form.firstName, form.lastName);
      if (pwErrors.length) e.password = pwErrors[0];
      if (!form.confirm) e.confirm = 'Confirmation requise';
      else if (form.password !== form.confirm) e.confirm = 'Les mots de passe ne correspondent pas';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep()) { triggerShake(); return; }
    setStep(s => s + 1);
  };

  const prev = () => setStep(s => s - 1);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateStep()) { triggerShake(); return; }
    setLoading(true);
    try {
      const data = await signup({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirm,
        role,
      });
      if (!data.status) throw new Error(data.message);
      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
      message.success('Compte créé avec succès !');
      if (!data.user?.onboardingDone) navigate('/onboarding');
      else if (data.user?.role === 'HR') navigate('/rh/dashboard');
      else navigate('/tests');
    } catch (err) {
      triggerShake();
      message.error(err.message || "Échec de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = form.password ? PW_RULES.filter(r => r.test(form.password)).length : 0;
  const strengthColor = ['#ef4444', '#f97316', '#eab308', '#22c55e'][Math.max(0, pwStrength - 1)] || '#e2e8f0';
  const strengthLabel = ['', 'Faible', 'Moyen', 'Bon', 'Fort'][pwStrength] || '';

  return (
    <div style={page}>
      <div style={mesh} aria-hidden />
      <div style={gridOverlay} aria-hidden />

      {/* ── TOP NAV ── */}
      <header style={topNav}>
        <Link to="/" style={brandLink}>
          <div style={brandIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#slg1)"/>
              <path d="M2 12l10 5 10-5" stroke="url(#slg2)" strokeWidth="2.2" strokeLinecap="round"/>
              <defs>
                <linearGradient id="slg1" x1="2" y1="2" x2="22" y2="14" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a78bfa"/><stop offset="1" stopColor="#22d3ee"/>
                </linearGradient>
                <linearGradient id="slg2" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a78bfa"/><stop offset="1" stopColor="#22d3ee"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span style={brandName}>Recruit<span style={brandAI}>AI</span></span>
        </Link>
        <div style={navActions}>
          <Link to="/" style={navGhost}>Accueil</Link>
          <Link to="/login" style={navCta}>Connexion</Link>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={body}>
        {/* LEFT PANEL */}
        <motion.div style={leftPanel}
          initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
          <div style={leftInner}>
            <div style={pill}><span style={pillDot} />Inscription instantanée — aucune confirmation e-mail</div>

            <h1 style={heroTitle}>
              Rejoignez<br />
              <span style={heroGrad}>RecruitAI dès maintenant.</span>
            </h1>

            <p style={heroPara}>Créez votre espace en 60 secondes. Candidat ou entreprise — tout est prêt.</p>

            <div style={benefitCards}>
              {[
                { icon: '🎯', title: 'Matching intelligent', desc: 'Offres personnalisées selon votre profil' },
                { icon: '⚡', title: 'Accès immédiat', desc: 'Votre espace actif sans délai' },
                { icon: '🔒', title: 'Données sécurisées', desc: 'Chiffrement AES-256 & conformité RGPD' },
                { icon: '📊', title: 'Tableau de bord', desc: 'Pipeline, tests et rapports en temps réel' },
              ].map(b => (
                <div key={b.title} style={benefitCard}>
                  <span style={benefitIcon}>{b.icon}</span>
                  <div>
                    <div style={benefitTitle}>{b.title}</div>
                    <div style={benefitDesc}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div style={proof}>
              <div style={avatars}>
                {['MR', 'AS', 'KB', 'LT'].map((a, i) => (
                  <div key={a} style={{ ...avatar, marginLeft: i > 0 ? -10 : 0 }}>{a}</div>
                ))}
              </div>
              <div>
                <div style={stars}>★★★★★</div>
                <div style={proofTxt}>+500 équipes nous font confiance</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT PANEL */}
        <div style={rightPanel}>
          <motion.div style={{ ...card, ...(shake ? {} : {}) }}
            className={shake ? 'shake' : ''}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>

            {/* Step indicator */}
            <div style={stepbar}>
              {STEPS.map((s, i) => (
                <div key={s.id} style={stepItem}>
                  <div style={{
                    ...stepCircle,
                    background: i < step ? '#7c3aed' : i === step ? 'linear-gradient(135deg,#7c3aed,#6366f1)' : '#e2e8f0',
                    color: i <= step ? '#fff' : '#94a3b8',
                    boxShadow: i === step ? '0 0 0 4px rgba(124,58,237,0.2)' : 'none',
                  }}>
                    {i < step ? <IcoCheck /> : i + 1}
                  </div>
                  <span style={{ ...stepLabel, color: i === step ? '#7c3aed' : i < step ? '#334155' : '#94a3b8' }}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div style={{ ...stepLine, background: i < step ? '#7c3aed' : '#e2e8f0' }} />
                  )}
                </div>
              ))}
            </div>

            {/* STEP 0 — Role */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <h2 style={cardTitle}>Votre profil</h2>
                <p style={cardSub}>Choisissez votre type de compte</p>

                <div style={roleGrid}>
                  {[
                    { v: 'candidat', icon: '🧑‍💼', title: 'Candidat', desc: 'Je cherche un emploi ou souhaite passer des tests' },
                    { v: 'HR',       icon: '🏢', title: 'Entreprise / RH', desc: 'Je recrute et gère des candidats' },
                  ].map(r => (
                    <button key={r.v} type="button"
                      onClick={() => setRole(r.v)}
                      style={{
                        ...roleCard,
                        borderColor: role === r.v ? '#7c3aed' : '#e2e8f0',
                        background: role === r.v ? 'rgba(124,58,237,0.06)' : '#fafafa',
                        boxShadow: role === r.v ? '0 0 0 3px rgba(124,58,237,0.15)' : 'none',
                      }}>
                      <span style={{ fontSize: 32, marginBottom: 8, display: 'block' }}>{r.icon}</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{r.title}</div>
                      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{r.desc}</div>
                      {role === r.v && (
                        <div style={roleCheck}><IcoCheck /></div>
                      )}
                    </button>
                  ))}
                </div>

                <button style={submitBtn} type="button" onClick={next}>
                  Continuer <IcoArrow />
                </button>
              </motion.div>
            )}

            {/* STEP 1 — Info */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <h2 style={cardTitle}>Vos informations</h2>
                <p style={cardSub}>Comment s'appelle-t-on ?</p>

                <form onSubmit={e => { e.preventDefault(); next(); }}>
                  {/* Name row */}
                  <div style={nameRow}>
                    <div style={field}>
                      <label style={label} htmlFor="su-fn">Prénom *</label>
                      <div style={{ position: 'relative' }}>
                        <span style={inputIcon}><IcoUser /></span>
                        <input id="su-fn" type="text" autoComplete="given-name"
                          value={form.firstName} onChange={e => set('firstName', e.target.value)}
                          placeholder="Prénom" autoFocus
                          style={{ ...input, borderColor: errors.firstName ? '#ef4444' : undefined }} />
                      </div>
                      {errors.firstName && <span style={errTxt}>{errors.firstName}</span>}
                    </div>
                    <div style={field}>
                      <label style={label} htmlFor="su-ln">Nom *</label>
                      <div style={{ position: 'relative' }}>
                        <input id="su-ln" type="text" autoComplete="family-name"
                          value={form.lastName} onChange={e => set('lastName', e.target.value)}
                          placeholder="Nom"
                          style={{ ...input, paddingLeft: 14, borderColor: errors.lastName ? '#ef4444' : undefined }} />
                      </div>
                      {errors.lastName && <span style={errTxt}>{errors.lastName}</span>}
                    </div>
                  </div>

                  {/* Email */}
                  <div style={field}>
                    <label style={label} htmlFor="su-email">Adresse e-mail *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={inputIcon}><IcoMail /></span>
                      <input id="su-email" type="email" autoComplete="email"
                        value={form.email} onChange={e => set('email', e.target.value)}
                        placeholder="votre@email.com"
                        style={{ ...input, borderColor: errors.email ? '#ef4444' : undefined }} />
                    </div>
                    {errors.email && <span style={errTxt}>{errors.email}</span>}
                  </div>

                  <div style={navBtns}>
                    <button type="button" style={backBtn} onClick={prev}>← Retour</button>
                    <button type="submit" style={{ ...submitBtn, flex: 1 }}>
                      Continuer <IcoArrow />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 2 — Password */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <h2 style={cardTitle}>Sécurisez votre compte</h2>
                <p style={cardSub}>Choisissez un mot de passe robuste</p>

                <form onSubmit={handleSubmit}>
                  {/* Password */}
                  <div style={field}>
                    <label style={label} htmlFor="su-pw">Mot de passe *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={inputIcon}><IcoLock /></span>
                      <input id="su-pw" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                        value={form.password} onChange={e => set('password', e.target.value)}
                        placeholder="Mot de passe sécurisé" autoFocus
                        style={{ ...input, paddingRight: 44, borderColor: errors.password ? '#ef4444' : undefined }} />
                      <button type="button" style={eyeBtn} onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                        {showPw ? <IcoEyeOff /> : <IcoEye />}
                      </button>
                    </div>
                    {errors.password && <span style={errTxt}>{errors.password}</span>}
                  </div>

                  {/* Strength bar */}
                  {form.password && (
                    <div style={strengthWrap}>
                      <div style={strengthTrack}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= pwStrength ? strengthColor : '#e2e8f0', transition: 'background 0.3s' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: strengthColor, fontWeight: 700 }}>{strengthLabel}</div>
                    </div>
                  )}

                  {/* PW rules */}
                  <div style={pwRules}>
                    {PW_RULES.map(r => {
                      const ok = r.test(form.password);
                      return (
                        <div key={r.label} style={{ ...pwRule, color: ok ? '#16a34a' : '#94a3b8' }}>
                          <div style={{ ...ruleIcon, background: ok ? '#dcfce7' : '#f1f5f9', color: ok ? '#16a34a' : '#cbd5e1' }}>
                            <IcoCheck />
                          </div>
                          {r.label}
                        </div>
                      );
                    })}
                  </div>

                  {/* Confirm */}
                  <div style={field}>
                    <label style={label} htmlFor="su-confirm">Confirmer le mot de passe *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={inputIcon}><IcoLock /></span>
                      <input id="su-confirm" type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
                        value={form.confirm} onChange={e => set('confirm', e.target.value)}
                        placeholder="Confirmer le mot de passe"
                        style={{ ...input, paddingRight: 44, borderColor: errors.confirm ? '#ef4444' : undefined }} />
                      <button type="button" style={eyeBtn} onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                        {showConfirm ? <IcoEyeOff /> : <IcoEye />}
                      </button>
                    </div>
                    {errors.confirm && <span style={errTxt}>{errors.confirm}</span>}
                  </div>

                  <div style={navBtns}>
                    <button type="button" style={backBtn} onClick={prev}>← Retour</button>
                    <button type="submit" disabled={loading}
                      style={{ ...submitBtn, flex: 1, opacity: loading ? 0.7 : 1 }}>
                      {loading ? 'Création…' : <><span>Créer mon compte</span> <IcoArrow /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            <p style={footerTxt}>
              Déjà membre ?{' '}
              <Link to="/login" style={accentLink}>Se connecter</Link>
            </p>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)} 15%,45%,75%{transform:translateX(-6px)} 30%,60%,90%{transform:translateX(6px)}
        }
        .shake { animation: shake 0.45s ease; }
        input:focus { outline:none; border-color:#7c3aed !important; box-shadow:0 0 0 3px rgba(124,58,237,0.15) !important; }
        button:focus-visible { outline:2px solid #7c3aed; outline-offset:2px; }
      `}</style>
    </div>
  );
}

/* ─── STYLES ──────────────────────────────────────────────────────────── */
const page = { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a', fontFamily: "'Inter','DM Sans',system-ui,sans-serif", position: 'relative', overflow: 'hidden' };
const mesh = { position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 55% at 15% 20%,rgba(124,58,237,0.36),transparent 55%),radial-gradient(ellipse 65% 45% at 88% 12%,rgba(6,182,212,0.2),transparent 48%),radial-gradient(ellipse 55% 40% at 50% 95%,rgba(99,102,241,0.2),transparent 52%)' };
const gridOverlay = { position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize: '52px 52px', maskImage: 'radial-gradient(ellipse 90% 70% at 50% 40%,black 10%,transparent 72%)' };
const topNav = { position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 64, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.07)' };
const brandLink = { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' };
const brandIcon = { width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,rgba(124,58,237,.22),rgba(6,182,212,.14))', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const brandName = { fontSize: 17, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em' };
const brandAI = { background: 'linear-gradient(90deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const navActions = { display: 'flex', alignItems: 'center', gap: 8 };
const navGhost = { padding: '8px 14px', borderRadius: 9, fontSize: 14, fontWeight: 600, color: 'rgba(203,213,225,0.75)', textDecoration: 'none' };
const navCta = { padding: '9px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#0f172a', background: 'linear-gradient(135deg,#fff,#e2e8f0)', textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' };
const body = { flex: 1, display: 'flex', alignItems: 'stretch', maxWidth: 1200, margin: '0 auto', padding: '36px 28px 56px', gap: 56, width: '100%', position: 'relative', zIndex: 1 };
const leftPanel = { flex: '0 0 44%', display: 'flex', alignItems: 'center' };
const leftInner = { display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 430 };
const pill = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#e9d5ff', background: 'rgba(124,58,237,0.22)', border: '1px solid rgba(167,139,250,0.3)', width: 'fit-content' };
const pillDot = { width: 7, height: 7, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 12px rgba(34,211,238,0.6)', flexShrink: 0 };
const heroTitle = { margin: 0, fontSize: 'clamp(28px,3.2vw,44px)', fontWeight: 800, color: '#f8fafc', lineHeight: 1.13, letterSpacing: '-0.035em', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" };
const heroGrad = { background: 'linear-gradient(90deg,#c4b5fd,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const heroPara = { margin: 0, fontSize: 15, color: 'rgba(226,232,240,0.7)', lineHeight: 1.75 };
const benefitCards = { display: 'flex', flexDirection: 'column', gap: 10 };
const benefitCard = { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', transition: 'border-color 0.2s' };
const benefitIcon = { fontSize: 22, flexShrink: 0, marginTop: 1 };
const benefitTitle = { fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 };
const benefitDesc = { fontSize: 12.5, color: 'rgba(203,213,225,0.6)' };
const proof = { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, width: 'fit-content' };
const avatars = { display: 'flex', flexShrink: 0 };
const avatar = { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a' };
const stars = { fontSize: 12, color: '#fbbf24', letterSpacing: 1 };
const proofTxt = { fontSize: 12.5, fontWeight: 600, color: '#e2e8f0' };

/* Card */
const rightPanel = { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 4 };
const card = { width: '100%', maxWidth: 450, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(255,255,255,0.45)', borderRadius: 24, padding: '32px 34px 28px', boxShadow: '0 32px 80px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.06)' };
const cardTitle = { margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" };
const cardSub = { margin: '5px 0 20px', fontSize: 14, color: '#94a3b8' };

/* Step bar */
const stepbar = { display: 'flex', alignItems: 'center', marginBottom: 22, gap: 0 };
const stepItem = { display: 'flex', alignItems: 'center', flex: 1, gap: 6, minWidth: 0 };
const stepCircle = { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, flexShrink: 0, transition: 'all 0.3s' };
const stepLabel = { fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', transition: 'color 0.3s', display: 'none' };
const stepLine = { flex: 1, height: 2, borderRadius: 2, minWidth: 12, transition: 'background 0.3s' };

/* Role card */
const roleGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 };
const roleCard = { position: 'relative', padding: '20px 14px 16px', borderRadius: 14, border: '2px solid', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', fontFamily: 'inherit' };
const roleCheck = { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: '50%', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' };

/* Form elements */
const nameRow = { display: 'flex', gap: 10 };
const field = { marginBottom: 16, flex: 1 };
const label = { display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 };
const inputIcon = { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#a78bfa', display: 'flex', pointerEvents: 'none' };
const input = { width: '100%', height: 46, paddingLeft: 38, paddingRight: 14, borderRadius: 11, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' };
const eyeBtn = { position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 3 };
const errTxt = { display: 'block', fontSize: 12, color: '#ef4444', marginTop: 4, fontWeight: 500 };

/* Password strength */
const strengthWrap = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: -4 };
const strengthTrack = { display: 'flex', flex: 1, gap: 4 };
const pwRules = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 };
const pwRule = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, transition: 'color 0.2s' };
const ruleIcon = { width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' };

/* Nav buttons */
const navBtns = { display: 'flex', gap: 10, marginTop: 8 };
const backBtn = { height: 46, padding: '0 16px', borderRadius: 11, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
const submitBtn = { width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 11, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#7c3aed,#6366f1)', boxShadow: '0 8px 28px rgba(124,58,237,0.32)', transition: 'all 0.2s', fontFamily: 'inherit' };
const footerTxt = { margin: '18px 0 0', textAlign: 'center', fontSize: 14, color: '#64748b' };
const accentLink = { color: '#7c3aed', fontWeight: 700, textDecoration: 'none' };
