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

export async function getTestById(id) {
    try {
        const response = await axiosClient.get(`/test/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch test details');
    }
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
