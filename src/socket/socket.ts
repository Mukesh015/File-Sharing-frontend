// socket/socket.ts
import { io } from "socket.io-client";

export const socket = io("http://119.18.62.146:8000", {
    autoConnect: false,
});