const { OpenAI } = require('openai');
const { runSerial } = require('./openaiQueue');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/** Plafond de tokens de sortie (évite coûts / réponses trop longues). Surcharge: OPENAI_MAX_COMPLETION_TOKENS */
const MAX_COMPLETION = Math.min(4096, Math.max(200, parseInt(process.env.OPENAI_MAX_COMPLETION_TOKENS || '1200', 10)));

/**
 * Utility to extract JSON from a potentially markdown-formatted string
 */
function cleanJsonResponse(str) {
    try {
        // Strip markdown backticks if present (e.g., ```json ... ```)
        const cleaned = str.replace(/```json\s?|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("Failed to parse JSON response from AI:", str);
        throw new Error("Invalid format received from AI.");
    }
}

function isRecoverableOpenAiError(error) {
    return error?.status === 429 ||
        error?.status === 503 ||
        error?.code === 'insufficient_quota' ||
        error?.code === 'rate_limit_exceeded';
}

function evaluateAnswersFallback(jobRole, questionsAndAnswersStr, evaluationCriteria = '') {
    const pairs = String(questionsAndAnswersStr || '')
        .split(/\n\s*\n/)
        .map((chunk) => chunk.trim())
        .filter(Boolean);

    const answers = pairs
        .map((chunk) => {
            const match = chunk.match(/A:\s*([\s\S]*)$/i);
            return match ? match[1].trim() : '';
        })
        .filter(Boolean);

    if (answers.length === 0) {
        return {
            score: 0,
            feedback: 'Evaluation automatique de secours: aucune reponse ouverte exploitable n a ete detectee.',
            competencies: [],
        };
    }

    const totalChars = answers.reduce((sum, answer) => sum + answer.length, 0);
    const avgChars = totalChars / answers.length;
    const longAnswers = answers.filter((answer) => answer.length >= 180).length;
    const detailedRatio = longAnswers / answers.length;
    const criteriaSkills = Array.from(new Set(
        String(evaluationCriteria || '')
            .toLowerCase()
            .match(/[a-z0-9+#/.]{3,}/g) || []
    ));
    const criteriaHits = criteriaSkills.filter((token) =>
        answers.some((answer) => answer.toLowerCase().includes(token))
    ).length;
    const criteriaCoverage = criteriaSkills.length > 0 ? criteriaHits / Math.min(criteriaSkills.length, 8) : 0.5;

    const score = Math.round(Math.max(
        15,
        Math.min(
            78,
            24 +
            Math.min(26, avgChars / 8) +
            detailedRatio * 18 +
            Math.min(10, answers.length * 2) +
            criteriaCoverage * 18
        )
    ));

    const strengths = [];
    if (avgChars >= 140) strengths.push('reponses detaillees');
    if (detailedRatio >= 0.5) strengths.push('niveau de detail correct');
    if (criteriaCoverage >= 0.45) strengths.push('prise en compte partielle des criteres du poste');

    const improvements = [];
    if (avgChars < 90) improvements.push('developper davantage les explications');
    if (detailedRatio < 0.4) improvements.push('ajouter plus de details techniques et d exemples');
    if (criteriaCoverage < 0.35 && criteriaSkills.length > 0) improvements.push('mieux couvrir les competences attendues');

    return {
        score,
        feedback: `Evaluation automatique de secours pour le poste "${jobRole}". Points positifs: ${strengths.join(', ') || 'quelques reponses exploitables'}. A renforcer: ${improvements.join(', ') || 'preciser davantage les reponses avec des exemples concrets'}.`,
        competencies: [
            {
                competency: 'Communication ecrite',
                score: Math.round(Math.max(20, Math.min(85, 30 + avgChars / 3))),
                comment: avgChars >= 120 ? 'Reponses globalement structurees.' : 'Reponses trop courtes ou peu developpees.',
            },
            {
                competency: 'Pertinence metier',
                score: Math.round(Math.max(20, Math.min(82, 25 + criteriaCoverage * 55))),
                comment: criteriaCoverage >= 0.45 ? 'Les attentes du poste apparaissent partiellement dans les reponses.' : 'Les attentes du poste sont peu visibles dans les reponses.',
            },
        ],
    };
}

/**
 * Fallback: generate role-aware QCM questions without OpenAI
 * Uses a keyword-matched question bank so questions are always relevant.
 */
function generateFallbackQuestions(jobRole, description, count) {
    const role = (jobRole + ' ' + (description || '')).toLowerCase();

    const qcmBank = [
        // --- Frontend / React ---
        {
            tags: ['react', 'frontend', 'javascript', 'js', 'web'],
            prompt: "What hook should you use to run a side-effect only once after a component mounts in React?",
            options: ["useEffect with []", "useState", "useMemo", "useRef"],
            correctAnswer: "useEffect with []"
        },
        {
            tags: ['react', 'frontend', 'javascript', 'js', 'web'],
            prompt: "What does the virtual DOM do in React?",
            options: ["Directly updates the browser DOM", "Minimises real DOM updates by diffing", "Manages API calls", "Handles routing between pages"],
            correctAnswer: "Minimises real DOM updates by diffing"
        },
        {
            tags: ['react', 'frontend', 'javascript', 'js'],
            prompt: "Which of the following is the correct way to pass data from parent to child in React?",
            options: ["Using props", "Using context only", "Using Redux only", "Using localStorage"],
            correctAnswer: "Using props"
        },
        {
            tags: ['javascript', 'js', 'frontend', 'web'],
            prompt: "What is the output of: typeof null in JavaScript?",
            options: ['"object"', '"null"', '"undefined"', '"boolean"'],
            correctAnswer: '"object"'
        },
        {
            tags: ['javascript', 'js', 'frontend', 'web'],
            prompt: "Which method is used to add an element at the end of an array in JavaScript?",
            options: ["push()", "pop()", "shift()", "unshift()"],
            correctAnswer: "push()"
        },
        // --- Backend / Node ---
        {
            tags: ['node', 'nodejs', 'backend', 'express', 'api'],
            prompt: "What does the middleware function in Express receive as its third argument?",
            options: ["next", "res", "req", "app"],
            correctAnswer: "next"
        },
        {
            tags: ['node', 'nodejs', 'backend', 'express', 'api'],
            prompt: "Which HTTP status code indicates a resource was created successfully?",
            options: ["201", "200", "404", "500"],
            correctAnswer: "201"
        },
        {
            tags: ['backend', 'node', 'api', 'express'],
            prompt: "What does REST stand for?",
            options: ["Representational State Transfer", "Remote Execution & State Transfer", "Resource Endpoint State Transfer", "Rapid Event Streaming Technology"],
            correctAnswer: "Representational State Transfer"
        },
        // --- Database / MongoDB ---
        {
            tags: ['mongodb', 'database', 'db', 'mongo', 'backend'],
            prompt: "Which MongoDB method returns all documents matching a filter?",
            options: ["find()", "get()", "select()", "query()"],
            correctAnswer: "find()"
        },
        {
            tags: ['mongodb', 'database', 'db', 'sql'],
            prompt: "What is the primary key called in MongoDB documents?",
            options: ["_id", "id", "pk", "key"],
            correctAnswer: "_id"
        },
        // --- Python ---
        {
            tags: ['python', 'data', 'ml', 'ai', 'machine learning', 'science'],
            prompt: "Which Python library is most commonly used for data manipulation and analysis?",
            options: ["Pandas", "NumPy", "Matplotlib", "Scikit-learn"],
            correctAnswer: "Pandas"
        },
        {
            tags: ['python', 'data', 'ml', 'ai', 'machine learning'],
            prompt: "What does the 'self' parameter represent in a Python class method?",
            options: ["The instance of the class", "The class itself", "A static reference", "The parent class"],
            correctAnswer: "The instance of the class"
        },
        // --- DevOps / General ---
        {
            tags: ['devops', 'docker', 'cloud', 'aws', 'ci', 'cd', 'deployment'],
            prompt: "What is the purpose of a Dockerfile?",
            options: ["Define how to build a Docker image", "Run Docker containers", "Push images to Docker Hub", "Monitor container performance"],
            correctAnswer: "Define how to build a Docker image"
        },
        {
            tags: ['git', 'devops', 'developer', 'backend', 'frontend'],
            prompt: "Which Git command creates a new branch and switches to it?",
            options: ["git checkout -b <branch>", "git branch <branch>", "git switch <branch>", "git new <branch>"],
            correctAnswer: "git checkout -b <branch>"
        },
        // --- General Software Engineering ---
        {
            tags: ['software', 'engineering', 'developer', 'general'],
            prompt: "What does SOLID stand for in software design principles?",
            options: [
                "Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion",
                "Scalable, Open-source, Lightweight, Integrated, Distributed",
                "Simple, Object-oriented, Logical, Independent, Documented",
                "Structured, Observable, Layered, Incremental, Distributed"
            ],
            correctAnswer: "Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion"
        },
        {
            tags: ['software', 'engineering', 'developer', 'general'],
            prompt: "What is the main purpose of unit testing?",
            options: ["Test individual components in isolation", "Test the full application end-to-end", "Test performance under load", "Test the UI visually"],
            correctAnswer: "Test individual components in isolation"
        },
        {
            tags: ['software', 'engineering', 'developer', 'general'],
            prompt: "Which design pattern ensures a class has only one instance?",
            options: ["Singleton", "Factory", "Observer", "Strategy"],
            correctAnswer: "Singleton"
        },
        {
            tags: ['software', 'engineering', 'developer', 'general', 'agile'],
            prompt: "In Agile, what is a 'sprint'?",
            options: ["A time-boxed iteration to deliver working software", "A sprint between two releases", "A code review session", "A final product demo"],
            correctAnswer: "A time-boxed iteration to deliver working software"
        },
    ];

    const shortAnswerBank = [
        {
            tags: ['react', 'frontend', 'javascript', 'web'],
            prompt: "Explain how you would structure a reusable React component for a dashboard widget and keep it easy to maintain.",
        },
        {
            tags: ['backend', 'node', 'api', 'express'],
            prompt: "Describe the steps you would take to secure a REST API used by multiple client applications.",
        },
        {
            tags: ['database', 'mongodb', 'sql', 'backend'],
            prompt: "How do you decide when to add indexes to a database table or collection, and what trade-offs do you watch for?",
        },
        {
            tags: ['python', 'data', 'ml', 'ai'],
            prompt: "Summarize how you would clean a messy dataset before using it for reporting or a machine learning model.",
        },
        {
            tags: ['devops', 'docker', 'cloud', 'aws', 'deployment'],
            prompt: "A deployment failed minutes before release. Explain how you would investigate and recover safely.",
        },
        {
            tags: ['software', 'engineering', 'developer', 'general'],
            prompt: "Describe a technical decision you would document carefully for teammates, and explain what information you would include.",
        },
        {
            tags: ['software', 'engineering', 'agile', 'general'],
            prompt: "How do you break down a medium-sized feature into tasks that are easy for a team to estimate and review?",
        },
        {
            tags: ['communication', 'leadership', 'management', 'general'],
            prompt: "How do you communicate technical risk to a non-technical stakeholder when deadlines are tight?",
        },
    ];

    const scoreItems = (items) => items
        .map((item) => ({
            ...item,
            score: item.tags.filter((tag) => role.includes(tag)).length,
        }))
        .sort((a, b) => b.score - a.score);

    const pickTopItems = (items, desiredCount) => {
        const scored = scoreItems(items);
        const selected = scored.slice(0, desiredCount);

        if (selected.length < desiredCount) {
            const generic = scored
                .filter((item) => item.tags.includes('general') || item.tags.includes('software'))
                .slice(0, desiredCount - selected.length);
            selected.push(...generic);
        }

        return selected.slice(0, desiredCount);
    };

    const total = Math.max(1, count);
    const qcmCount = total === 1 ? 1 : Math.max(1, Math.ceil(total * 0.7));
    const shortCount = Math.max(0, total - qcmCount);

    const qcmItems = pickTopItems(qcmBank, qcmCount).map(({ prompt, options, correctAnswer }) => ({
        type: 'QCM',
        prompt,
        options,
        correctAnswer,
    }));

    const shortAnswerItems = pickTopItems(shortAnswerBank, shortCount).map(({ prompt }) => ({
        type: 'SHORT_ANSWER',
        prompt,
    }));

    return [...qcmItems, ...shortAnswerItems].slice(0, total);
}

async function generateQuestionsAI(jobRole, description, count = 5) {
    const n = Math.max(1, Math.min(30, count));
    const qcmCount = n === 1 ? 1 : Math.max(1, Math.ceil(n * 0.7));
    const shortCount = Math.max(0, n - qcmCount);
    const prompt = `You are an expert HR technical recruiter.
Generate exactly ${n} assessment items for the position "${jobRole}".
Context/Requirements: ${description || 'Not provided'}

Mix:
- Exactly ${qcmCount} items of type "QCM" (multiple choice, 4 options, one correct).
- Exactly ${shortCount} items of type "SHORT_ANSWER" (brief written answer, 3-6 sentences expected from the candidate).

Return ONLY a valid JSON array. Each object MUST include "type": "QCM" | "SHORT_ANSWER".

QCM shape:
{ "type": "QCM", "prompt": "...", "options": ["A","B","C","D"], "correctAnswer": "exact option string" }

SHORT_ANSWER shape:
{ "type": "SHORT_ANSWER", "prompt": "..." }

Do not include markdown or text outside the JSON array.`;

    return runSerial(async () => {
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: MAX_COMPLETION,
            });

            const rawJson = response.choices[0].message.content;
            const parsed = cleanJsonResponse(rawJson);
            if (!Array.isArray(parsed)) throw new Error("AI returned non-array JSON.");
            return normalizeGeneratedQuestions(parsed, n);
        } catch (error) {
            if (error.status === 429 || error.status === 503 || error.code === 'insufficient_quota') {
                console.warn("OpenAI quota exceeded, using fallback question generator.");
                return generateFallbackQuestions(jobRole, description, count);
            }
            console.error("OpenAI Question Generation Error:", error);
            throw new Error(error.message || "Failed to generate questions using AI.");
        }
    });
}

/**
 * Ensure AI output matches expected types and caps length.
 */
function normalizeGeneratedQuestions(items, maxCount) {
    const out = [];
    for (const raw of items) {
        if (!raw || typeof raw.prompt !== 'string' || !raw.prompt.trim()) continue;
        const t = (raw.type || 'QCM').toString().toUpperCase();
        if (t === 'QCM' && Array.isArray(raw.options) && raw.options.length >= 2 && raw.correctAnswer) {
            out.push({
                type: 'QCM',
                prompt: raw.prompt.trim(),
                options: raw.options.map(String),
                correctAnswer: String(raw.correctAnswer),
            });
        } else if (['TEXT', 'SHORT_ANSWER', 'PROBLEM'].includes(t)) {
            out.push({ type: 'SHORT_ANSWER', prompt: raw.prompt.trim() });
        }
        if (out.length >= maxCount) break;
    }
    return out;
}

async function evaluateAnswersAI(jobRole, questionsAndAnswersStr, evaluationCriteria = '') {
    const criteriaBlock = evaluationCriteria && evaluationCriteria.trim()
        ? `\nEmployer scoring criteria (follow these priorities):\n${evaluationCriteria.trim()}\n`
        : '';

    const prompt = `You are an expert HR technical recruiter evaluating a candidate for the position of "${jobRole}".
Below is a list of open-ended questions and the candidate's answers.
Evaluate the answers, assign an overall score out of 100 for this written part, and provide constructive feedback.
${criteriaBlock}
Also break down performance into 3 to 6 key competencies relevant to the role (e.g. technical depth, communication, problem-solving). For each competency give a score 0-100 and a short comment.

Questions and Answers:
${questionsAndAnswersStr}

Return ONLY a valid JSON object. No other text. Structure:
{
  "score": <number 0-100>,
  "feedback": "<detailed string: strengths, weaknesses, overall assessment>",
  "competencies": [
    { "competency": "<name>", "score": <0-100>, "comment": "<brief>" }
  ]
}`;

    return runSerial(async () => {
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2,
            });

            const rawJson = response.choices[0].message.content;
            const parsed = cleanJsonResponse(rawJson);
            const competencies = Array.isArray(parsed.competencies)
                ? parsed.competencies
                    .filter(c => c && c.competency)
                    .map(c => ({
                        competency: String(c.competency),
                        score: Math.min(100, Math.max(0, Number(c.score) || 0)),
                        comment: c.comment != null ? String(c.comment) : '',
                    }))
                : [];
            return {
                score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
                feedback: parsed.feedback != null ? String(parsed.feedback) : '',
                competencies,
            };
        } catch (error) {
            if (isRecoverableOpenAiError(error)) {
                console.warn("OpenAI grading unavailable, using fallback evaluator.");
                return evaluateAnswersFallback(jobRole, questionsAndAnswersStr, evaluationCriteria);
            }
            console.error("OpenAI Grading Error:", error);
            throw new Error(error.message || "Failed to grade using AI.");
        }
    });
}

/**
 * Reformule une question existante (même type) pour le poste indiqué.
 */
async function regenerateSingleQuestionAI({ type, prompt, jobRole, instruction }) {
    const extra = instruction && instruction.trim() ? `Additional instruction: ${instruction.trim()}` : '';
    const typeHint = type === 'QCM'
        ? `Return JSON: { "type": "QCM", "prompt": "...", "options": ["A","B","C","D"], "correctAnswer": "exact one option" }`
        : `Return JSON: { "type": "${type}", "prompt": "..." } (type must be exactly "${type}")`;

    const userPrompt = `Role: "${jobRole}".
Reformulate this assessment item in French or English matching the role (keep the same type: ${type}).
Original: ${prompt}
${extra}
${typeHint}
Return ONLY valid JSON, no markdown.`;

    return runSerial(async () => {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: userPrompt }],
            temperature: 0.75,
            max_tokens: Math.min(900, MAX_COMPLETION),
        });
        const rawJson = response.choices[0].message.content;
        const parsed = cleanJsonResponse(rawJson);
        const normalized = normalizeGeneratedQuestions([{ ...parsed, type: parsed.type || type }], 1);
        if (!normalized.length) throw new Error('Could not normalize regenerated question.');
        return normalized[0];
    });
}

async function chatAssistantReply({ userMessage, jobRole, testTitle, userRole = 'candidat', history = [] }) {
    const normalizedRole = String(userRole || '').toLowerCase();
    const isHr = normalizedRole === 'hr' || normalizedRole === 'admin';
    const system = isHr
        ? `You are an AI copilot for recruiters and HR teams.
Help with job definition, screening strategy, interview structure, evaluation rubrics, and candidate communication.
Never generate discriminatory advice or criteria.
Give practical and actionable guidance in concise steps.
Keep answers under 140 words and match the user's language.`
        : `You help candidates taking a recruitment screening test.
Rules: clarify instructions, suggest study approaches, encourage.
Do NOT provide direct answers, code that solves the exercise, or multiple-choice solutions.
Keep answers under 140 words and match the user's language.`;

    const contextLine = `Context: ${testTitle || 'General context'} - ${jobRole || 'role unspecified'}.`;
    const safeHistory = Array.isArray(history)
        ? history
            .slice(-8)
            .filter((entry) =>
                entry &&
                (entry.role === 'user' || entry.role === 'assistant') &&
                typeof entry.content === 'string' &&
                entry.content.trim()
            )
            .map((entry) => ({
                role: entry.role,
                content: entry.content.trim().slice(0, 2000),
            }))
        : [];

    return runSerial(async () => {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
            messages: [
                { role: 'system', content: system },
                ...safeHistory,
                { role: 'user', content: `${contextLine}\n\nUser message:\n${String(userMessage || '').trim()}` },
            ],
            temperature: 0.4,
            max_tokens: Math.min(420, MAX_COMPLETION),
        });
        return response.choices[0].message.content || '';
    });
}

