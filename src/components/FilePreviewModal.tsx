import { X } from "lucide-react";
import { useEffect } from "react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string;
    fileName: string;
    mimeType: string;
    size: number;
    owner: string;
    createdAt?: string;
}

const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const FilePreviewModal: React.FC<Props> = ({
    isOpen,
    onClose,
    fileUrl,
    fileName,
    mimeType,
    size,
    owner,
    createdAt,
}) => {

    /* Prevent background scroll */
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
        }

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const renderPreview = () => {
        if (mimeType.startsWith("image/")) {
            return (
                <img
                    src={fileUrl}
                    alt={fileName}
                    className="max-h-[75vh] w-auto object-contain rounded-xl"
                />
            );
        }

        if (mimeType.startsWith("video/")) {
            return (
                <video
                    src={fileUrl}
                    controls
                    className="max-h-[75vh] w-full rounded-xl"
                />
            );
        }

        if (mimeType === "application/pdf") {
            return (
                <iframe
                    src={fileUrl}
                    className="w-full h-[75vh] rounded-xl"
                />
            );
        }

        return (
            <div className="text-gray-400 text-sm">
                Preview not available for this file type.
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-1000 flex items-center justify-center">

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative bg-slate-900 border border-white/10 rounded-2xl 
                w-[95%] max-w-5xl p-3 shadow-2xl 
                transform transition-all duration-300 scale-100"
            >

                {/* HEADER (STRICT ONE LINE) */}
                <div className="flex items-center justify-between mb-10 gap-4">

                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-white truncate">
                            {fileName}
                        </h2>

                        <div className="text-xs text-gray-400 truncate">
                            Uploaded by {owner}
                            {createdAt && ` • ${new Date(createdAt).toLocaleString()}`}
                            {" • "}
                            {formatSize(size)}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="shrink-0 text-gray-400 hover:text-white transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* MEDIA PREVIEW */}
                <div className="flex justify-center items-center 
                    bg-black/60 rounded-xl 
                     max-h-[80vh] overflow-hidden">

                    {renderPreview()}
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;