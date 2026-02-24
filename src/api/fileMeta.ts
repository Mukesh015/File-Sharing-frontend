import { api } from "./axios";

export const createFileMeta = async (payload: {
    id: string;
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