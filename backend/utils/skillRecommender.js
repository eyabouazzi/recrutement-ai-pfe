const crypto = require('crypto');
const Recommendation = require('../models/recommendation.model');
const Test = require('../models/test.model');
const Submission = require('../models/submission.model');
const User = require('../models/user.model');
const { createManyAndDispatchNotifications } = require('./inAppNotifications');
const { notifyCandidateNewMatch } = require('./emailNotifications');

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function escapeRegex(value = '') {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class SkillBasedRecommender {
    constructor() {
        this.ALGORITHM_VERSION = '2.0.0';
        this.RECOMMENDATION_LIMIT = 10;
        this.STALE_RECOMMENDATIONS_MS = 24 * 60 * 60 * 1000;

        this.SCORE_WEIGHTS = {
            skillCoverage: 0.33,
            skillAlignment: 0.17,
            proficiency: 0.14,
            experience: 0.12,
            location: 0.08,
            jobType: 0.06,
            momentum: 0.10,
        };

        this.SKILL_WEIGHTS = {
            javascript: 1.0,
            typescript: 0.95,
            react: 0.95,
            'next.js': 0.9,
            'vue.js': 0.82,
            angular: 0.82,
            nodejs: 0.9,
            express: 0.84,
            python: 0.9,
            django: 0.84,
            flask: 0.8,
            java: 0.85,
            'spring boot': 0.82,
            go: 0.8,
            rust: 0.8,
            'c#': 0.8,
            '.net': 0.8,
            sql: 0.82,
            postgresql: 0.8,
            mysql: 0.74,
            mongodb: 0.82,
            redis: 0.74,
            docker: 0.86,
            kubernetes: 0.9,
            aws: 0.9,
            azure: 0.85,
            gcp: 0.85,
            terraform: 0.78,
            git: 0.68,
            linux: 0.68,
            'react native': 0.86,
            flutter: 0.82,
            swift: 0.78,
            kotlin: 0.78,
            'machine learning': 0.9,
            'data science': 0.86,
            tensorflow: 0.84,
            pytorch: 0.84,
            pandas: 0.74,
            numpy: 0.74,
            figma: 0.68,
            'ui/ux': 0.72,
            testing: 0.7,
            jest: 0.7,
            cypress: 0.7,
        };

        this.SKILL_ALIASES = {
            'node js': 'nodejs',
            'node.js': 'nodejs',
            reactjs: 'react',
            'react js': 'react',
            vue: 'vue.js',
            'c sharp': 'c#',
            'dot net': '.net',
            'google cloud': 'gcp',
            'google cloud platform': 'gcp',
            'ci cd': 'ci/cd',
            'ui ux': 'ui/ux',
            'react-native': 'react native',
        };

        this.SKILL_GROUPS = {
            frontend: ['react', 'next.js', 'vue.js', 'angular', 'javascript', 'typescript', 'ui/ux'],
            backend: ['nodejs', 'express', 'python', 'django', 'flask', 'java', 'spring boot', 'go', 'c#', '.net'],
            data: ['machine learning', 'data science', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'sql'],
            devops: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'linux'],
            mobile: ['react native', 'flutter', 'swift', 'kotlin'],
        };

        this.EXPERIENCE_LEVELS = ['Junior', 'Mid-level', 'Senior', 'Expert'];
        this.EXPERIENCE_KEYWORDS = {
            Junior: ['junior', 'entry', 'intern', '0-2'],
            'Mid-level': ['mid', '2-5', 'intermediate'],
            Senior: ['senior', 'lead', '5-8'],
            Expert: ['principal', 'staff', 'architect', '10+', 'expert'],
        };

        this.JOB_TYPE_ALIASES = {
            cdi: 'full-time',
            'full time': 'full-time',
            'full-time': 'full-time',
            cdd: 'contract',
            contract: 'contract',
            freelance: 'contract',
            stage: 'internship',
            internship: 'internship',
            alternance: 'internship',
            'part time': 'part-time',
            'part-time': 'part-time',
            remote: 'remote',
            hybride: 'hybrid',
            hybrid: 'hybrid',
        };
    }

    normalizeText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9+#/. -]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    normalizeSkill(value) {
        const normalized = this.normalizeText(value);
        if (!normalized) return '';
        if (this.SKILL_ALIASES[normalized]) return this.SKILL_ALIASES[normalized];

        const exact = Object.keys(this.SKILL_WEIGHTS).find(
            (skill) => this.normalizeText(skill) === normalized
        );
        return exact || normalized;
    }

    normalizeJobType(value) {
        const normalized = this.normalizeText(value);
        return this.JOB_TYPE_ALIASES[normalized] || normalized;
    }

    getSkillWeight(skill) {
        const normalized = this.normalizeSkill(skill);
        return this.SKILL_WEIGHTS[normalized] || 0.55;
    }

    extractSkillsFromText(value) {
        const text = this.normalizeText(value);
        if (!text) return [];

        const found = new Set();
        const skillEntries = Object.keys(this.SKILL_WEIGHTS);

        for (const rawSkill of skillEntries) {
            const normalizedSkill = this.normalizeText(rawSkill);
            if (!normalizedSkill) continue;

            const pattern = new RegExp(`(^|\\b)${escapeRegex(normalizedSkill)}(\\b|$)`, 'i');
            if (pattern.test(text)) {
                found.add(this.normalizeSkill(rawSkill));
            }
        }

        return Array.from(found);
    }

    extractSkillsFromJobRole(jobRole) {
        return this.extractSkillsFromText(jobRole);
    }

    hasSkill(userSkills = [], skill) {
        const target = this.normalizeSkill(skill);
        if (!target) return false;
        const normalizedSkills = new Set((userSkills || []).map((item) => this.normalizeSkill(item)));
        return normalizedSkills.has(target);
    }

    inferExperienceLevel(user, submissions) {
        const years = Number(user?.experienceYears || 0);
        if (Array.isArray(submissions) && submissions.length > 0) {
            const avgScore = submissions.reduce((sum, item) => sum + (Number(item.totalScore) || 0), 0) / submissions.length;
            if (years >= 9 || avgScore >= 87) return 'Expert';
            if (years >= 5 || avgScore >= 76) return 'Senior';
            if (years >= 2 || avgScore >= 65) return 'Mid-level';
            return 'Junior';
        }
        if (years >= 9) return 'Expert';
        if (years >= 5) return 'Senior';
        if (years >= 2) return 'Mid-level';
        return 'Junior';
    }

    scoreToProficiency(score) {
        if (score >= 90) return 95;
        if (score >= 80) return 85;
        if (score >= 70) return 75;
        if (score >= 60) return 65;
        return 50;
    }

    estimateSalaryRange(experienceLevel, skills) {
        const baseRanges = {
            Junior: { min: 30000, max: 45000 },
            'Mid-level': { min: 45000, max: 65000 },
            Senior: { min: 65000, max: 90000 },
            Expert: { min: 90000, max: 130000 },
        };
        const base = baseRanges[experienceLevel] || baseRanges.Junior;
        const premiumSkills = ['machine learning', 'aws', 'kubernetes', 'react native', 'terraform'];
        const hasPremium = (skills || []).some((skill) => premiumSkills.includes(this.normalizeSkill(skill)));
        if (!hasPremium) return base;
        return {
            min: Math.round(base.min * 1.12),
            max: Math.round(base.max * 1.18),
        };
    }

    getPrimarySkillGroup(skills = []) {
        const normalized = skills.map((skill) => this.normalizeSkill(skill));
        let best = 'general';
        let bestScore = 0;
        Object.entries(this.SKILL_GROUPS).forEach(([group, groupSkills]) => {
            const score = normalized.filter((skill) => groupSkills.includes(skill)).length;
            if (score > bestScore) {
                best = group;
                bestScore = score;
            }
        });
        return best;
    }

    findRelatedUserSkills(targetSkill, userSkills = []) {
        const normalizedTarget = this.normalizeSkill(targetSkill);
        if (!normalizedTarget) return [];

        const related = new Set();
        for (const groupSkills of Object.values(this.SKILL_GROUPS)) {
            if (!groupSkills.includes(normalizedTarget)) continue;
            for (const userSkill of userSkills) {
                const normalizedUserSkill = this.normalizeSkill(userSkill);
                if (normalizedUserSkill && normalizedUserSkill !== normalizedTarget && groupSkills.includes(normalizedUserSkill)) {
                    related.add(normalizedUserSkill);
                }
            }
        }
        return Array.from(related);
    }

    estimateLearningDifficulty(skill) {
        const normalized = this.normalizeSkill(skill);
        if (['machine learning', 'tensorflow', 'pytorch', 'kubernetes'].includes(normalized)) return 'advanced';
        if (['docker', 'react', 'nodejs', 'python', 'java', 'aws'].includes(normalized)) return 'intermediate';
        return 'beginner';
    }

    buildLearningOpportunities(missingSkills = [], userProfile = {}) {
        return missingSkills
            .sort((a, b) => this.getSkillWeight(b) - this.getSkillWeight(a))
            .slice(0, 3)
            .map((skill) => ({
                skill,
                reason: `High value skill for this role (${Math.round(this.getSkillWeight(skill) * 100)}% importance)`,
                suggestion: this.findRelatedUserSkills(skill, userProfile.skills).length > 0
                    ? `Start from related skills you already have: ${this.findRelatedUserSkills(skill, userProfile.skills).slice(0, 2).join(', ')}`
                    : `Build a small project focused on ${skill} and practice with real tasks`,
            }));
    }

    inferTargetExperienceLevel(test) {
        const text = this.normalizeText([test?.title, test?.jobRole, test?.description].filter(Boolean).join(' '));
        const scoreMap = new Map(this.EXPERIENCE_LEVELS.map((level, index) => [level, index]));
        let best = 'Junior';
        let bestScore = -1;

        Object.entries(this.EXPERIENCE_KEYWORDS).forEach(([level, keywords]) => {
            const hits = keywords.reduce((acc, keyword) => acc + (text.includes(this.normalizeText(keyword)) ? 1 : 0), 0);
            if (hits > bestScore || (hits === bestScore && scoreMap.get(level) > scoreMap.get(best))) {
                best = level;
                bestScore = hits;
            }
        });

        return best;
    }

    buildUserProfile(user, submissions = []) {
        const directSkills = Array.isArray(user?.skills) ? user.skills : [];
        const cvSkills = Array.isArray(user?.cvAnalysis?.detectedSkills) ? user.cvAnalysis.detectedSkills : [];
        const profileSkills = new Set([...directSkills, ...cvSkills].map((skill) => this.normalizeSkill(skill)).filter(Boolean));
        const skillProficiency = {};
        const scoreBuckets = {};

        submissions.forEach((submission) => {
            const test = submission?.testId;
            if (!test) return;
            const extracted = this.extractSkillsFromText([test.title, test.jobRole, test.description].filter(Boolean).join(' '));
            extracted.forEach((skill) => {
                profileSkills.add(skill);
                if (!scoreBuckets[skill]) scoreBuckets[skill] = [];
                scoreBuckets[skill].push(Number(submission.totalScore) || 0);
            });
        });

        Array.from(profileSkills).forEach((skill) => {
            const years = Number(user?.experienceYears || 0);
            const base = clamp((years / 10) * 100, 20, 90);
            skillProficiency[skill] = Math.round(clamp(base * (0.75 + this.getSkillWeight(skill) / 2), 20, 96));
        });

        Object.entries(scoreBuckets).forEach(([skill, scores]) => {
            if (!Array.isArray(scores) || scores.length === 0) return;
            const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;
            skillProficiency[skill] = Math.max(skillProficiency[skill] || 0, this.scoreToProficiency(average));
        });

        const preferredLocations = [user?.preferredLocation, user?.city]
            .map((value) => this.normalizeText(value))
            .filter(Boolean);
        const preferredJobTypes = [user?.preferredJobType]
            .map((value) => this.normalizeJobType(value))
            .filter(Boolean);

        const avgScore = submissions.length > 0
            ? Math.round(submissions.reduce((sum, item) => sum + (Number(item.totalScore) || 0), 0) / submissions.length)
            : 0;

        const profile = {
            skills: Array.from(profileSkills),
            skillProficiency,
            experienceLevel: this.inferExperienceLevel(user, submissions),
            preferredLocations: Array.from(new Set(preferredLocations)),
            preferredJobTypes: Array.from(new Set(preferredJobTypes)),
            preferredSectors: user?.preferredSector ? [String(user.preferredSector)] : [],
            industryPreferences: user?.preferredSector ? [this.normalizeText(user.preferredSector)] : [],
            remotePreference: this.normalizeText(user?.preferredJobType).includes('remote'),
            yearsOfExperience: Number(user?.experienceYears || 0),
            activitySignals: {
                totalSubmissions: submissions.length,
                averageScore: avgScore,
                lastSubmissionAt: submissions[0]?.createdAt || null,
            },
        };

        profile.salaryExpectations = this.estimateSalaryRange(profile.experienceLevel, profile.skills);
        return profile;
    }

    computeProfileFingerprint(profile = {}) {
        const payload = {
            skills: [...(profile.skills || [])].sort(),
            preferredLocations: [...(profile.preferredLocations || [])].sort(),
            preferredJobTypes: [...(profile.preferredJobTypes || [])].sort(),
            experienceLevel: profile.experienceLevel || 'Junior',
            yearsOfExperience: Number(profile.yearsOfExperience || 0),
            avgScore: Number(profile.activitySignals?.averageScore || 0),
        };
        return crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
    }

    calculateSkillCoverageScore(testSkills = [], userSkills = []) {
        if (testSkills.length === 0) return 55;
        const matchedCount = testSkills.filter((skill) => this.hasSkill(userSkills, skill)).length;
        return Math.round((matchedCount / testSkills.length) * 100);
    }

    calculateSkillAlignmentScore(testSkills = [], userSkills = []) {
        if (testSkills.length === 0) return 55;
        const totalWeight = testSkills.reduce((sum, skill) => sum + this.getSkillWeight(skill), 0);
        if (totalWeight === 0) return 55;

        const matchedWeight = testSkills.reduce((sum, skill) => {
            if (!this.hasSkill(userSkills, skill)) return sum;
            return sum + this.getSkillWeight(skill);
        }, 0);

        let score = (matchedWeight / totalWeight) * 100;
        if (score < 65) {
            const relatedHits = testSkills.reduce((sum, skill) => {
                const related = this.findRelatedUserSkills(skill, userSkills);
                return sum + (related.length > 0 ? 1 : 0);
            }, 0);
            score += (relatedHits / Math.max(testSkills.length, 1)) * 18;
        }
        return Math.round(clamp(score, 0, 100));
    }

    calculateProficiencyScore(testSkills = [], userProfile = {}) {
        if (testSkills.length === 0) return 60;
        const map = userProfile.skillProficiency || {};
        const values = testSkills.map((skill) => Number(map[this.normalizeSkill(skill)] || 50));
        return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    }

    calculateExperienceScore(test, userProfile = {}) {
        const target = this.inferTargetExperienceLevel(test);
        const userLevel = userProfile.experienceLevel || 'Junior';
        const targetRank = this.EXPERIENCE_LEVELS.indexOf(target);
        const userRank = this.EXPERIENCE_LEVELS.indexOf(userLevel);
        const delta = Math.abs(targetRank - userRank);
        if (delta === 0) return 100;
        if (delta === 1) return 75;
        if (delta === 2) return 48;
        return 30;
    }

    calculateLocationScore(test, userProfile = {}) {
        const location = this.normalizeText(test?.location);
        if (!location) return 60;
        if (location.includes('remote') && userProfile.remotePreference) return 100;
        const preferred = new Set((userProfile.preferredLocations || []).map((item) => this.normalizeText(item)));
        if (preferred.size === 0) return location.includes('remote') ? 85 : 60;
        if (preferred.has(location)) return 100;
        if (location.includes('remote')) return 90;
        return 35;
    }

    calculateJobTypeScore(test, userProfile = {}) {
        const jobType = this.normalizeJobType(test?.employmentType);
        if (!jobType) return 60;
        const preferred = new Set((userProfile.preferredJobTypes || []).map((item) => this.normalizeJobType(item)));
        if (preferred.size === 0) return 60;
        return preferred.has(jobType) ? 100 : 40;
    }

    calculateMomentumScore(userProfile = {}) {
        const avgScore = Number(userProfile.activitySignals?.averageScore || 0);
        const submissions = Number(userProfile.activitySignals?.totalSubmissions || 0);
        const recencyDate = userProfile.activitySignals?.lastSubmissionAt ? new Date(userProfile.activitySignals.lastSubmissionAt) : null;

        let score = 45;
        if (avgScore > 0) score += avgScore * 0.35;
        if (submissions > 0) score += Math.min(submissions * 3, 18);

        if (recencyDate && !Number.isNaN(recencyDate.getTime())) {
            const daysAgo = (Date.now() - recencyDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysAgo <= 14) score += 10;
            else if (daysAgo <= 30) score += 6;
        }

        return Math.round(clamp(score, 25, 100));
    }

    deriveCategory(score, missingSkills = []) {
        if (score >= 78 && missingSkills.length <= 2) return 'STRONG_MATCH';
        if (score >= 58) return 'GROWTH_MATCH';
        return 'EXPLORATION';
    }

    buildRecommendationReason(score, matchedSkills, missingSkills, userProfile) {
        const topMatched = (matchedSkills || []).slice(0, 3);
        if (score >= 80) {
            if (topMatched.length > 0) {
                return `Strong fit with your skills: ${topMatched.join(', ')}`;
            }
            return `Strong fit for your ${userProfile.experienceLevel || 'current'} profile`;
        }
        if (score >= 60) {
            if (topMatched.length > 0 && (missingSkills || []).length > 0) {
                return `Good fit with growth path from ${topMatched.join(', ')}`;
            }
            return 'Good growth opportunity with your current profile';
        }
        return 'Exploration opportunity to expand your skill set';
    }

    buildFitSummary(scoreBreakdown = {}) {
        const strongest = Object.entries(scoreBreakdown)
            .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
            .slice(0, 2)
            .map(([key]) => key);
        return strongest.length > 0
            ? `Best aligned on ${strongest.join(' + ')}`
            : 'General alignment based on available profile signals';
    }

    scoreSingleTest(test, userProfile = {}) {
        const textBlock = [test?.title, test?.jobRole, test?.description].filter(Boolean).join(' ');
        const testSkills = this.extractSkillsFromText(textBlock);
        const matchedSkills = testSkills.filter((skill) => this.hasSkill(userProfile.skills, skill));
        const missingSkills = testSkills.filter((skill) => !this.hasSkill(userProfile.skills, skill));

        const scoreBreakdown = {
            skillCoverage: this.calculateSkillCoverageScore(testSkills, userProfile.skills),
            skillAlignment: this.calculateSkillAlignmentScore(testSkills, userProfile.skills),
            proficiency: this.calculateProficiencyScore(testSkills, userProfile),
            experience: this.calculateExperienceScore(test, userProfile),
            location: this.calculateLocationScore(test, userProfile),
            jobType: this.calculateJobTypeScore(test, userProfile),
            momentum: this.calculateMomentumScore(userProfile),
        };

        const weighted = Object.entries(this.SCORE_WEIGHTS).reduce((sum, [key, weight]) => {
            return sum + (Number(scoreBreakdown[key] || 0) * weight);
        }, 0);
        const score = Math.round(clamp(weighted, 0, 100));

        const confidence = Math.round(clamp(
            42 +
            (testSkills.length > 0 ? 12 : 0) +
            (matchedSkills.length * 6) +
            ((userProfile.activitySignals?.totalSubmissions || 0) > 0 ? 10 : 0) +
            ((userProfile.skills || []).length > 0 ? 10 : 0),
            40,
            97
        ));

        const category = this.deriveCategory(score, missingSkills);
        const learningOpportunities = this.buildLearningOpportunities(missingSkills, userProfile);
        const skillGaps = missingSkills.map((skill) => ({
            skill,
            importance: this.getSkillWeight(skill),
            learningDifficulty: this.estimateLearningDifficulty(skill),
            relatedUserSkills: this.findRelatedUserSkills(skill, userProfile.skills),
        }));

        return {
            testId: test._id,
            score,
            matchScore: score,
            confidence,
            category,
            reason: this.buildRecommendationReason(score, matchedSkills, missingSkills, userProfile),
            fitSummary: this.buildFitSummary(scoreBreakdown),
            matchedSkills,
            missingSkills,
            skillGaps,
            learningOpportunities,
            scoreBreakdown,
            createdAt: new Date(),
            __test: test,
            __primaryGroup: this.getPrimarySkillGroup(testSkills),
        };
    }

    diversifyRecommendations(scoredTests = []) {
        const sorted = [...scoredTests].sort((a, b) => b.score - a.score);
        const selected = [];
        const perGroupCap = {};

        const pushIfAllowed = (item) => {
            const group = item.__primaryGroup || 'general';
            const current = perGroupCap[group] || 0;
            if (current >= 3) return false;
            perGroupCap[group] = current + 1;
            selected.push(item);
            return true;
        };

        sorted
            .filter((item) => item.category === 'STRONG_MATCH')
            .forEach((item) => {
                if (selected.length < 6) pushIfAllowed(item);
            });

        sorted
            .filter((item) => item.category === 'GROWTH_MATCH')
            .forEach((item) => {
                if (selected.length < this.RECOMMENDATION_LIMIT) pushIfAllowed(item);
            });

        sorted
            .filter((item) => item.category === 'EXPLORATION')
            .forEach((item) => {
                if (selected.length < this.RECOMMENDATION_LIMIT) pushIfAllowed(item);
            });

        if (selected.length < this.RECOMMENDATION_LIMIT) {
            sorted.forEach((item) => {
                if (selected.length >= this.RECOMMENDATION_LIMIT) return;
                if (selected.some((chosen) => String(chosen.testId) === String(item.testId))) return;
                selected.push(item);
            });
        }

        return selected.slice(0, this.RECOMMENDATION_LIMIT);
    }

    computeRecommendationStats(recommendations = []) {
        const total = recommendations.length;
        const strongMatches = recommendations.filter((item) => item.category === 'STRONG_MATCH').length;
        const growthMatches = recommendations.filter((item) => item.category === 'GROWTH_MATCH').length;
        const explorationMatches = recommendations.filter((item) => item.category === 'EXPLORATION').length;
        const averageMatchScore = total > 0
            ? Math.round(recommendations.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / total)
            : 0;

        return {
            totalRecommendations: total,
            strongMatches,
            growthMatches,
            explorationMatches,
            averageMatchScore,
        };
    }

    async maybeNotifyCandidateNewTopMatches(user, previousRecommendations = [], nextRecommendations = [], options = {}) {
        if (!user?._id) return;
        if (options.notifyTopMatches === false) return;

        const previousTopIds = new Set(
            (previousRecommendations || [])
                .slice(0, 6)
                .map((item) => String(item?.testId))
                .filter(Boolean)
        );

        const freshTop = (nextRecommendations || [])
            .filter((item) => item.category === 'STRONG_MATCH' && item.score >= 80)
            .filter((item) => !previousTopIds.has(String(item.testId)))
            .slice(0, 3);

        if (freshTop.length === 0) return;

        const notifications = freshTop.map((item) => ({
            userId: user._id,
            type: 'NEW_MATCH_RECOMMENDATION',
            category: 'matching',
            priority: item.score >= 90 ? 'high' : 'normal',
            title: 'New high-match opportunity',
            message: `${item.__test?.title || 'A job'} matches your profile (${item.score}%)`,
            link: '/recommendations',
            actionKey: `recommendation:${user._id}:${item.testId}`,
            data: {
                testId: item.testId,
                testTitle: item.__test?.title || '',
                score: item.score,
                category: item.category,
            },
        }));

        await createManyAndDispatchNotifications(notifications, { dedupeWindowMinutes: 1440 });

        const best = freshTop[0];
        notifyCandidateNewMatch(user._id, {
            testTitle: best.__test?.title || 'A new opportunity',
            matchScore: best.score,
        }).catch(() => {});
    }

    async generateRecommendations(userId, options = {}) {
        const [user, submissions, existingRecommendation] = await Promise.all([
            User.findById(userId),
            Submission.find({ candidateId: userId }).populate('testId').sort({ createdAt: -1 }),
            Recommendation.findOne({ userId }),
        ]);

        if (!user) {
            throw new Error('User not found');
        }

        const attemptedTestIds = submissions
            .filter((item) => item?.testId?._id)
            .map((item) => item.testId._id);

        const activeTests = await Test.find({
            status: { $regex: /^publish(ed)?$/i },
            _id: { $nin: attemptedTestIds },
        }).sort({ createdAt: -1 });

        const userProfile = this.buildUserProfile(user, submissions);
        const scoredTests = activeTests.map((test) => this.scoreSingleTest(test, userProfile));
        const recommendations = this.diversifyRecommendations(scoredTests);
        const cleanedRecommendations = recommendations.map((item) => {
            const clone = { ...item };
            delete clone.__test;
            delete clone.__primaryGroup;
            return clone;
        });

        const recommendationDoc = existingRecommendation || new Recommendation({ userId });
        recommendationDoc.recommendedTests = cleanedRecommendations;
        recommendationDoc.userProfile = userProfile;
        recommendationDoc.stats = this.computeRecommendationStats(cleanedRecommendations);
        recommendationDoc.profileFingerprint = this.computeProfileFingerprint(userProfile);
        recommendationDoc.algorithmVersion = this.ALGORITHM_VERSION;
        recommendationDoc.lastUpdated = new Date();
        await recommendationDoc.save();

        await this.maybeNotifyCandidateNewTopMatches(
            user,
            existingRecommendation?.recommendedTests || [],
            recommendations,
            options
        );

        return cleanedRecommendations;
    }

    async refreshRecommendations(userId, options = {}) {
        return this.generateRecommendations(userId, options);
    }

    filterValidRecommendations(recommendationDocument) {
        if (!recommendationDocument) return recommendationDocument;
        const filtered = (recommendationDocument.recommendedTests || []).filter((item) => {
            const testDoc = item?.testId;
            if (!testDoc) return false;
            if (typeof testDoc === 'object' && testDoc.status && !/^publish(ed)?$/i.test(String(testDoc.status))) {
                return false;
            }
            return true;
        });
        recommendationDocument.recommendedTests = filtered;
        return recommendationDocument;
    }

    async getRecommendationDocument(userId, options = {}) {
        const {
            autoGenerate = true,
            refreshIfStale = true,
            staleAfterMs = this.STALE_RECOMMENDATIONS_MS,
            notifyTopMatches = false,
        } = options;

        let recommendationDocument = await Recommendation.findOne({ userId })
            .populate('recommendedTests.testId')
            .sort({ lastUpdated: -1 });

        const isMissing = !recommendationDocument;
        const isStale = recommendationDocument
            ? (Date.now() - new Date(recommendationDocument.lastUpdated || 0).getTime()) > staleAfterMs
            : false;

        if ((isMissing && autoGenerate) || (isStale && refreshIfStale)) {
            await this.generateRecommendations(userId, { notifyTopMatches });
            recommendationDocument = await Recommendation.findOne({ userId })
                .populate('recommendedTests.testId')
                .sort({ lastUpdated: -1 });
        }

        return this.filterValidRecommendations(recommendationDocument);
    }

    async getRecommendationsForUser(userId, options = {}) {
        const document = await this.getRecommendationDocument(userId, options);
        return document ? document.recommendedTests || [] : [];
    }

    buildLightCandidateProfile(user) {
        const profile = this.buildUserProfile(user, []);
        profile.activitySignals = {
            totalSubmissions: 0,
            averageScore: 0,
            lastSubmissionAt: null,
        };
        return profile;
    }

    async broadcastNewOpportunitiesForTest(testOrId, options = {}) {
        const {
            minScore = 75,
            maxCandidates = 500,
            maxRecipients = 30,
            sendEmail = true,
        } = options;

        const test = typeof testOrId === 'object' && testOrId?._id
            ? testOrId
            : await Test.findById(testOrId);

        if (!test || !/^publish(ed)?$/i.test(String(test.status || ''))) {
            return { notified: 0, evaluated: 0 };
        }

        const [candidates, submissionsForTest] = await Promise.all([
            User.find({ role: 'candidat' })
                .select('_id firstName email skills preferredLocation preferredJobType preferredSector cvAnalysis experienceYears notificationPrefs')
                .sort({ updatedAt: -1 })
                .limit(maxCandidates)
                .lean(),
            Submission.find({ testId: test._id }).select('candidateId').lean(),
        ]);

        const alreadyApplied = new Set(submissionsForTest.map((item) => String(item.candidateId)));
        const scoredCandidates = candidates
            .filter((candidate) => !alreadyApplied.has(String(candidate._id)))
            .map((candidate) => {
                const profile = this.buildLightCandidateProfile(candidate);
                const scored = this.scoreSingleTest(test, profile);
                return { candidate, scored };
            })
            .filter(({ scored }) => scored.score >= minScore)
            .sort((a, b) => b.scored.score - a.scored.score)
            .slice(0, maxRecipients);

        if (scoredCandidates.length === 0) {
            return { notified: 0, evaluated: candidates.length };
        }

        const notifications = scoredCandidates.map(({ candidate, scored }) => ({
            userId: candidate._id,
            type: 'NEW_MATCH_RECOMMENDATION',
            category: 'matching',
            priority: scored.score >= 90 ? 'high' : 'normal',
            title: 'New opportunity for your profile',
            message: `${test.title} matches your profile (${scored.score}%)`,
            link: '/recommendations',
            actionKey: `published-test:${test._id}:${candidate._id}`,
            data: {
                testId: test._id,
                testTitle: test.title,
                score: scored.score,
                source: 'new-published-test',
            },
        }));

        await createManyAndDispatchNotifications(notifications, { dedupeWindowMinutes: 1440 });

        if (sendEmail) {
            scoredCandidates.forEach(({ candidate, scored }) => {
                notifyCandidateNewMatch(candidate._id, {
                    testTitle: test.title,
                    matchScore: scored.score,
                }).catch(() => {});
            });
        }

        return { notified: scoredCandidates.length, evaluated: candidates.length };
    }
}

module.exports = new SkillBasedRecommender();
