import { Card, Col, Row, Tag, Typography, Divider, List, Space, Button } from 'antd';
import {
  CheckCircleOutlined,
  RobotOutlined,
  TeamOutlined,
  UserOutlined,
  BarChartOutlined,
  BellOutlined,
  LockOutlined,
  SolutionOutlined,
  FileSearchOutlined,
  ProfileOutlined,
  ThunderboltOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const { Title, Paragraph, Text } = Typography;

const objectives = [
  'Sélectionner et évaluer les candidats via des tests et quiz structurés.',
  'Automatiser la génération de questions adaptées au poste.',
  "Évaluer les réponses ouvertes avec l'IA pour un scoring clair et exploitable.",
  'Réduire le temps de recrutement et augmenter la précision des décisions RH.',
];

const actors = [
  {
    title: 'Le Candidat',
    subtitle: 'Utilisateur cherchant une opportunité professionnelle.',
    icon: <UserOutlined />,
    items: [
      'Créer et gérer son profil professionnel.',
      'Soumettre son CV pour postuler aux offres.',
      "Passer les évaluations techniques générées par l'IA.",
      'Consulter les notifications.',
      'Consulter ses candidatures.',
    ],
  },
  {
    title: 'Le Recruteur',
    subtitle: "Membre de l'équipe RH ou technique de l'entreprise.",
    icon: <TeamOutlined />,
    items: [
      "Publier, modifier et archiver les offres d'emploi.",
      'Consulter le score de matching des candidats.',
      'Suivre et évaluer les résultats des tests techniques.',
    ],
  },
];

const functionalRequirements = [
  { title: 'Gestion des accès', icon: <LockOutlined />, text: 'Authentification sécurisée, inscription, et récupération de mot de passe.' },
  { title: 'Gestion des opportunités', icon: <SolutionOutlined />, text: 'Opérations CRUD (création, lecture, mise à jour, suppression) sur les offres d’emploi.' },
  { title: 'Traitement des candidatures', icon: <FileSearchOutlined />, text: 'Téléchargement des CV, suivi des candidatures via un tableau de bord interactif, et suppression.' },
  { title: 'Analyse IA', icon: <RobotOutlined />, text: 'Évaluation sémantique des CV et calcul d’un score de compatibilité (matching score).' },
  { title: 'Évaluation technique', icon: <ThunderboltOutlined />, text: 'Passage de tests chronométrés personnalisés générés par l’IA avec restitution du résultat final.' },
  { title: 'Gestion de profil', icon: <ProfileOutlined />, text: 'Mise à jour et consultation des informations personnelles, des compétences et du parcours de l’utilisateur.' },
];

const modules = [
  { title: 'Gestion des accès', points: ['Inscription candidat et espace entreprise RH', 'Authentification sécurisée', 'Récupération et réinitialisation du mot de passe', "Contrôle d'accès par rôle (candidat, RH, admin)"], status: 'Opérationnel' },
  { title: "Offres d'emploi (CRUD)", points: ['Création, lecture, mise à jour et archivage des offres', 'Statuts brouillon, publié, fermé', "Association d'évaluations techniques à l'offre"], status: 'Opérationnel' },
  { title: 'Profil, CV & parcours', points: ['Consultation et mise à jour des informations personnelles', 'Compétences et parcours professionnel', 'Dépôt du CV pour postuler aux offres'], status: 'Opérationnel' },
  { title: 'Analyse CV & matching', points: ['Analyse sémantique du CV par rapport au poste', 'Score de compatibilité (matching)', 'Visualisation côté recruteur pour prioriser les dossiers'], status: 'Opérationnel' },
  { title: 'Traitement des candidatures', points: ['Téléchargement des CV et pièces associées', 'Suivi via tableau de bord candidat et pipeline RH', 'Suppression ou retrait de candidatures'], status: 'Opérationnel' },
  { title: 'Génération & gestion des tests', points: ['Création manuelle et banque de questions', "Génération IA de questions adaptées à l'offre", 'Édition, publication et suivi des campagnes'], status: 'Opérationnel' },
  { title: 'Passage des évaluations techniques', points: ['Tests chronométrés personnalisés', 'Questions mélangées, sauvegarde brouillon', 'Soumission et verrouillage automatique'], status: 'Opérationnel' },
  { title: 'Scoring & restitution', points: ['Correction immédiate des QCM', "Analyse IA des réponses ouvertes", 'Détail par compétences et score final'], status: 'Opérationnel' },
  { title: 'Tableaux de bord RH', points: ['Filtres par offre, date et score', 'Profil candidat et résultats détaillés', 'Synthèses et exports de données (CSV, rapports)'], status: 'Renforcé' },
  { title: 'Notifications', points: ['Alertes fin de test et scores disponibles', 'Événements applicatifs en temps réel (WebSocket)', 'Centre de messages côté produit (évolutif)'], status: 'Opérationnel' },
  { title: 'Modules IA complémentaires', points: ['Assistant pendant le passage de test', 'Architecture ouverte (chat RH / candidat, recommandations)'], status: 'Extensible' },
];

function statusColor(status) {
  if (status === 'Renforcé' || status === 'Renforce') return 'blue';
  if (status === 'Extensible') return 'purple';
  return 'green';
}

export default function Specs() {
  return (
    <motion.div
      className="wow-public-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 72px' }}
    >
      <section className="pub-modern-hero" style={{ marginBottom: 22 }}>
        <Tag color="cyan" style={{ marginBottom: 12 }}>Cahier des charges</Tag>
        <Title level={2} style={{ marginBottom: 8 }}>Vision produit et couverture fonctionnelle</Title>
        <Paragraph type="secondary" style={{ maxWidth: 900, marginBottom: 0 }}>
          Une vue claire et professionnelle des exigences du projet, des acteurs et des modules clés de la plateforme.
        </Paragraph>
      </section>

      <Card style={{ marginBottom: 20, borderRadius: 16 }}>
        <Space align="start" size={12}>
          <RobotOutlined style={{ fontSize: 20, color: '#0284c7', marginTop: 4 }} />
          <div>
            <Title level={4} style={{ marginTop: 0 }}>1. Objectif du projet</Title>
            <List
              size="small"
              dataSource={objectives}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <CheckCircleOutlined style={{ color: '#16a34a' }} />
                    <Text>{item}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        </Space>
      </Card>

      <Title level={4} style={{ marginBottom: 12 }}>2. Les acteurs</Title>
      <Paragraph type="secondary" style={{ marginTop: -6, marginBottom: 16, maxWidth: 920 }}>
        Vision par rôle pour garantir une expérience fluide côté candidat et une efficacité opérationnelle côté RH.
      </Paragraph>
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        {actors.map((actor) => (
          <Col xs={24} md={12} key={actor.title}>
            <Card style={{ height: '100%', borderRadius: 14 }}>
              <Space align="center" size={10} style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 18, color: '#0f766e' }}>{actor.icon}</span>
                <Title level={5} style={{ margin: 0 }}>{actor.title}</Title>
              </Space>
              <Paragraph type="secondary" style={{ marginBottom: 12 }}>{actor.subtitle}</Paragraph>
              <List
                size="small"
                dataSource={actor.items}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <AuditOutlined style={{ color: '#64748b', fontSize: 12 }} />
                      <Text>{item}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Title level={4} style={{ marginBottom: 12 }}>3. Besoins fonctionnels</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        {functionalRequirements.map((req) => (
          <Col xs={24} md={12} lg={8} key={req.title}>
            <Card size="small" style={{ height: '100%', borderRadius: 12 }} title={<Space>{req.icon}<span>{req.title}</span></Space>}>
              <Text type="secondary">{req.text}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Title level={4} style={{ marginBottom: 12 }}>4. Fonctionnalités principales</Title>
      <Row gutter={[16, 16]}>
        {modules.map((module) => (
          <Col xs={24} md={12} lg={8} key={module.title}>
            <Card
              title={module.title}
              extra={<Tag color={statusColor(module.status)}>{module.status}</Tag>}
              style={{ height: '100%', borderRadius: 14 }}
            >
              <List
                size="small"
                dataSource={module.points}
                renderItem={(item) => (
                  <List.Item>
                    <Text>{item}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Divider />

      <Card style={{ borderRadius: 16 }}>
        <Space direction="vertical" size={12}>
          <Title level={4} style={{ margin: 0 }}>5. Organisation et contraintes</Title>
          <Paragraph style={{ marginBottom: 0 }}>
            Front-office candidat et back-office RH, expérience responsive, filtres multi-critères, résultats lisibles et
            exportables, architecture ouverte à des modules IA supplémentaires.
          </Paragraph>
          <Space wrap>
            <Tag icon={<BarChartOutlined />} color="geekblue">Dashboard RH</Tag>
            <Tag icon={<BellOutlined />} color="gold">Notifications intelligentes</Tag>
            <Tag icon={<RobotOutlined />} color="purple">IA évaluative</Tag>
          </Space>
          <Space>
            <Link to="/signup?role=HR">
              <Button type="primary">Rejoindre en tant qu'entreprise RH</Button>
            </Link>
            <Link to="/careers">
              <Button>Consulter les offres</Button>
            </Link>
          </Space>
        </Space>
      </Card>
    </motion.div>
  );
}

