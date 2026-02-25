import { Copy, Wifi, Users, X, MessageSquareMore, MessageSquareOff, Share2, CircleSlash2 } from "lucide-react";
import { useState } from "react";
import type { User } from "../types";

interface Props {
    roomId?: string;
    connected: boolean;
    totalUsers: number;
    onKick: (socketId: string) => void;
    myName: string;
    users: User[];
    onOpenChatPanel: () => void;
    isChatPanelOpen: boolean;
    onOpenFilePanel: () => void;
    isFilePanelOpen: boolean;
}

const RoomHeader: React.FC<Props> = ({
    roomId,
    connected,
    totalUsers,
    onKick,
    myName,
    users,
    onOpenChatPanel,
    isChatPanelOpen,
    onOpenFilePanel,
    isFilePanelOpen,
}) => {
    const [, setCopied] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

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
            <div className="flex w-full items-center justify-between gap-4">

                {/* LEFT → Logo + Room */}
                <div className="flex items-center gap-3">

                    {/* LOGO */}
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center font-bold">
                        <img src="https://cdn-icons-png.flaticon.com/512/1037/1037316.png" alt="" />
                    </div>
                </div>

                {/* RIGHT → Users + Connection */}
                <div className="flex items-center gap-3">


                    <button className="icon-button " onClick={onOpenFilePanel} >
                        {isFilePanelOpen ? <CircleSlash2 className="w-4 h-4 text-yellow-500" /> : <Share2 className="w-4 h-4 text-yellow-500" />}
                    </button>

                    <button className="icon-button " onClick={onOpenChatPanel} >
                        {isChatPanelOpen ? <MessageSquareOff className="w-4 h-4 text-yellow-500" /> : <MessageSquareMore className="w-4 h-4 text-yellow-500" />}
                    </button>

                    {/* USERS */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition bg-white/5 px-3 py-2 rounded-lg"
                    >
                        <Users className="w-4 h-4" />
                        {totalUsers}
                    </button>

                    {/* CONNECTION */}
                    <button
                        onClick={() => setMenuOpen(v => !v)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${connected ? "bg-green-500/20" : "bg-red-500/20"
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
                    </button>

                </div>
            </div>

            {/* MODAL */}

            {/* users */}
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300
        ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
            >
                {/* Backdrop */}
                <div
                    onClick={() => setIsOpen(false)}
                    className="absolute inset-0 bg-black/60 "
                />

                {/* Modal Card */}
                <div
                    className={`relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl transform transition-all duration-300 m-5
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

            {/* connect */}
            <div
                className={`absolute right-0 mt-2 w-52 origin-top-right rounded-xl
  bg-slate-900 border border-white/10 shadow-xl p-2
  transition-all duration-200
  ${menuOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
`}
            >
                {/* Disconnect */}
                <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-white/10 text-sm">
                    {/* SVG */}
                    <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
                        <path strokeWidth="2" d="M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Disconnect
                </button>

                {/* Reconnect */}
                <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-white/10 text-sm">
                    <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" d="M4 4v6h6" />
                        <path strokeWidth="2" d="M20 20v-6h-6" />
                        <path strokeWidth="2" d="M5 19a9 9 0 0 1 14-7M19 5a9 9 0 0 1-14 7" />
                    </svg>
                    Reconnect
                </button>

                {/* Copy room */}
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                >
                    <Copy className="w-4 h-4 text-gray-400" />
                    Copy Room ID
                </button>

                {/* Debug */}
                <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-white/10 text-sm">
                    <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" d="M9 12h6M12 9v6" />
                        <circle strokeWidth="2" cx="12" cy="12" r="9" />
                    </svg>
                    Debug Info
                </button>
            </div>
        </>
    );
};

export default RoomHeader;