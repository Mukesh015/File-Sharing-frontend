import React, { useState, useEffect } from "react";
import { renderFileIcon } from "../getFileType";
import { Check, Dot, Download, X, Eye } from "lucide-react";
import { formatBytes, formatETA } from "../../utils/formatBytes.ts";
import type { FileMeta } from "../../types";
import FilePreviewModal from "../FilePreviewModal";

interface Props {
    file: FileMeta;
    stats: {
        eta: number;
        speed: number;
        received: number;
    };
    isDownloaded: boolean;
    isDownloading: boolean;
    progress: number;
    onCancelDownload: (file: FileMeta) => void;
    onDownload: (file: FileMeta) => void;

    // 👇 NEW: pass blob from parent when download completed
    downloadedBlob?: Blob | null;
}

const PeerFileCard: React.FC<Props> = ({
    file,
    stats,
    isDownloaded,
    isDownloading,
    progress,
    onCancelDownload,
    onDownload,
    downloadedBlob,
}) => {

    const [previewOpen, setPreviewOpen] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);

    /* Create object URL only when previewing */
    useEffect(() => {
        if (!previewOpen || !downloadedBlob) return;

        const url = URL.createObjectURL(downloadedBlob);
        setFileUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [previewOpen, downloadedBlob]);

    return (
        <>
            <div
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

                    {stats && (!isDownloaded || isDownloading) && (
                        <p className="text-xs text-gray-400 sm:ml-3">
                            {formatBytes(stats.speed)}/s (ETA - {formatETA(stats.eta)}) •{" "}
                            {formatBytes(stats.received)} / {formatBytes(file.size)} downloaded
                        </p>
                    )}
                </div>

                {/* ACTIONS */}
                <div className="ml-3 flex items-center gap-2">

                    {/* 👁 Preview (only when downloaded) */}
                    {isDownloaded && downloadedBlob && (
                        <button
                            onClick={() => setPreviewOpen(true)}
                            className="icon-button hover:bg-yellow-500/10 transition"
                        >
                            <Eye className="w-4 h-4 text-yellow-400" />
                        </button>
                    )}

                    {isDownloaded && (
                        <button className="icon-button download-btn">
                            <Check className="w-4 h-4 text-indigo-500" />
                        </button>
                    )}

                    {isDownloading && (
                        <button
                            onClick={() => onCancelDownload(file)}
                            className="icon-button download-btn"
                        >
                            <X className="w-4 h-4 text-red-500" />
                        </button>
                    )}

                    {!isDownloaded && !isDownloading && (
                        <button
                            onClick={() => onDownload(file)}
                            className="icon-button download-btn"
                        >
                            <Download className="w-4 h-4 text-green-500" />
                        </button>
                    )}
                </div>

                {/* PROGRESS BAR */}
                {progress !== undefined && (
                    <div className="absolute bottom-0 left-0 w-full">
                        <div className="w-full h-1 bg-black/20">
                            <div
                                className="h-full bg-indigo-500 transition-all duration-200"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 🔥 Preview Modal */}
            {fileUrl && (
                <FilePreviewModal
                    isOpen={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    fileUrl={fileUrl}
                    fileName={file.fileName}
                    mimeType={file.mimeType}
                    size={file.size}
                    owner={file.owner}
                />
            )}
        </>
    );
};

export default PeerFileCard;