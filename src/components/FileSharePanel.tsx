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
    History,
    ArrowDown,
    ChevronDown,
    Expand,
    Minimize,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { getFilesMeta } from "../api/fileMeta";
import { useParams } from "react-router-dom";
import { renderFileIcon } from "./getFileType";
import InfoTooltip from "./InfoTooltip";
import { formatBytes, formatETA } from "../utils/formatBytes.ts";

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
    createdAt?: string;
}

interface Props {
    onFileReady: (file: File) => Promise<FileMeta>;
    availableFiles: FileMeta[];
    onDownload: (file: FileMeta) => void;
    onCancelDownload: (file: FileMeta) => void;
    downloadProgress: Record<string, number>;
    mySocketId: string;
    checkIsDownloaded: (fileId: string) => boolean;
    checkIsDownloading: (fileId: string) => boolean;
    isOpen: boolean;
    onOpenFilePanel: () => void;
    fullscreen: boolean;
    onToggleFullscreen: () => void;
    transferStats: {
        [fileId: string]: {
            received: number;
            speed: number;
            eta: number;
        };
    };
}

/* ================================
   CONSTANTS
================================ */

const MAX_FILE_SIZE = 1000 * 1024 * 1024;
const ALLOWED_TYPES = [
    "image/",
    "video/",
    "application/pdf",
    "application/zip",
];

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
    isOpen,
    // onOpenFilePanel,
    fullscreen,
    onToggleFullscreen,
    transferStats
}: Props) => {
    const { roomId } = useParams<{ roomId: string }>();

    const inputRef = useRef<HTMLInputElement | null>(null);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [previousFiles, setPreviousFiles] = useState<FileMeta[]>([]);
    const [showPreviousFiles, setShowingPreviousFiles] = useState(false);
    const [, setIsLoading] = useState(false);

    const getPreviousFiles = async (roomId: string) => {
        try {
            setIsLoading(true);
            const data = await getFilesMeta(roomId);
            setPreviousFiles(data.files || []);
        } catch (err) {
            console.error("Failed to fetch previous files:", err);
        } finally {
            setIsLoading(false);
        }
    }


    const validateFile = (file: File) => {
        const isValidType = ALLOWED_TYPES.some((type) =>
            file.type.startsWith(type)
        );

        if (!isValidType) return "File type not supported";
        if (file.size > MAX_FILE_SIZE)
            return "File too large (Max 1GB)";
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

            try {
                // 🔥 Wait for backend to generate real ID
                const savedFile = await onFileReady(compressedFile);

                // savedFile MUST return backend response now

                newFiles.push({
                    id: savedFile.fileId, // ✅ real backend ID
                    file: compressedFile,
                    originalSize,
                    compressedSize,
                    progress: 0,
                    estimatedTime: formatETA(compressedSize),
                    owner: mySocketId,
                });

            } catch (err) {
                console.error("Upload failed:", err);
            }
        }

        setFiles(prev => [...prev, ...newFiles]);
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

    const peerFiles = availableFiles.filter(
        (file) => file.owner !== mySocketId
    );

    /* ================================
       UI
    ================================ */

    useEffect(() => {
        if (roomId) {
            getPreviousFiles(roomId);
        }
    }, [roomId]);

    return (
        <div className={`flex flex-col overflow-hidden flex-1 bg-linear-to-br from-slate-900 via-black to-slate text-white p-5 rounded-2xl transition-all duration-300 border border-white/10 ${fullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : "h-full"} ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
            {/* HEADER */}
            <div className="flex items-center justify-between w-full mb-5">
                <div className="flex items-center gap-3">
                    <Share2 className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-lg font-semibold text-indigo-400">
                        File Sharing
                    </h2>
                </div>
                <button onClick={onToggleFullscreen} className="icon-button flex justify-center items-center">
                    {fullscreen ? (<Minimize className="w-4 h-4 text-gray-400 hover:text-white transition" />) : (<Expand className="w-4 h-4 text-gray-400 hover:text-white transition" />)}
                </button>
            </div>

            {/* ================================
          YOUR UPLOADS
      ================================= */}
            {files.length > 0 && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between w-full">
                        <h3 className="text-sm font-semibold text-gray-400">
                            <LucideUpload className="w-4 h-4 inline mr-2" />
                            Uploaded by You
                        </h3>
                        <ArrowDown className="w-3 h-3 text-gray-400 inline ml-1" />
                    </div>

                    {files.map((fileItem) => (
                        <div
                            key={fileItem.id}
                            className="relative mb-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3 backdrop-blur-sm"
                        >
                            <div className="absolute left-0 top-0 h-full w-0.75 bg-indigo-500/60 rounded-l-xl" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    {renderFileIcon(fileItem.file.type, 20, "shrink-0")}
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
                        const stats = transferStats[file.fileId];
                        const progress =
                            downloadProgress[file.fileId];

                        const isDownloaded =
                            checkIsDownloaded(file.fileId);
                        const isDownloading =
                            checkIsDownloading(file.fileId);

                        return (
                            <div
                                key={file.fileId}
                                className={`relative mb-3 rounded-lg p-3 flex items-center justify-between overflow-hidden backdrop-blur-sm transition
                                    ${isDownloaded
                                        ? "bg-green-500/5 border border-green-500/20"
                                        : isDownloading
                                            ? "bg-slate-800/50 border border-indigo-500/40 ring-1 ring-indigo-500/30"
                                            : "bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60"
                                    }`}
                            >
                                {/* FILE INFO */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">

                                    {/* top row */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        {renderFileIcon(file.mimeType, 20, "shrink-0")}

                                        <span className="text-sm truncate">
                                            {file.fileName}
                                        </span>

                                        <Dot className="w-1 h-1 bg-gray-400 rounded-full shrink-0" />

                                        <span className="text-xs text-gray-400 shrink-0">
                                            {formatBytes(file.size)}
                                        </span>
                                    </div>

                                    {/* speed text → moves below on mobile */}
                                    {stats && (!isDownloaded || isDownloading) && (
                                        <p className="text-xs text-gray-400 sm:ml-3">
                                            {formatBytes(stats.speed)}/s (ETA - {formatETA(stats.eta)}) •{" "}
                                            {formatBytes(stats.received)} / {formatBytes(file.size)} downloaded
                                        </p>
                                    )}

                                </div>

                                {/* ACTIONS */}
                                <div className="flex items-center gap-3 ml-3">
                                    <button
                                        disabled={
                                            isDownloaded || isDownloading
                                        }
                                        onClick={() => {

                                            onDownload(file)
                                        }}
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
                                    <div className="absolute bottom-0 left-0 w-full">

                                        {/* progress bar */}
                                        <div className="w-full h-1 bg-black/20">
                                            <div
                                                className="h-full bg-indigo-500 transition-all duration-200"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
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

            {previousFiles && previousFiles?.length > 0 && (<div className="flex flex-col mt-5 gap-3">
                <div className="flex w-full justify-between items-center">
                    <h4 className="text-sm font-semibold flex items-center  text-white">
                        <History className="w-4 h-4 inline mr-2" />
                        Previously Shared Files
                        <InfoTooltip text="These are files that were previously shared and are not available for download. You can ask for them to be re-shared." />
                    </h4>
                    <button onClick={() => setShowingPreviousFiles((v) => !v)} className={`flex items-center gap-1 text-md text-gray-400 hover:text-white transition-transform duration-300 ${showPreviousFiles ? "rotate-180" : ""
                        }`}>
                        <ChevronDown className="h-4 w-4 text-gray-400 inline" />
                    </button>
                </div>
                <div className={showPreviousFiles ? "block" : "hidden"}>
                    {previousFiles.map((file) => (
                        <div
                            key={file.fileId}
                            className="flex items-center justify-between mb-2 gap-3 bg-white/5 border border-white/10 rounded-lg p-3"
                        >
                            {/* LEFT → icon + filename */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                {/* <File className="w-4 h-4 text-gray-400 shrink-0" /> */}
                                {renderFileIcon(file.mimeType, 20, "shrink-0")}
                                <span className="text-sm text-gray-400 truncate">
                                    {file.fileName}
                                </span>
                            </div>

                            {/* RIGHT → size + owner + date */}
                            <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0 whitespace-nowrap">
                                <span>
                                    {(file.size / 1024 / 1024).toFixed(2)}MB
                                </span>

                                <Dot className="w-1 h-1 bg-gray-400 rounded-full" />

                                <span className="truncate max-w-17.5 sm:max-w-30">
                                    {file.owner}
                                </span>

                                <Dot className="w-1 h-1 bg-gray-400 rounded-full" />

                                <span>
                                    {new Date(file.createdAt || new Date()).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>)}

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
        </div >
    );
};

export default FileSharePanel;