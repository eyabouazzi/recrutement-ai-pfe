import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function Terms() {
  return (
    <div className="legal-page">
      <Title level={1}>Conditions d&apos;utilisation</Title>
      <Paragraph type="secondary" className="legal-updated">
        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
      </Paragraph>

      <Title level={2}>1. Objet</Title>
      <Paragraph>
        RecruitAI est une plateforme de recrutement et d&apos;évaluation de candidats. En créant un compte ou en utilisant
        l&apos;application, vous acceptez les présentes conditions.
      </Paragraph>

      <Title level={2}>2. Comptes</Title>
      <Paragraph>
        Vous êtes responsable de la confidentialité de vos identifiants. Toute activité réalisée depuis votre compte est
        réputée effectuée par vous ou votre organisation.
      </Paragraph>

      <Title level={2}>3. Données</Title>
      <Paragraph>
        Le traitement des données personnelles est décrit dans notre politique de confidentialité. Les recruteurs
        s&apos;engagent à respecter le RGPD et les droits des candidats.
      </Paragraph>

      <Title level={2}>4. Utilisation acceptable</Title>
      <Paragraph>
        Il est interdit d&apos;utiliser la plateforme pour des contenus illicites, pour harceler des utilisateurs ou pour
        contourner les mesures de sécurité.
      </Paragraph>

      <Title level={2}>5. Évolution du service</Title>
      <Paragraph>
        RecruitAI peut faire évoluer ses fonctionnalités et ces conditions. Les changements importants seront
        communiqués dans l&apos;application ou par e-mail.
      </Paragraph>

      <Title level={2}>6. Contact</Title>
      <Paragraph>
        Pour toute question, utilisez le formulaire de contact sur le site ou l&apos;adresse support de votre
        organisation.
      </Paragraph>
    </div>
  );
}
