const Test = require('../models/test.model');
const Question = require('../models/question.model');
const Submission = require('../models/submission.model');
const { generateQuestionsAI, generateFallbackQuestions, regenerateSingleQuestionAI } = require('../utils/openai');
const { logManualActivity } = require('../utils/activityLogger');
const skillRecommender = require('../utils/skillRecommender');

function createHttpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function sendControllerError(res, error) {
    const statusCode = error?.statusCode || (error?.name === 'ValidationError' ? 400 : 500);
    const payload = {
        status: false,
        message: error?.message || 'Unexpected server error',
    };

    if (statusCode >= 500 && process.env.NODE_ENV !== 'production') {
        payload.error = error?.message || 'Unknown error';
    }

    return res.status(statusCode).json(payload);
}

async function ensureHrCompanyApproved(req) {
    // Business decision: RH can manage tests without company approval/linking constraints.
    return null;
}

function clampInt(value, min, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.floor(n));
}

function sanitizeAntiCheatPolicy(levelInput, configInput = {}) {
    const level = ['BASIC', 'STANDARD', 'STRICT'].includes(String(levelInput || '').toUpperCase())
        ? String(levelInput).toUpperCase()
        : 'STANDARD';

    const defaultsByLevel = {
        BASIC: {
            tabSwitchWarnThreshold: 4,
            tabSwitchAutoSubmitThreshold: 8,
            focusLossFlagThreshold: 6,
            pasteFlagThreshold: 6,
            fullscreenExitFlagThreshold: 5,
            requireFullscreen: false,
        },
        STANDARD: {
            tabSwitchWarnThreshold: 3,
            tabSwitchAutoSubmitThreshold: 5,
            focusLossFlagThreshold: 4,
            pasteFlagThreshold: 4,
            fullscreenExitFlagThreshold: 3,
            requireFullscreen: false,
        },
        STRICT: {
            tabSwitchWarnThreshold: 2,
            tabSwitchAutoSubmitThreshold: 4,
            focusLossFlagThreshold: 3,
            pasteFlagThreshold: 3,
            fullscreenExitFlagThreshold: 2,
            requireFullscreen: true,
        },
    };

    const defaults = defaultsByLevel[level];
    const warn = clampInt(configInput.tabSwitchWarnThreshold, 1, defaults.tabSwitchWarnThreshold);
    const autoSubmit = clampInt(configInput.tabSwitchAutoSubmitThreshold, warn + 1, defaults.tabSwitchAutoSubmitThreshold);

    return {
        antiCheatLevel: level,
        antiCheatConfig: {
            tabSwitchWarnThreshold: warn,
            tabSwitchAutoSubmitThreshold: autoSubmit,
            focusLossFlagThreshold: clampInt(configInput.focusLossFlagThreshold, 1, defaults.focusLossFlagThreshold),
            pasteFlagThreshold: clampInt(configInput.pasteFlagThreshold, 1, defaults.pasteFlagThreshold),
            fullscreenExitFlagThreshold: clampInt(configInput.fullscreenExitFlagThreshold, 1, defaults.fullscreenExitFlagThreshold),
            requireFullscreen: configInput.requireFullscreen !== undefined
                ? Boolean(configInput.requireFullscreen)
                : defaults.requireFullscreen,
        },
    };
}

// Create a new Test / Job
async function createTest(req, res) {
    try {
        await ensureHrCompanyApproved(req);
        const {
            title, description, jobRole, timeLimit, location, employmentType, status, evaluationCriteria,
            inviteCode, submissionDeadline, maxAttempts, passThreshold, weightQCM, weightOpen,
            calendlyUrl, webhookUrl, minSecondsPerQuestion,
            antiCheatLevel, antiCheatConfig,
        } = req.body;
        const antiCheatPolicy = sanitizeAntiCheatPolicy(antiCheatLevel, antiCheatConfig || {});

        const test = new Test({
            title,
            description,
            jobRole,
            timeLimit,
            location,
            employmentType,
            status,
            evaluationCriteria: evaluationCriteria || '',
            inviteCode: inviteCode || '',
            submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : undefined,
            maxAttempts: maxAttempts ?? 0,
            passThreshold: passThreshold ?? 50,
            weightQCM: weightQCM ?? 50,
            weightOpen: weightOpen ?? 50,
            calendlyUrl: calendlyUrl || '',
            webhookUrl: webhookUrl || '',
            minSecondsPerQuestion: minSecondsPerQuestion ?? 0,
            antiCheatLevel: antiCheatPolicy.antiCheatLevel,
            antiCheatConfig: antiCheatPolicy.antiCheatConfig,
            createdBy: req.user.id,
        });

        await test.save();

        if (/^publish(ed)?$/i.test(String(test.status || ''))) {
            skillRecommender.broadcastNewOpportunitiesForTest(test, {
                minScore: 72,
                maxRecipients: 40,
            }).catch(() => {});
        }

        res.status(201).json({
            status: true,
            message: "Test created successfully",
            test
        });
    } catch (error) {
        return sendControllerError(res, error);
    }
}

