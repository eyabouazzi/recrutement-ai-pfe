const Company = require('../models/company.model');
const { analyzeCvProfileAI } = require('./openai');
const { extractCvTextFromFile, normalizeExtractedText } = require('./cvParser');

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

const COMPANY_SIZES = new Set(['1-10', '11-50', '51-200', '201-500', '500+']);

function uniqueStrings(values = []) {
    return [...new Set(values.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];
}

function normalizeText(value) {
    return String(value || '').trim();
}

function mergeCvTextSources(...values) {
    const merged = [];

    values.forEach((value) => {
        const normalized = normalizeExtractedText(value);
        if (normalized && !merged.includes(normalized)) {
            merged.push(normalized);
        }
    });

    return merged.join('\n\n').slice(0, 20000);
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
    const hasReadableCvText = Boolean(normalizeText(cvText));
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
        hasUploadedCv && !hasReadableCvText
            ? 'The uploaded CV could not be read automatically. Use a text-based PDF/DOCX or paste the CV text.'
            : '',
        !hasReadableCvText ? 'Paste a text version of the CV to unlock a deeper analysis than file metadata alone.' : '',
        !user.bio ? 'Add a short professional summary to improve recruiter context.' : '',
        suggestedRoles[0] ? `Best current role fit: ${suggestedRoles[0]}.` : 'Add more role-specific keywords for better matching.',
    ]).slice(0, 4);

    const summaryParts = [
        hasUploadedCv
            ? (hasReadableCvText ? 'CV analyzed from uploaded document.' : 'CV uploaded but text extraction is incomplete.')
            : 'Profile-based analysis.',
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

function firstUploadedFile(files, key) {
    if (!files || !files[key]) {
        return null;
    }
    return Array.isArray(files[key]) ? files[key][0] : files[key];
}

function countWords(text) {
    return normalizeText(text)
        .split(/\s+/)
        .filter(Boolean)
        .length;
}

function buildProfileSignalMetrics({ user, analysis, cvText }) {
    const wordCount = countWords(cvText);
    const skillCount = Array.isArray(analysis?.detectedSkills) ? analysis.detectedSkills.length : 0;
    const roleCount = Array.isArray(analysis?.suggestedRoles) ? analysis.suggestedRoles.length : 0;
    const recommendationCount = Array.isArray(analysis?.recommendations) ? analysis.recommendations.length : 0;
    const strengthsCount = Array.isArray(analysis?.strengths) ? analysis.strengths.length : 0;
    const profileFieldsFilled = [
        normalizeText(user.bio),
        normalizeText(user.education),
        normalizeText(user.preferredSector),
        normalizeText(user.preferredLocation),
        normalizeText(user.preferredJobType),
        Array.isArray(user.skills) && user.skills.length > 0 ? 'skills' : '',
        wordCount >= 40 ? 'cv' : '',
    ].filter(Boolean).length;

    const profileDepthScore = Math.min(
        100,
        Math.round(
            profileFieldsFilled * 10 +
            Math.min(30, wordCount / 12) +
            Math.min(24, skillCount * 4)
        )
    );

    const marketReadinessScore = Math.min(
        100,
        Math.round(
            20 +
            Math.min(32, skillCount * 5) +
            Math.min(18, roleCount * 6) +
            Math.min(15, strengthsCount * 4) +
            Math.min(15, Number(user.experienceYears || 0) * 3)
        )
    );

    return {
        wordCount,
        skillCount,
        roleCount,
        recommendationCount,
        strengthsCount,
        profileDepthScore,
        marketReadinessScore,
    };
}

function buildPreviewUser(user, body = {}) {
    const base = user?.toObject ? user.toObject() : { ...user };
    const previewUser = {
        ...base,
        skills: Array.isArray(base.skills) ? [...base.skills] : [],
    };

    const textFields = [
        'firstName',
        'lastName',
        'bio',
        'education',
        'city',
        'country',
        'phone',
        'jobTitle',
        'preferredJobType',
        'preferredSector',
        'preferredLocation',
    ];

    textFields.forEach((field) => {
        if (body[field] !== undefined) {
            previewUser[field] = normalizeText(body[field]);
        }
    });

    const skills = parseSkills(body.skills);
    if (skills !== undefined) {
        previewUser.skills = skills;
    }

    if (body.experienceYears !== undefined && body.experienceYears !== '') {
        const value = Number(body.experienceYears);
        previewUser.experienceYears = Number.isFinite(value) ? value : previewUser.experienceYears;
    }

    if (body.cvText !== undefined) {
        previewUser.cvText = normalizeText(body.cvText);
    } else {
        previewUser.cvText = normalizeText(previewUser.cvText);
    }

    return previewUser;
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
        'jobTitle',
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
    const extractedCvText = await extractCvTextFromFile(cvFile);
    const hadUploadedCv = Boolean(user.cvUrl);
    let nextCvText = normalizeExtractedText(user.cvText || '');

    if (cvFile) {
        nextCvText = mergeCvTextSources(extractedCvText, pastedCvText);
    } else if (pastedCvText !== undefined) {
        nextCvText = normalizeExtractedText(pastedCvText);
    }

    if (pastedCvText !== undefined || cvFile) {
        user.cvText = nextCvText;
    }

    const shouldAnalyze =
        body.analyzeCv === true ||
        body.analyzeCv === 'true' ||
        pastedCvText !== undefined ||
        Boolean(cvFile) ||
        hadUploadedCv;

    if (shouldAnalyze) {
        user.cvAnalysis = await buildBestCvAnalysis({
            user,
            cvText: nextCvText,
            hasUploadedCv: Boolean(user.cvUrl),
        });
    }
}

async function applyHrCompanyPayload({ user, body = {}, files = {} }) {
    if (user.role !== 'HR') {
        return;
    }

    const companyFieldNames = [
        'companyName',
        'companySector',
        'companyDescription',
        'companySize',
        'companyCity',
        'companyAddress',
        'applicationEmail',
        'companyPhone',
        'companyWebsite',
        'companyLinkedin',
        'companyFacebook',
        'companyBookingLink',
    ];

    const hasCompanyPayload =
        companyFieldNames.some((field) => body[field] !== undefined) ||
        Boolean(firstUploadedFile(files, 'companyLogo'));

    if (!hasCompanyPayload) {
        return;
    }

    let company = null;
    if (user.companyId) {
        company = await Company.findById(user.companyId);
    }

    if (!company) {
        company = await Company.findOne({ email: normalizeText(user.email).toLowerCase() });
    }

    if (!company) {
        company = new Company({
            email: normalizeText(user.email).toLowerCase(),
            name: normalizeText(body.companyName) || 'Entreprise RH',
            status: 'pending',
        });
    }

    if (body.companyName !== undefined) company.name = normalizeText(body.companyName);
    if (body.companySector !== undefined) company.sector = normalizeText(body.companySector);
    if (body.companyDescription !== undefined) company.description = normalizeText(body.companyDescription);
    if (body.companyCity !== undefined) company.city = normalizeText(body.companyCity);
    if (body.companyAddress !== undefined) company.address = normalizeText(body.companyAddress);
    if (body.applicationEmail !== undefined) company.applicationEmail = normalizeText(body.applicationEmail).toLowerCase();
    if (body.companyPhone !== undefined) company.phone = normalizeText(body.companyPhone);
    if (body.companyWebsite !== undefined) company.website = normalizeText(body.companyWebsite);
    if (body.companyLinkedin !== undefined) company.linkedin = normalizeText(body.companyLinkedin);
    if (body.companyBookingLink !== undefined) company.bookingLink = normalizeText(body.companyBookingLink);

    if (body.companySize !== undefined) {
        const nextSize = normalizeText(body.companySize);
        if (!nextSize) {
            company.size = undefined;
        } else if (COMPANY_SIZES.has(nextSize)) {
            company.size = nextSize;
        }
    }

    if (body.companyFacebook !== undefined) {
        company.socialLinks = company.socialLinks || {};
        company.socialLinks.facebook = normalizeText(body.companyFacebook);
    }

    const companyLogoFile = firstUploadedFile(files, 'companyLogo');
    if (companyLogoFile) {
        company.logo = `/uploads/${companyLogoFile.filename}`;
    }

    const hrUsers = new Set((company.hrUsers || []).map((id) => String(id)));
    hrUsers.add(String(user._id));
    company.hrUsers = Array.from(hrUsers);

    await company.save();
    user.companyId = company._id;
}

async function buildProfilePreviewAnalysis({ user, body = {} }) {
    const previewUser = buildPreviewUser(user, body);
    const analysis = await buildBestCvAnalysis({
        user: previewUser,
        cvText: previewUser.cvText || '',
        hasUploadedCv: Boolean(previewUser.cvUrl),
    });

    return {
        analysis,
        signals: buildProfileSignalMetrics({
            user: previewUser,
            analysis,
            cvText: previewUser.cvText || '',
        }),
    };
}

module.exports = {
    applyProfilePayload,
    applyHrCompanyPayload,
    buildProfilePreviewAnalysis,
    buildCvAnalysis,
    buildBestCvAnalysis,
};
