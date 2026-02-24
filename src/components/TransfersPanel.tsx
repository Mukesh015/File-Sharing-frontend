import { Loader, Send } from "lucide-react";

const TransfersPanel = () => {
    return (
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <Send className="w-5 h-5" />
                <h2 className="font-semibold">Transfers</h2>
            </div>

            <div className="space-y-3">
                <div className="bg-white/5 p-3 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                        <span>video.mp4</span>
                        <span>45%</span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full w-[45%] bg-indigo-500 transition-all duration-300" />
                    </div>
                </div>

                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Loader className="w-4 h-4 animate-spin" />
                    Waiting for peer…
                </div>
            </div>
        </div>
    );
};

export default TransfersPanel;