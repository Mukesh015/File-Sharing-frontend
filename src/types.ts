import type { ReactionKey } from "./utils/reaction";

export interface User {
    socketId: string;
    userName: string;
}

export interface Reaction {
    id: string;
    reactionKey: ReactionKey;
    user: string;
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    sender: string;
    message: string;
    createdAt: string;   // ISO string

    type?: "user" | "system" | "chat";

    replyTo?: {
        id: string;
        sender: string;
        message: string;
    };

    reactions?: Reaction[];   // ✅ ARRAY (normalized)
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
    | ChatMessage
    | {
        type: "system";
        message: string;
        createdAt: string;
        id: string;
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
    } | {
        type: "file-cancel";
        fileId: string;
    } | {
        type: "typing";
        sender: string;
    } | {
        type: "stop-typing";
        sender: string;
    } | {
        type: "reaction-updated";
        messageId: string;
        reactionKey: ReactionKey;
        user: string;
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