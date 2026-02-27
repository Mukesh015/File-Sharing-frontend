import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, Shield, Wifi, Sparkles, Plus } from "lucide-react";
import { createRoom, getRoom } from "../api/room";

function HomePage() {
    const navigate = useNavigate();
    const [room, setRoom] = useState("");
    const [errMsg, setErrMsg] = useState("");

    const handleFindRoom = async () => {
        try {
            const res = await getRoom(room.toUpperCase());
            if (res?.id) {
                navigate(`/room/${res.id}`);
            } else {
                setErrMsg((res?.message || "Room does not exist") + ", please check the code and try again or create a new room.");
            }
        } catch (error) {
            console.log('error during find room', error)
        }
    }

    const handleCreateRoom = async () => {
        try {
            const res = await createRoom();
            if (res?.id) {
                navigate(`/room/${res.id}`);
            }
        } catch (error) {
            console.log('error creating room', error)
        }
    };

    return (
        <>
            <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-900 via-black to-slate-800 flex items-center justify-center px-6">

                {/* Glow blobs (SVG style backgrounds) */}
                <div className="absolute w-125 h-125 bg-indigo-600/20 rounded-full blur-3xl -top-30 -left-30" />
                <div className="absolute w-100 h-100 bg-purple-600/20 rounded-full blur-3xl -bottom-30 -right-30" />

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
                        className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-sm sm:text-base text-white font-semibold transition-all duration-200 mb-6"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        Create Room
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-gray-400 text-sm">OR</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Join */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            placeholder="Enter Room Code"
                            className={`flex-1 px-4 py-3 rounded-xl bg-white/10 text-white outline-none border ${errMsg ? "border-red-500" : "border-white/10"} focus:border-indigo-500 text-sm sm:text-base`}
                        />

                        <button
                            disabled={!room || room.length !== 6 || !/^[a-zA-Z0-9]+$/.test(room)}
                            onClick={handleFindRoom}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 active:scale-[0.98] text-sm sm:text-base text-white font-semibold transition-all duration-200"
                        >
                            Join
                        </button>
                    </div>

                    {errMsg && (
                        <p className="text-center text-red-400 text-xs mt-2">
                            {errMsg}
                        </p>
                    )}

                    <p className="text-center text-gray-500 text-xs mt-8">
                        Direct transfer • No server storage • End-to-end connection
                    </p>
                </div>
            </div>
        </>
    );
}

export default HomePage;