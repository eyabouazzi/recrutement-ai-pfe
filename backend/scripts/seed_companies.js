require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('../models/company.model');

const companies = [
  {
    name: 'TechVision Algerie',
    email: 'contact@techvision.dz',
    sector: 'Technologies',
    city: 'Alger',
    size: '51-200',
    description: 'Leader algerien en solutions logicielles et transformation digitale des entreprises.',
    website: 'https://techvision.dz',
    status: 'approved',
    foundedYear: 2015,
  },
  {
    name: 'DataSync Labs',
    email: 'hello@datasynclabs.dz',
    sector: 'Intelligence Artificielle',
    city: 'Oran',
    size: '11-50',
    description: 'Studio specialise en IA, machine learning et analyse de donnees pour les marches MENA.',
    website: 'https://datasynclabs.dz',
    status: 'approved',
    foundedYear: 2019,
  },
  {
    name: 'FinServ Solutions',
    email: 'rh@finserv.dz',
    sector: 'Finance & Fintech',
    city: 'Constantine',
    size: '201-500',
    description: 'Plateforme fintech innovante proposant des services bancaires digitaux et paiements en ligne.',
    website: 'https://finserv.dz',
    status: 'approved',
    foundedYear: 2017,
  },
  {
    name: 'GreenBuild Corp',
    email: 'jobs@greenbuild.dz',
    sector: 'Energie & Environnement',
    city: 'Annaba',
    size: '51-200',
    description: 'Entreprise specialisee dans les energies renouvelables et la construction ecologique.',
    website: 'https://greenbuild.dz',
    status: 'approved',
    foundedYear: 2020,
  },
  {
    name: 'MedTech Innovations',
    email: 'careers@medtech.dz',
    sector: 'Sante & MedTech',
    city: 'Alger',
    size: '11-50',
    description: 'Startup en e-sante, developpant des applications de suivi patient et telemedecine.',
    website: 'https://medtech.dz',
    status: 'approved',
    foundedYear: 2021,
  },
  {
    name: 'LogiTrans DZ',
    email: 'recrutement@logitrans.dz',
    sector: 'Logistique & Transport',
    city: 'Setif',
    size: '201-500',
    description: 'Operateur logistique national avec un reseau couvrant les 48 wilayas algeriennes.',
    website: 'https://logitrans.dz',
    status: 'approved',
    foundedYear: 2012,
  },
  {
    name: 'EduPlatform',
    email: 'hr@eduplatform.dz',
    sector: 'Education & EdTech',
    city: 'Alger',
    size: '11-50',
    description: 'Plateforme e-learning proposant des formations certifiantes en arabe, francais et anglais.',
    website: 'https://eduplatform.dz',
    status: 'approved',
    foundedYear: 2018,
  },
  {
    name: 'CloudSec Algeria',
    email: 'talent@cloudsec.dz',
    sector: 'Cybersecurite',
    city: 'Oran',
    size: '1-10',
    description: 'Expert en securite informatique, audit et protection des infrastructures cloud des PME.',
    website: 'https://cloudsec.dz',
    status: 'approved',
    foundedYear: 2022,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await Company.countDocuments();
    if (existing > 0) {
      console.log(`Found ${existing} existing companies — skipping seed (use --force to overwrite).`);
      if (!process.argv.includes('--force')) {
        await mongoose.disconnect();
        return;
      }
      await Company.deleteMany({});
      console.log('Cleared existing companies.');
    }

    const inserted = await Company.insertMany(companies);
    console.log(`Seeded ${inserted.length} companies successfully.`);
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Done.');
  }
}

seed();
