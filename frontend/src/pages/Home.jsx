import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  CalendarCheck,
  ChartNoAxesCombined,
  Layers3,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Star,
  Workflow,
} from 'lucide-react';
import { getPublicTests } from '../api/tests';

const WHY_CARDS = [
  {
    icon: BrainCircuit,
    accent: 'from-cyan-400 to-violet-500',
    border: 'border-cyan-300/20',
    title: 'Matching IA multi-dimensionnel',
    desc: 'Le système analyse 14 signaux (compétences, certifications, leadership, langues) et génère un score de compatibilité pour chaque candidat.',
  },
  {
    icon: ShieldCheck,
    accent: 'from-emerald-400 to-cyan-400',
    border: 'border-emerald-300/20',
    title: 'Anti-triche avancé',
    desc: 'Surveillance comportementale en temps réel durant les tests : détection de copier-coller, changements d\'onglet, et anomalies de frappe.',
  },
  {
    icon: Workflow,
    accent: 'from-violet-400 to-fuchsia-500',
    border: 'border-violet-300/20',
    title: 'Pipeline de recrutement structuré',
    desc: 'Suivez chaque candidature de la soumission à la décision finale avec des statuts clairs, des transitions automatisées et un historique complet.',
  },
  {
    icon: CalendarCheck,
    accent: 'from-fuchsia-400 to-pink-500',
    border: 'border-fuchsia-300/20',
    title: 'Planification d\'entretiens',
    desc: 'Proposez des créneaux, envoyez des liens Google Meet et notifiez les candidats directement depuis le tableau de bord RH.',
  },
  {
    icon: MessageCircleMore,
    accent: 'from-sky-400 to-cyan-400',
    border: 'border-sky-300/20',
    title: 'Chat RH ↔ Candidat',
    desc: 'Communication directe et traçable entre recruteurs et candidats, avec historique des messages accessible aux deux parties.',
  },
  {
    icon: ChartNoAxesCombined,
    accent: 'from-amber-400 to-orange-500',
    border: 'border-amber-300/20',
    title: 'Analytics & rapports RH',
    desc: 'Tableaux de bord riches : taux de conversion, temps de recrutement, distribution des scores, tendances par poste et par équipe.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Nous avons réduit notre temps de recrutement de 37% en deux mois. La clarté du dashboard a transformé la collaboration de notre équipe RH.',
    name: 'Nora Bensaid',
    role: 'Head of Talent',
    company: 'NovaLabs',
    initials: 'NB',
    avatar: 'from-cyan-500 to-blue-600',
    metric: '−37% délai de recrutement',
    metricColor: 'text-cyan-300 border-cyan-300/30 bg-cyan-300/10',
  },
  {
    quote: 'Les candidats se sentent guidés, les recruteurs ont le contrôle. C\'est la première plateforme qui satisfait vraiment les deux côtés à la fois.',
    name: 'Yassine Trabelsi',
    role: 'HR Operations Lead',
    company: 'OrbitWorks',
    initials: 'YT',
    avatar: 'from-violet-500 to-fuchsia-600',
    metric: '+82% satisfaction candidats',
    metricColor: 'text-violet-300 border-violet-300/30 bg-violet-300/10',
  },
  {
    quote: 'Les analytics et la cohérence du processus ont donné à notre direction une vraie confiance dans la qualité de nos recrutements.',
    name: 'Ines Kefi',
    role: 'People Director',
    company: 'Velocity Group',
    initials: 'IK',
    avatar: 'from-emerald-500 to-teal-600',
    metric: '3× pipeline plus rapide',
    metricColor: 'text-emerald-300 border-emerald-300/30 bg-emerald-300/10',
  },
];

const FAQ = [
  {
    q: 'How quickly can we start?',
    a: 'Most teams launch in less than a week with onboarding guidance and prebuilt workflows.',
  },
  {
    q: 'Can this support both RH and candidate journeys?',
    a: 'Yes. The same platform powers recruiter operations and candidate-facing experiences.',
  },
  {
    q: 'Can this fit our existing hiring process?',
    a: 'Yes. Your current workflow can be mapped into a cleaner and more measurable pipeline.',
  },
  {
    q: 'Can we migrate from our current process?',
    a: 'Yes. We help map your existing steps into a cleaner, measurable pipeline.',
  },
];

const ROLES = ['Développeur Fullstack', 'Data Scientist', 'UX Designer', 'Chef de Projet', 'DevOps Engineer', 'Product Manager'];

