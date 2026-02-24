import {
    UploadCloud,
    File,
    X,
    Download,
    Dot,
    Share2,
    FolderDown,
    LucideUpload,
    Check,
} from "lucide-react";
import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";

/* ================================
   TYPES
================================ */

interface FileItem {
    id: string;
    file: File;
    originalSize: number;
    compressedSize: number;
    progress: number;
    estimatedTime: string;
    owner: string;
}

interface FileMeta {
    type: "file-meta";
    fileId: string;
    fileName: string;
    size: number;
    mimeType: string;
    owner: string;
}

interface Props {
    onFileReady: (file: File) => void;
    availableFiles: FileMeta[];
    onDownload: (file: FileMeta) => void;
    onCancelDownload: (file: FileMeta) => void;
    downloadProgress: Record<string, number>;
    mySocketId: string;
    checkIsDownloaded: (fileId: string) => boolean;
    checkIsDownloading: (fileId: string) => boolean;
}

/* ================================
   CONSTANTS
================================ */

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = [
    "image/",
    "video/",
    "application/pdf",
    "application/zip",
];
const ESTIMATED_SPEED_MBPS = 10;

/* ================================
   COMPONENT
================================ */

const FileSharePanel = ({
    onFileReady,
    availableFiles,
    onDownload,
    onCancelDownload,
    downloadProgress,
    mySocketId,
    checkIsDownloaded,
    checkIsDownloading,
}: Props) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [files, setFiles] = useState<FileItem[]>([]);

    /* ================================
       HELPERS
    ================================ */

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +
            " " +
            sizes[i]
        );
    };

    const estimateTime = (fileSize: number) => {
        const speedBytesPerSec =
            (ESTIMATED_SPEED_MBPS * 1024 * 1024) / 8;
        const seconds = fileSize / speedBytesPerSec;

        if (seconds < 60) return `${seconds.toFixed(1)} sec`;
        if (seconds < 3600)
            return `${(seconds / 60).toFixed(1)} min`;
        return `${(seconds / 3600).toFixed(1)} hr`;
    };

    const validateFile = (file: File) => {
        const isValidType = ALLOWED_TYPES.some((type) =>
            file.type.startsWith(type)
        );

        if (!isValidType) return "File type not supported";
        if (file.size > MAX_FILE_SIZE)
            return "File too large (Max 100MB)";
        return null;
    };

    const compressImage = async (file: File) => {
        if (!file.type.startsWith("image/")) return file;

        return await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        });
    };

    /* ================================
       FILE HANDLING
    ================================ */

    const handleFiles = async (fileList: FileList) => {
        const newFiles: FileItem[] = [];

        for (let file of Array.from(fileList)) {
            const error = validateFile(file);
            if (error) {
                alert(error);
                continue;
            }

            const originalSize = file.size;
            const compressedFile = await compressImage(file);
            const compressedSize = compressedFile.size;

            newFiles.push({
                id: crypto.randomUUID(),
                file: compressedFile,
                originalSize,
                compressedSize,
                progress: 0,
                estimatedTime: estimateTime(compressedSize),
                owner: mySocketId,
            });

            onFileReady(compressedFile);
        }

        setFiles((prev) => [...prev, ...newFiles]);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    const handleBrowse = () => {
        inputRef.current?.click();
    };

    const removeFile = (id: string) => {
        setFiles((prev) =>
            prev.filter((f) => f.id !== id)
        );
    };

    /* ================================
       DERIVED DATA
    ================================ */

    const peerFiles = availableFiles.filter(
        (file) => file.owner !== mySocketId
    );

    /* ================================
       UI
    ================================ */

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Share2 className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-lg font-semibold text-indigo-400">
                        File Sharing
                    </h2>
                </div>
                <span className="text-xs text-indigo-400">
                    Send files to connected peers
                </span>
            </div>

            {/* ================================
          YOUR UPLOADS
      ================================= */}
            {files.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-gray-400">
                        <LucideUpload className="w-4 h-4 inline mr-2" />
                        Uploaded by You
                    </h3>

                    {files.map((fileItem) => (
                        <div
                            key={fileItem.id}
                            className="relative bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3 backdrop-blur-sm"
                        >
                            <div className="absolute left-0 top-0 h-full w-[3px] bg-indigo-500/60 rounded-l-xl" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <File className="w-5 h-5 text-indigo-400 shrink-0" />
                                    <span className="text-sm font-medium truncate">
                                        {fileItem.file.name}
                                    </span>
                                </div>

                                <button
                                    onClick={() => removeFile(fileItem.id)}
                                    className="icon-button cancel-btn"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {fileItem.originalSize !==
                                fileItem.compressedSize && (
                                    <span className="text-xs text-green-400 mt-1 block">
                                        Compressed from{" "}
                                        {formatBytes(fileItem.originalSize)}
                                    </span>
                                )}
                        </div>
                    ))}
                </div>
            )}

            {/* ================================
          PEER FILES
      ================================= */}
            {peerFiles.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-gray-400">
                        <FolderDown className="w-4 h-4 inline mr-2" />
                        Available from Peers
                    </h3>

                    {peerFiles.map((file) => {
                        const progress =
                            downloadProgress[file.fileId];

                        const isDownloaded =
                            checkIsDownloaded(file.fileId);
                        const isDownloading =
                            checkIsDownloading(file.fileId);

                        return (
                            <div
                                key={file.fileId}
                                className={`relative rounded-lg p-3 flex items-center justify-between overflow-hidden backdrop-blur-sm transition
                                    ${isDownloaded
                                        ? "bg-green-500/5 border border-green-500/20"
                                        : isDownloading
                                            ? "bg-slate-800/50 border border-indigo-500/40 ring-1 ring-indigo-500/30"
                                            : "bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60"
                                    }`}
                            >
                                {/* FILE INFO */}
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <File className="w-4 h-4 text-white shrink-0" />

                                    <span className="text-sm truncate">
                                        {file.fileName}
                                    </span>

                                    <Dot className="w-1 h-1 bg-gray-400 rounded-full shrink-0" />

                                    <span className="text-xs text-gray-400 shrink-0">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>

                                {/* ACTIONS */}
                                <div className="flex items-center gap-3 ml-3">
                                    <button
                                        disabled={
                                            isDownloaded || isDownloading
                                        }
                                        onClick={() =>
                                            onDownload(file)
                                        }
                                        className="icon-button download-btn"
                                    >
                                        {isDownloaded ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Download className="w-4 h-4" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() =>
                                            onCancelDownload(file)
                                        }
                                        className="icon-button cancel-btn"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* PROGRESS BAR */}
                                {progress !== undefined && (
                                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-black/20">
                                        <div
                                            className="h-full bg-indigo-500 transition-all duration-200"
                                            style={{
                                                width: `${progress}%`,
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ================================
          DROP ZONE
      ================================= */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) =>
                    e.preventDefault()
                }
                onClick={handleBrowse}
                className="border-2 border-dashed border-white/20 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-indigo-500 transition cursor-pointer"
            >
                <UploadCloud className="w-12 h-12 text-indigo-400 mb-4" />
                <h3 className="text-md font-semibold mb-1">
                    Drag & Drop Files Here
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                    or click to browse from your device
                </p>
                <button
                    type="button"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-xl transition"
                >
                    <File className="w-4 h-4" />
                    Select File
                </button>
            </div>

            <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                    if (e.target.files) {
                        handleFiles(e.target.files);
                        e.target.value = "";
                    }
                }}
            />
        </div>
    );
};

export default FileSharePanel;