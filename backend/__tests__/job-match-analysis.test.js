const { buildJobMatchAnalysis } = require('../utils/jobMatchAnalysis');

describe('job match analysis', () => {
    it('scores a strong candidate highly and reports matched skills', () => {
        const analysis = buildJobMatchAnalysis({
            candidate: {
                bio: 'Frontend engineer building dashboards and product interfaces.',
                education: 'Computer Science',
                experienceYears: 5,
                skills: ['React', 'TypeScript', 'Node.js', 'SQL'],
                cvAnalysis: {
                    detectedSkills: ['React', 'TypeScript', 'Node.js', 'SQL', 'Jest'],
                    experienceLevel: 'Mid-level',
                    suggestedRoles: ['Frontend Developer', 'Full-Stack Developer'],
                },
            },
            submission: {
                applicationCvText: 'React TypeScript Node.js SQL Jest. Built frontend products and APIs over 5 years.',
            },
            test: {
                title: 'Frontend Engineer',
                jobRole: 'Senior Frontend Developer',
                description: 'Looking for React, TypeScript, Jest, CSS and API collaboration.',
                evaluationCriteria: 'Strong React architecture, testing, communication.',
            },
        });

        expect(analysis.score).toBeGreaterThanOrEqual(65);
        expect(analysis.matchedSkills).toEqual(expect.arrayContaining(['React', 'TypeScript', 'Jest']));
        expect(analysis.summary).toContain('Compétences alignées');
        expect(analysis.matchEngine?.version).toBe(2);
        expect(analysis.matchEngine?.radarAxes?.length).toBe(6);
        expect(analysis.matchEngine?.headline).toBeTruthy();
    });

    it('reports missing required skills when the profile does not cover the brief', () => {
        const analysis = buildJobMatchAnalysis({
            candidate: {
                bio: 'Junior support profile.',
                education: 'Business',
                experienceYears: 1,
                skills: ['Excel'],
                cvAnalysis: {
                    detectedSkills: ['Excel'],
                    experienceLevel: 'Junior',
                    suggestedRoles: ['Data Analyst'],
                },
            },
            submission: {
                applicationCvText: 'Excel reporting and documentation.',
            },
            test: {
                title: 'Backend Engineer',
                jobRole: 'Backend Developer',
                description: 'Requires Node.js, Express, PostgreSQL, Docker and REST API design.',
                evaluationCriteria: 'Hands-on backend architecture and API implementation.',
            },
        });

        expect(analysis.score).toBeLessThan(65);
        expect(analysis.missingSkills).toEqual(expect.arrayContaining(['Node.js', 'Express', 'PostgreSQL']));
        expect(analysis.recruiterRecommendations.length).toBeGreaterThan(0);
    });
});
