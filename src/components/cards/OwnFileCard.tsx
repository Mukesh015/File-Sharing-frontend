import React, { useState, useEffect } from "react";
import { formatBytes } from "../../utils/formatBytes.ts";
import { Eye, X } from "lucide-react";
import type { FileItem } from "../../types.ts";
import { renderFileIcon } from "../getFileType";
import FilePreviewModal from "../FilePreviewModal";

interface Props {
    fileItem: FileItem;
    removeFile: (id: string) => void;
    ownerName?: string;
    createdAt?: string;
}

const OwnFileCard: React.FC<Props> = ({
    fileItem,
    removeFile,
    ownerName,
    createdAt,
}) => {

    const [previewOpen, setPreviewOpen] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);

    // Create object URL safely
    useEffect(() => {
        if (!previewOpen) return;

        const url = URL.createObjectURL(fileItem.file);
        setFileUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [previewOpen, fileItem.file]);

    return (
        <>
            <div
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

                    <div className="flex items-center gap-2">
                        {/* 👁 Preview */}
                        <button
                            onClick={() => setPreviewOpen(true)}
                            className="icon-button hover:bg-yellow-500/10 transition"
                        >
                            <Eye size={16} className="text-yellow-400" />
                        </button>

                        {/* ❌ Remove */}
                        <button
                            onClick={() => removeFile(fileItem.id)}
                            className="icon-button hover:bg-red-500/10 transition"
                        >
                            <X size={16} className="text-red-400" />
                        </button>
                    </div>
                </div>

                {fileItem.originalSize !== fileItem.compressedSize && (
                    <span className="text-xs text-green-400 mt-1 block">
                        Compressed from {formatBytes(fileItem.originalSize)}
                    </span>
                )}
            </div>

            {/* 🔥 Preview Modal */}
            {fileUrl && (
                <FilePreviewModal
                    isOpen={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    fileUrl={fileUrl}
                    fileName={fileItem.file.name}
                    mimeType={fileItem.file.type}
                    size={fileItem.file.size}
                    owner={ownerName || "You"}
                    createdAt={createdAt}
                />
            )}
        </>
    );
};

export default OwnFileCard;