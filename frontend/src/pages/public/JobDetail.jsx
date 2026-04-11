import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Briefcase, Clock, Building2,
  Users, Star, Bookmark, Share2, CheckCircle, Globe,
  Award, ExternalLink
} from 'lucide-react';
import { Button, Tag, Spin, message, Typography } from 'antd';
import { useAuth } from '../../contexts/authContext';
import { getPublicTestById } from '../../api/tests';
import { addFavorite, checkFavorite, removeFavorite } from '../../api/favorite';
import { baseUrl } from '../../api/api';
import './JobDetail.css';

const { Title, Paragraph, Text } = Typography;

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const isAuthenticated = Boolean(token);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getPublicTestById(id);
        if (!res.status) throw new Error(res.message || "Impossible de charger l'offre");
        setJob(res.test);

        if (token) {
          const fav = await checkFavorite(id);
          setSaved(Boolean(fav?.isFavorite));
        } else {
          setSaved(false);
        }
      } catch (error) {
        message.error(error.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, token]);

  const handleApply = () => {
    sessionStorage.setItem('pendingTestId', id);

    if (!isAuthenticated) {
      message.info('Créez un compte ou connectez-vous pour postuler à cette offre.');
      navigate('/signup');
      return;
    }

    if (user?.role !== 'candidat') {
      message.warning('La candidature à une offre est réservée aux comptes candidat.');
      return;
    }

    if (!user?.onboardingDone) {
      message.info('Complétez d’abord votre profil pour finaliser votre candidature.');
      navigate('/onboarding');
      return;
    }

    const hasCv = Boolean(user?.cvUrl) || Boolean(String(user?.cvText || '').trim());
    if (!hasCv) {
      message.info('Ajoutez votre CV dans votre profil avant de postuler a cette offre.');
      navigate('/profile');
      return;
    }

    navigate(`/tests/${id}`);
  };

  const handleSaveJob = async () => {
    if (!isAuthenticated) {
      message.info('Connectez-vous pour enregistrer des offres en favoris.');
      navigate('/login');
      return;
    }

    try {
      if (saved) {
        const res = await removeFavorite(id);
        if (!res.status) throw new Error(res.message || 'Impossible de retirer le favori');
        setSaved(false);
        message.success('Offre retirée des favoris');
      } else {
        const res = await addFavorite(id);
        if (!res.status) throw new Error(res.message || "Impossible d'ajouter le favori");
        setSaved(true);
        message.success('Offre ajoutée aux favoris');
      }
    } catch (error) {
      message.error(error.message || 'Action impossible');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      message.success('Lien copié');
    } catch {
      message.error('Impossible de copier le lien');
    }
  };

  if (loading || !job) {
    return (
      <div className="job-detail-loading">
        <Spin size="large" tip="Chargement de l'offre..." />
      </div>
    );
  }

  const recruiter = job.createdBy;
  const company = recruiter?.companyId;

  return (
    <div className="job-detail-page">
      <header className="detail-header">
        <div className="container">
          <Link to="/careers" className="back-btn">
            <ArrowLeft size={20} /> Retour aux offres
          </Link>

          <div className="header-content">
            <div className="company-logo-large">
              {company?.logo ? (
                <img src={`${baseUrl}${company.logo}`} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 18 }} />
              ) : (
                <Building2 size={48} />
              )}
            </div>
            <div className="job-header-info">
              <h1>{job.title}</h1>
              <div className="company-row">
                <Building2 size={16} />
                <span>{company?.name || 'Entreprise partenaire'}</span>
                {recruiter?.firstName && (
                  <>
                    <Star size={14} fill="#fbbf24" color="#fbbf24" />
                    <span>{recruiter.firstName} {recruiter.lastName}</span>
                  </>
                )}
              </div>
              <div className="job-meta-inline">
                <span><MapPin size={14} /> {job.location || 'Remote'}</span>
                <span><Briefcase size={14} /> {job.employmentType || 'CDI'}</span>
                <span><Clock size={14} /> Publié le {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <Button icon={<Bookmark size={18} />} onClick={handleSaveJob} className={saved ? 'saved' : ''}>
              {saved ? 'En favori' : 'Ajouter aux favoris'}
            </Button>
            <Button icon={<Share2 size={18} />} onClick={handleShare}>
              Partager
            </Button>
            <Button type="primary" size="large" onClick={handleApply} className="apply-btn">
              Postuler maintenant
            </Button>
          </div>
        </div>
      </header>

      <div className="detail-content">
        <div className="container">
          <div className="content-layout">
            <main className="description-col">
              <section className="detail-section">
                <Title level={2}>Description de l'offre</Title>
                <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 15, color: '#334155' }}>
                  {job.description || "Aucune description détaillée n'a été publiée pour cette offre."}
                </Paragraph>
              </section>

              <section className="detail-section">
                <Title level={2}>Informations clés</Title>
                <div className="skills-grid">
                  {job.jobRole && <Tag className="skill-tag-large"><Award size={14} /> {job.jobRole}</Tag>}
                  {job.location && <Tag className="skill-tag-large"><MapPin size={14} /> {job.location}</Tag>}
                  {job.employmentType && <Tag className="skill-tag-large"><Briefcase size={14} /> {job.employmentType}</Tag>}
                  {company?.sector && <Tag className="skill-tag-large"><Building2 size={14} /> {company.sector}</Tag>}
                </div>
              </section>

              <section className="detail-section">
                <Title level={2}>À quoi vous attendre</Title>
                <div className="info-grid">
                  <div className="info-item">
                    <Users size={20} />
                    <div>
                      <strong>Candidatures</strong>
                      <p>{job.applicantCount || 0} candidat(s) ont déjà postulé</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <CheckCircle size={20} />
                    <div>
                      <strong>Compte requis</strong>
                      <p>La candidature est accessible après création de compte et onboarding.</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <Globe size={20} />
                    <div>
                      <strong>Parcours</strong>
                      <p>Après connexion, vous serez redirigé vers le processus de candidature.</p>
                    </div>
                  </div>
                </div>
              </section>
            </main>

            <aside className="sidebar-col">
              <div className="company-card">
                <Title level={3}>Entreprise</Title>
                <Paragraph>{company?.description || "Aucune présentation publique de l'entreprise."}</Paragraph>
                <div className="company-stats">
                  {company?.city && (
                    <div className="stat">
                      <MapPin size={20} />
                      <span>{company.city}</span>
                    </div>
                  )}
                  {company?.sector && (
                    <div className="stat">
                      <Award size={20} />
                      <span>{company.sector}</span>
                    </div>
                  )}
                </div>
                {company?._id && (
                  <Button type="link" onClick={() => navigate(`/companies/${company._id}`)} style={{ paddingLeft: 0 }}>
                    Voir le profil entreprise
                  </Button>
                )}
                {company?.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="company-website">
                    <Globe size={16} /> Visiter le site web
                  </a>
                )}
              </div>

              <div className="apply-card">
                <Title level={3}>Recruteur</Title>
                <Text>{recruiter?.firstName} {recruiter?.lastName}</Text>
                {recruiter?.city && (
                  <p style={{ marginTop: 8, color: '#64748b' }}>{recruiter.city}</p>
                )}
                {recruiter?._id && (
                  <Button icon={<ExternalLink size={16} />} onClick={() => navigate(`/recruiters/${recruiter._id}`)} style={{ marginTop: 12 }}>
                    Consulter le profil recruteur
                  </Button>
                )}
              </div>

              <div className="apply-card">
                <Title level={3}>Intéressé(e) ?</Title>
                <p>La candidature nécessite un compte candidat et un profil complété.</p>
                <Button type="primary" size="large" block onClick={handleApply}>
                  Postuler
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
