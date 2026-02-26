import React from "react";
import { renderFileIcon } from "../getFileType";
import type { FileMeta } from "../../types";
import { Dot } from "lucide-react";

interface Props {
    file: FileMeta
}
const PreviousFileCard: React.FC<Props> = ({ file }) => {
    return (
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
    )
}

export default PreviousFileCard;