function normalizeCvAnalysisResult(parsed, fallback = {}) {
    const unique = (values = []) => [...new Set(
        values
            .filter(Boolean)
            .map((value) => String(value).trim())
            .filter(Boolean)
    )];

    const summary = String(parsed?.summary || fallback.summary || '').trim();
    const experienceLevel = String(parsed?.experienceLevel || fallback.experienceLevel || '').trim();
    const detectedSkills = unique([
        ...(Array.isArray(parsed?.detectedSkills) ? parsed.detectedSkills : []),
        ...(Array.isArray(fallback.detectedSkills) ? fallback.detectedSkills : []),
    ]).slice(0, 12);
    const strengths = unique(Array.isArray(parsed?.strengths) ? parsed.strengths : fallback.strengths || []).slice(0, 6);
    const recommendations = unique(Array.isArray(parsed?.recommendations) ? parsed.recommendations : fallback.recommendations || []).slice(0, 6);
    const suggestedRoles = unique(Array.isArray(parsed?.suggestedRoles) ? parsed.suggestedRoles : fallback.suggestedRoles || []).slice(0, 5);

    return {
        summary: summary || fallback.summary || '',
        detectedSkills,
        experienceLevel: experienceLevel || fallback.experienceLevel || '',
        strengths,
        recommendations,
        suggestedRoles,
        lastAnalyzedAt: new Date(),
    };
}

