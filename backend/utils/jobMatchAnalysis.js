/**
 * Moteur de matching CV ↔ offre (v2) — multi-dimensionnel, narratif et données pour visualisation.
 * Sortie compatible legacy + objet matchEngine pour l’UI « cosmos ».
 */

const SKILL_KEYWORDS = [
    'javascript', 'typescript', 'react', 'vue', 'angular', 'next.js', 'html', 'css', 'sass', 'tailwind',
    'node', 'node.js', 'express', 'nestjs', 'python', 'django', 'flask', 'fastapi', 'java', 'spring',
    'c#', '.net', 'php', 'laravel', 'go', 'rust', 'sql', 'mysql', 'postgresql',
    'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform',
    'git', 'linux', 'devops', 'rest api', 'graphql', 'machine learning', 'data science',
    'pandas', 'numpy', 'tensorflow', 'pytorch', 'power bi', 'tableau', 'excel',
    'figma', 'ux', 'ui', 'product', 'testing', 'jest', 'cypress', 'playwright', 'vitest',
    'communication', 'leadership', 'management', 'scrum', 'agile', 'kafka', 'rabbitmq',
    'elasticsearch', 'nginx', 'webpack', 'vite', 'redux', 'zustand', 'prisma', 'sequelize',
];

const ROLE_HINTS = [
    { label: 'Frontend', patterns: ['frontend', 'front-end', 'react', 'vue', 'angular', 'ui', 'ux'] },
    { label: 'Backend', patterns: ['backend', 'back-end', 'node', 'express', 'nestjs', 'api', 'java', 'spring', 'django', 'flask'] },
    { label: 'Full-Stack', patterns: ['full stack', 'full-stack', 'frontend', 'backend', 'react', 'node'] },
    { label: 'Data', patterns: ['data', 'analyst', 'analytics', 'python', 'sql', 'tableau', 'power bi'] },
    { label: 'ML', patterns: ['machine learning', 'ml', 'ai', 'tensorflow', 'pytorch'] },
    { label: 'DevOps', patterns: ['devops', 'cloud', 'docker', 'kubernetes', 'terraform', 'aws', 'azure', 'gcp'] },
    { label: 'Design', patterns: ['design', 'designer', 'ux', 'ui', 'figma', 'product designer'] },
    { label: 'Product', patterns: ['product manager', 'product owner', 'product'] },
];

const FRENCH_STOP = new Set([
    'cette', 'cela', 'comme', 'avec', 'pour', 'dans', 'nous', 'vous', 'leur', 'elles', 'aussi',
    'ainsi', 'entre', 'après', 'avant', 'chez', 'sans', 'sous', 'tout', 'tous', 'toute', 'être',
    'avoir', 'faire', 'notre', 'votre', 'leurs', 'candidat', 'profil', 'poste', 'offre', 'mission',
]);

const SKILL_SYNONYMS = [
    ['react', 'reactjs', 'react.js'],
    ['node', 'node.js', 'nodejs'],
    ['typescript', 'ts'],
    ['javascript', 'js'],
    ['postgresql', 'postgres'],
    ['kubernetes', 'k8s'],
];

// ─── NEW: Extended CV signal catalogs ─────────────────────────────────────────

const EDUCATION_LEVELS = [
    { level: 'PhD', score: 100, patterns: [/\b(ph\.?d|doctorat|doctorate|thèse|thesis)\b/i] },
    { level: 'Master', score: 85, patterns: [/\b(master|msc|m\.sc|m\.s\.|mba|magister|ingénieur|engineering degree)\b/i] },
    { level: 'Bachelor', score: 70, patterns: [/\b(bachelor|licence|bsc|b\.sc|b\.s\.|l\.?[123]|deug|dut|licence pro)\b/i] },
    { level: 'Associate', score: 55, patterns: [/\b(bts|iut|associate|hnd|hnc|deust)\b/i] },
    { level: 'Bootcamp', score: 50, patterns: [/\b(bootcamp|formation intensive|coding school|le wagon|holberton|wild code)\b/i] },
    { level: 'HighSchool', score: 35, patterns: [/\b(baccalauréat|bac|lycée|high school|terminale)\b/i] },
];

const CERTIFICATION_CATALOG = [
    { name: 'AWS', patterns: [/aws.certified|amazon.web.services.certified/i], domain: 'cloud', weight: 1.0 },
    { name: 'GCP', patterns: [/google.cloud.certified|gcp.certified/i], domain: 'cloud', weight: 0.95 },
    { name: 'Azure', patterns: [/microsoft.certified|az-\d{3}|azure.certified/i], domain: 'cloud', weight: 0.95 },
    { name: 'CKA/CKAD', patterns: [/\b(cka|ckad|certified.kubernetes)\b/i], domain: 'devops', weight: 0.9 },
    { name: 'Scrum Master', patterns: [/\b(csm|certified.scrum|psm.i|scrum.master)\b/i], domain: 'agile', weight: 0.75 },
    { name: 'PMP', patterns: [/\bpmp\b|project.management.professional/i], domain: 'management', weight: 0.8 },
    { name: 'TensorFlow Dev', patterns: [/tensorflow.developer.certificate/i], domain: 'ml', weight: 0.9 },
    { name: 'Meta React', patterns: [/meta.certified|meta.front.end|meta.react/i], domain: 'frontend', weight: 0.8 },
    { name: 'Oracle Java', patterns: [/oracle.certified|ocpjp|ocajp|ocp.java/i], domain: 'backend', weight: 0.8 },
    { name: 'MongoDB', patterns: [/mongodb.certified|m[0-9]{3}.certified/i], domain: 'data', weight: 0.75 },
    { name: 'Security+', patterns: [/comptia.security|security\+/i], domain: 'security', weight: 0.85 },
    { name: 'CISSP', patterns: [/\bcissp\b/i], domain: 'security', weight: 0.9 },
    { name: 'Cisco', patterns: [/\b(ccna|ccnp|cisco.certified)\b/i], domain: 'network', weight: 0.8 },
    { name: 'Databricks', patterns: [/databricks.certified/i], domain: 'data', weight: 0.85 },
    { name: 'Tableau', patterns: [/tableau.certified|tableau.desktop.specialist/i], domain: 'data', weight: 0.7 },
];

