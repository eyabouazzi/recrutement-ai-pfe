import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function Privacy() {
  return (
    <div className="legal-page">
      <Title level={1}>Politique de confidentialité</Title>
      <Paragraph type="secondary" className="legal-updated">
        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
      </Paragraph>

      <Title level={2}>1. Responsable du traitement</Title>
      <Paragraph>
        Les données collectées via RecruitAI sont traitées dans le cadre du service de recrutement et d&apos;évaluation.
        Les responsables de traitement sont les employeurs (comptes RH) et, pour l&apos;hébergement technique, l&apos;éditeur
        de la plateforme selon votre déploiement.
      </Paragraph>

      <Title level={2}>2. Données collectées</Title>
      <Paragraph>
        Peuvent être collectées : identité, coordonnées, CV, réponses aux tests, scores, journaux de connexion et
        métadonnées nécessaires à la sécurité du service.
      </Paragraph>

      <Title level={2}>3. Finalités</Title>
      <Paragraph>
        Gestion des candidatures, évaluation des compétences, statistiques agrégées, amélioration du produit et respect
        des obligations légales.
      </Paragraph>

      <Title level={2}>4. Droits</Title>
      <Paragraph>
        Conformément au RGPD, vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de limitation,
        d&apos;opposition et de portabilité lorsque applicable. Les candidats peuvent exercer ces droits via les canaux
        indiqués par l&apos;employeur ou depuis leur espace candidat.
      </Paragraph>

      <Title level={2}>5. Conservation</Title>
      <Paragraph>
        Les données sont conservées pendant la durée nécessaire au recrutement et aux obligations légales, puis
        supprimées ou anonymisées.
      </Paragraph>

      <Title level={2}>6. Contact</Title>
      <Paragraph>
        Pour toute question relative à cette politique, utilisez le formulaire Contact du site.
      </Paragraph>
    </div>
  );
}
