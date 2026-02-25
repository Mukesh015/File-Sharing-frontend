import {
    FileImage,
    FileVideo,
    FileAudio,
    FileArchive,
    FileText,
    FileQuestion,
} from "lucide-react";

export type FileCategory =
    | "image"
    | "video"
    | "pdf"
    | "zip"
    | "audio"
    | "unknown";

export const getFileCategory = (
    mimeType?: string
): FileCategory => {
    if (!mimeType) return "unknown";

    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";

    if (mimeType === "application/pdf") return "pdf";

    if (
        mimeType === "application/zip" ||
        mimeType === "application/x-zip-compressed"
    )
        return "zip";

    return "unknown";
};

export const renderFileIcon = (
    mimeType?: string,
    size: number = 20,
    className: string = ""
) => {
    const type = getFileCategory(mimeType);

    switch (type) {
        case "image":
            return <FileImage size={size} className={`${className} text-pink-400`} />;

        case "video":
            return <FileVideo size={size} className={`${className} text-blue-400`} />;

        case "audio":
            return <FileAudio size={size} className={`${className} text-purple-400`} />;

        case "pdf":
            return <FileText size={size} className={`${className} text-red-400`} />;

        case "zip":
            return <FileArchive size={size} className={`${className} text-yellow-400`} />;

        default:
            return <FileQuestion size={size} className={`${className} text-gray-400`} />;
    }
};