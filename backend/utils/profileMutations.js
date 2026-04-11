const fs = require('fs/promises');
const path = require('path');
const { analyzeCvProfileAI } = require('./openai');

const SKILL_KEYWORDS = [
    'javascript', 'typescript', 'react', 'vue', 'angular', 'html', 'css', 'sass',
    'node', 'node.js', 'express', 'python', 'django', 'flask', 'java', 'spring',
    'c#', '.net', 'php', 'laravel', 'go', 'rust', 'sql', 'mysql', 'postgresql',
    'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform',
    'git', 'linux', 'devops', 'machine learning', 'data science', 'pandas', 'numpy',
    'tensorflow', 'pytorch', 'figma', 'ux', 'ui', 'product', 'testing', 'jest',
    'cypress', 'communication', 'leadership', 'management'
];

const ROLE_RULES = [
    { role: 'Frontend Developer', keywords: ['react', 'javascript', 'typescript', 'vue', 'angular', 'css', 'html'] },
    { role: 'Backend Developer', keywords: ['node', 'express', 'python', 'django', 'java', 'spring', 'sql'] },
    { role: 'Full-Stack Developer', keywords: ['react', 'javascript', 'node', 'express', 'sql', 'mongodb'] },
    { role: 'DevOps Engineer', keywords: ['docker', 'kubernetes', 'aws', 'azure', 'terraform', 'linux'] },
    { role: 'Data Analyst', keywords: ['sql', 'python', 'pandas', 'data science', 'numpy'] },
    { role: 'ML Engineer', keywords: ['machine learning', 'python', 'tensorflow', 'pytorch', 'data science'] },
    { role: 'Product Designer', keywords: ['figma', 'ux', 'ui', 'product'] },
];

