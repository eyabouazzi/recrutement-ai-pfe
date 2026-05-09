const skillRecommender = require('../utils/skillRecommender');

describe('skill recommender', () => {
    it('detects aliased and punctuated skills from text', () => {
        const skills = skillRecommender.extractSkillsFromText(
            'Senior engineer with Node.js, Vue, C# and Google Cloud Platform experience.'
        );

        expect(skills).toEqual(expect.arrayContaining(['nodejs', 'vue.js', 'c#', 'gcp']));
    });

    it('does not add low-score tested skills as candidate skills', () => {
        const profile = skillRecommender.buildUserProfile(
            {
                skills: [],
                cvAnalysis: { detectedSkills: [] },
                experienceYears: 1,
                preferredJobType: '',
                preferredLocation: '',
            },
            [{
                totalScore: 24,
                testId: {
                    title: 'Backend Challenge',
                    jobRole: 'Backend Developer',
                    description: 'Node.js Express PostgreSQL REST API',
                    evaluationCriteria: 'Node.js architecture and API quality',
                },
                createdAt: new Date('2026-01-10T00:00:00.000Z'),
            }]
        );

        expect(profile.skills).not.toContain('nodejs');
        expect(profile.skills).not.toContain('express');
        expect(profile.skills).not.toContain('postgresql');
    });

    it('can infer a skill from strong assessment evidence', () => {
        const profile = skillRecommender.buildUserProfile(
            {
                skills: [],
                cvAnalysis: { detectedSkills: [] },
                experienceYears: 2,
                preferredJobType: '',
                preferredLocation: '',
            },
            [{
                totalScore: 88,
                testId: {
                    title: 'Cloud Platform Test',
                    jobRole: 'DevOps Engineer',
                    description: 'AWS Docker Kubernetes Terraform',
                    evaluationCriteria: 'Hands-on Kubernetes and AWS operations',
                },
                createdAt: new Date('2026-01-10T00:00:00.000Z'),
            }]
        );

        expect(profile.skills).toEqual(expect.arrayContaining(['aws', 'kubernetes', 'docker']));
    });

    it('uses evaluation criteria text in test scoring', () => {
        const scored = skillRecommender.scoreSingleTest(
            {
                _id: 'test-1',
                title: 'Platform Engineer',
                jobRole: 'Infrastructure Engineer',
                description: 'General infrastructure role',
                evaluationCriteria: 'Terraform Kubernetes AWS',
                location: 'Remote',
                employmentType: 'Full-time',
            },
            {
                skills: ['terraform', 'aws'],
                skillProficiency: { terraform: 90, aws: 85 },
                experienceLevel: 'Senior',
                preferredLocations: ['remote'],
                preferredJobTypes: ['full-time'],
                activitySignals: { totalSubmissions: 2, averageScore: 82, lastSubmissionAt: new Date() },
                remotePreference: true,
            }
        );

        expect(scored.matchedSkills).toEqual(expect.arrayContaining(['terraform', 'aws']));
        expect(scored.missingSkills).toContain('kubernetes');
        expect(scored.score).toBeGreaterThan(0);
    });

    it('penalizes missing hard requirements much more aggressively', () => {
        const strongProfile = {
            skills: ['react', 'typescript', 'nodejs', 'docker', 'aws'],
            skillProficiency: { react: 90, typescript: 88, nodejs: 84, docker: 78, aws: 82 },
            experienceLevel: 'Senior',
            preferredLocations: ['remote'],
            preferredJobTypes: ['full-time'],
            activitySignals: { totalSubmissions: 3, averageScore: 84, lastSubmissionAt: new Date() },
            remotePreference: true,
        };

        const weakProfile = {
            ...strongProfile,
            skills: ['react', 'typescript'],
            skillProficiency: { react: 90, typescript: 88 },
        };

        const test = {
            _id: 'test-2',
            title: 'Cloud Platform Engineer',
            jobRole: 'Senior DevOps Engineer',
            description: 'Remote full-time role for platform ownership',
            evaluationCriteria: 'Must have AWS, Docker and Kubernetes. Strong Terraform experience required.',
            location: 'Remote',
            employmentType: 'Full-time',
        };

        const strongScore = skillRecommender.scoreSingleTest(test, strongProfile);
        const weakScore = skillRecommender.scoreSingleTest(test, weakProfile);

        expect(strongScore.hardRequirementSkills).toEqual(expect.arrayContaining(['aws', 'docker', 'kubernetes', 'terraform']));
        expect(weakScore.missingHardRequirements).toEqual(expect.arrayContaining(['aws', 'docker', 'kubernetes', 'terraform']));
        expect(weakScore.score).toBeLessThan(strongScore.score);
        expect(weakScore.category).toBe('EXPLORATION');
    });
});
