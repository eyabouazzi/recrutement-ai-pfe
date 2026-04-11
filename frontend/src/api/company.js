import { baseUrl } from "./api";

// 1. Liste publique d'entreprises
export const getCompanies = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.sector) queryParams.append('sector', params.sector);
        if (params.size) queryParams.append('size', params.size);
        if (params.sort) queryParams.append('sort', params.sort);
        if (params.featured !== undefined) queryParams.append('featured', String(params.featured));
        if (params.city) queryParams.append('city', params.city);

        const response = await fetch(`${baseUrl}/companies?${queryParams.toString()}`);
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

// 2. Détail d'une entreprise (publique)
export const getCompanyById = async (id) => {
    try {
        const response = await fetch(`${baseUrl}/companies/${id}`);
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

// 3. Création compte entreprise (Registration)
export const createCompany = async (formData) => {
    try {
        const response = await fetch(`${baseUrl}/companies`, {
            method: 'POST',
            body: formData, // FormData contains file
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

// 4. Liste publique des recruteurs
export const getRecruiters = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.sector) queryParams.append('sector', params.sector);
        
        const response = await fetch(`${baseUrl}/companies/recruiters?${queryParams.toString()}`);
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

// 5. Profil détaillé d'un recruteur
export const getRecruiterById = async (id) => {
    try {
        const response = await fetch(`${baseUrl}/companies/recruiters/${id}`);
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}