const HOW_IT_WORKS = [
  { step: '01', title: 'HR publie une offre', desc: 'L\'équipe RH crée une offre avec les critères, questions et tests automatisés par IA.' },
  { step: '02', title: 'Les candidats postulent', desc: 'Les talents découvrent les offres sur la page Carrières et soumettent leur candidature.' },
  { step: '03', title: 'Évaluation IA & scoring', desc: 'Le système score automatiquement chaque candidat selon les critères définis par le recruteur.' },
  { step: '04', title: 'Décision RH & onboarding', desc: 'L\'équipe RH sélectionne, notifie les candidats et démarre l\'onboarding depuis le tableau de bord.' },
];

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
};

function Typewriter({ words }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index % words.length];
    let timeout;
    if (!deleting && displayed.length < word.length) {
      timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 60);
    } else if (!deleting && displayed.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setIndex((i) => (i + 1) % words.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, index, words]);

  return (
    <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
      {displayed}<span className="animate-pulse">|</span>
    </span>
  );
}


function MagneticLink({ to, className, children }) {
  return <Link to={to} className={className}>{children}</Link>;
}

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [faqOpen, setFaqOpen] = useState(0);

  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, index) => ({
        id: index,
        size: 4 + ((index * 3) % 8),
        left: `${(index * 13) % 100}%`,
        top: `${(index * 17) % 100}%`,
      })),
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getPublicTests({ page: 1, limit: 6, sortBy: 'createdAt', sortOrder: 'desc' });
      if (!cancelled) setJobs(res?.tests || []);
    })();
    return () => { cancelled = true; };
  }, []);


  return (
    <div className="relative min-h-screen overflow-hidden bg-mesh font-body text-slate-100">
      {/* ── Scroll progress bar ──────────────────────────────── */}
      <motion.div
        className="fixed left-0 top-0 z-[100] h-[3px] origin-left bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-violet-400"
        style={{ scaleX }}
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/30 blur-3xl" />
        <div className="absolute -right-20 top-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl" />
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="absolute rounded-full bg-cyan-200/40"
            style={{
              width: particle.size,
              height: particle.size,
              left: particle.left,
              top: particle.top,
            }}
          />
        ))}
      </div>

      <main className="relative z-10 flex w-full flex-col gap-6 px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <motion.nav
          className="sticky top-4 z-40 rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-3 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="flex items-center justify-between gap-4">

            {/* Brand */}
            <a href="#home" className="flex items-center gap-2 no-underline">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-[0_0_12px_rgba(34,211,238,0.4)]">
                <Sparkles size={13} className="text-white" />
              </div>
              <span className="font-display text-sm font-bold tracking-[0.18em] text-white">
                RECRUIT<span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">AI</span>
              </span>
            </a>

            {/* Desktop section links */}
            <div className="hidden items-center gap-0.5 text-[12px] font-medium text-slate-400 md:flex">
              {[
                { label: 'Accueil', href: '#home' },
                { label: 'Pourquoi nous', href: '#features' },
                { label: 'Comment ça marche', href: '#how' },
                { label: 'Offres live', href: '#jobs' },
                { label: 'FAQ', href: '#faq' },
              ].map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-2 transition-all duration-200 hover:bg-white/10 hover:text-cyan-200"
                >
                  {label}
                </a>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">

              <MagneticLink
                to="/login"
                className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-[12px] font-semibold text-cyan-100 transition hover:bg-cyan-200/20"
              >
                Connexion
              </MagneticLink>
              <MagneticLink
                to="/signup"
                className="hidden rounded-xl bg-gradient-to-r from-cyan-500/30 to-violet-500/25 px-4 py-2 text-[12px] font-semibold text-white transition hover:from-cyan-400/40 hover:to-violet-400/35 sm:inline-flex"
              >
                S'inscrire
              </MagneticLink>
            </div>
          </div>
        </motion.nav>

        <motion.section
          id="home"
          className="glass-panel-strong relative overflow-hidden rounded-[28px] p-6 sm:p-8 lg:p-12"
        >
          {/* layered bg glows */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.18),transparent_38%),radial-gradient(circle_at_10%_80%,rgba(167,139,250,0.18),transparent_36%),radial-gradient(circle_at_50%_50%,rgba(244,114,182,0.08),transparent_60%)]" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">

            {/* ── LEFT: copy ── */}
            <motion.div {...fadeUp}>
              {/* Eyebrow */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-cyan-100">
                  <Sparkles size={13} /> Plateforme de recrutement IA
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Système opérationnel
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl xl:text-6xl">
                Recruter un{' '}
                <span className="block mt-1">
                  <Typewriter words={ROLES} />
                </span>
                <span className="mt-3 block text-xl font-medium text-slate-300 sm:text-2xl">
                  n'a jamais été aussi simple.
                </span>
              </h1>

              {/* Sub */}
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-[15px]">
                Gérez les offres, les candidatures et les évaluations dans une seule plateforme —
                suivi temps réel, scoring IA et notifications automatiques pour toute votre équipe RH.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <MagneticLink
                  to="/signup?role=candidate"
                  className="glow-ring inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/25 to-violet-500/20 px-6 py-3 text-sm font-semibold text-cyan-100 transition hover:from-cyan-400/35 hover:to-violet-400/30"
                >
                  Espace Candidat <ArrowRight size={15} />
                </MagneticLink>
                <MagneticLink
                  to="/signup?role=HR"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
                >
                  Espace Recruteur
                </MagneticLink>
              </div>


            </motion.div>

            {/* ── RIGHT: animated dashboard mockup ── */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Floating notification badge */}
              <motion.div
                className="absolute -right-3 -top-4 z-20 rounded-2xl border border-cyan-300/30 bg-slate-900/80 px-3 py-2 backdrop-blur-md"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <p className="text-[11px] font-semibold text-cyan-200">🎉 Nouveau candidat</p>
                <p className="text-[10px] text-slate-400">Score IA : 94 / 100</p>
              </motion.div>

              {/* Main card */}
              <div className="rounded-2xl border border-white/12 bg-slate-900/60 p-5 backdrop-blur-xl">
                {/* Card header */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-400">Pipeline actif</p>
                    <p className="mt-0.5 font-display text-lg font-semibold text-white">Développeur Fullstack</p>
                  </div>
                  <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                    En cours
                  </span>
                </div>

                {/* Pipeline stages */}
                <div className="space-y-2.5">
                  {[
                    { stage: 'Candidatures reçues', count: 24, pct: 100, color: 'from-slate-500 to-slate-400' },
                    { stage: 'Test technique passé', count: 18, pct: 75, color: 'from-cyan-500 to-sky-400' },
                    { stage: 'Entretien planifié', count: 9, pct: 37, color: 'from-violet-500 to-fuchsia-400' },
                    { stage: 'Offre envoyée', count: 3, pct: 12, color: 'from-emerald-500 to-green-400' },
                  ].map(({ stage, count, pct, color }, i) => (
                    <div key={stage}>
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="text-slate-300">{stage}</span>
                        <span className="font-semibold text-white">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.5 + i * 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Candidates avatars row */}
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {['CB', 'MK', 'AR', 'YB'].map((initials, i) => (
                      <div
                        key={initials}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-900 text-[10px] font-bold text-white"
                        style={{ background: ['#6366f1', '#06b6d4', '#8b5cf6', '#10b981'][i] }}
                      >
                        {initials}
                      </div>
                    ))}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-900 bg-white/10 text-[10px] text-slate-300">
                      +20
                    </div>
                  </div>
                  <Link
                    to="/careers"
                    className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 transition hover:bg-cyan-300/20"
                  >
                    Voir les offres →
                  </Link>
                </div>
              </div>

              {/* Bottom floating AI score card */}
              <motion.div
                className="absolute -bottom-4 -left-4 z-20 rounded-xl border border-violet-300/25 bg-slate-900/85 px-4 py-3 backdrop-blur-md"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <p className="text-[10px] uppercase tracking-widest text-slate-400">Score IA moyen</p>
                <p className="mt-0.5 font-display text-2xl font-bold text-white">87<span className="text-sm text-violet-300">/100</span></p>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>



        <motion.section id="features" className="glass-panel rounded-[26px] p-6 sm:p-8" {...fadeUp}>
          <div className="mb-7">
            <h2 className="section-headline">Pourquoi RecruitAI ?</h2>
            <p className="section-subtext mt-2 max-w-2xl">
              Une plateforme complète qui couvre l'intégralité du cycle de recrutement, de la publication à l'embauche.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {WHY_CARDS.map(({ icon: Icon, accent, border, title, desc }, idx) => (
              <motion.article
                key={title}
                className={`relative overflow-hidden rounded-2xl border ${border} bg-white/[0.03] p-5`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.07, duration: 0.55 }}
                whileHover={{ y: -4 }}
              >
                <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-2xl`} />
                <span className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} bg-opacity-15 text-white`}>
                  <Icon size={20} />
                </span>
                <h3 className="font-display text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
              </motion.article>
            ))}
          </div>
        </motion.section>

        {/* ── How it works ────────────────────────────────────── */}
        <motion.section id="how" className="glass-panel rounded-[26px] p-6 sm:p-8" {...fadeUp}>
          <div className="mb-7">
            <h2 className="section-headline">Comment ça marche ?</h2>
            <p className="section-subtext mt-2">De la publication à l'embauche en 4 étapes claires.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, title, desc }, idx) => (
              <motion.div
                key={step}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.55 }}
                whileHover={{ y: -4 }}
              >
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-slate-500 lg:block">→</div>
                )}
                <span className="font-display text-4xl font-bold text-white/10">{step}</span>
                <h3 className="mt-2 font-display text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Live job offers from DB ──────────────────────────── */}
        <motion.section id="jobs" className="glass-panel rounded-[26px] p-6 sm:p-8" {...fadeUp}>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="section-headline">Offres publiées en direct</h2>
              <p className="section-subtext mt-1">Dernières opportunités issues de la base de données.</p>
            </div>
            <Link
              to="/careers"
              className="shrink-0 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-200/20"
            >
              Tout voir →
            </Link>
          </div>
          {jobs.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-slate-400">
              Aucune offre publiée pour le moment.{' '}
              <Link to="/signup?role=HR" className="text-cyan-300 hover:underline">Publiez la première →</Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs.slice(0, 3).map((job, idx) => (
                <motion.div
                  key={job._id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  whileHover={{ y: -4, borderColor: 'rgba(34,211,238,0.3)' }}
                >
                  <div>
                    <span className="inline-block rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-200">
                      {job.jobRole || 'Poste'}
                    </span>
                    <h3 className="mt-3 font-display text-lg font-semibold text-white">{job.title || 'Offre'}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                      {job.description?.slice(0, 100) || 'Consultez la fiche pour tous les détails.'}
                      {job.description?.length > 100 ? '…' : ''}
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span>📍 {job.location || 'Remote'}</span>
                      <span>🕐 {job.employmentType || 'CDI'}</span>
                    </div>
                    <Link
                      to={`/careers/${job._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:underline"
                    >
                      Voir l'offre <ArrowRight size={12} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ── Testimonials ─────────────────────────────────────── */}
        <motion.section className="glass-panel rounded-[26px] p-6 sm:p-10" {...fadeUp}>

          {/* Header */}
          <div className="mb-8 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-300/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-violet-200">
              <Star size={11} fill="currentColor" /> Ils nous font confiance
            </span>
            <h2 className="section-headline mt-3">Ce que disent nos équipes RH</h2>
            <p className="section-subtext mt-2 mx-auto max-w-xl">Des équipes ambitieuses qui ont transformé leur recrutement avec RecruitAI.</p>
          </div>

          {/* Metric strip */}
          <div className="mb-8 flex flex-wrap justify-center gap-6 border-y border-white/10 py-5">
            {[
              { value: '−37%', label: 'Temps de recrutement' },
              { value: '+82%', label: 'Satisfaction candidats' },
              { value: '3×', label: 'Pipeline plus rapide' },
              { value: '98%', label: 'Taux de satisfaction' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="font-display text-2xl font-bold text-white">{value}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">{label}</div>
              </div>
            ))}
          </div>

          {/* Cards grid */}
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map(({ quote, name, role, company, initials, avatar, metric, metricColor }, idx) => (
              <motion.article
                key={name}
                className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12, duration: 0.55 }}
                whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.18)' }}
              >
                {/* Decorative giant quote mark */}
                <span className="pointer-events-none absolute -right-2 -top-4 font-display text-[96px] font-black leading-none text-white/[0.04] select-none">
                  &ldquo;
                </span>

                {/* Stars */}
                <div className="mb-4 flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="flex-1 text-[14px] leading-relaxed text-slate-200">
                  &ldquo;{quote}&rdquo;
                </blockquote>

                {/* Metric chip */}
                <span className={`mt-4 inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${metricColor}`}>
                  ✦ {metric}
                </span>

                {/* Author */}
                <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-5">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatar} text-xs font-bold text-white shadow-md`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{name}</p>
                    <p className="text-[11px] text-slate-400">{role} · <span className="text-slate-300">{company}</span></p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.section>




        <motion.section id="faq" className="glass-panel rounded-[26px] p-6 sm:p-8" {...fadeUp}>
          <div className="mb-5">
            <h2 className="section-headline">FAQ</h2>
            <p className="section-subtext mt-2">Everything teams ask before launching the platform.</p>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, index) => (
              <motion.article
                key={item.q}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
                initial={false}
              >
                <button
                  type="button"
                  onClick={() => setFaqOpen((prev) => (prev === index ? -1 : index))}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-white sm:text-base">{item.q}</span>
                  <span className="text-cyan-200">{faqOpen === index ? '-' : '+'}</span>
                </button>
                <AnimatePresence initial={false}>
                  {faqOpen === index ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <p className="border-t border-white/10 px-4 py-4 text-sm text-slate-300">{item.a}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="relative overflow-hidden rounded-[28px] border border-cyan-300/25 bg-gradient-to-r from-cyan-300/20 via-violet-400/20 to-fuchsia-400/20 p-7 sm:p-10"
          {...fadeUp}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(34,211,238,0.32),transparent_36%),radial-gradient(circle_at_80%_50%,rgba(244,114,182,0.26),transparent_34%)]" />
          <div className="relative flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Turn hiring into a premium experience</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-100/85 sm:text-base">
                Launch a modern, high-converting workflow that attracts talent and empowers RH teams.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <MagneticLink
                to="/signup?role=HR"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950/80 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-slate-900"
              >
                Start Free Trial <ArrowRight size={14} />
              </MagneticLink>
              <MagneticLink
                to="/careers"
                className="inline-flex items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Browse Offers
              </MagneticLink>
            </div>
          </div>
        </motion.section>

        <motion.footer
          className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <p className="font-display text-xl tracking-[0.18em] text-cyan-100">RECRUIT AI</p>
              <p className="mt-2 text-sm text-slate-300">
                Future-facing recruitment platform for high-performance hiring teams.
              </p>
              <div className="mt-4 flex gap-2">
                {[ChartNoAxesCombined, Building2, Layers3].map((Icon, idx) => (
                  <span
                    key={idx}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-black/[0.04] text-cyan-200"
                  >
                    <Icon size={15} />
                  </span>
                ))}
              </div>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Roadmap', 'Insights'] },
              { title: 'Resources', links: ['Guides', 'Documentation', 'Support'] },
              { title: 'Company', links: ['About', 'Careers', 'Contact'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-display text-base text-white">{col.title}</h4>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {col.links.map((link) => (
                    <li key={link}>{link}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-400">
            Copyright {new Date().getFullYear()} Recruit AI. Crafted for modern teams.
          </div>
        </motion.footer>
      </main>
      {/* ── VS Code-style pets ────────────────────────────────── */}
      <div aria-hidden="true">

        {/* 🦊 Fox – slow, LTR, bottom */}
        <div className="web-pet-lane" style={{ bottom: 14 }}>
          <div className="web-pet" style={{ animationDuration: '22s' }}>
            <span className="web-pet__paw">🐾</span>
            <span className="web-pet__body" style={{ fontSize: 28 }}>🦊</span>
          </div>
        </div>

        {/* 🐱 Cat – medium, LTR, mid-level, delayed */}
        <div className="web-pet-lane" style={{ bottom: 54 }}>
          <div className="web-pet" style={{ animationDuration: '15s', animationDelay: '6s' }}>
            <span className="web-pet__paw">🐾</span>
            <span className="web-pet__body" style={{ fontSize: 26 }}>🐱</span>
          </div>
        </div>

        {/* 🐰 Rabbit – hops, LTR */}
        <div className="web-pet-lane" style={{ bottom: 36 }}>
          <div className="web-pet web-pet--hop" style={{ animationDuration: '19s', animationDelay: '3s' }}>
            <span className="web-pet__body" style={{ fontSize: 24 }}>🐰</span>
          </div>
        </div>

        {/* 🐍 Snake – slow, RTL (walks right→left), very delayed */}
        <div className="web-pet-lane" style={{ bottom: 6 }}>
          <div className="web-pet web-pet--rtl" style={{ animationDuration: '32s', animationDelay: '16s' }}>
            <span className="web-pet__body" style={{ fontSize: 24 }}>🐍</span>
          </div>
        </div>

        {/* 🐦 Bird – flies fast, LTR, high above rest */}
        <div className="web-pet-lane" style={{ bottom: 82 }}>
          <div className="web-pet web-pet--fly" style={{ animationDuration: '8s', animationDelay: '2s' }}>
            <span className="web-pet__body" style={{ fontSize: 22 }}>🐦</span>
          </div>
        </div>

      </div>
    </div>
  );
}


