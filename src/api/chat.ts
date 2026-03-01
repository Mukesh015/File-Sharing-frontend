import { api } from "./axios";

export const initiateMessage = async (roomId: string, sender: string, message: string, replyToId?: string, mentions?: string[]) => {
    const { data } = await api.post("/chats", {
        roomId,
        sender,
        message,
        replyToId,
        mentions
    });
    return data;
};

export const getChatMessages = async (roomId: string, page = 1, limit = 20) => {
    const { data } = await api.get(`/chats/${roomId}?page=${page}&limit=${limit}`);
    return data;
};