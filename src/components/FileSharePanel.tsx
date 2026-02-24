import { UploadCloud, File, X, Pause } from "lucide-react";
import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";

interface FileItem {
    id: string;
    file: File;
    originalSize: number;
    compressedSize: number;
    progress: number;
    estimatedTime: string;
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
    downloadProgress: Record<string, number>;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ["image/", "video/", "application/pdf", "application/zip"];
const ESTIMATED_SPEED_MBPS = 10; // Later replace with real speed measurement

const FileSharePanel = ({ onFileReady, availableFiles, onDownload, downloadProgress }: Props) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [files, setFiles] = useState<FileItem[]>([]);

    /* ---------------- Helpers ---------------- */

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const estimateTime = (fileSize: number) => {
        const speedBytesPerSec = (ESTIMATED_SPEED_MBPS * 1024 * 1024) / 8;
        const seconds = fileSize / speedBytesPerSec;

        if (seconds < 60) return `${seconds.toFixed(1)} sec`;
        if (seconds < 3600) return `${(seconds / 60).toFixed(1)} min`;
        return `${(seconds / 3600).toFixed(1)} hr`;
    };

    const validateFile = (file: File) => {
        const isValidType = ALLOWED_TYPES.some(type =>
            file.type.startsWith(type)
        );

        if (!isValidType) return "File type not supported";
        if (file.size > MAX_FILE_SIZE) return "File too large (Max 100MB)";
        return null;
    };

    const compressImage = async (file: File) => {
        if (!file.type.startsWith("image/")) return file;

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        };

        return await imageCompression(file, options);
    };

    /* ---------------- File Handling ---------------- */

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
            });
            onFileReady(compressedFile);
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
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    /* ---------------- UI ---------------- */

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-6">

            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">File Sharing</h2>
                <span className="text-xs text-gray-400">
                    Send files to connected peers
                </span>
            </div>

            {/* File List */}
            {files.map(fileItem => (
                <div
                    key={fileItem.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-indigo-400" />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                    {fileItem.file.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {fileItem.progress}% • {formatBytes(fileItem.compressedSize)}
                                    {" "}• ETA: {fileItem.estimatedTime}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="text-gray-400 hover:text-yellow-400 transition">
                                <Pause size={16} />
                            </button>
                            <button
                                onClick={() => removeFile(fileItem.id)}
                                className="text-gray-400 hover:text-red-400 transition"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-300"
                            style={{ width: `${fileItem.progress}%` }}
                        />
                    </div>

                    {fileItem.originalSize !== fileItem.compressedSize && (
                        <span className="text-xs text-green-400">
                            Compressed from {formatBytes(fileItem.originalSize)}
                        </span>
                    )}
                </div>
            ))}

            {/* Available Files from Peers */}
            {availableFiles.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-gray-400">
                        Available Files
                    </h3>

                    {availableFiles.map(file => (
                        <div>

                            <div
                                key={file.fileId}
                                className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between"
                            >
                                <div className="flex flex-col">
                                    <span className="text-sm">{file.fileName}</span>
                                    <span className="text-xs text-gray-400">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>

                                <button
                                    onClick={() => onDownload(file)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-xs px-3 py-1 rounded-lg"
                                >
                                    Download
                                </button>
                            </div>
                            {downloadProgress[file.fileId] !== undefined && (
                                <div className="mt-2 w-full bg-black/30 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-200"
                                        style={{
                                            width: `${downloadProgress[file.fileId]}%`,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
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
                        e.target.value = ""; // 👈 RESET HERE
                    }
                }}
            />
        </div>
    );
};

export default FileSharePanel;