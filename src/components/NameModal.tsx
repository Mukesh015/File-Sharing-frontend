import { useEffect, useState } from "react";

interface Props {
    onSubmit?: (name: string) => void;
    error: string;
}

const NameModal: React.FC<Props> = ({ onSubmit, error }) => {
    const [name, setName] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = () => {
        if (!name.trim()) return;
        const finalName = name.trim();
        localStorage.setItem("name", finalName);   // ⭐ important
        onSubmit?.(finalName);
        setIsOpen(false);
    };

    useEffect(() => {
        const saved = localStorage.getItem("name");
        if (saved) setIsOpen(false);
        else setIsOpen(true);
    }, []);

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300
        ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}
      `}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal Card */}
            <div
                className={`relative w-full max-w-md mx-4 bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl transform transition-all duration-300
          ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}
        `}
            >
                <h2 className="text-xl font-semibold mb-4 text-white text-center">
                    Welcome back 👋
                </h2>

                <p className="text-sm text-gray-400 mb-6">
                    Enter your name to continue
                </p>

                <div className="flex flex-col gap-4">
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleSubmit();
                            }
                        }}
                        placeholder="Your name"
                        className="w-full text-white bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition"
                    />
                    {error && (
                        <p className="text-red-400 text-sm text-center">
                            {error}
                        </p>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all px-4 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NameModal;