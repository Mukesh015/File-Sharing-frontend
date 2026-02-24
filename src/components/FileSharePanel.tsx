import { UploadCloud, File } from "lucide-react";

const FileSharePanel = () => {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-6">

            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">File Sharing</h2>
                <span className="text-xs text-gray-400">
                    Send files to connected peers
                </span>
            </div>

            {/* Example File Item */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-indigo-400" />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">video.mp4</span>
                            <span className="text-xs text-gray-400">
                                45% • 12 MB / 26 MB
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="text-gray-400 hover:text-yellow-400 transition">
                            ⏸
                        </button>
                        <button className="text-gray-400 hover:text-red-400 transition">
                            ✕
                        </button>
                    </div>
                </div>

                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full w-[45%] bg-indigo-500 transition-all duration-300" />
                </div>
            </div>

            {/* Drop Zone */}
            <div className="border-2 border-dashed border-white/20 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-indigo-500 transition cursor-pointer">
                <UploadCloud className="w-12 h-12 text-indigo-400 mb-4" />
                <h3 className="text-md font-semibold mb-1">
                    Drag & Drop Files Here
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                    or click to browse from your device
                </p>
                <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-xl transition">
                    <File className="w-4 h-4" />
                    Select File
                </button>
            </div>
        </div>
    );
};

export default FileSharePanel;