// Generate Questions using AI for a given Test
async function generateAutoQuestions(req, res) {
    try {
        await ensureHrCompanyApproved(req);
        const { testId, count } = req.body;

        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ status: false, message: "Test not found" });
        }

        let aiQuestions = await generateQuestionsAI(test.jobRole, test.description, count || 5);
        if (!aiQuestions || aiQuestions.length === 0) {
            aiQuestions = generateFallbackQuestions(test.jobRole, test.description, count || 5);
        }

        const savedQuestions = [];
        for (let qData of aiQuestions) {
            const isQcm = qData.type === 'QCM';
            const question = new Question({
                testId: test._id,
                type: isQcm ? 'QCM' : (qData.type || 'TEXT'),
                prompt: qData.prompt,
                options: isQcm ? qData.options : undefined,
                correctAnswer: isQcm ? qData.correctAnswer : undefined,
            });
            await question.save();
            savedQuestions.push(question);
        }

        res.status(200).json({
            status: true,
            message: "Questions generated and saved successfully",
            questions: savedQuestions
        });

    } catch (error) {
        return sendControllerError(res, error);
    }
}

// Get all tests
// HR/admin: only their own tests; candidates: all tests
async function getTests(req, res) {
    try {
        const filter = req.user.role === 'candidat' ? {} : { createdBy: req.user.id };
        const tests = await Test.find(filter).sort('-createdAt');
        res.status(200).json({ status: true, tests });
    } catch (error) {
        return sendControllerError(res, error);
    }
}

// Get single test with questions (HR : propriÃ©taire ou admin ; candidat : accÃ¨s contrÃ´lÃ©)
async function getTestById(req, res) {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ status: false, message: "Test not found" });

        const questions = await Question.find({ testId: test._id });
        const role = req.user.role;

        if (role === 'candidat') {
            const invite = (req.query.invite || '').toString();
            if (test.inviteCode && test.inviteCode.trim() && invite !== test.inviteCode) {
                return res.status(403).json({ status: false, message: "Code d'invitation requis ou invalide." });
            }
            if (test.status !== 'PUBLISHED') {
                return res.status(403).json({ status: false, message: "Ce test n'est pas disponible." });
            }
            if (test.submissionDeadline && new Date() > new Date(test.submissionDeadline)) {
                return res.status(400).json({ status: false, message: 'La date limite de passage est dÃ©passÃ©e.' });
            }
            const attempts = await Submission.countDocuments({ testId: test._id, candidateId: req.user._id });
            if (test.maxAttempts > 0 && attempts >= test.maxAttempts) {
                return res.status(400).json({ status: false, message: 'Nombre maximum de tentatives atteint pour ce test.' });
            }
            const safe = test.toObject();
            delete safe.webhookUrl;
            delete safe.inviteCode;
            return res.status(200).json({
                status: true,
                test: safe,
                questions,
                meta: {
                    attemptsUsed: attempts,
                    maxAttempts: test.maxAttempts || 0,
                    minSecondsPerQuestion: test.minSecondsPerQuestion || 0,
                    antiCheatLevel: test.antiCheatLevel || 'STANDARD',
                    antiCheatConfig: test.antiCheatConfig || {},
                    questionCount: questions.length,
                },
            });
        }

        if (role === 'HR' && test.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: false, message: 'Non autorisÃ© Ã  voir ce test.' });
        }

        res.status(200).json({ status: true, test, questions, meta: {} });
    } catch (error) {
        return sendControllerError(res, error);
    }
}

// Add Manual Question
async function addManualQuestion(req, res) {
    try {
        await ensureHrCompanyApproved(req);
        const { testId, type, prompt, options, correctAnswer } = req.body;
        const question = new Question({
            testId,
            type,
            prompt,
            options: type === 'QCM' ? options : undefined,
            correctAnswer: type === 'QCM' ? correctAnswer : undefined
        });
        await question.save();
        res.status(201).json({ status: true, message: "Question added", question });
    } catch (error) {
        return sendControllerError(res, error);
    }
}

// Delete question
async function deleteQuestion(req, res) {
    try {
        await ensureHrCompanyApproved(req);
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) return res.status(404).json({ status: false, message: "Question not found" });
        res.status(200).json({ status: true, message: "Question deleted" });
    } catch (error) {
        return sendControllerError(res, error);
    }
}

