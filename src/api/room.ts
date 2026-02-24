import { api } from "./axios";

export const createRoom = async (roomId: string) => {
    const { data } = await api.post("/rooms", { roomId });
    return data;
};

export const getRoom = async (roomId: string) => {
    const { data } = await api.get(`/rooms/${roomId}`);
    return data;
};

export const deleteRoom = async (roomId: string) => {
    const { data } = await api.delete(`/rooms/${roomId}`);
    return data;
};

export const getAllRooms = async () => {
    const { data } = await api.get("/rooms");
    return data;
};