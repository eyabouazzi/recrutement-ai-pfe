import axiosClient from "../utils/axiosClient";
export async function uploadFile(AvatarFile) {
    try {

        const formData = new FormData();
        formData.append('file', AvatarFile);

        const uploadRes = await axiosClient.post('/file/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return uploadRes.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error uploading file');
    }
}