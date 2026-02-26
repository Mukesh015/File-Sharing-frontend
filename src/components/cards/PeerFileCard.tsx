import React from "react";
import { renderFileIcon } from "../getFileType";
import { Check, Dot, Download, X } from "lucide-react";
import { formatBytes, formatETA } from "../../utils/formatBytes.ts";
import type { FileMeta } from "../../types";

interface Props {
    file: FileMeta,
    stats: {
        eta: number;
        speed: number;
        received: number
    },
    isDownloaded: boolean,
    isDownloading: boolean,
    progress: number,
    onCancelDownload: (file: FileMeta) => void,
    onDownload: (file: FileMeta) => void

}

const PeerFileCard: React.FC<Props> = ({ file, stats, isDownloaded, isDownloading, progress, onCancelDownload, onDownload }) => {
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
                    onClick={() => onDownload(file)}
                    className="icon-button download-btn"
                >
                    {isDownloaded ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                </button>

                <button
                    onClick={() => onCancelDownload(file)}
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
    )
}

export default PeerFileCard;