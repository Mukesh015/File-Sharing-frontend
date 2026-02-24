import { Copy, Wifi } from "lucide-react";
import { useState } from "react";

interface Props {
    roomId?: string;
    connected: boolean;
    totalUsers: number;
}

const RoomHeader: React.FC<Props> = ({
    roomId,
    connected,
    totalUsers,
}) => {

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!roomId) return;

        try {
            await navigator.clipboard.writeText(roomId);
            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center justify-between">

                {/* Left Section */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Room {roomId}
                        </h1>

                        {/* Copy Button */}
                        <button
                            onClick={handleCopy}
                            className={`flex items-center cursor-pointer gap-1 px-3 py-2 rounded-lg text-xs transition-all duration-200 active:scale-95
          ${copied
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                                }`}
                        >
                            <Copy className="w-4 h-4" />
                            {copied ? "Copied!" : "Copy ID"}
                        </button>
                    </div>
                </div>

            </div>

            <div className="flex items-center gap-6">
                {/* Sub text */}
                <p className="text-gray-400 text-sm mt-1">
                    {totalUsers} device{totalUsers !== 1 && "s"} connected
                </p>
                <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl ${connected ? "bg-green-500/20" : "bg-red-500/20"
                        }`}
                >
                    <Wifi
                        className={`w-5 h-5 ${connected ? "text-green-400" : "text-red-400"
                            }`}
                    />
                    <span
                        className={`text-sm ${connected ? "text-green-400" : "text-red-400"
                            }`}
                    >
                        {connected ? "Connected" : "Disconnected"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default RoomHeader;