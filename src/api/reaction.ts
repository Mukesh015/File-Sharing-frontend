import { api } from "./axios";

export const reactMessage = async (reactionKey: string, sender: string, messageId: string, roomId: string) => {
    const { data } = await api.post("/reactions/toggle", {
        reactionKey: reactionKey,
        user: sender,
        messageId: messageId,
        roomId: roomId
    });
    return data;
};

export const clearMessageReaction = async (messageId: string, sender: string, roomId: string) => {
    const { data } = await api.post("/reactions/clear", {
        user: sender,
        messageId: messageId,
        roomId: roomId
    });
    return data;
};

export const getReactionsByMessageId = async (messageId: string, page = 1, limit = 20) => {
    const { data } = await api.get(`/reactions/${messageId}?page=${page}&limit=${limit}`);
    return data;
};