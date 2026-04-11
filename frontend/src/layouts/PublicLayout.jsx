import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import { submitLead } from '../api/contact';
import '../styles/public.css';

const ANNOUNCEMENT_ITEMS = [
  'Nouveau: matching intelligent des offres selon profil candidat',
  'Recherche publique enrichie: categorie, localisation, domaine',
  'Espace entreprise/RH disponible depuis Inscription',
];

function FooterNewsletter() {
  const { message } = AntdApp.useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      message.warning('Indiquez une adresse e-mail valide.');
      return;
    }
    setLoading(true);
    try {
      await submitLead({ type: 'newsletter', email: e, message: 'Inscription newsletter' });
      message.success('Merci ! Vous êtes inscrit·e à la veille RH.');
      setEmail('');
    } catch (err) {
      message.error(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pub-newsletter">
      <p className="pub-newsletter-label">Recevez nos actualités RH (1 email/mois)</p>
      <div className="pub-newsletter-row">
        <input
          type="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          placeholder="vous@entreprise.com"
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          className="pub-newsletter-input"
        />
        <button onClick={onSubmit} disabled={loading} className="pub-newsletter-btn">
          {loading ? '...' : "S'inscrire"}
        </button>
      </div>
    </div>
  );
}

const NAV_LINKS = [
  { to: '/', label: 'Produit', exact: true },
  { to: '/companies', label: 'Entreprises' },
  { to: '/careers', label: 'Offres' },
  { to: '/recruiters', label: 'Recruteurs' },
  { to: '/events', label: 'Événements' },
  { to: '/contact', label: 'Contact' },
];

function PublicLayout() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Detect scroll for navbar style change
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY || 0;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(100, (y / docHeight) * 100) : 0;
      setScrolled(y > 20);
      setScrollProgress(progress);
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isActive = (link) => {
    if (link.exact) return pathname === link.to;
    return pathname.startsWith(link.to);
  };

  // Check if we are on the home page (dark bg hero)
  const isHome = pathname === '/';

  return (
    <div className={`pub-root wow-public-shell ${isHome ? 'pub-root--dark' : ''}`}>
      <div className="pub-announcement" aria-label="actualites plateforme">
        <div className="pub-announcement-track">
          {ANNOUNCEMENT_ITEMS.map((item) => (
            <span key={`a-${item}`} className="pub-announcement-item">{item}</span>
          ))}
          {ANNOUNCEMENT_ITEMS.map((item) => (
            <span key={`b-${item}`} className="pub-announcement-item">{item}</span>
          ))}
        </div>
      </div>

      {/* ── Navbar ── */}
      <header className={`pub-nav ${scrolled ? 'pub-nav--scrolled' : ''} ${isHome ? 'pub-nav--dark' : ''}`}>
        <div className="pub-nav-inner">

          {/* Brand */}
          <Link to="/" className="pub-brand">
            <div className="pub-brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#navG1)" />
                <path d="M2 12l10 5 10-5" stroke="url(#navG2)" strokeWidth="2.2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="navG1" x1="2" y1="2" x2="22" y2="14" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#a78bfa" />
                    <stop offset="1" stopColor="#22d3ee" />
                  </linearGradient>
                  <linearGradient id="navG2" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#a78bfa" />
                    <stop offset="1" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="pub-brand-name">
              Recruit<span className="pub-brand-ai">AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="pub-nav-links" aria-label="Principal">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`pub-nav-link ${isActive(link) ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="pub-nav-actions">
            <Link to="/login" className="pub-nav-ghost">Connexion</Link>
            <Link to="/signup" className="pub-nav-cta">
              Commencer <ArrowRight size={15} />
            </Link>
            {/* Mobile toggle */}
            <button
              className="pub-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Fermer menu' : 'Ouvrir menu'}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="pub-mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={link.to}
                    className={`pub-mobile-link ${isActive(link) ? 'active' : ''}`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="pub-mobile-actions">
                <Link to="/login" className="pub-mobile-ghost">Connexion</Link>
                <Link to="/signup" className="pub-mobile-cta">Commencer →</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="pub-scroll-progress" aria-hidden>
          <span style={{ transform: `scaleX(${scrollProgress / 100})` }} />
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="pub-main">
        <Outlet />
      </main>
      <div className="pub-float-actions">
        <Link to="/careers" className="pub-float-link">Voir les offres</Link>
        <Link to="/signup" className="pub-float-link pub-float-link--primary">Creer un compte</Link>
      </div>

      {/* ── Footer ── */}
      <footer className="pub-footer">
        <div className="pub-footer-inner">
          <div className="pub-footer-brand">
            <Link to="/" className="pub-brand" style={{ color: 'inherit', textDecoration: 'none' }}>
              <div className="pub-brand-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#ftG1)" />
                  <path d="M2 12l10 5 10-5" stroke="url(#ftG2)" strokeWidth="2.2" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="ftG1" x1="2" y1="2" x2="22" y2="14">
                      <stop stopColor="#a78bfa" /><stop offset="1" stopColor="#22d3ee" />
                    </linearGradient>
                    <linearGradient id="ftG2" x1="2" y1="12" x2="22" y2="12">
                      <stop stopColor="#a78bfa" /><stop offset="1" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="pub-brand-name">Recruit<span className="pub-brand-ai">AI</span></span>
            </Link>
            <p className="pub-footer-tag">Recrutement intelligent, expérience candidat irréprochable.</p>
            <FooterNewsletter />
          </div>

          <div className="pub-footer-cols">
            <div className="pub-footer-col">
              <h4>Plateforme</h4>
              <Link to="/">Produit</Link>
              <Link to="/careers">Offres d'emploi</Link>
              <Link to="/companies">Entreprises</Link>
              <Link to="/recruiters">Recruteurs</Link>
            </div>
            <div className="pub-footer-col">
              <h4>Ressources</h4>
              <Link to="/events">Événements</Link>
              <Link to="/contact">Contact & démo</Link>
              <Link to="/specs">Cahier des charges</Link>
              <Link to="/terms">CGU</Link>
              <Link to="/privacy">Confidentialité</Link>
            </div>
            <div className="pub-footer-col">
              <h4>Espace</h4>
              <Link to="/login">Connexion</Link>
              <Link to="/signup">Inscription</Link>
            </div>
          </div>
        </div>

        <div className="pub-footer-bottom">
          <p>© {new Date().getFullYear()} RecruitAI. Tous droits réservés.</p>
          <div className="pub-footer-social">
            <span>Fait avec ♥ en France</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
