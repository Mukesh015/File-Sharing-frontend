export interface User {
    socketId: string;
    userName: string;
}

export interface ChatMessage {
    id?: string;
    sender: string;
    message: string;
    createdAt?: string;   // ISO string
    type?: "user" | "system";

    replyTo?: {
        id?: string;
        sender: string;
        message: string;
    };
}

export interface FileMeta {
    type: "file-meta";
    fileId: string;
    fileName: string;
    size: number;
    mimeType: string;
    owner: string;
    createdAt?: string;
}

export type DataMessage =
    | {
        type: "chat";
        sender: string;
        message: string;
    }
    | {
        type: "system";
        message: string;
    }
    | FileMeta
    | {
        type: "file-request";
        fileId: string;
        sender: string;
    }
    | {
        type: "file-start";
        fileId: string;
    }
    | {
        type: "file-complete";
        fileId: string;
    };


export interface FileItem {
    id: string;
    file: File;
    originalSize: number;
    compressedSize: number;
    progress: number;
    estimatedTime: string;
    owner: string;
}