import axios from "axios";

export const uploadFileToServer = async (
    file: File, uid: string
): Promise<{ url: string; data: string, storedName: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URI}/v1/user/assets/${uid}`,
            formData,
            {
                withCredentials: true
            }
        );

        const result = response.data;
        console.log(result)

        return {
            url: result?.url || '',
            data: result?.message || '',
            storedName: result?.storedName
        };
    } catch (error: any) {
        console.error('Upload error:', error);
        throw new Error(error.message || 'Something went wrong during upload');
    }
};
export const deleteFile = async (
    data: any
): Promise<{ url: string; data: string }> => {

    try {
        const response = await axios.delete(
            `${process.env.NEXT_PUBLIC_API_URI}/v1/user/assets/delete`,
            {
                data: { storedName: data },
                withCredentials: true
            }
        );

        const result = response.data;
        console.log(result)

        return {
            url: result?.url || '',
            data: result?.message || '',
        };
    } catch (error: any) {
        console.error('Upload error:', error);
        throw new Error(error.message || 'Something went wrong during upload');
    }
};