const LANGUAGE_CATALOG = [
    { lang: 'English', patterns: [/\b(english|anglais|ielts|toefl|toeic|cambridge|c1|c2|b2.english)\b/i], score: 90 },
    { lang: 'French', patterns: [/\b(french|français|dalf|delf|tcf|b2.français)\b/i], score: 85 },
    { lang: 'Arabic', patterns: [/\b(arabic|arabe|العربية)\b/i], score: 80 },
    { lang: 'German', patterns: [/\b(german|allemand|deutsch|goethe|telc)\b/i], score: 80 },
    { lang: 'Spanish', patterns: [/\b(spanish|español|espagnol|dele)\b/i], score: 80 },
    { lang: 'Chinese', patterns: [/\b(chinese|mandarin|hsk|chinois)\b/i], score: 85 },
];

const INDUSTRY_DOMAINS = [
    { domain: 'Fintech', patterns: [/\b(fintech|banking|payment|stripe|paypal|financial.tech|blockchain|crypto|defi|trading|bank)\b/i] },
    { domain: 'Healthcare', patterns: [/\b(healthcare|medical|health.tech|ehr|emr|clinical|hospital|pharma|biotech|fhir|hl7)\b/i] },
    { domain: 'E-commerce', patterns: [/\b(e.commerce|ecommerce|shopify|magento|woocommerce|marketplace|retail.tech|cart|checkout)\b/i] },
    { domain: 'EdTech', patterns: [/\b(edtech|education.tech|e.learning|lms|moodle|coursera|mooc|pedagogy)\b/i] },
    { domain: 'SaaS', patterns: [/\b(saas|software.as.a.service|b2b.software|multi.tenant|subscription.platform)\b/i] },
    { domain: 'Gaming', patterns: [/\b(game.dev|unity|unreal|godot|gaming|game.engine|3d.rendering|opengl|webgl)\b/i] },
    { domain: 'IoT', patterns: [/\b(iot|embedded|firmware|rtos|arduino|raspberry|mqtt|modbus|plc)\b/i] },
    { domain: 'Cybersecurity', patterns: [/\b(cybersecurity|pentest|penetration.test|siem|soc|vulnerability|appsec|devsecops)\b/i] },
    { domain: 'Logistics', patterns: [/\b(logistics|supply.chain|erp|sap|warehouse|transport|fleet.management)\b/i] },
    { domain: 'AI/ML', patterns: [/\b(artificial.intelligence|machine.learning|deep.learning|nlp|computer.vision|llm|gpt|bert|neural.network)\b/i] },
];

const PROJECT_SIGNALS = [
    /github\.com\/[a-z0-9_-]+\/[a-z0-9_-]+/i,
    /gitlab\.com\/[a-z0-9_-]+/i,
    /\b(open.source|contribution|contributed to|pull request|forked|npm package|published package)\b/i,
    /\b(side project|personal project|projet personnel|portfolio|built a|developed a|created a|launched a)\b/i,
    /\b(app\.store|google.play|deployed on|production.app|live at|www\.|https?:\/\/)\b/i,
    /\b(hackathon|won|1st place|prize|award|winner)\b/i,
];

const QUANTIFIED_PATTERNS = [
    /\b(increased|improved|reduced|optimized|boosted|grew|cut|saved|delivered)\b.{0,40}\b(\d+\s*%|\d+x|millions?|k\s*users|hours)\b/i,
    /\b\d{1,3}[%]\s*(increase|reduction|improvement|decrease|faster|more)\b/i,
    /\b(served|handled|processed|managed)\b.{0,30}\b(\d[\d,]*)\b.{0,20}\b(users|requests|clients|transactions|records)\b/i,
    /\b(team|squad|chapter)\s*(of|with)\s*\d+/i,
    /\b\d+\s*(microseconds|ms|milliseconds)\s*(response|latency|throughput)\b/i,
];

const LEADERSHIP_PATTERNS = [
    /\b(led|lead|leaded|leading)\b.{0,30}\b(team|squad|chapter|tribe|guild|engineers?|developers?)\b/i,
    /\b(managed|managing)\b.{0,30}\b(\d+|team|engineers?|developers?|reports?)\b/i,
    /\b(tech lead|technical lead|engineering manager|cto|vp.engineering|head of|director of)\b/i,
    /\b(mentored|coached|onboarded|trained)\b.{0,30}\b(junior|intern|team|engineers?)\b/i,
    /\b(architect|architected|designed the system|system design|designed and led)\b/i,
    /\b(scrum master|product owner|squad lead|chapter lead)\b/i,
];

// ─── NEW: Signal extraction functions ────────────────────────────────────────

function detectEducationLevel(text) {
    const haystack = String(text || '').toLowerCase();
    for (const entry of EDUCATION_LEVELS) {
        if (entry.patterns.some((p) => p.test(haystack))) return entry;
    }
    return null;
}

function detectCertifications(text) {
    const haystack = String(text || '');
    return CERTIFICATION_CATALOG.filter((cert) =>
        cert.patterns.some((p) => p.test(haystack))
    ).map((c) => ({ name: c.name, domain: c.domain, weight: c.weight }));
}

function detectLanguages(text) {
    const haystack = String(text || '');
    return LANGUAGE_CATALOG.filter((l) =>
        l.patterns.some((p) => p.test(haystack))
    ).map((l) => l.lang);
}