function uniqueStrings(values = []) {
    return [...new Set(values.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];
}

function normalizeText(value) {
    return String(value || '').trim();
}

function parseSkills(value) {
    if (Array.isArray(value)) {
        return uniqueStrings(value);
    }

    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    return uniqueStrings(String(value).split(',').map((item) => item.trim()));
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectSkills(text) {
    const haystack = normalizeText(text).toLowerCase();
    if (!haystack) {
        return [];
    }

    return SKILL_KEYWORDS.filter((skill) => {
        const pattern = new RegExp(`(^|[^a-z0-9+#.])${escapeRegex(skill.toLowerCase())}([^a-z0-9+#.]|$)`, 'i');
        return pattern.test(haystack);
    }).map((skill) => {
        if (skill === 'node.js') return 'Node.js';
        if (skill === '.net') return '.NET';
        return skill
            .split(' ')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    });
}

function inferExperienceLevel(text, yearsOfExperience) {
    const normalizedYears = Number.isFinite(Number(yearsOfExperience)) ? Number(yearsOfExperience) : 0;
    const source = normalizeText(text).toLowerCase();

    const explicitYears = source.match(/(\d{1,2})\s*\+?\s*(years|year|ans|an)/i);
    const parsedYears = explicitYears ? Number(explicitYears[1]) : normalizedYears;

    if (parsedYears >= 8 || /(lead|principal|architect|expert|senior)/i.test(source)) {
        return 'Senior';
    }
    if (parsedYears >= 3 || /(mid|intermediate|confirme|confirmed)/i.test(source)) {
        return 'Mid-level';
    }
    return 'Junior';
}

function suggestRoles(skills) {
    const normalizedSkills = skills.map((skill) => skill.toLowerCase());

    return ROLE_RULES
        .map((rule) => ({
            role: rule.role,
            score: rule.keywords.filter((keyword) => normalizedSkills.includes(
                keyword
                    .split(' ')
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(' ')
                    .replace('Node.js', 'Node.js')
            ) || normalizedSkills.includes(keyword)).length,
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((item) => item.role);
}

function buildCvAnalysis({ user, cvText, hasUploadedCv }) {
    const sourceText = [
        normalizeText(cvText),
        normalizeText(user.bio),
        normalizeText(user.education),
        uniqueStrings(user.skills || []).join(', '),
        normalizeText(user.preferredSector),
        normalizeText(user.preferredLocation),
    ].filter(Boolean).join('\n');

    const detectedSkills = uniqueStrings([
        ...uniqueStrings(user.skills || []),
        ...detectSkills(sourceText),
    ]);
    const experienceLevel = inferExperienceLevel(sourceText, user.experienceYears);
    const suggestedRoles = suggestRoles(detectedSkills);
    const strengths = uniqueStrings([
        detectedSkills[0] ? `${detectedSkills[0]} appears consistently in the profile.` : '',
        detectedSkills[1] ? `Strong alignment with ${detectedSkills[1]} requirements.` : '',
        user.education ? `Education focus: ${user.education}.` : '',
        user.preferredSector ? `Target sector: ${user.preferredSector}.` : '',
    ]).slice(0, 4);

    const recommendations = uniqueStrings([
        detectedSkills.length < 5 ? 'Add more concrete achievements or tools from the CV to improve matching.' : '',
        !normalizeText(cvText) ? 'Paste a text version of the CV to unlock a deeper analysis than file metadata alone.' : '',
        !user.bio ? 'Add a short professional summary to improve recruiter context.' : '',
        suggestedRoles[0] ? `Best current role fit: ${suggestedRoles[0]}.` : 'Add more role-specific keywords for better matching.',
    ]).slice(0, 4);

    const summaryParts = [
        hasUploadedCv ? 'CV uploaded.' : 'Profile-based analysis.',
        experienceLevel ? `${experienceLevel} profile detected.` : '',
        detectedSkills.length ? `Key skills: ${detectedSkills.slice(0, 6).join(', ')}.` : 'No clear skill cluster detected yet.',
        suggestedRoles.length ? `Closest roles: ${suggestedRoles.join(', ')}.` : '',
    ].filter(Boolean);

    return {
        summary: summaryParts.join(' '),
        detectedSkills,
        experienceLevel,
        strengths,
        recommendations,
        suggestedRoles,
        lastAnalyzedAt: new Date(),
    };
}

async function buildBestCvAnalysis({ user, cvText, hasUploadedCv }) {
    const fallback = buildCvAnalysis({ user, cvText, hasUploadedCv });
    const aiAnalysis = await analyzeCvProfileAI({
        user,
        cvText,
        hasUploadedCv,
        fallback,
    });
    return aiAnalysis || fallback;
}

async function extractCvText(file) {
    if (!file) {
        return '';
    }

    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = String(file.mimetype || '').toLowerCase();
    const isTextLike =
        mime.startsWith('text/') ||
        ['.txt', '.md', '.csv', '.json'].includes(ext);

    if (!isTextLike) {
        return '';
    }

    try {
        const raw = await fs.readFile(file.path, 'utf8');
        return normalizeText(raw).slice(0, 20000);
    } catch (error) {
        return '';
    }
}

function firstUploadedFile(files, key) {
    if (!files || !files[key]) {
        return null;
    }
    return Array.isArray(files[key]) ? files[key][0] : files[key];
}

async function applyProfilePayload({ user, body = {}, files = {} }) {
    const textFields = [
        'firstName',
        'lastName',
        'bio',
        'education',
        'city',
        'country',
        'phone',
        'preferredJobType',
        'preferredSector',
        'preferredLocation',
    ];

    textFields.forEach((field) => {
        if (body[field] !== undefined) {
            user[field] = normalizeText(body[field]);
        }
    });

    const skills = parseSkills(body.skills);
    if (skills !== undefined) {
        user.skills = skills;
    }

    if (body.experienceYears !== undefined && body.experienceYears !== '') {
        const value = Number(body.experienceYears);
        user.experienceYears = Number.isFinite(value) ? value : user.experienceYears;
    }

    const avatarFile = firstUploadedFile(files, 'avatar');
    if (avatarFile) {
        user.avatar = `/uploads/${avatarFile.filename}`;
    }

    const cvFile = firstUploadedFile(files, 'cv');
    if (cvFile) {
        user.cvUrl = `/uploads/${cvFile.filename}`;
        user.cvOriginalName = normalizeText(cvFile.originalname);
    }

    const pastedCvText = body.cvText !== undefined ? normalizeText(body.cvText) : undefined;
    const extractedCvText = await extractCvText(cvFile);
    const nextCvText = extractedCvText || pastedCvText || (pastedCvText === '' ? '' : user.cvText || '');

    if (pastedCvText !== undefined || extractedCvText || cvFile) {
        user.cvText = nextCvText;
    }

    const shouldAnalyze =
        body.analyzeCv === true ||
        body.analyzeCv === 'true' ||
        pastedCvText !== undefined ||
        Boolean(extractedCvText) ||
        Boolean(cvFile);

    if (shouldAnalyze) {
        user.cvAnalysis = await buildBestCvAnalysis({
            user,
            cvText: nextCvText,
            hasUploadedCv: Boolean(cvFile),
        });
    }
}

module.exports = {
    applyProfilePayload,
    buildCvAnalysis,
    buildBestCvAnalysis,
};
