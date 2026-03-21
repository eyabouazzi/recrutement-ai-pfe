import axiosClient from "../utils/axiosClient";
import { format } from 'date-fns';
export async function createUser(values, AvatarFilename) {
    try {
        const payload = {
            ...values,
            dob: values.dob ? format(values.dob.toDate(), 'yyyy-MM-dd') : undefined,
            avatar: AvatarFilename
        }
        const response = await axiosClient.post('/user/', payload);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error creating user');
    }
}



export async function listUsers() {
    try {
        const response = await axiosClient.get('/user/');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error listing users');
    }
}

export async function updateUser(id, values, AvatarFilename) {
    try {
        const payload = {
            ...values,
            dob: values.dob ? format(values.dob.toDate(), 'yyyy-MM-dd') : undefined,
            avatar: AvatarFilename
        }
        const response = await axiosClient.patch(`/user/${id}`, payload);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error updating user');
    }
}

export async function getUser(id) {
    try {
        const response = await axiosClient.get(`/user/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error fetching user');
    }
}