async function analyzeCvProfileAI({ user = {}, cvText = '', hasUploadedCv = false, fallback = {} }) {
    const normalizedCvText = String(cvText || '').trim();
    const canCallOpenAI = Boolean(process.env.OPENAI_API_KEY);

    if (!canCallOpenAI || !normalizedCvText) {
        return null;
    }

    const profileSnapshot = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        skills: Array.isArray(user.skills) ? user.skills : [],
        education: user.education || '',
        bio: user.bio || '',
        experienceYears: user.experienceYears ?? 0,
        preferredSector: user.preferredSector || '',
        preferredLocation: user.preferredLocation || '',
    };

    const prompt = `You are an expert recruiting copilot.
Analyze the following candidate CV and profile data to help recruiters screen the candidate.

Return ONLY valid JSON with this exact shape:
{
  "summary": "<2 to 4 concise sentences>",
  "detectedSkills": ["skill1", "skill2"],
  "experienceLevel": "<Junior|Mid-level|Senior|Lead>",
  "strengths": ["strength 1", "strength 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "suggestedRoles": ["role 1", "role 2"]
}

Rules:
- Use the CV text as the primary source.
- Keep skills concrete and recruiter-friendly.
- Keep recommendations actionable.
- Do not invent certifications or employers if not present.
- Respond in the same language as the CV/profile when possible.

Profile snapshot:
${JSON.stringify(profileSnapshot, null, 2)}

CV uploaded: ${hasUploadedCv ? 'yes' : 'no'}

CV text:
${normalizedCvText.slice(0, 16000)}`;

    return runSerial(async () => {
        try {
            const response = await openai.chat.completions.create({
                model: process.env.OPENAI_CV_MODEL || process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Return strict JSON only. No markdown.' },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.2,
                max_tokens: Math.min(700, MAX_COMPLETION),
            });

            const rawJson = response.choices[0].message.content;
            const parsed = cleanJsonResponse(rawJson);
            return normalizeCvAnalysisResult(parsed, fallback);
        } catch (error) {
            console.error('OpenAI CV analysis error:', error?.message || error);
            return null;
        }
    });
}

module.exports = {
    generateQuestionsAI,
    evaluateAnswersAI,
    generateFallbackQuestions,
    regenerateSingleQuestionAI,
    chatAssistantReply,
    analyzeCvProfileAI,
};
