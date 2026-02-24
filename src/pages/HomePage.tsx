import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, Shield, Wifi, Sparkles, Plus } from "lucide-react";
import { createRoom } from "../api/room";
import NameModal from "../components/NameModal";

function HomePage() {
    const navigate = useNavigate();
    const [room, setRoom] = useState("");

    const handleSaveUserName = (name: string) => {
        localStorage.setItem("name", name);
    };

    const handleCreateRoom = async () => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        try {
            const res = await createRoom(roomId);
            if (res?.id) {
                navigate(`/room/${roomId}`);
            }
        } catch (error) {
            console.log('error creating room', error)
        }
    };

    const joinRoom = () => {
        if (!room) return;
        navigate(`/room/${room.toUpperCase()}`);
    };

    return (
        <>
            <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-900 via-black to-slate-800 flex items-center justify-center px-6">

                {/* Glow blobs (SVG style backgrounds) */}
                <div className="absolute w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl top-[-120px] left-[-120px]" />
                <div className="absolute w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-3xl bottom-[-120px] right-[-120px]" />

                {/* Floating icons */}
                <UploadCloud className="absolute top-20 left-20 w-10 h-10 text-indigo-400/30" />
                <Wifi className="absolute bottom-24 left-32 w-10 h-10 text-green-400/30" />
                <Shield className="absolute top-24 right-32 w-10 h-10 text-pink-400/30" />
                <Sparkles className="absolute bottom-32 right-20 w-10 h-10 text-yellow-400/30" />

                {/* Card */}
                <div className="relative w-full max-w-xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">

                    {/* Logo */}
                    <div className="flex items-center justify-center mb-6">
                        <img src="https://cdn-icons-png.flaticon.com/512/1037/1037316.png" alt="Logo" className="w-16 h-16" />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-center text-white mb-2">
                        RTC File Transfer
                    </h1>

                    <p className="text-center text-gray-400 mb-8">
                        Secure peer-to-peer file sharing using WebRTC
                    </p>

                    {/* Feature badges */}
                    <div className="flex justify-center gap-4 mb-8 text-xs">
                        <div className="flex text-white items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                            <Shield className="w-4 h-4 text-green-400" />
                            Secure
                        </div>
                        <div className="flex items-center text-white gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                            <Wifi className="w-4 h-4 text-indigo-400" />
                            P2P
                        </div>
                        <div className="flex text-white items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                            <UploadCloud className="w-4 h-4 text-pink-400" />
                            Fast
                        </div>
                    </div>

                    {/* Create Room */}
                    <button
                        onClick={handleCreateRoom}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition mb-6 cursor-pointer"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Room
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-gray-400 text-sm">OR</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Join */}
                    <div className="flex gap-3">
                        <input
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            placeholder="Enter Room Code"
                            className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white outline-none border border-white/10 focus:border-indigo-500"
                        />

                        <button
                            onClick={joinRoom}
                            className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold transition"
                        >
                            Join
                        </button>
                    </div>

                    <p className="text-center text-gray-500 text-xs mt-8">
                        Direct transfer • No server storage • End-to-end connection
                    </p>
                </div>
            </div>

            <NameModal onSubmit={(name) => handleSaveUserName(name)} />
        </>
    );
}

export default HomePage;