// Delete a test and all its questions
async function deleteTest(req, res) {
    try {
        await ensureHrCompanyApproved(req);
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ status: false, message: "Test not found" });

        // Only allow the creator or admin to delete
        if (test.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: "Not authorized to delete this test" });
        }

        await Question.deleteMany({ testId: test._id });
        await Test.findByIdAndDelete(test._id);
        res.status(200).json({ status: true, message: "Test and its questions deleted successfully" });
    } catch (error) {
        return sendControllerError(res, error);
    }
}

// Update test (renamed to job offers mentally in the frontend)
async function updateTest(req, res) {
    try {
        await ensureHrCompanyApproved(req);
        const prev = await Test.findById(req.params.id);
        if (!prev) return res.status(404).json({ status: false, message: "Test not found" });
        if (req.user.role === 'HR' && prev.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: false, message: 'Non autorisÃ©' });
        }

        const {
            title, description, jobRole, timeLimit, location, employmentType, status, evaluationCriteria,
            inviteCode, submissionDeadline, maxAttempts, passThreshold, weightQCM, weightOpen,
            calendlyUrl, webhookUrl, minSecondsPerQuestion,
            antiCheatLevel, antiCheatConfig,
        } = req.body;

        const payload = { title, description, jobRole, timeLimit, location, employmentType, status };
        if (evaluationCriteria !== undefined) payload.evaluationCriteria = evaluationCriteria;
        if (inviteCode !== undefined) payload.inviteCode = inviteCode;
        if (submissionDeadline !== undefined) payload.submissionDeadline = submissionDeadline ? new Date(submissionDeadline) : null;
        if (maxAttempts !== undefined) payload.maxAttempts = maxAttempts;
        if (passThreshold !== undefined) payload.passThreshold = passThreshold;
        if (weightQCM !== undefined) payload.weightQCM = weightQCM;
        if (weightOpen !== undefined) payload.weightOpen = weightOpen;
        if (calendlyUrl !== undefined) payload.calendlyUrl = calendlyUrl;
        if (webhookUrl !== undefined) payload.webhookUrl = webhookUrl;
        if (minSecondsPerQuestion !== undefined) payload.minSecondsPerQuestion = minSecondsPerQuestion;
        if (antiCheatLevel !== undefined || antiCheatConfig !== undefined) {
            const normalized = sanitizeAntiCheatPolicy(
                antiCheatLevel !== undefined ? antiCheatLevel : prev.antiCheatLevel,
                {
                    ...(prev.antiCheatConfig || {}),
                    ...(antiCheatConfig || {}),
                }
            );
            payload.antiCheatLevel = normalized.antiCheatLevel;
            payload.antiCheatConfig = normalized.antiCheatConfig;
        }

        let criteriaBump = false;
        if (evaluationCriteria !== undefined && evaluationCriteria !== prev.evaluationCriteria) {
            criteriaBump = true;
            payload.evaluationCriteriaVersion = (prev.evaluationCriteriaVersion || 1) + 1;
        }

        let test = await Test.findByIdAndUpdate(req.params.id, payload, { new: true });

        if (criteriaBump) {
            await Test.findByIdAndUpdate(req.params.id, {
                $push: {
                    scoringAuditLog: {
                        $each: [{
                            at: new Date(),
                            evaluationCriteria: evaluationCriteria || '',
                            version: test.evaluationCriteriaVersion,
                            updatedBy: req.user._id,
                        }],
                        $slice: -25,
                    },
                },
            });
            test = await Test.findById(req.params.id);
        }

        if (/^publish(ed)?$/i.test(String(test.status || ''))) {
            skillRecommender.broadcastNewOpportunitiesForTest(test, {
                minScore: 72,
                maxRecipients: 40,
            }).catch(() => {});
        }

        res.status(200).json({ status: true, message: "Test updated", test });
    } catch (error) {
        return sendControllerError(res, error);
    }
}

async function regenerateQuestion(req, res) {
    try {
        const question = await Question.findById(req.params.qId);
        if (!question) return res.status(404).json({ status: false, message: 'Question introuvable' });
        const test = await Test.findById(question.testId);
        if (!test) return res.status(404).json({ status: false, message: 'Test introuvable' });
        if (req.user.role !== 'admin' && test.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: false, message: 'Non autorisÃ©' });
        }
        const { instruction } = req.body;
        const regen = await regenerateSingleQuestionAI({
            type: question.type,
            prompt: question.prompt,
            jobRole: test.jobRole,
            instruction,
        });
        question.prompt = regen.prompt;
        if (regen.type === 'QCM' && regen.options) {
            question.options = regen.options;
            question.correctAnswer = regen.correctAnswer;
        }
        await question.save();

        try {
            await logManualActivity(req.user._id, req.user.email, req.user.role, 'AI_QUESTION_REGENERATED', {
                resourceType: 'Question',
                resourceId: question._id,
                testId: test._id,
            });
        } catch (e) { /* ignore log errors */ }

        res.status(200).json({ status: true, question });
    } catch (error) {
        return sendControllerError(res, error);
    }
}

