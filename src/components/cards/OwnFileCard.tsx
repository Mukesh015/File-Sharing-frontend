import React from "react";
import { formatBytes } from "../../utils/formatBytes.ts";
import { X } from "lucide-react";
import type { FileItem } from "../../types.ts";
import { renderFileIcon } from "../getFileType";

interface Props {
    fileItem: FileItem;
    removeFile: (id: string) => void;
}

const OwnFileCard: React.FC<Props> = ({ fileItem, removeFile }) => {
    return (
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
    )
}

export default OwnFileCard;