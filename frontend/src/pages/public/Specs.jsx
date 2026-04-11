import { Card, Col, Row, Tag, Typography, Divider, List, Space, Button } from 'antd';
import { CheckCircleOutlined, RobotOutlined, TeamOutlined, UserOutlined, BarChartOutlined, BellOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const { Title, Paragraph, Text } = Typography;

const objectives = [
  "Selectionner et evaluer les candidats via des tests/quiz structures.",
  "Automatiser la generation des questions adaptees au poste.",
  "Evaluer les reponses ouvertes avec IA pour un scoring clair et exploitable.",
  "Reduire le temps de recrutement et augmenter la precision des decisions RH.",
];

const actors = [
  {
    title: 'Administrateurs / RH',
    icon: <TeamOutlined />,
    items: [
      'Creer et configurer des tests par poste.',
      'Ajuster les criteres et seuils de scoring.',
      'Suivre les resultats candidats et comparer les profils.',
      'Exporter les rapports PDF / Excel.',
    ],
  },
  {
    title: 'Candidats',
    icon: <UserOutlined />,
    items: [
      'Passer les tests en ligne sur une interface simple.',
      'Repondre a des questions QCM + ouvertes.',
      'Recevoir score et feedback rapide.',
      'Suivre historique, recommandations et candidatures.',
    ],
  },
];

const modules = [
  {
    title: 'Authentification & roles',
    points: ['Comptes RH / candidat', 'Connexion securisee', 'Acces par role'],
    status: 'Operationnel',
  },
  {
    title: 'Creation des tests',
    points: ['Creation manuelle', 'Generation IA', 'Question bank', 'Edition / publication'],
    status: 'Operationnel',
  },
  {
    title: 'Passage candidat',
    points: ['Questions melangees', 'Limite de temps', 'Sauvegarde brouillon', 'Soumission auto'],
    status: 'Operationnel',
  },
  {
    title: 'Evaluation automatique',
    points: ['QCM corrige instantanement', 'Analyse IA des reponses ouvertes', 'Breakdown competences'],
    status: 'Operationnel',
  },
  {
    title: 'Dashboard RH',
    points: ['Filtres poste/date/score', 'Comparaison candidats', 'Details evaluation', 'Exports'],
    status: 'Renforce',
  },
  {
    title: 'Notifications',
    points: ['Evenements test termine', 'Score disponible', 'Flux applicatif temps reel'],
    status: 'Operationnel',
  },
  {
    title: 'Module IA additionnel',
    points: ['Assistant candidat pendant test', 'Architecture prete pour chat IA RH/candidat'],
    status: 'Extensible',
  },
];

export default function Specs() {
  return (
    <motion.div
      className="wow-public-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 72px' }}
    >
      <div style={{ marginBottom: 28 }}>
        <Tag color="cyan" style={{ marginBottom: 12 }}>
          Cahier des charges - plateforme screening recrutement
        </Tag>
        <Title level={2} style={{ marginBottom: 8 }}>
          Vision produit et couverture fonctionnelle
        </Title>
        <Paragraph type="secondary" style={{ maxWidth: 900 }}>
          Cette page formalise les exigences du projet et leur traduction produit sur la plateforme.
          Elle sert de reference pour la soutenance et la validation.
        </Paragraph>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <Space align="start" size={12}>
          <RobotOutlined style={{ fontSize: 20, color: '#0284c7', marginTop: 4 }} />
          <div>
            <Title level={4} style={{ marginTop: 0 }}>
              1. Objectif du projet
            </Title>
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

      <Title level={4} style={{ marginBottom: 12 }}>
        2. Les acteurs
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 22 }}>
        {actors.map((actor) => (
          <Col xs={24} md={12} key={actor.title}>
            <Card>
              <Space align="center" size={10} style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 18, color: '#0f766e' }}>{actor.icon}</span>
                <Title level={5} style={{ margin: 0 }}>
                  {actor.title}
                </Title>
              </Space>
              <List
                size="small"
                dataSource={actor.items}
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

      <Title level={4} style={{ marginBottom: 12 }}>
        3. Fonctionnalites principales
      </Title>
      <Row gutter={[16, 16]}>
        {modules.map((module) => (
          <Col xs={24} md={12} lg={8} key={module.title}>
            <Card
              title={module.title}
              extra={
                <Tag color={module.status === 'Renforce' ? 'blue' : module.status === 'Extensible' ? 'purple' : 'green'}>
                  {module.status}
                </Tag>
              }
              style={{ height: '100%' }}
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

      <Card>
        <Space direction="vertical" size={12}>
          <Title level={4} style={{ margin: 0 }}>
            4. Organisation & contraintes
          </Title>
          <Paragraph style={{ marginBottom: 0 }}>
            Front-office candidat + back-office RH, experience responsive, filtres multi-criteres, resultats lisibles et exportables, architecture ouverte a des modules IA supplementaires.
          </Paragraph>
          <Space wrap>
            <Tag icon={<BarChartOutlined />} color="geekblue">Dashboard RH</Tag>
            <Tag icon={<BellOutlined />} color="gold">Notifications intelligentes</Tag>
            <Tag icon={<RobotOutlined />} color="purple">IA evaluative</Tag>
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