// Get public published jobs for Careers Page with pagination
async function getPublicTests(req, res) {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        const employmentTypes = Array.isArray(req.query.employmentType)
            ? req.query.employmentType
            : (req.query.employmentType ? [req.query.employmentType] : []);
        const locations = Array.isArray(req.query.location)
            ? req.query.location
            : (req.query.location ? [req.query.location] : []);
        const search = String(req.query.search || '').trim().toLowerCase();
        const category = String(req.query.category || '').trim().toLowerCase();
        const sector = String(req.query.sector || '').trim().toLowerCase();
        const company = String(req.query.company || '').trim().toLowerCase();

        let tests = await Test.find({ status: { $regex: /^publish(ed)?$/i } })
            .populate({
                path: 'createdBy',
                select: 'firstName lastName companyId',
                populate: {
                    path: 'companyId',
                    select: 'name sector city status',
                },
            })
            .lean();

        tests = tests.filter((job) => {
            const companyDoc = job.createdBy?.companyId;
            if (companyDoc && companyDoc.status && companyDoc.status !== 'approved') return false;

            if (search) {
                const haystack = [
                    job.title,
                    job.jobRole,
                    job.description,
                    job.location,
                    companyDoc?.name,
                    companyDoc?.sector,
                ].filter(Boolean).join(' ').toLowerCase();
                if (!haystack.includes(search)) return false;
            }

            if (employmentTypes.length > 0 && !employmentTypes.includes(job.employmentType)) return false;
            if (locations.length > 0 && !locations.includes(job.location)) return false;
            if (category && String(job.jobRole || '').trim().toLowerCase() !== category) return false;
            if (sector && String(companyDoc?.sector || '').trim().toLowerCase() !== sector) return false;
            if (company && !String(companyDoc?.name || '').toLowerCase().includes(company)) return false;
            return true;
        }).map((job) => ({
            ...job,
            companyName: job.createdBy?.companyId?.name || 'Entreprise partenaire',
            companySector: job.createdBy?.companyId?.sector || '',
            recruiterName: `${job.createdBy?.firstName || ''} ${job.createdBy?.lastName || ''}`.trim(),
        }));

        const total = tests.length;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        tests.sort((a, b) => {
            const av = a[sortBy];
            const bv = b[sortBy];
            if (av == null && bv == null) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            return av > bv ? sortOrder : -sortOrder;
        });

        const paginated = tests.slice(skip, skip + limit);

        res.status(200).json({ 
            status: true, 
            tests: paginated,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        return sendControllerError(res, error);
    }
}

async function getPublicTestById(req, res) {
    try {
        const test = await Test.findOne({
            _id: req.params.id,
            status: { $regex: /^publish(ed)?$/i },
        })
            .populate({
                path: 'createdBy',
                select: 'firstName lastName avatar bio city companyId',
                populate: {
                    path: 'companyId',
                    select: 'name logo city sector description website size phone',
                },
            })
            .lean();

        if (!test) {
            return res.status(404).json({ status: false, message: "Offre d'emploi introuvable" });
        }

        const applicantCount = await Submission.countDocuments({ testId: test._id });

        return res.status(200).json({
            status: true,
            test: {
                ...test,
                applicantCount,
            },
        });
    } catch (error) {
        return sendControllerError(res, error);
    }
}

async function markQuestionReviewed(req, res) {
    try {
        const question = await Question.findById(req.params.qId);
        if (!question) return res.status(404).json({ status: false, message: 'Question introuvable' });
        const test = await Test.findById(question.testId);
        if (!test) return res.status(404).json({ status: false, message: 'Test introuvable' });
        if (req.user.role !== 'admin' && test.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: false, message: 'Non autorisÃ©' });
        }
        question.reviewedForPublish = req.body.reviewedForPublish !== false;
        await question.save();
        res.status(200).json({ status: true, question });
    } catch (error) {
        return sendControllerError(res, error);
    }
}

module.exports = {
    createTest,
    generateAutoQuestions,
    getTests,
    getTestById,
    addManualQuestion,
    deleteQuestion,
    deleteTest,
    updateTest,
    getPublicTests,
    getPublicTestById,
    regenerateQuestion,
    markQuestionReviewed,
};

