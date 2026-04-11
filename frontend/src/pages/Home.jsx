import '../styles/home.css';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  BriefcaseBusiness,
  CalendarCheck2,
  Users2,
  MapPin,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { getPublicTests } from '../api/tests';
import { getCompanies, getRecruiters } from '../api/company';
import { getEvents } from '../api/event';
import { baseUrl } from '../api/api';

const riseIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
};

function toAssetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}${path}`;
}

function formatDate(value) {
  if (!value) return 'Date à confirmer';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Date à confirmer';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadHomeData = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        getPublicTests({ page: 1, limit: 6, sortBy: 'createdAt', sortOrder: 'desc' }),
        getCompanies({ page: 1, limit: 6, featured: true, sort: 'rating' }),
        getRecruiters({ page: 1, limit: 4 }),
        getEvents({ page: 1, limit: 4, upcoming: true }),
      ]);

      if (cancelled) return;

      const [jobsRes, companiesRes, recruitersRes, eventsRes] = results;

      setJobs(jobsRes.status === 'fulfilled' ? jobsRes.value?.tests || [] : []);
      setCompanies(companiesRes.status === 'fulfilled' ? companiesRes.value?.companies || [] : []);
      setRecruiters(recruitersRes.status === 'fulfilled' ? recruitersRes.value?.recruiters || [] : []);
      setEvents(eventsRes.status === 'fulfilled' ? eventsRes.value?.events || [] : []);
      setLoading(false);
    };

    loadHomeData();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryStats = useMemo(() => {
    const buckets = new Map();
    jobs.forEach((job) => {
      const key = (job.jobRole || 'Autres').trim();
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    return [...buckets.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }));
  }, [jobs]);

  return (
    <div className="hm-home">
      <section className="hm-hero">
        <div className="hm-hero-overlay hm-blob-a" />
        <div className="hm-hero-overlay hm-blob-b" />
        <div className="hm-shell hm-hero-grid">
          <motion.div className="hm-hero-text" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="hm-pill">
              <Sparkles size={14} />
              Plateforme recrutement nouvelle génération
            </div>
            <h1>
              Recrutez plus vite.
              <br />
              Décidez avec confiance.
            </h1>
            <p>
              Une seule plateforme pour publier vos offres, attirer les bons profils, suivre les candidatures et
              collaborer avec votre équipe RH en temps réel.
            </p>
            <div className="hm-hero-actions">
              <Link className="hm-btn hm-btn-primary" to="/careers">
                Explorer les offres <ArrowRight size={16} />
              </Link>
              <Link className="hm-btn hm-btn-secondary" to="/signup?role=HR">
                Espace entreprise / RH
              </Link>
            </div>
            <div className="hm-hero-note">
              <CheckCircle2 size={14} />
              Inscription directe sans vérification email
            </div>
          </motion.div>

          <motion.div
            className="hm-hero-panel"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.7 }}
          >
            <div className="hm-kpi-grid">
              <article>
                <BriefcaseBusiness size={18} />
                <strong>{jobs.length}</strong>
                <span>Offres récentes</span>
              </article>
              <article>
                <Building2 size={18} />
                <strong>{companies.length}</strong>
                <span>Entreprises actives</span>
              </article>
              <article>
                <Users2 size={18} />
                <strong>{recruiters.length}</strong>
                <span>Recruteurs visibles</span>
              </article>
              <article>
                <CalendarCheck2 size={18} />
                <strong>{events.length}</strong>
                <span>Événements à venir</span>
              </article>
            </div>
            <div className="hm-mini-board">
              <h3>Parcours public</h3>
              <ul>
                <li>Consulter les offres par catégorie et localisation</li>
                <li>Explorer les profils recruteurs et entreprises</li>
                <li>Accéder aux détails d’offre et événements emploi</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="hm-signal-band">
        <div className="hm-shell hm-signal-grid">
          <article className="hm-signal-card">
            <Sparkles size={18} />
            <div>
              <h3>Parcours personnalise</h3>
              <p>Premier login guide puis recommandations d'offres selon vos attentes.</p>
            </div>
          </article>
          <article className="hm-signal-card">
            <MapPin size={18} />
            <div>
              <h3>Filtres publics avances</h3>
              <p>Recherche par categorie, localisation, domaine et mots-cles competences.</p>
            </div>
          </article>
          <article className="hm-signal-card">
            <Users2 size={18} />
            <div>
              <h3>Espace entreprise complet</h3>
              <p>Validation admin, profils recruteurs detailles et suivi des candidatures.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="hm-section hm-categories">
        <div className="hm-shell">
          <motion.div className="hm-section-head" {...riseIn}>
            <h2>Catégories qui recrutent maintenant</h2>
            <p>Un aperçu rapide des domaines avec le plus d’opportunités.</p>
          </motion.div>
          <div className="hm-tag-grid">
            {loading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="hm-skeleton hm-tag-skeleton" />)}
            {!loading && categoryStats.length === 0 && (
              <p className="hm-empty">Les catégories apparaîtront ici dès que des offres seront publiées.</p>
            )}
            {!loading &&
              categoryStats.map((item) => (
                <Link key={item.label} className="hm-tag-card" to="/careers">
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <section className="hm-section">
        <div className="hm-shell">
          <motion.div className="hm-section-head hm-head-row" {...riseIn}>
            <div>
              <h2>Offres d’emploi récentes</h2>
              <p>Consultez les dernières opportunités publiées par nos entreprises partenaires.</p>
            </div>
            <Link to="/careers" className="hm-text-link">
              Voir toutes les offres <ArrowRight size={15} />
            </Link>
          </motion.div>

          <div className="hm-card-grid hm-job-grid">
            {loading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="hm-skeleton hm-card-skeleton" />)}
            {!loading && jobs.length === 0 && <p className="hm-empty">Aucune offre disponible pour le moment.</p>}
            {!loading &&
              jobs.map((job) => (
                <article key={job._id} className="hm-card hm-job-card">
                  <div className="hm-job-top">
                    <h3>{job.title || 'Offre d’emploi'}</h3>
                    <span>{job.jobRole || 'Général'}</span>
                  </div>
                  <p>{job.companyName || 'Entreprise partenaire'}</p>
                  <div className="hm-job-meta">
                    <span><MapPin size={13} /> {job.location || 'Non précisé'}</span>
                    <span>{job.employmentType || 'Contrat à définir'}</span>
                    <span>{job.salaryRange || 'Salaire à discuter'}</span>
                  </div>
                  <Link to={`/careers/${job._id}`} className="hm-inline-cta">
                    Consulter le détail <ArrowRight size={14} />
                  </Link>
                </article>
              ))}
          </div>
        </div>
      </section>

      <section className="hm-section hm-surface">
        <div className="hm-shell hm-double-grid">
          <div>
            <motion.div className="hm-section-head" {...riseIn}>
              <h2>Recruteurs en avant</h2>
              <p>Consultez les profils RH publics et leurs offres actives.</p>
            </motion.div>
            <div className="hm-card-grid hm-compact-grid">
              {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="hm-skeleton hm-card-skeleton" />)}
              {!loading && recruiters.length === 0 && <p className="hm-empty">Aucun recruteur public pour le moment.</p>}
              {!loading &&
                recruiters.map((r) => (
                  <article key={r._id} className="hm-card hm-recruiter-card">
                    <div className="hm-avatar">
                      {r.avatar ? (
                        <img src={toAssetUrl(r.avatar)} alt={`${r.firstName || ''} ${r.lastName || ''}`} />
                      ) : (
                        <span>{(r.firstName?.[0] || 'R').toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h3>{`${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Recruteur'}</h3>
                      <p>{r.companyId?.name || 'Entreprise non renseignée'}</p>
                    </div>
                    <Link to={`/recruiters/${r._id}`} className="hm-inline-cta">
                      Voir le profil <ArrowRight size={14} />
                    </Link>
                  </article>
                ))}
            </div>
          </div>

          <div>
            <motion.div className="hm-section-head" {...riseIn}>
              <h2>Événements à venir</h2>
              <p>Webinaires, salons et sessions de recrutement ouverts au public.</p>
            </motion.div>
            <div className="hm-card-grid hm-compact-grid">
              {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="hm-skeleton hm-card-skeleton" />)}
              {!loading && events.length === 0 && <p className="hm-empty">Aucun événement planifié pour le moment.</p>}
              {!loading &&
                events.map((event) => (
                  <article key={event._id} className="hm-card hm-event-card">
                    <div className="hm-event-top">
                      <span>{formatDate(event.date)}</span>
                      <em>{event.type || 'Événement'}</em>
                    </div>
                    <h3>{event.title || 'Événement recrutement'}</h3>
                    <p>{event.location || (event.isOnline ? 'En ligne' : 'Lieu à confirmer')}</p>
                    <Link to="/events" className="hm-inline-cta">
                      Voir les événements <ArrowRight size={14} />
                    </Link>
                  </article>
                ))}
            </div>
          </div>
        </div>
      </section>

      <section className="hm-final-cta">
        <div className="hm-shell">
          <motion.div className="hm-final-box" {...riseIn}>
            <h2>Prêt à accélérer votre recrutement ?</h2>
            <p>
              Créez votre compte, complétez votre onboarding et commencez à publier vos offres en quelques minutes.
            </p>
            <div className="hm-hero-actions">
              <Link className="hm-btn hm-btn-primary" to="/signup">
                Créer un compte candidat <ArrowRight size={16} />
              </Link>
              <Link className="hm-btn hm-btn-secondary" to="/signup?role=HR">
                Rejoindre en tant qu’entreprise
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