function detectIndustryDomains(text) {
    const haystack = String(text || '');
    return INDUSTRY_DOMAINS.filter((d) =>
        d.patterns.some((p) => p.test(haystack))
    ).map((d) => d.domain);
}

function detectProjectEvidence(text) {
    const haystack = String(text || '');
    const hits = PROJECT_SIGNALS.filter((p) => p.test(haystack));
    return { count: hits.length, hasOpenSource: /open.source|contribution|pull.request/i.test(haystack), hasLiveProject: /github\.com|gitlab\.com|www\.|https?:\/\//i.test(haystack) };
}

function detectQuantifiedAchievements(text) {
    const haystack = String(text || '');
    return QUANTIFIED_PATTERNS.filter((p) => p.test(haystack)).length;
}

function detectLeadershipSignals(text) {
    const haystack = String(text || '');
    return LEADERSHIP_PATTERNS.filter((p) => p.test(haystack)).length;
}

// ─── NEW: Scoring functions for new dimensions ────────────────────────────────

function computeEducationScore(eduEntry, jobText) {
    if (!eduEntry) return 50;
    const job = String(jobText || '').toLowerCase();
    const requiresPhd = /\b(phd|doctorate|doctorat|recherche|research scientist)\b/i.test(job);
    const requiresMaster = /\b(master|msc|bac\+[45]|ingénieur|graduate)\b/i.test(job);
    if (requiresPhd) return eduEntry.level === 'PhD' ? 100 : eduEntry.level === 'Master' ? 65 : 35;
    if (requiresMaster) return ['PhD', 'Master'].includes(eduEntry.level) ? 100 : ['Bachelor', 'Associate'].includes(eduEntry.level) ? 72 : 50;
    return Math.max(50, eduEntry.score);
}

function computeCertificationScore(certs, jobText) {
    if (!certs || certs.length === 0) return 50;
    const job = String(jobText || '').toLowerCase();
    const relevant = certs.filter((c) => job.includes(c.domain) || job.includes(c.name.toLowerCase()));
    const totalWeight = relevant.reduce((sum, c) => sum + c.weight, 0);
    const allWeight = certs.reduce((sum, c) => sum + c.weight * 0.4, 0);
    return Math.min(100, Math.round(50 + relevant.length * 12 + totalWeight * 14 + allWeight * 6));
}

function computeLanguageScore(languages, jobText) {
    if (!languages || languages.length === 0) return 55;
    const job = String(jobText || '').toLowerCase();
    const requiresEnglish = /\b(english|anglais|bilingual|international)\b/i.test(job);
    const requiresFrench = /\b(french|français|francophone)\b/i.test(job);
    let score = 60;
    if (requiresEnglish && languages.includes('English')) score += 25;
    if (requiresFrench && languages.includes('French')) score += 20;
    score += Math.min(15, (languages.length - 1) * 5);
    return Math.min(100, score);
}

function computeIndustryScore(candidateDomains, jobDomains) {
    if (jobDomains.length === 0) return 65;
    if (candidateDomains.length === 0) return 45;
    const set = new Set(candidateDomains);
    const overlap = jobDomains.filter((d) => set.has(d));
    if (overlap.length === jobDomains.length) return 100;
    if (overlap.length > 0) return Math.round(65 + overlap.length * 10);
    return 40;
}

function computeProjectScore(projectEvidence) {
    let score = 45;
    score += Math.min(30, projectEvidence.count * 8);
    if (projectEvidence.hasOpenSource) score += 15;
    if (projectEvidence.hasLiveProject) score += 10;
    return Math.min(100, score);
}

function computeQuantifiedImpactScore(achievementCount) {
    if (achievementCount === 0) return 40;
    if (achievementCount === 1) return 62;
    if (achievementCount === 2) return 76;
    return Math.min(100, 76 + (achievementCount - 2) * 8);
}

function computeLeadershipScore(leadershipCount, requiredLevel) {
    const needsLeadership = /\b(lead|senior|manager|head|director|principal|staff|architect)\b/i.test(requiredLevel || '');
    if (!needsLeadership) return leadershipCount > 0 ? 72 : 60;
    if (leadershipCount === 0) return 30;
    if (leadershipCount === 1) return 62;
    return Math.min(100, 62 + leadershipCount * 10);
}

function normalizeText(value) {
    return String(value || '').trim();
}

function uniqueStrings(values = []) {
    return [...new Set(
        values
            .filter(Boolean)
            .map((value) => String(value).trim())
            .filter(Boolean)
    )];
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function titleCaseSkill(skill) {
    const s = String(skill || '').toLowerCase();
    if (s === 'typescript') return 'TypeScript';
    if (s === 'javascript') return 'JavaScript';
    if (s === 'node.js') return 'Node.js';
    if (s === '.net') return '.NET';
    if (s === 'next.js') return 'Next.js';
    if (s === 'rest api') return 'REST API';
    if (s === 'graphql') return 'GraphQL';
    if (s === 'aws') return 'AWS';
    if (s === 'gcp') return 'GCP';
    if (s === 'postgresql') return 'PostgreSQL';
    if (s === 'mysql') return 'MySQL';
    if (s === 'mongodb') return 'MongoDB';
    if (s === 'ui') return 'UI';
    if (s === 'ux') return 'UX';
    if (s === 'sql') return 'SQL';
    if (s === 'html') return 'HTML';
    if (s === 'css') return 'CSS';
    return s
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function detectSkills(text) {
    const haystack = normalizeText(text).toLowerCase();
    if (!haystack) return [];
    return SKILL_KEYWORDS.filter((skill) => {
        const pattern = new RegExp(`(^|[^a-z0-9+#.])${escapeRegex(skill.toLowerCase())}([^a-z0-9+#.]|$)`, 'i');
        return pattern.test(haystack);
    }).map(titleCaseSkill);
}

function canonicalSkillKey(skill) {
    const k = String(skill || '').toLowerCase().trim();
    for (const group of SKILL_SYNONYMS) {
        if (group.some((g) => k === g || k.includes(g) || g.includes(k))) return group[0];
    }
    return k;
}

function inferExperienceLevel(text = '', years = 0) {
    const source = normalizeText(text).toLowerCase();
    const explicitYears = source.match(/(\d{1,2})\s*\+?\s*(years|year|ans|an)/i);
    const parsedYears = explicitYears ? Number(explicitYears[1]) : Number(years || 0);
    if (parsedYears >= 8 || /(lead|principal|architect|expert|staff|senior)/i.test(source)) return 'Senior';
    if (parsedYears >= 3 || /(mid|intermediate|confirme|confirmed)/i.test(source)) return 'Mid-level';
    return 'Junior';
}

function inferRequiredExperience(jobText = '') {
    const source = normalizeText(jobText).toLowerCase();
    if (!source) return 'Open';
    if (/(lead|principal|architect|staff|expert|senior|\b8\+?\s*(years|year|ans|an)\b)/i.test(source)) return 'Senior';
    if (/(mid|intermediate|\b3\+?\s*(years|year|ans|an)\b|\b4\+?\s*(years|year|ans|an)\b|\b5\+?\s*(years|year|ans|an)\b)/i.test(source)) return 'Mid-level';
    if (/(junior|entry|intern|stage|graduate|\b0\+?\s*(years|year|ans|an)\b|\b1\+?\s*(years|year|ans|an)\b|\b2\+?\s*(years|year|ans|an)\b)/i.test(source)) return 'Junior';
    return 'Open';
}

function inferRoleFamilies(text = '') {
    const haystack = normalizeText(text).toLowerCase();
    if (!haystack) return [];
    return ROLE_HINTS
        .filter((hint) => hint.patterns.some((pattern) => haystack.includes(pattern)))
        .map((hint) => hint.label);
}

function tokenizeForOverlap(text) {
    return normalizeText(text)
        .toLowerCase()
        .replace(/[^a-zàâäéèêëïîôùûüç0-9\s]/gi, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 4 && !FRENCH_STOP.has(w));
}

function computeLexicalResonance(jobText, cvText) {
    const jobTokens = new Set(tokenizeForOverlap(jobText));
    const cvTokens = tokenizeForOverlap(cvText);
    if (jobTokens.size === 0) return 72;
    let hit = 0;
    for (const t of cvTokens) {
        if (jobTokens.has(t)) hit += 1;
    }
    const union = new Set([...jobTokens, ...cvTokens]);
    const jaccard = union.size > 0 ? hit / union.size : 0;
    return Math.min(100, Math.round(jaccard * 380 + 15));
}

function computeExperienceScore(candidateLevel, requiredLevel, years) {
    if (!requiredLevel || requiredLevel === 'Open') return 78;
    const order = { Junior: 1, 'Mid-level': 2, Senior: 3 };
    const candidateRank = order[candidateLevel] || (Number(years || 0) >= 8 ? 3 : Number(years || 0) >= 3 ? 2 : 1);
    const requiredRank = order[requiredLevel] || 2;
    if (candidateRank >= requiredRank) return 100;
    if (candidateRank === requiredRank - 1) return 64;
    return 38;
}

function computeRoleScore(candidateFamilies, jobFamilies) {
    if (jobFamilies.length === 0) return 74;
    const candidateSet = new Set(candidateFamilies);
    const overlaps = jobFamilies.filter((family) => candidateSet.has(family));
    if (overlaps.length === jobFamilies.length) return 100;
    if (overlaps.length > 0) return 76;
    return 36;
}

function computeEvidenceScore({ cvText, matchedSkills, candidateSkills, hasBio }) {
    const wordCount = normalizeText(cvText).split(/\s+/).filter(Boolean).length;
    const skillEvidence = Math.min(100, matchedSkills.length * 18 + candidateSkills.length * 3);
    const textEvidence = Math.min(100, wordCount >= 280 ? 100 : Math.round((wordCount / 280) * 100));
    const profileEvidence = hasBio ? 100 : 52;
    return Math.round(skillEvidence * 0.42 + textEvidence * 0.38 + profileEvidence * 0.2);
}

function computeAdaptabilityScore(extraSkills, matchedCount) {
    const breadth = Math.min(12, extraSkills.length);
    const bonus = matchedCount >= 3 ? 12 : 0;
    return Math.min(100, Math.round(28 + breadth * 6 + bonus));
}

function computeVelocityIndex(cvText, candidateSkills) {
    const words = normalizeText(cvText).split(/\s+/).filter(Boolean).length;
    const density = words > 0 ? Math.min(1, candidateSkills.length / Math.max(40, words / 25)) : 0;
    return Math.min(100, Math.round(35 + density * 55 + (words > 120 ? 18 : 0)));
}

function hashString(s) {
    let h = 0;
    const str = String(s || '');
    for (let i = 0; i < str.length; i += 1) {
        h = ((h << 5) - h) + str.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

const TIER_DEFS = [
    {
        id: 'COSMIC',
        min: 90,
        label: 'Alignement cosmique',
        hue: 286,
        headlines: [
            'Une trajectoire qui épouse la mission presque sans friction.',
            'Le CV et le brief se répondent comme deux orbites synchronisées.',
            'Profil rare : la densité de preuves technique est exceptionnelle.',
        ],
    },
    {
        id: 'ORBIT',
        min: 78,
        label: 'Orbite verrouillée',
        hue: 258,
        headlines: [
            'Forte cohérence : les signaux techniques convergent clairement.',
            'Un profil qui « tient la route » pour ce périmètre de poste.',
            'La trajectoire candidat suit la courbe d’exigence attendue.',
        ],
    },
    {
        id: 'RESONANT',
        min: 65,
        label: 'Résonance nette',
        hue: 220,
        headlines: [
            'Les compétences clés vibrent au bon rythme avec le descriptif.',
            'Bon potentiel : quelques axes à creuser en entretien.',
            'Le socle technique est solide pour poursuivre le screening.',
        ],
    },
    {
        id: 'EMERGING',
        min: 50,
        label: 'Signal émergent',
        hue: 200,
        headlines: [
            'Des correspondances partielles — la marge de progression est visible.',
            'Profil en phase d’alignement : le détail fera la différence.',
            'Le cœur du métier est touché, les bords restent à peaufiner.',
        ],
    },
    {
        id: 'NEBULA',
        min: 35,
        label: 'Dérive nébuleuse',
        hue: 28,
        headlines: [
            'Les constellations de compétences ne se superposent qu’en partie.',
            'Un écart notable sur plusieurs axes du brief.',
            'Le CV raconte une autre histoire que celle du poste — à clarifier.',
        ],
    },
    {
        id: 'DEEP',
        min: 0,
        label: 'Espace profond',
        hue: 12,
        headlines: [
            'Peu de points d’ancrage directs avec les exigences formulées.',
            'Trajectoire éloignée : prioriser d’autres profils ou ajuster le brief.',
            'Les signaux restent faibles sur les critères discriminants.',
        ],
    },
];

function pickTier(score) {
    for (const t of TIER_DEFS) {
        if (score >= t.min) return t;
    }
    return TIER_DEFS[TIER_DEFS.length - 1];
}

function buildConstellationNodes({ matchedSkills, missingSkills, extraSkills, seed }) {
    const nodes = [];
    const max = 14;
    let i = 0;
    for (const skill of matchedSkills.slice(0, 6)) {
        const angle = (i / max) * Math.PI * 2 + (seed % 17) * 0.02;
        nodes.push({
            id: `m-${i}`,
            label: skill,
            type: 'match',
            intensity: 0.85 + (hashString(skill) % 15) / 100,
            angle,
            ring: 1,
        });
        i += 1;
    }
    for (const skill of missingSkills.slice(0, 4)) {
        const angle = (i / max) * Math.PI * 2;
        nodes.push({
            id: `g-${i}`,
            label: skill,
            type: 'gap',
            intensity: 0.45 + (hashString(skill) % 20) / 100,
            angle,
            ring: 2,
        });
        i += 1;
    }
    for (const skill of extraSkills.slice(0, 4)) {
        const angle = (i / max) * Math.PI * 2;
        nodes.push({
            id: `s-${i}`,
            label: skill,
            type: 'spark',
            intensity: 0.55 + (hashString(skill) % 25) / 100,
            angle,
            ring: 1.5,
        });
        i += 1;
    }
    return nodes;
}

function buildCreativeInsights({
    score, matchedSkills, missingSkills, extraSkills, tier, dimensions,
    certifications, languages, candidateDomains, projectEvidence, achievementCount, leadershipCount, educationEntry,
}) {
    const d = dimensions;
    const lines = [];
    lines.push(`Couche narrative : **${tier.label}** — score global ${score}/100.`);
    if (d.linguisticResonance >= 70) {
        lines.push('Le vocabulaire métier du CV « résonne » fortement avec le descriptif de l\'offre (mots-clés profonds alignés).');
    }
    if (d.adaptability >= 75 && extraSkills.length >= 4) {
        lines.push(`Étincelles de polyvalence : ${extraSkills.slice(0, 3).join(', ')} enrichissent la carte des possibles.`);
    }
    if (matchedSkills.length >= 5) {
        lines.push(`Constellation technique dense : ${matchedSkills.length} intersections directes avec le brief.`);
    }
    if (missingSkills.length >= 4 && score < 70) {
        lines.push(`Zones d'ombre : ${missingSkills.slice(0, 3).join(', ')} — angles d'attaque prioritaires en entretien.`);
    }
    if (d.evidenceDepth >= 80) {
        lines.push('Matière narrative abondante sur le CV : les preuves sont exploitables sans complément immédiat.');
    }
    if (certifications.length > 0) {
        lines.push(`Signal fort : ${certifications.slice(0, 2).map((c) => c.name).join(', ')} — certifications qui densifient la crédibilité technique.`);
    }
    if (languages.length >= 2) {
        lines.push(`Profil multilingue détecté (${languages.join(', ')}) — atout sur des contextes internationaux.`);
    }
    if (candidateDomains.length > 0) {
        lines.push(`Ancrage sectoriel : ${candidateDomains.slice(0, 2).join(', ')} — contexte métier identifié dans le parcours.`);
    }
    if (projectEvidence.hasOpenSource) {
        lines.push('Contribution open source détectée — signal de culture collaborative et de code public vérifiable.');
    }
    if (achievementCount >= 2) {
        lines.push(`${achievementCount} réalisation(s) chiffrée(s) détectée(s) — le candidat quantifie son impact, signal de maturité professionnelle.`);
    }
    if (leadershipCount >= 2) {
        lines.push(`Leadership documenté : ${leadershipCount} marqueur(s) de coordination/management dans le CV.`);
    }
    if (educationEntry && ['PhD', 'Master'].includes(educationEntry.level)) {
        lines.push(`Formation académique avancée (${educationEntry.level}) — profil à fort capital théorique.`);
    }
    return uniqueStrings(lines).slice(0, 7);
}

function buildSummary({ score, matchedSkills, missingSkills, roleScore, experienceScore, requiredLevel, educationEntry, certifications, languages, candidateDomains }) {
    const grade = score >= 80
        ? 'Profil très aligné avec le poste.'
        : score >= 65
            ? 'Profil prometteur avec quelques écarts à valider.'
            : score >= 50
                ? 'Compatibilité partielle — vérification RH recommandée.'
                : 'Alignement faible pour ce poste à ce stade.';

    const parts = [
        grade,
        matchedSkills.length > 0 ? `Compétences alignées : ${matchedSkills.slice(0, 5).join(', ')}.` : 'Aucune compétence clé nettement alignée détectée pour le moment.',
        missingSkills.length > 0 ? `Axes à confirmer : ${missingSkills.slice(0, 4).join(', ')}.` : 'Aucun manque majeur détecté à partir du brief.',
        requiredLevel && requiredLevel !== 'Open'
            ? `Niveau d'expérience ${experienceScore >= 80 ? 'aligné' : experienceScore >= 55 ? 'proche' : 'en dessous de la cible'} pour un poste ${requiredLevel.toLowerCase()}.`
            : '',
        roleScore >= 75 ? 'Le profil semble cohérent avec la famille de rôle visée.' : 'L\'alignement au rôle doit être confirmé en screening.',
        educationEntry ? `Formation : ${educationEntry.level} détecté.` : '',
        certifications.length > 0 ? `Certifications : ${certifications.slice(0, 2).map((c) => c.name).join(', ')}.` : '',
        languages.length > 0 ? `Langues : ${languages.join(', ')}.` : '',
        candidateDomains.length > 0 ? `Secteurs identifiés : ${candidateDomains.slice(0, 2).join(', ')}.` : '',
    ].filter(Boolean);

    return parts.join(' ');
}

function buildRecruiterRecommendations({ score, missingSkills, evidenceScore, matchedSkills, requiredLevel, experienceScore, certifications, projectEvidence, achievementCount, leadershipCount, candidateDomains }) {
    return uniqueStrings([
        missingSkills.length > 0 ? `Creuser l'expérience concrète sur ${missingSkills.slice(0, 3).join(', ')} pendant le screening.` : '',
        evidenceScore < 60 ? 'Demander des exemples de projets plus concrets : le CV apporte peu de preuves exploitables.' : '',
        matchedSkills.length >= 4 && score >= 72 ? 'Prioriser ce profil pour un screening RH ou un premier entretien.' : '',
        requiredLevel !== 'Open' && experienceScore < 70 ? `Vérifier la séniorité : le profil peut être sous le niveau ${requiredLevel.toLowerCase()} attendu.` : '',
        score < 55 ? 'Garder cette candidature en réserve sauf flexibilité sur les critères clés.' : '',
        certifications.length > 0 ? `Certifications vérifiables : ${certifications.map((c) => c.name).join(', ')} — valider en entretien.` : '',
        projectEvidence.hasOpenSource ? 'Contributions open source détectées — consulter le profil GitHub/GitLab pour évaluation du code réel.' : '',
        achievementCount >= 2 ? `Candidat avec ${achievementCount} réalisations chiffrées — demander des détails sur les métriques en entretien.` : '',
        leadershipCount >= 2 ? 'Signaux de leadership présents — valider périmètre de management réel en entretien.' : '',
        candidateDomains.length > 0 ? `Expérience sectorielle : ${candidateDomains.slice(0, 2).join(', ')} — pertinente si le poste est dans ce secteur.` : '',
    ]).slice(0, 6);
}

function buildCandidateActionPlan({ score, missingSkills, matchedSkills, roleScore, experienceScore, evidenceScore, certifications, projectEvidence, achievementCount, languages }) {
    const priorities = missingSkills.slice(0, 5).map((skill, index) => ({
        skill,
        priority: index < 2 ? 'high' : index < 4 ? 'medium' : 'low',
        reason: index < 2
            ? 'Compétence fortement attendue pour améliorer le matching global.'
            : 'Compétence utile pour augmenter votre couverture métier.',
    }));

    const nextSteps = uniqueStrings([
        missingSkills[0] ? `Monter en compétence sur ${missingSkills[0]} avec un mini-projet ciblé.` : '',
        missingSkills[1] ? `Ajouter une preuve concrète (${missingSkills[1]}) dans votre CV/portfolio.` : '',
        roleScore < 70 ? 'Adapter votre CV au rôle visé (missions et stack plus explicites).' : '',
        experienceScore < 70 ? 'Valoriser vos expériences les plus proches du niveau attendu.' : '',
        evidenceScore < 60 ? 'Renforcer les réalisations chiffrées pour augmenter la crédibilité du profil.' : '',
        score >= 75 ? 'Profil déjà solide : préparez 2-3 exemples d\'impact chiffré pour l\'entretien RH.' : '',
        certifications.length === 0 ? 'Envisager une certification reconnue dans votre domaine (AWS, Azure, Scrum…) pour renforcer la crédibilité.' : '',
        !projectEvidence.hasLiveProject ? 'Publier un projet concret en ligne (GitHub, portfolio) pour prouver vos compétences.' : '',
        achievementCount === 0 ? 'Ajouter des métriques chiffrées à vos réalisations (% d\'amélioration, volume traité, temps réduit).' : '',
        languages.length < 2 ? 'Mentionner explicitement vos langues et niveaux (TOEIC, IELTS, DALF) pour maximiser la visibilité.' : '',
    ]).slice(0, 6);

    return {
        priorities,
        nextSteps,
        suggestedFocus: missingSkills.slice(0, 3),
        readinessLabel: score >= 80 ? 'Prêt pour entretien' : score >= 65 ? 'Bon potentiel' : 'A renforcer',
    };
}

function buildMatchingSignals({ matchedSkills, candidateLevel, requiredLevel, roleFamilies, dimensions, certifications, languages, candidateDomains, achievementCount, projectEvidence }) {
    return uniqueStrings([
        matchedSkills[0] ? `${matchedSkills[0]} ressort comme ancrage technique direct.` : '',
        matchedSkills[1] ? `${matchedSkills[1]} renforce la cohérence du socle.` : '',
        roleFamilies[0] ? `Familles de rôle détectées : ${roleFamilies.join(', ')}.` : '',
        candidateLevel ? `Séniorité candidat estimée : ${candidateLevel}.` : '',
        requiredLevel && requiredLevel !== 'Open' ? `Séniorité poste estimée : ${requiredLevel}.` : '',
        `Résonance lexicale CV / offre : ${dimensions.linguisticResonance}/100.`,
        certifications.length > 0 ? `Certifications : ${certifications.slice(0, 2).map((c) => c.name).join(', ')}.` : '',
        languages.length > 0 ? `Langues identifiées : ${languages.join(', ')}.` : '',
        candidateDomains.length > 0 ? `Domaines sectoriels : ${candidateDomains.join(', ')}.` : '',
        achievementCount > 0 ? `${achievementCount} réalisation(s) quantifiée(s) détectée(s).` : '',
        projectEvidence.hasLiveProject ? 'Présence en ligne / projets déployés détectés.' : '',
    ]).slice(0, 8);
}

function blendCompositeScore(parts) {
    const {
        skillCoverageScore, roleScore, experienceScore, evidenceScore,
        lexicalResonance, adaptabilityScore, velocityIndex,
        educationScore, certificationScore, languageScore,
        industryScore, projectScore, quantifiedImpactScore, leadershipScore,
    } = parts;
    // Core dimensions (60%) + new enriched dimensions (40%)
    const linear = Math.round(
        skillCoverageScore   * 0.26
        + roleScore          * 0.10
        + experienceScore    * 0.10
        + evidenceScore      * 0.08
        + lexicalResonance   * 0.06
        + adaptabilityScore  * 0.05
        + velocityIndex      * 0.05
        // New signals
        + educationScore     * 0.07
        + certificationScore * 0.05
        + languageScore      * 0.03
        + industryScore      * 0.05
        + projectScore       * 0.06
        + quantifiedImpactScore * 0.05
        + leadershipScore    * 0.05
    );
    const boosted = linear + (linear >= 72 ? Math.round((linear - 72) * 0.12) : 0);
    return Math.max(12, Math.min(100, boosted));
}

function buildJobMatchAnalysis({ candidate = {}, submission = {}, test = {} }) {
    const jobText = [
        normalizeText(test.title),
        normalizeText(test.jobRole),
        normalizeText(test.description),
        normalizeText(test.evaluationCriteria),
    ].filter(Boolean).join('\n');

    const cvText = normalizeText(submission.applicationCvText || candidate.cvText);
    const candidateText = [
        cvText,
        normalizeText(candidate.bio),
        normalizeText(candidate.education),
        normalizeText(candidate.jobTitle),
        normalizeText(candidate.preferredSector),
        normalizeText(candidate.preferredLocation),
    ].filter(Boolean).join('\n');

    // ── Core skill matching ──────────────────────────────────────────────────
    const requiredSkills = uniqueStrings(detectSkills(jobText));
    const candidateSkillsRaw = uniqueStrings([
        ...(Array.isArray(candidate.skills) ? candidate.skills : []),
        ...(Array.isArray(candidate.cvAnalysis?.detectedSkills) ? candidate.cvAnalysis.detectedSkills : []),
        ...detectSkills(candidateText),
    ]);
    const candidateKeys = new Set(candidateSkillsRaw.map((s) => canonicalSkillKey(s)));
    const matchedSkills = requiredSkills.filter((skill) => candidateKeys.has(canonicalSkillKey(skill)));
    const missingSkills = requiredSkills.filter((skill) => !candidateKeys.has(canonicalSkillKey(skill)));
    const extraSkills = candidateSkillsRaw.filter(
        (skill) => !requiredSkills.some((r) => canonicalSkillKey(r) === canonicalSkillKey(skill))
    );

    // ── Role & experience ────────────────────────────────────────────────────
    const candidateFamilies = uniqueStrings([
        ...inferRoleFamilies((candidate.cvAnalysis?.suggestedRoles || []).join(' ')),
        ...inferRoleFamilies(`${candidate.jobTitle || ''} ${candidateText}`),
    ]);
    const jobFamilies = uniqueStrings(inferRoleFamilies(`${test.jobRole || ''} ${jobText}`));
    const candidateLevel = candidate.cvAnalysis?.experienceLevel || inferExperienceLevel(candidateText, candidate.experienceYears);
    const requiredLevel = inferRequiredExperience(jobText);

    // ── NEW: Rich CV signal extraction ───────────────────────────────────────
    const educationEntry    = detectEducationLevel(candidateText);
    const certifications    = detectCertifications(candidateText);
    const languages         = detectLanguages(candidateText);
    const candidateDomains  = detectIndustryDomains(candidateText);
    const jobDomains        = detectIndustryDomains(jobText);
    const projectEvidence   = detectProjectEvidence(candidateText);
    const achievementCount  = detectQuantifiedAchievements(candidateText);
    const leadershipCount   = detectLeadershipSignals(candidateText);

    // ── Score computation ────────────────────────────────────────────────────
    const skillCoverageScore   = requiredSkills.length > 0
        ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
        : Math.min(88, 42 + candidateSkillsRaw.length * 5);
    const roleScore            = computeRoleScore(candidateFamilies, jobFamilies);
    const experienceScore      = computeExperienceScore(candidateLevel, requiredLevel, candidate.experienceYears);
    const evidenceScore        = computeEvidenceScore({ cvText, matchedSkills, candidateSkills: candidateSkillsRaw, hasBio: Boolean(normalizeText(candidate.bio)) });
    const lexicalResonance     = computeLexicalResonance(jobText, cvText);
    const adaptabilityScore    = computeAdaptabilityScore(extraSkills, matchedSkills.length);
    const velocityIndex        = computeVelocityIndex(cvText, candidateSkillsRaw);
    const educationScore       = computeEducationScore(educationEntry, jobText);
    const certificationScore   = computeCertificationScore(certifications, jobText);
    const languageScore        = computeLanguageScore(languages, jobText);
    const industryScore        = computeIndustryScore(candidateDomains, jobDomains);
    const projectScore         = computeProjectScore(projectEvidence);
    const quantifiedImpactScore = computeQuantifiedImpactScore(achievementCount);
    const leadershipScore      = computeLeadershipScore(leadershipCount, `${requiredLevel} ${test.jobRole || ''}`);

    const score = blendCompositeScore({
        skillCoverageScore, roleScore, experienceScore, evidenceScore,
        lexicalResonance, adaptabilityScore, velocityIndex,
        educationScore, certificationScore, languageScore,
        industryScore, projectScore, quantifiedImpactScore, leadershipScore,
    });

    const tier = pickTier(score);
    const seed = hashString(`${candidate._id || ''}|${test._id || ''}|${cvText.slice(0, 40)}`);
    const headline = tier.headlines[seed % tier.headlines.length];

    const dimensions = {
        technicalFit:      Math.min(100, Math.round(skillCoverageScore * 0.92 + (matchedSkills.length >= 4 ? 8 : 0))),
        experienceFit:     experienceScore,
        roleCoherence:     roleScore,
        evidenceDepth:     evidenceScore,
        adaptability:      adaptabilityScore,
        linguisticResonance: lexicalResonance,
        velocityIndex,
        // NEW
        educationFit:      educationScore,
        certificationBoost: certificationScore,
        languageFit:       languageScore,
        industryAlignment: industryScore,
        projectEvidence:   projectScore,
        quantifiedImpact:  quantifiedImpactScore,
        leadershipSignal:  leadershipScore,
    };

    const radarAxes = [
        { key: 'technicalFit',       label: 'Adéquation technique' },
        { key: 'experienceFit',      label: 'Expérience' },
        { key: 'roleCoherence',      label: 'Cohérence de rôle' },
        { key: 'evidenceDepth',      label: 'Profondeur des preuves' },
        { key: 'adaptability',       label: 'Polyvalence' },
        { key: 'linguisticResonance',label: 'Résonance lexicale' },
        { key: 'educationFit',       label: 'Formation' },
        { key: 'certificationBoost', label: 'Certifications' },
        { key: 'industryAlignment',  label: 'Secteur d\'activité' },
        { key: 'projectEvidence',    label: 'Projets concrets' },
        { key: 'quantifiedImpact',   label: 'Impact chiffré' },
        { key: 'leadershipSignal',   label: 'Leadership' },
    ].map((axis) => ({
        ...axis,
        value: dimensions[axis.key],
    }));

    const confidence =
        evidenceScore >= 76 ? 'Forte' :
        evidenceScore >= 52 ? 'Moyenne' :
        'Faible';

    const matchEngine = {
        version: 2,
        headline,
        tier: { id: tier.id, label: tier.label, min: tier.min, hue: tier.hue },
        dimensions,
        radarAxes,
        constellation: buildConstellationNodes({
            matchedSkills,
            missingSkills,
            extraSkills,
            seed,
        }),
        creativeInsights: buildCreativeInsights({
            score, matchedSkills, missingSkills, extraSkills, tier, dimensions,
            certifications, languages, candidateDomains, projectEvidence,
            achievementCount, leadershipCount, educationEntry,
        }),
        signature: {
            gradient: `linear-gradient(135deg, hsl(${tier.hue}, 72%, 42%) 0%, hsl(${(tier.hue + 42) % 360}, 58%, 20%) 100%)`,
            glow: `hsla(${tier.hue}, 85%, 55%, 0.45)`,
        },
        meta: {
            engine: 'recruit-ai-match-v2',
            weightsVersion: '2026-04',
            seed,
        },
    };

    return {
        score,
        confidence,
        summary: buildSummary({
            score, matchedSkills, missingSkills, roleScore, experienceScore, requiredLevel,
            educationEntry, certifications, languages, candidateDomains,
        }),
        matchedSkills: matchedSkills.slice(0, 14),
        missingSkills: missingSkills.slice(0, 14),
        extraSkills: extraSkills.slice(0, 14),
        matchingSignals: buildMatchingSignals({
            matchedSkills, candidateLevel, requiredLevel,
            roleFamilies: uniqueStrings([...candidateFamilies, ...jobFamilies]),
            dimensions, certifications, languages, candidateDomains,
            achievementCount, projectEvidence,
        }),
        recruiterRecommendations: buildRecruiterRecommendations({
            score, missingSkills, evidenceScore, matchedSkills, requiredLevel, experienceScore,
            certifications, projectEvidence, achievementCount, leadershipCount, candidateDomains,
        }),
        candidateActionPlan: buildCandidateActionPlan({
            score, missingSkills, matchedSkills, roleScore, experienceScore, evidenceScore,
            certifications, projectEvidence, achievementCount, languages,
        }),
        roleAlignment: roleScore >= 80 ? 'Fort' : roleScore >= 60 ? 'Moyen' : 'Faible',
        experienceAlignment: experienceScore >= 80 ? 'Alignee' : experienceScore >= 60 ? 'Proche' : 'Sous la cible',
        requiredExperienceLevel: requiredLevel,
        detectedCandidateLevel: candidateLevel,
        // NEW: enriched CV signal summary for UI display
        enrichedCvSignals: {
            educationLevel: educationEntry ? educationEntry.level : null,
            certifications: certifications.map((c) => c.name),
            languages,
            industryDomains: candidateDomains,
            hasOpenSourceContributions: projectEvidence.hasOpenSource,
            hasLiveProjects: projectEvidence.hasLiveProject,
            projectSignalCount: projectEvidence.count,
            quantifiedAchievements: achievementCount,
            leadershipSignals: leadershipCount,
        },
        lastCalculatedAt: new Date(),
        matchEngine,
    };
}

module.exports = {
    buildJobMatchAnalysis,
    detectSkills,
};
