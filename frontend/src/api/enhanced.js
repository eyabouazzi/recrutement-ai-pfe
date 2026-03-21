import axiosClient from "../utils/axiosClient";

// Enhanced Tests API with full database integration
export async function getActiveTests() {
    try {
        const response = await axiosClient.get('/test/');
        return {
            tests: (response.data.tests || []).filter(test => test.status === 'active'),
            total: response.data.tests?.length || 0
        };
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch active tests');
    }
}

export async function getTestsWithAnalytics() {
    try {
        const [testsResponse, submissionsResponse] = await Promise.all([
            axiosClient.get('/test/'),
            axiosClient.get('/submission/all')
        ]);

        const tests = testsResponse.data.tests || [];
        const submissions = submissionsResponse.data.submissions || [];

        const testsWithAnalytics = tests.map(test => {
            const testSubmissions = submissions.filter(sub => 
                sub.testId?._id === test._id || sub.testId === test._id
            );
            
            return {
                ...test,
                analytics: {
                    totalSubmissions: testSubmissions.length,
                    avgScore: testSubmissions.length > 0 
                        ? Math.round(testSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / testSubmissions.length)
                        : 0,
                    completionRate: test.questions?.length > 0
                        ? Math.round((testSubmissions.length / test.questions.length) * 100)
                        : 0,
                    highScores: testSubmissions.filter(sub => sub.score >= 80).length,
                    lowScores: testSubmissions.filter(sub => sub.score < 50).length
                }
            };
        });

        return testsWithAnalytics;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch tests with analytics');
    }
}

export async function createTestWithQuestions(testData) {
    try {
        // First create the test
        const testResponse = await axiosClient.post('/test/create', testData);
        const test = testResponse.data.test;
        
        // If auto-generate questions is requested
        if (testData.autoGenerate && testData.jobDescription) {
            await axiosClient.post('/test/generate-questions', {
                testId: test._id,
                jobDescription: testData.jobDescription,
                numberOfQuestions: testData.numberOfQuestions || 10
            });
        }
        
        return test;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create test');
    }
}

// Enhanced Submissions API
export async function getSubmissionsWithDetails(filters = {}) {
    try {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined) {
                params.append(key, filters[key]);
            }
        });

        const [submissionsResponse, testsResponse, usersResponse] = await Promise.all([
            axiosClient.get(`/submission/all?${params.toString()}`),
            axiosClient.get('/test/'),
            axiosClient.get('/user/')
        ]);

        const submissions = submissionsResponse.data.submissions || [];
        const tests = testsResponse.data.tests || [];
        const users = usersResponse.data.users || [];

        const enrichedSubmissions = submissions.map(submission => {
            const test = tests.find(t => t._id === submission.testId?._id || t._id === submission.testId);
            const candidate = users.find(u => u._id === submission.candidateId?._id || u._id === submission.candidateId);
            
            return {
                ...submission,
                testTitle: test?.title || 'Test inconnu',
                testName: test?.name || 'N/A',
                candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidat anonyme',
                candidateEmail: candidate?.email || 'N/A',
                testDifficulty: test?.difficulty || 'Moyen',
                daysSinceSubmission: Math.floor((new Date() - new Date(submission.createdAt)) / (1000 * 60 * 60 * 24))
            };
        });

        return enrichedSubmissions;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch submissions with details');
    }
}

export async function updateSubmissionWithNotes(id, updates) {
    try {
        const response = await axiosClient.put(`/submission/${id}`, updates);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update submission');
    }
}

// Enhanced Users API
export async function getUsersWithStats(role = null) {
    try {
        const params = role ? `?role=${role}` : '';
        const [usersResponse, submissionsResponse, testsResponse] = await Promise.all([
            axiosClient.get(`/user/${params}`),
            axiosClient.get('/submission/all'),
            axiosClient.get('/test/')
        ]);

        const users = usersResponse.data.users || [];
        const submissions = submissionsResponse.data.submissions || [];
        const tests = testsResponse.data.tests || [];

        const usersWithStats = users.map(user => {
            const userSubmissions = submissions.filter(sub => 
                sub.candidateId?._id === user._id || sub.candidateId === user._id
            );
            
            const avgScore = userSubmissions.length > 0 
                ? Math.round(userSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / userSubmissions.length)
                : 0;
            
            const completedTests = userSubmissions.length;
            const bestScore = userSubmissions.length > 0 
                ? Math.max(...userSubmissions.map(sub => sub.score || 0))
                : 0;

            return {
                ...user,
                stats: {
                    completedTests,
                    avgScore,
                    bestScore,
                    testsTaken: userSubmissions.map(sub => {
                        const test = tests.find(t => t._id === sub.testId?._id || t._id === sub.testId);
                        return {
                            testName: test?.title || 'Test inconnu',
                            score: sub.score,
                            date: sub.createdAt
                        };
                    })
                }
            };
        });

        return usersWithStats;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch users with stats');
    }
}

export async function searchUsers(query, filters = {}) {
    try {
        const params = new URLSearchParams({
            search: query,
            ...filters
        });
        
        const response = await axiosClient.get(`/user/search?${params.toString()}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to search users');
    }
}

// Batch operations
export async function batchUpdateUsers(updates) {
    try {
        const response = await axiosClient.post('/user/batch-update', { updates });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to batch update users');
    }
}

export async function batchDeleteSubmissions(ids) {
    try {
        const response = await axiosClient.post('/submission/batch-delete', { ids });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to batch delete submissions');
    }
}

// Reporting and analytics
export async function generateReport(reportType, filters = {}) {
    try {
        const response = await axiosClient.post('/reports/generate', {
            type: reportType,
            filters
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to generate report');
    }
}

export async function exportData(exportType, format = 'csv', filters = {}) {
    try {
        const response = await axiosClient.post('/exports/data', {
            type: exportType,
            format,
            filters
        }, {
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `export_${exportType}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        return { success: true };
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to export data');
    }
}