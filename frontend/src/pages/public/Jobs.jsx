import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, MapPin, Briefcase, DollarSign, Clock, Filter, 
  Building2, Users, Star, Bookmark, ChevronRight, Globe,
  Calendar, Award, TrendingUp
} from 'lucide-react';
import { Input, Select, Button, Spin, Empty, Tag } from 'antd';
import './Jobs.css';

const { Search: AntSearch } = Input;
const { Option } = Select;

// Mock data - will be replaced with API calls
const CATEGORIES = [
  { id: 'tech', name: 'Technologie', icon: '💻', count: 156 },
  { id: 'health', name: 'Santé', icon: '🏥', count: 89 },
  { id: 'finance', name: 'Finance', icon: '📊', count: 124 },
  { id: 'marketing', name: 'Marketing', icon: '📱', count: 67 },
  { id: 'education', name: 'Éducation', icon: '🎓', count: 45 },
  { id: 'engineering', name: 'Ingénierie', icon: '⚙️', count: 98 },
];

const JOB_TYPES = ['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'];
const EXPERIENCE_LEVELS = ['Débutant', 'Junior', 'Confirmé', 'Senior', 'Expert'];
const LOCATIONS = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Toulouse', 'Remote'];

export default function PublicJobs() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [savedJobs, setSavedJobs] = useState(new Set());

  useEffect(() => {
    // Fetch jobs based on category and filters
    fetchJobs();
  }, [category, selectedType, selectedLevel, selectedLocation]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      setTimeout(() => {
        const mockJobs = generateMockJobs();
        setJobs(mockJobs);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  const generateMockJobs = () => {
    // Mock data generator
    return Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      title: `${['Développeur', 'Designer', 'Chef de projet', 'Data Scientist', 'Ingénieur'][i % 5]} ${['Full Stack', 'UX/UI', 'Marketing', 'IA', 'Système'][Math.floor(i / 3)]}`,
      company: {
        name: `Entreprise ${String.fromCharCode(65 + i)}`,
        logo: null,
        rating: 3.5 + Math.random() * 1.5,
      },
      location: LOCATIONS[i % LOCATIONS.length],
      type: JOB_TYPES[i % JOB_TYPES.length],
      experience: EXPERIENCE_LEVELS[i % EXPERIENCE_LEVELS.length],
      salary: `${45 + (i * 2)}k€ - ${60 + (i * 2)}k€`,
      posted: `${i + 1} jours`,
      skills: ['React', 'Node.js', 'TypeScript'].slice(0, (i % 3) + 1),
      description: 'Description du poste avec les responsabilités et exigences...',
      category: category || CATEGORIES[i % CATEGORIES.length].id,
      remote: i % 3 === 0,
    }));
  };

  const handleSaveJob = (jobId, e) => {
    e.preventDefault();
    setSavedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="public-jobs-page">
      {/* Hero Section */}
      <section className="jobs-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1>Trouvez votre emploi idéal</h1>
            <p className="hero-subtitle">
              Découvrez des milliers d'opportunités et postulez facilement
            </p>
            
            <div className="search-bar">
              <AntSearch
                size="large"
                placeholder="Rechercher par compétence, titre ou entreprise"
                prefix={<Search size={18} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={() => {}}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <div className="container">
          <h2>Explorer par catégorie</h2>
          <div className="category-grid">
            {CATEGORIES.map((cat, idx) => (
              <Link
                key={cat.id}
                to={`/jobs/category/${cat.id}`}
                className={`category-card ${category === cat.id ? 'active' : ''}`}
              >
                <span className="category-icon">{cat.icon}</span>
                <h3>{cat.name}</h3>
                <span className="category-count">{cat.count} offres</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Filters & Results */}
      <section className="jobs-results">
        <div className="container">
          <div className="results-layout">
            {/* Sidebar Filters */}
            <aside className="filters-sidebar">
              <div className="filter-group">
                <h3><Filter size={18} /> Filtres</h3>
                
                <div className="filter-item">
                  <label>Type de contrat</label>
                  <Select
                    value={selectedType}
                    onChange={setSelectedType}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">Tous les types</Option>
                    {JOB_TYPES.map(type => (
                      <Option key={type} value={type}>{type}</Option>
                    ))}
                  </Select>
                </div>

                <div className="filter-item">
                  <label>Niveau d'expérience</label>
                  <Select
                    value={selectedLevel}
                    onChange={setSelectedLevel}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">Tous niveaux</Option>
                    {EXPERIENCE_LEVELS.map(level => (
                      <Option key={level} value={level}>{level}</Option>
                    ))}
                  </Select>
                </div>

                <div className="filter-item">
                  <label>Localisation</label>
                  <Select
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">Toutes villes</Option>
                    {LOCATIONS.map(loc => (
                      <Option key={loc} value={loc}>{loc}</Option>
                    ))}
                  </Select>
                </div>

                <Button type="primary" block onClick={() => {
                  setSelectedType('all');
                  setSelectedLevel('all');
                  setSelectedLocation('all');
                }}>
                  Réinitialiser les filtres
                </Button>
              </div>
            </aside>

            {/* Job Cards */}
            <main className="jobs-main">
              <div className="jobs-header">
                <h2>
                  {filteredJobs.length} offre{filteredJobs.length > 1 ? 's' : ''} d'emploi
                  {category && ` - ${CATEGORIES.find(c => c.id === category)?.name}`}
                </h2>
              </div>

              {loading ? (
                <div className="loading-state">
                  <Spin size="large" tip="Chargement des offres..." />
                </div>
              ) : filteredJobs.length === 0 ? (
                <Empty 
                  description="Aucune offre ne correspond à votre recherche"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <div className="jobs-grid">
                  {filteredJobs.map((job, idx) => (
                    <motion.div
                      key={job.id}
                      className="job-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -4 }}
                    >
                      <div className="job-card-header">
                        <div className="company-logo">
                          <Building2 size={32} />
                        </div>
                        <div className="job-info">
                          <h3 className="job-title">{job.title}</h3>
                          <p className="company-name">{job.company.name}</p>
                        </div>
                        <button
                          className={`save-btn ${savedJobs.has(job.id) ? 'saved' : ''}`}
                          onClick={(e) => handleSaveJob(job.id, e)}
                        >
                          <Bookmark size={20} fill={savedJobs.has(job.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <div className="job-card-body">
                        <div className="job-tags">
                          <Tag color="blue"><Briefcase size={12} /> {job.type}</Tag>
                          <Tag color="green"><MapPin size={12} /> {job.location}</Tag>
                          <Tag color="purple"><DollarSign size={12} /> {job.salary}</Tag>
                        </div>

                        <div className="job-skills">
                          {job.skills.map(skill => (
                            <Tag key={skill} className="skill-tag">{skill}</Tag>
                          ))}
                        </div>

                        <div className="job-meta">
                          <span><Clock size={14} /> Publié {job.posted}</span>
                          {job.remote && <span><Globe size={14} /> Remote friendly</span>}
                        </div>
                      </div>

                      <div className="job-card-footer">
                        <Link to={`/jobs/${job.id}`} className="view-job-btn">
                          Voir l'offre <ChevronRight size={16} />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="jobs-cta">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2>Prêt à postuler ?</h2>
            <p>Créez un compte pour sauvegarder vos offres préférées et suivre vos candidatures</p>
            <div className="cta-buttons">
              <Button type="primary" size="large" onClick={() => navigate('/signup')}>
                Créer un compte gratuit
              </Button>
              <Button size="large" onClick={() => navigate('/login')}>
                Se connecter
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
