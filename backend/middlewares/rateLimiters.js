const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: false, message: 'Trop de tentatives de connexion. Réessayez plus tard.' },
});

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 12,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: false, message: 'Trop de créations de compte depuis cette adresse. Réessayez plus tard.' },
});

const submitLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: false, message: 'Trop de soumissions. Attendez quelques minutes.' },
});

const chatLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 45,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: false, message: 'Limite d’utilisation de l’assistant atteinte.' },
});

const generateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 35,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: false, message: 'Limite de génération IA atteinte. Réessayez plus tard.' },
});

/** Public contact / demo / newsletter forms */
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: false, message: 'Trop de demandes. Réessayez dans quelques minutes.' },
});

module.exports = {
    loginLimiter,
    signupLimiter,
    submitLimiter,
    chatLimiter,
    generateLimiter,
    contactLimiter,
};
