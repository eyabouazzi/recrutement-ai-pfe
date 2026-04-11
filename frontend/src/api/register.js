import { baseUrl } from './api';
import { getStoredToken } from '../utils/authStorage';

// Finalisation du profil (Onboarding)
export const completeOnboarding = async (formData) => {
    const token = getStoredToken();
    try {
        const response = await fetch(`${baseUrl}/register/onboarding`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
};
