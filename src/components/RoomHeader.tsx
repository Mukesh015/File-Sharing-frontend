import { Copy, Wifi, Users, X } from "lucide-react";
import { useState } from "react";
import type { User } from "../types";

interface Props {
    roomId?: string;
    connected: boolean;
    totalUsers: number;
    onKick: (socketId: string) => void;
    myName: string;
    users: User[];
}

const RoomHeader: React.FC<Props> = ({
    roomId,
    connected,
    totalUsers,
    onKick,
    myName,
    users,
}) => {
    const [copied, setCopied] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleCopy = async () => {
        if (!roomId) return;

        try {
            await navigator.clipboard.writeText(roomId);
            setCopied(true);
            alert("Room ID copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    return (
        <>
            {/* HEADER */}
            <div className="flex  lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                {/* Title + Copy */}
                <div className="flex w-full items-center gap-3">
                    <button
                        onClick={handleCopy}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200 active:scale-95
            ${copied
                                ? "bg-green-500/20 text-green-400"
                                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            }`}
                    >
                        <span className="font-bold text-xl break-all">
                            R-{roomId}
                        </span>
                        <Copy className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex gap-3 w-full">

                    {/* Mobile Joined + Connection */}
                    <div className="flex items-center gap-3 lg:hidden">
                        <button
                            onClick={() => setIsOpen(true)}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition bg-white/5 px-3 py-2 rounded-lg"
                        >
                            <Users className="w-4 h-4" />
                            {totalUsers}
                        </button>

                        <div
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${connected ? "bg-green-500/20" : "bg-red-500/20"
                                }`}
                        >
                            <Wifi
                                className={`w-4 h-4 ${connected ? "text-green-400" : "text-red-400"
                                    }`}
                            />
                            <span
                                className={`text-xs ${connected ? "text-green-400" : "text-red-400"
                                    }`}
                            >
                                {connected ? "Connected" : "Disconnected"}
                            </span>
                        </div>
                    </div>
                    {/* DESKTOP RIGHT SECTION */}
                    <div className="hidden lg:flex items-center gap-4">

                        <button
                            onClick={() => setIsOpen(true)}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
                        >
                            <Users className="w-4 h-4" />
                            {totalUsers} Joined
                        </button>

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


            </div>

            {/* MODAL */}
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300
      ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
            >
                {/* Backdrop */}
                <div
                    onClick={() => setIsOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Card */}
                <div
                    className={`relative w-[90%] sm:w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl transform transition-all duration-300
        ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}
                >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-base sm:text-lg">
                            Joined Devices
                        </h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Users List */}
                    <div className="space-y-3 max-h-72 sm:max-h-80 overflow-y-auto pr-1">

                        <div className="bg-indigo-500/10 px-3 py-2 rounded-lg text-sm">
                            {myName} (You)
                        </div>

                        {users.map((user) => (
                            <div
                                key={user.socketId}
                                className="group flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg hover:bg-white/10 transition text-sm"
                            >
                                <span className="truncate">{user.userName}</span>

                                <button
                                    onClick={() => onKick(user.socketId)}
                                    className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-300 text-xs"
                                >
                                    Kick
                                </button>
                            </div>
                        ))}

                        {users.length === 0 && (
                            <div className="text-gray-400 text-sm text-center">
                                Waiting for peers…
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL */}
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300
        ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
            >
                {/* Backdrop */}
                <div
                    onClick={() => setIsOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Card */}
                <div
                    className={`relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl transform transition-all duration-300
          ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}
          `}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-lg">Joined Devices</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Users List */}
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">

                        {/* You */}
                        <div className="bg-indigo-500/10 px-3 py-2 rounded-lg">
                            {myName} (You)
                        </div>

                        {users.map((user) => (
                            <div
                                key={user.socketId}
                                className="group flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg hover:bg-white/10 transition"
                            >
                                <span>{user.userName}</span>

                                <button
                                    onClick={() => onKick(user.socketId)}
                                    className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-300"
                                >
                                    Kick
                                </button>
                            </div>
                        ))}

                        {users.length === 0 && (
                            <div className="text-gray-400 text-sm text-center">
                                Waiting for peers…
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default RoomHeader;