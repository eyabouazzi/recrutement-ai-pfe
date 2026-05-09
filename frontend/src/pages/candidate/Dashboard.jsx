import { useContext, useEffect, useRef, useState } from 'react';
import { Button, Modal, Progress, Spin, Upload, message, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightOutlined,
  BarChartOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  FireOutlined,
  LockOutlined,
  RocketOutlined,
  SaveOutlined,
  SearchOutlined,
  SolutionOutlined,
  TrophyOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { getTests } from '../../api/tests';
import { getMyApplications, getMyDrafts, fetchMySubmissions } from '../../api/submissions';
import { updateProfile } from '../../api/auth.js';
import { AuthContext } from '../../contexts/authContext.jsx';
import UserAvatar from '../../Components/UserAvatar.jsx';
import '../../styles/dashboard-light.css';


const TEST_STATUS_META = {
  PUBLISHED: { label: 'Publie', tone: 'success' },
  DRAFT: { label: 'Brouillon', tone: 'warning' },
  CLOSED: { label: 'Ferme', tone: 'muted' },
};

function scoreColor(score) {
  if (score >= 70) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function getScore(submission) {
  return submission?.totalScore ?? submission?.score ?? 0;
}

function getTestStatus(test) {
  return String(test?.status || 'PUBLISHED').toUpperCase();
}

function hasCvOnProfile(user) {
  return Boolean(user?.cvUrl) || Boolean(String(user?.cvText || '').trim());
}

function hasSkills(user) {
  if (Array.isArray(user?.skills)) return user.skills.length > 0;
  return Boolean(String(user?.skills || '').trim()) || Boolean(String(user?.bio || '').trim());
}

function formatShortDate(value) {
  if (!value) return 'Date inconnue';
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function buildLatestSubmissionMap(submissions) {
  const byTest = new Map();

  submissions.forEach((submission) => {
    const testId = submission?.testId?._id || submission?.testId;
    if (!testId || byTest.has(testId)) return;
    byTest.set(testId, submission);
  });

  return byTest;
}

function DashboardMetric({ icon, label, value, hint, accent }) {
  return (
    <div className="candidate-dashboard__metric" style={{ '--metric-accent': accent }}>
      <div className="candidate-dashboard__metric-icon">{icon}</div>
      <div className="candidate-dashboard__metric-value">{value}</div>
      <div className="candidate-dashboard__metric-label">{label}</div>
      {hint ? <div className="candidate-dashboard__metric-hint">{hint}</div> : null}
    </div>
  );
}

function SmallSnapshot({ label, value, accent }) {
  return (
    <div className="candidate-dashboard__snapshot" style={{ '--snapshot-accent': accent }}>
      <div className="candidate-dashboard__snapshot-value">{value}</div>
      <div className="candidate-dashboard__snapshot-label">{label}</div>
    </div>
  );
}

function ProfileChecklist({ items, progress, onProfile }) {
  return (
    <section className="candidate-dashboard__panel">
      <div className="candidate-dashboard__panel-header">
        <div>
          <div className="candidate-dashboard__panel-title">Profil candidat</div>
          <div className="candidate-dashboard__panel-subtitle">Complete les informations clefs avant de postuler.</div>
        </div>
        <div className="candidate-dashboard__panel-pill">{progress}%</div>
      </div>

      <Progress
        percent={progress}
        showInfo={false}
        strokeColor={{ '0%': '#0284c7', '100%': '#10b981' }}
        trailColor="rgba(148, 163, 184, 0.18)"
      />

      <div className="candidate-dashboard__checklist">
        {items.map((item) => (
          <div key={item.label} className="candidate-dashboard__checklist-item">
            <span className={`candidate-dashboard__checklist-icon ${item.done ? 'is-done' : 'is-pending'}`}>
              {item.done ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
            </span>
            <div>
              <div className="candidate-dashboard__checklist-label">{item.label}</div>
              <div className="candidate-dashboard__checklist-help">{item.help}</div>
            </div>
          </div>
        ))}
      </div>

      <Button type="default" block onClick={onProfile}>
        Completer mon profil
      </Button>
    </section>
  );
}

function ActivityFeed({ submissions, onViewResults, onBrowseTests }) {
  return (
    <section className="candidate-dashboard__panel">
      <div className="candidate-dashboard__panel-header">
        <div>
          <div className="candidate-dashboard__panel-title">Activite recente</div>
          <div className="candidate-dashboard__panel-subtitle">Tes derniers passages et evaluations.</div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="candidate-dashboard__empty candidate-dashboard__empty--compact">
          <div className="candidate-dashboard__empty-title">Aucune activite pour le moment</div>
          <div className="candidate-dashboard__empty-copy">Commence un test pour voir apparaitre ton historique ici.</div>
          <Button type="default" onClick={onBrowseTests}>
            Voir les tests
          </Button>
        </div>
      ) : (
        <>
          <div className="candidate-dashboard__activity-list">
            {submissions.slice(0, 5).map((submission) => {
              const score = getScore(submission);
              const graded = submission.status === 'GRADED';

              return (
                <button
                  key={submission._id}
                  type="button"
                  className="candidate-dashboard__activity-item"
                  onClick={() => onViewResults(submission)}
                >
                  <span
                    className="candidate-dashboard__activity-dot"
                    style={{ '--activity-color': graded ? scoreColor(score) : '#0284c7' }}
                  >
                    {graded ? <TrophyOutlined /> : <ClockCircleOutlined />}
                  </span>
                  <span className="candidate-dashboard__activity-copy">
                    <span className="candidate-dashboard__activity-title">
                      {submission.testId?.title || 'Test'}
                    </span>
                    <span className="candidate-dashboard__activity-meta">
                      {graded ? `Note ${score}%` : 'En attente de correction'} • {formatShortDate(submission.createdAt)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <Button type="default" block onClick={() => onViewResults()}>
            Voir tous les resultats
          </Button>
        </>
      )}
    </section>
  );
}

function ApplicationsPanel({ stats, onOpenApplications }) {
  return (
    <section className="candidate-dashboard__panel">
      <div className="candidate-dashboard__panel-header">
        <div>
          <div className="candidate-dashboard__panel-title">Mes candidatures</div>
          <div className="candidate-dashboard__panel-subtitle">Suivi rapide de ton pipeline.</div>
        </div>
      </div>

      <div className="candidate-dashboard__snapshot-grid">
        <SmallSnapshot label="Actives" value={stats.active} accent="#0284c7" />
        <SmallSnapshot label="Embauchees" value={stats.hired} accent="#10b981" />
        <SmallSnapshot label="Refusees" value={stats.rejected} accent="#ef4444" />
      </div>

      <div className="candidate-dashboard__note">
        <SolutionOutlined />
        <span>{stats.total} candidature{stats.total > 1 ? 's' : ''} au total.</span>
      </div>

      <Button type="default" block onClick={onOpenApplications}>
        Ouvrir mes candidatures
      </Button>
    </section>
  );
}

function ScorePanel({ best, average, pending }) {
  return (
    <section className="candidate-dashboard__panel">
      <div className="candidate-dashboard__panel-header">
        <div>
          <div className="candidate-dashboard__panel-title">Score snapshot</div>
          <div className="candidate-dashboard__panel-subtitle">Vision rapide de tes performances.</div>
        </div>
      </div>

      <div className="candidate-dashboard__snapshot-grid">
        <SmallSnapshot label="Meilleur score" value={`${best}%`} accent="#10b981" />
        <SmallSnapshot label="Moyenne" value={`${average}%`} accent="#0284c7" />
        <SmallSnapshot label="En attente" value={pending} accent="#f59e0b" />
      </div>
    </section>
  );
}

function TestSection({ title, description, items, emptyTitle, emptyCopy, onAction }) {
  return (
    <section className="candidate-dashboard__section">
      <div className="candidate-dashboard__section-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="candidate-dashboard__panel-pill">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="candidate-dashboard__empty">
          <div className="candidate-dashboard__empty-title">{emptyTitle}</div>
          <div className="candidate-dashboard__empty-copy">{emptyCopy}</div>
        </div>
      ) : (
        <div className="candidate-dashboard__cards">
          {items.map((item) => (
            <TestCard key={item.key} item={item} onAction={onAction} />
          ))}
        </div>
      )}
    </section>
  );
}

function TestCard({ item, onAction }) {
  const score = item.submission ? getScore(item.submission) : null;

  return (
    <article className="candidate-dashboard__card">
      <div className="candidate-dashboard__card-top">
        <div className="candidate-dashboard__card-badges">
          <span className={`candidate-dashboard__badge is-${item.badgeTone}`}>{item.badgeLabel}</span>
          <span className={`candidate-dashboard__badge is-${item.statusTone}`}>{item.statusLabel}</span>
        </div>
        <div className="candidate-dashboard__card-role">{item.jobRole}</div>
      </div>

      <div className="candidate-dashboard__card-body">
        <h3>{item.title}</h3>
        <p>{item.description || 'Aucune description disponible pour ce test.'}</p>

        <div className="candidate-dashboard__meta-list">
          <span><ClockCircleOutlined /> {item.timeLimit || 30} min</span>
          {item.location ? <span><RocketOutlined /> {item.location}</span> : null}
          {item.employmentType ? <span><FileTextOutlined /> {item.employmentType}</span> : null}
        </div>

        {score !== null ? (
          <div className="candidate-dashboard__score-row">
            <div className="candidate-dashboard__score-label">
              {item.submission?.status === 'GRADED' ? `Score ${score}%` : 'Evaluation en attente'}
            </div>
            {item.submission?.status === 'GRADED' ? (
              <Progress
                percent={score}
                showInfo={false}
                strokeColor={scoreColor(score)}
                trailColor="rgba(148, 163, 184, 0.18)"
              />
            ) : null}
          </div>
        ) : null}

        <div className="candidate-dashboard__meta-note">{item.note}</div>
      </div>

      <button
        type="button"
        className={`candidate-dashboard__action is-${item.actionTone}`}
        disabled={item.actionDisabled}
        onClick={() => onAction(item)}
      >
        <span>{item.actionLabel}</span>
        {!item.actionDisabled ? <ArrowRightOutlined /> : item.actionIcon || <LockOutlined />}
      </button>
    </article>
  );
}

export default function CandidateDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const testsRef = useRef(null);

  const [tests, setTests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [applicationStats, setApplicationStats] = useState({
    total: 0,
    active: 0,
    hired: 0,
    rejected: 0,
  });
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [testToStart, setTestToStart] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [testsResponse, submissionsResponse, applicationsResponse, draftsResponse] = await Promise.all([
        getTests(),
        fetchMySubmissions(),
        getMyApplications(),
        getMyDrafts(),
      ]);

      const testList = testsResponse?.tests || [];
      const submissionList = [...(submissionsResponse?.submissions || [])].sort(
        (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
      );
      const draftList = [...(draftsResponse?.drafts || [])].sort(
        (left, right) => new Date(right.lastActivityAt || right.updatedAt) - new Date(left.lastActivityAt || left.updatedAt),
      );
      const applications = applicationsResponse?.applications || [];

      setTests(testList);
      setSubmissions(submissionList);
      setDrafts(draftList);
      setApplicationStats({
        total: applications.length,
        active: applications.filter((application) => ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER'].includes(application.stage)).length,
        hired: applications.filter((application) => application.stage === 'HIRED').length,
        rejected: applications.filter((application) => application.stage === 'REJECTED').length,
      });
    } catch (error) {
      message.error(error.message || 'Impossible de charger votre espace candidat.');
    } finally {
      setLoading(false);
    }
  };

  const hasCv = hasCvOnProfile(user);
  const latestSubmissionByTest = buildLatestSubmissionMap(submissions);
  const draftByTest = new Map();

  drafts.forEach((draft) => {
    const testId = draft?.testId?._id || draft?.testId;
    if (!testId || draftByTest.has(testId)) return;
    draftByTest.set(testId, draft);
  });

  const searchTerm = search.trim().toLowerCase();
  const testMatches = (test) => {
    if (!searchTerm) return true;
    const haystack = [test?.title, test?.jobRole, test?.description, test?.location, test?.employmentType]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(searchTerm);
  };

  const publishedTests = tests.filter((test) => getTestStatus(test) === 'PUBLISHED');
  const availableTests = [];
  const pendingTests = [];
  const completedTests = [];
  const unavailableTests = [];

  tests.forEach((test) => {
    const status = getTestStatus(test);
    if (status !== 'PUBLISHED') {
      if (testMatches(test)) unavailableTests.push(test);
      return;
    }

    const latestSubmission = latestSubmissionByTest.get(test._id);
    const latestDraft = draftByTest.get(test._id);

    if (latestDraft && !latestSubmission) {
      return;
    }

    if (!testMatches(test)) return;

    if (!latestSubmission) {
      availableTests.push(test);
      return;
    }

    if (latestSubmission.status === 'GRADED') {
      completedTests.push(test);
      return;
    }

    pendingTests.push(test);
  });

  const resumeItems = drafts
    .filter((draft) => {
      const linkedTest = draft?.testId;
      const testId = linkedTest?._id;
      if (!testId || latestSubmissionByTest.has(testId)) return false;
      if (getTestStatus(linkedTest) !== 'PUBLISHED') return false;
      return testMatches(linkedTest);
    })
    .map((draft) => draft.testId);

  const gradedSubmissions = submissions.filter((submission) => submission.status === 'GRADED');
  const averageScore = gradedSubmissions.length
    ? Math.round(gradedSubmissions.reduce((sum, submission) => sum + getScore(submission), 0) / gradedSubmissions.length)
    : 0;
  const bestScore = gradedSubmissions.length
    ? Math.max(...gradedSubmissions.map((submission) => getScore(submission)))
    : 0;

  const checklistItems = [
    {
      label: 'CV charge',
      help: hasCv ? 'Ton CV est deja disponible pour les recruteurs.' : 'Ajoute un CV pour debloquer le passage des tests.',
      done: hasCv,
    },
    {
      label: 'Telephone renseigne',
      help: user?.phone ? 'Numero visible dans ton profil.' : 'Ajoute un numero pour accelerer la prise de contact.',
      done: Boolean(user?.phone),
    },
    {
      label: 'Ville renseignee',
      help: user?.city ? 'Localisation ajoutee.' : 'Renseigne ta ville pour des recommandations plus pertinentes.',
      done: Boolean(user?.city),
    },
    {
      label: 'Competences ou bio',
      help: hasSkills(user) ? 'Ton profil donne du contexte a l evaluation.' : 'Ajoute une bio ou quelques competences clefs.',
      done: hasSkills(user),
    },
  ];
  const profileProgress = Math.round((checklistItems.filter((item) => item.done).length / checklistItems.length) * 100);

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Candidat';
  const pendingCount = pendingTests.length;

  const toCardItem = (test, kind) => {
    const submission = latestSubmissionByTest.get(test._id);
    const draft = draftByTest.get(test._id);
    const testStatus = getTestStatus(test);
    const base = {
      key: `${kind}-${test._id}`,
      test,
      submission,
      draft,
      title: test.title,
      jobRole: test.jobRole || 'Test technique',
      description: test.description,
      timeLimit: test.timeLimit,
      location: test.location,
      employmentType: test.employmentType,
    };

    if (kind === 'resume') {
      return {
        ...base,
        badgeLabel: 'A reprendre',
        badgeTone: 'info',
        statusLabel: 'Brouillon sauve',
        statusTone: 'warning',
        note: `Derniere activite le ${formatShortDate(draft?.lastActivityAt || draft?.updatedAt)}.`,
        actionLabel: 'Reprendre le test',
        actionTone: 'primary',
        actionType: 'resume',
      };
    }

    if (kind === 'available') {
      return {
        ...base,
        badgeLabel: 'Disponible',
        badgeTone: 'success',
        statusLabel: 'Pret a lancer',
        statusTone: 'success',
        note: hasCv ? 'Ton profil est pret pour cette candidature.' : 'Ajoute ton CV avant de lancer ce test.',
        actionLabel: 'Commencer',
        actionTone: 'primary',
        actionType: 'start',
      };
    }

    if (kind === 'pending') {
      return {
        ...base,
        badgeLabel: 'Soumis',
        badgeTone: 'warning',
        statusLabel: 'Correction en attente',
        statusTone: 'warning',
        note: `Soumis le ${formatShortDate(submission?.createdAt)}.`,
        actionLabel: 'Voir le suivi',
        actionTone: 'secondary',
        actionType: 'results',
      };
    }

    if (kind === 'completed') {
      return {
        ...base,
        badgeLabel: 'Note',
        badgeTone: 'success',
        statusLabel: `${getScore(submission)}%`,
        statusTone: 'score',
        note: `Resultat evalue le ${formatShortDate(submission?.createdAt)}.`,
        actionLabel: 'Voir le resultat',
        actionTone: 'secondary',
        actionType: 'result-detail',
      };
    }

    const meta = TEST_STATUS_META[testStatus] || TEST_STATUS_META.CLOSED;
    return {
      ...base,
      badgeLabel: meta.label,
      badgeTone: meta.tone,
      statusLabel: 'Non accessible',
      statusTone: 'muted',
      note: testStatus === 'DRAFT'
        ? 'Ce test n est pas encore publie.'
        : 'Ce test a ete ferme par le recruteur.',
      actionLabel: testStatus === 'DRAFT' ? 'En attente de publication' : 'Test ferme',
      actionTone: 'disabled',
      actionDisabled: true,
      actionIcon: <CloseCircleOutlined />,
    };
  };

  const allTests = [
    ...resumeItems.map((test) => toCardItem(test, 'resume')),
    ...availableTests.map((test) => toCardItem(test, 'available')),
  ];

  const openResults = (submission) => {
    if (!submission?._id) {
      navigate('/mes-resultats');
      return;
    }

    if (submission.status === 'GRADED') {
      navigate(`/mes-resultats?submission=${submission._id}`);
      return;
    }

    navigate('/mes-resultats');
  };

  const openProfile = () => navigate('/profile');
  const openApplications = () => navigate('/mes-candidatures');

  const browseTests = () => {
    testsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const beginTest = (testId) => {
    if (!hasCv) {
      setTestToStart(testId);
      setCvFile(null);
      setUploadModalVisible(true);
      return;
    }

    navigate(`/tests/${testId}`);
  };

  const handleCardAction = (item) => {
    if (item.actionDisabled) return;

    if (item.actionType === 'start' || item.actionType === 'resume') {
      beginTest(item.test._id);
      return;
    }

    if (item.actionType === 'result-detail') {
      openResults(item.submission);
      return;
    }

    if (item.actionType === 'results') {
      openResults(item.submission);
    }
  };

  const submitCvAndStart = async () => {
    if (!cvFile) {
      message.warning('Selectionnez un CV avant de continuer.');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('cv', cvFile);
      formData.append('analyzeCv', 'true');

      const response = await updateProfile(formData);

      if (!response?.status || !response?.user) {
        throw new Error('Le CV n a pas pu etre enregistre.');
      }

      setUser?.(response.user);
      setUploadModalVisible(false);
      message.success('CV enregistre. Redirection vers le test.');
      navigate(`/tests/${testToStart}`);
    } catch (error) {
      message.error(error.message || 'Impossible de televerser le CV.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="candidate-dashboard__loading">
        <Spin size="large" />
        <span>Chargement de votre espace candidat...</span>
      </div>
    );
  }

  return (
    <div className="candidate-dashboard">
      <section className="candidate-dashboard__hero">
        <div className="candidate-dashboard__hero-copy">
          <div className="candidate-dashboard__hero-user">
            <div className="candidate-dashboard__hero-avatar">
              <UserAvatar user={user} size={56} />
            </div>
            <div>
              <div className="candidate-dashboard__eyebrow">Espace candidat</div>
              <h1>Bonjour {firstName}</h1>
              <p>
                {hasCv
                  ? `Tu as ${publishedTests.length} test${publishedTests.length > 1 ? 's' : ''} publie${publishedTests.length > 1 ? 's' : ''} dans ta vue.`
                  : 'Complete ton profil pour debloquer le passage des tests.'}
              </p>
            </div>
          </div>

          <div className="candidate-dashboard__hero-note">
            <span className={`candidate-dashboard__hero-status ${hasCv ? 'is-ready' : 'is-warning'}`}>
              {hasCv ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
              {hasCv ? 'CV present sur le profil' : 'CV manquant'}
            </span>
            <span className="candidate-dashboard__hero-summary">
              {resumeItems.length > 0
                ? `${resumeItems.length} test${resumeItems.length > 1 ? 's' : ''} a reprendre`
                : pendingCount > 0
                  ? `${pendingCount} resultat${pendingCount > 1 ? 's' : ''} en attente`
                  : 'Tes prochaines actions sont classees par priorite ci-dessous.'}
            </span>
          </div>
        </div>

        <div className="candidate-dashboard__hero-actions">
          <Button type="default" onClick={openProfile}>
            Mon profil
          </Button>
          <Button type="primary" icon={<BarChartOutlined />} onClick={() => navigate('/mes-resultats')}>
            Mes resultats
          </Button>
        </div>
      </section>

      {!hasCv ? (
        <section className="candidate-dashboard__callout">
          <div>
            <div className="candidate-dashboard__callout-title">Action requise: ajoute ton CV</div>
            <div className="candidate-dashboard__callout-copy">
              Les tests peuvent etre consultes, mais le lancement reste bloque tant que le CV n est pas ajoute au profil.
            </div>
          </div>
          <Button type="primary" onClick={openProfile}>
            Completer mon profil
          </Button>
        </section>
      ) : null}

      <section className="candidate-dashboard__metrics">
        <DashboardMetric
          icon={<BookOutlined />}
          label="Tests publies"
          value={publishedTests.length}
          hint={`${availableTests.length} a demarrer`}
          accent="#0284c7"
        />
        <DashboardMetric
          icon={<RocketOutlined />}
          label="A reprendre"
          value={resumeItems.length}
          hint="Brouillons sauvegardes"
          accent="#f59e0b"
        />
        <DashboardMetric
          icon={<TrophyOutlined />}
          label="Resultats notes"
          value={completedTests.length}
          hint={`Meilleur score ${bestScore}%`}
          accent="#10b981"
        />
        <DashboardMetric
          icon={<SolutionOutlined />}
          label="Candidatures actives"
          value={applicationStats.active}
          hint={`${applicationStats.total} au total`}
          accent="#7c3aed"
        />
      </section>

      <div className="candidate-dashboard__layout">
        <main className="candidate-dashboard__main" ref={testsRef}>
          <section className="candidate-dashboard__toolbar">
            <div className="candidate-dashboard__toolbar-copy">
              <h2>Mes tests</h2>
              <p>Recherche rapide sur tous les tests visibles dans ta base.</p>
            </div>

            <div className="candidate-dashboard__search">
              <Input
                size="large"
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par titre, poste ou lieu"
                allowClear
              />
            </div>

            <div className="candidate-dashboard__toolbar-count">{allTests.length} element{allTests.length > 1 ? 's' : ''}</div>
          </section>

          {allTests.length === 0 ? (
            <div className="candidate-dashboard__empty candidate-dashboard__empty--large">
              <div className="candidate-dashboard__empty-title">Aucun resultat pour cette recherche</div>
              <div className="candidate-dashboard__empty-copy">Essaie un autre mot-cle ou vide le champ de recherche.</div>
              <Button type="default" onClick={() => setSearch('')}>
                Reinitialiser la recherche
              </Button>
            </div>
          ) : (
            <div className="candidate-dashboard__cards">
              {allTests.map((item) => (
                <TestCard key={item.key} item={item} onAction={handleCardAction} />
              ))}
            </div>
          )}
        </main>

        <aside className="candidate-dashboard__aside">
          <ProfileChecklist items={checklistItems} progress={profileProgress} onProfile={openProfile} />
          <ScorePanel best={bestScore} average={averageScore} pending={pendingCount} />
          <ApplicationsPanel stats={applicationStats} onOpenApplications={openApplications} />
          <ActivityFeed submissions={submissions} onViewResults={openResults} onBrowseTests={browseTests} />
        </aside>
      </div>

      <Modal
        title="Ajouter un CV avant de commencer"
        open={uploadModalVisible}
        onCancel={() => !uploading && setUploadModalVisible(false)}
        footer={null}
        centered
      >
        <div className="candidate-dashboard__modal-copy">
          <p>
            Ce test est rattache a une candidature. Ajoute ton CV une fois pour debloquer le passage des tests suivants.
          </p>

          <Upload
            beforeUpload={(file) => {
              setCvFile(file);
              return false;
            }}
            maxCount={1}
            accept=".pdf,.doc,.docx"
            fileList={cvFile ? [{ uid: 'candidate-cv', name: cvFile.name, status: 'done' }] : []}
            onRemove={() => {
              setCvFile(null);
              return true;
            }}
          >
            <Button icon={<UploadOutlined />} block>
              {cvFile ? 'Changer le fichier' : 'Choisir un CV'}
            </Button>
          </Upload>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            block
            loading={uploading}
            onClick={submitCvAndStart}
            style={{ marginTop: 16 }}
          >
            Enregistrer et commencer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
