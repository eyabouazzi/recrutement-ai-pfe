const Recommendation = require('../models/recommendation.model');
const Test = require('../models/test.model');
const Submission = require('../models/submission.model');
const User = require('../models/user.model');

class SkillBasedRecommender {
    constructor() {
        this.SKILL_WEIGHTS = {
            'javascript': 1.0,
            'react': 0.9,
            'nodejs': 0.8,
            'python': 0.8,
            'java': 0.7,
            'sql': 0.6,
            'mongodb': 0.7,
            'docker': 0.6,
            'aws': 0.6,
            'typescript': 0.8
        };
        
        this.EXPERIENCE_MAPPING = {
            'Junior': ['débutant', 'junior', 'entry', 'débutant'],
            'Mid-level': ['intermédiaire', 'mid', 'expérience'],
            'Senior': ['senior', 'expérimenté', 'confirmé'],
            'Expert': ['expert', 'lead', 'principal']
        };
    }

    async generateRecommendations(userId) {
        try {
            // Get user profile and submission history
            const [user, submissions, existingRec] = await Promise.all([
                User.findById(userId),
                Submission.find({ candidateId: userId }).populate('testId'),
                Recommendation.findOne({ userId })
            ]);

            if (!user) {
                throw new Error('User not found');
            }

            // Build user profile
            const userProfile = await this.buildUserProfile(user, submissions);
            
            // Get all active tests
            const activeTests = await Test.find({ 
                status: 'PUBLISHED',
                _id: { $nin: submissions.map(s => s.testId._id) }
            });

            // Score each test
            const recommendations = await this.scoreTests(activeTests, userProfile);

            // Save recommendations
            const recommendationDoc = existingRec || new Recommendation({ userId });
            recommendationDoc.recommendedTests = recommendations;
            recommendationDoc.userProfile = userProfile;
            recommendationDoc.lastUpdated = new Date();
            
            await recommendationDoc.save();
            
            return recommendations;
        } catch (error) {
            console.error('Error generating recommendations:', error);
            throw error;
        }
    }

    async buildUserProfile(user, submissions) {
        const profile = {
            skills: [],
            experienceLevel: 'Junior',
            preferredLocations: [],
            preferredJobTypes: [],
            salaryExpectations: { min: 0, max: 100000 }
        };

        // Extract skills from submission history
        const skillsFromSubmissions = [];
        submissions.forEach(sub => {
            if (sub.testId.jobRole) {
                const jobSkills = this.extractSkillsFromJobRole(sub.testId.jobRole);
                skillsFromSubmissions.push(...jobSkills);
            }
        });

        profile.skills = [...new Set(skillsFromSubmissions)];

        // Determine experience level based on submissions and scores
        if (submissions.length > 0) {
            const avgScore = submissions.reduce((sum, sub) => sum + sub.totalScore, 0) / submissions.length;
            const testCount = submissions.length;
            
            if (avgScore >= 80 && testCount >= 5) {
                profile.experienceLevel = 'Expert';
            } else if (avgScore >= 70 && testCount >= 3) {
                profile.experienceLevel = 'Senior';
            } else if (avgScore >= 60 && testCount >= 2) {
                profile.experienceLevel = 'Mid-level';
            }
        }

        return profile;
    }

    extractSkillsFromJobRole(jobRole) {
        const role = jobRole.toLowerCase();
        const skills = [];
        
        Object.keys(this.SKILL_WEIGHTS).forEach(skill => {
            if (role.includes(skill)) {
                skills.push(skill);
            }
        });
        
        return skills;
    }

    async scoreTests(tests, userProfile) {
        const scoredTests = [];

        for (const test of tests) {
            const score = this.calculateTestScore(test, userProfile);
            const matchedSkills = this.findMatchedSkills(test, userProfile);
            
            scoredTests.push({
                testId: test._id,
                score,
                reason: this.generateRecommendationReason(score, matchedSkills, userProfile),
                matchedSkills
            });
        }

        // Sort by score descending
        return scoredTests
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Top 10 recommendations
    }

    calculateTestScore(test, userProfile) {
        let totalScore = 0;
        let weightSum = 0;

        // Skill matching score (60% weight)
        const skillScore = this.calculateSkillScore(test, userProfile);
        totalScore += skillScore * 0.6;
        weightSum += 0.6;

        // Experience level matching (20% weight)
        const experienceScore = this.calculateExperienceScore(test, userProfile);
        totalScore += experienceScore * 0.2;
        weightSum += 0.2;

        // Location preference matching (10% weight)
        const locationScore = this.calculateLocationScore(test, userProfile);
        totalScore += locationScore * 0.1;
        weightSum += 0.1;

        // Job type matching (10% weight)
        const jobTypeScore = this.calculateJobTypeScore(test, userProfile);
        totalScore += jobTypeScore * 0.1;
        weightSum += 0.1;

        return Math.round((totalScore / weightSum) * 100);
    }

    calculateSkillScore(test, userProfile) {
        const testSkills = this.extractSkillsFromJobRole(test.jobRole);
        if (testSkills.length === 0) return 0.5; // Default score if no skills detected

        const matchedSkills = testSkills.filter(skill => userProfile.skills.includes(skill));
        const skillScore = matchedSkills.length / testSkills.length;
        
        // Weight important skills higher
        const weightedScore = matchedSkills.reduce((sum, skill) => {
            return sum + (this.SKILL_WEIGHTS[skill] || 0.5);
        }, 0) / testSkills.length;

        return (skillScore + weightedScore) / 2;
    }

    calculateExperienceScore(test, userProfile) {
        const testDescription = (test.description || '').toLowerCase();
        const userLevel = userProfile.experienceLevel;
        
        const levelKeywords = this.EXPERIENCE_MAPPING[userLevel] || [];
        const matches = levelKeywords.filter(keyword => testDescription.includes(keyword));
        
        return matches.length > 0 ? 1 : 0.3; // 1 for match, 0.3 for no clear indication
    }

    calculateLocationScore(test, userProfile) {
        if (!test.location || userProfile.preferredLocations.length === 0) {
            return 0.5; // Neutral score
        }
        
        return userProfile.preferredLocations.includes(test.location) ? 1 : 0.2;
    }

    calculateJobTypeScore(test, userProfile) {
        if (!test.employmentType || userProfile.preferredJobTypes.length === 0) {
            return 0.5;
        }
        
        return userProfile.preferredJobTypes.includes(test.employmentType) ? 1 : 0.3;
    }

    findMatchedSkills(test, userProfile) {
        const testSkills = this.extractSkillsFromJobRole(test.jobRole);
        return testSkills.filter(skill => userProfile.skills.includes(skill));
    }

    generateRecommendationReason(score, matchedSkills, userProfile) {
        if (score >= 80) {
            return `Fort alignement avec vos compétences en ${matchedSkills.join(', ')} et votre niveau ${userProfile.experienceLevel}`;
        } else if (score >= 60) {
            return `Bonnes opportunités pour développer vos compétences en ${matchedSkills.join(', ')}`;
        } else {
            return `Opportunité pour explorer de nouveaux domaines et progresser professionnellement`;
        }
    }

    async getRecommendationsForUser(userId) {
        const recommendation = await Recommendation.findOne({ userId })
            .populate('recommendedTests.testId')
            .sort({ lastUpdated: -1 });
        
        return recommendation ? recommendation.recommendedTests : [];
    }

    async refreshRecommendations(userId) {
        return await this.generateRecommendations(userId);
    }
}

module.exports = new SkillBasedRecommender();