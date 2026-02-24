import { api } from "./axios";

export const createFileMeta = async (payload: {
    fileName: string;
    size: number;
    mimeType: string;
    owner: string;
    roomId: string;
}) => {
    const { data } = await api.post("/files", payload);
    return data;
};

export const deleteFileMeta = async (fileId: string) => {
    const { data } = await api.delete(`/files/${fileId}`);
    return data;
};

export const getFilesMeta = async (roomId: string, page = 1, limit = 10) => {
    const { data } = await api.get(`/files/room/${roomId}?page=${page}&limit=${limit}`);
    return data;
}
