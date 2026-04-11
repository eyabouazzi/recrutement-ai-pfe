const ContactLead = require('../models/contactLead.model');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /contact — public lead capture (demo, contact, newsletter)
 */
exports.submitLead = async (req, res) => {
  try {
    const type = String(req.body.type || '').trim();
    const allowed = ['contact', 'demo', 'newsletter'];
    if (!allowed.includes(type)) {
      return res.status(400).json({ status: false, message: 'Type de demande invalide.' });
    }

    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ status: false, message: 'Adresse e-mail invalide.' });
    }

    const name = String(req.body.name || '').trim().slice(0, 120);
    const company = String(req.body.company || '').trim().slice(0, 120);
    let message = String(req.body.message || '').trim().slice(0, 5000);

    if (type === 'newsletter') {
      if (!message) message = 'Inscription à la newsletter';
    } else {
      if (message.length < 10) {
        return res.status(400).json({
          status: false,
          message: 'Veuillez décrire votre besoin en au moins 10 caractères.',
        });
      }
    }

    const meta = JSON.stringify({
      ip: req.ip || req.connection?.remoteAddress,
      ua: req.get('user-agent') || '',
    });

    await ContactLead.create({
      type,
      email,
      name,
      company,
      message,
      source: 'website',
      meta,
    });

    const messages = {
      contact: 'Message envoyé. Notre équipe vous répondra sous 2 jours ouvrés.',
      demo: 'Demande enregistrée. Un conseiller vous contactera pour planifier la démo.',
      newsletter: 'Merci ! Vous êtes inscrit·e à la veille RH.',
    };

    return res.status(201).json({
      status: true,
      message: messages[type] || 'Enregistré.',
    });
  } catch (err) {
    console.error('submitLead', err);
    return res.status(500).json({ status: false, message: 'Erreur serveur. Réessayez plus tard.' });
  }
};
