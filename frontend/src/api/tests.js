import axiosClient from "../utils/axiosClient";

export async function createTest(data) {
    try {
        const response = await axiosClient.post('/test/create', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create test');
    }
}

export async function generateAutoQuestions(testId, count) {
    try {
        const response = await axiosClient.post('/test/generate-questions', { testId, count });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to generate questions');
    }
}

export async function getTests() {
    try {
        const response = await axiosClient.get('/test');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch tests');
    }
}

export async function getTestById(id, opts = {}) {
    try {
        const q = opts.invite ? `?invite=${encodeURIComponent(opts.invite)}` : '';
        const response = await axiosClient.get(`/test/${id}${q}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch test details');
    }
}

export async function regenerateQuestion(questionId, instruction) {
    try {
        const response = await axiosClient.post(`/test/question/${questionId}/regenerate`, { instruction: instruction || '' });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || error.response?.data?.message || 'Regenerate failed');
    }
}

export async function listQuestionBank() {
    const response = await axiosClient.get('/test/question-bank/list');
    return response.data;
}

export async function createQuestionBankItem(body) {
    const response = await axiosClient.post('/test/question-bank', body);
    return response.data;
}

export async function attachBankQuestion(bankId, testId) {
    const response = await axiosClient.post(`/test/question-bank/${bankId}/attach`, { testId });
    return response.data;
}

export async function deleteBankQuestion(bankId) {
    const response = await axiosClient.delete(`/test/question-bank/${bankId}`);
    return response.data;
}

export async function clearQuestionBank() {
    const response = await axiosClient.delete('/test/question-bank/clear');
    return response.data;
}

export async function markQuestionReviewed(questionId, reviewedForPublish = true) {
    const response = await axiosClient.put(`/test/question/${questionId}/review`, { reviewedForPublish });
    return response.data;
}

export async function addManualQuestion(data) {
    try {
        const response = await axiosClient.post('/test/question', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to add question');
    }
}

export async function deleteQuestion(id) {
    try {
        const response = await axiosClient.delete(`/test/question/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete question');
    }
}

export async function deleteTest(id) {
    try {
        const response = await axiosClient.delete(`/test/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete test');
    }
}

export async function updateTest(id, data) {
    try {
        const response = await axiosClient.put(`/test/${id}`, data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update test');
    }
}

export async function getPublicTests(params = {}) {
    try {
        const queryParams = new URLSearchParams();
        
        // Add pagination parameters
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        
        // Add search parameter
        if (params.search) queryParams.append('search', params.search);
        if (params.category) queryParams.append('category', params.category);
        if (params.sector) queryParams.append('sector', params.sector);
        if (params.company) queryParams.append('company', params.company);
        
        // Add filters
        if (params.employmentType && params.employmentType.length > 0) {
            params.employmentType.forEach(type => queryParams.append('employmentType', type));
        }
        
        if (params.location && params.location.length > 0) {
            params.location.forEach(loc => queryParams.append('location', loc));
        }
        
        if (params.minSalary) queryParams.append('minSalary', params.minSalary);
        if (params.maxSalary) queryParams.append('maxSalary', params.maxSalary);
        
        // Add sorting
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        
        const queryString = queryParams.toString();
        const url = `/test/public/jobs${queryString ? `?${queryString}` : ''}`;
        
        const response = await axiosClient.get(url);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch public jobs');
    }
}

export async function getPublicTestById(id) {
    try {
        const response = await axiosClient.get(`/test/public/jobs/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch public job details');
    }
}
