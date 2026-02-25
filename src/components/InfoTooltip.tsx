import { useState } from "react";
import { Info } from "lucide-react";

type Props = {
    text: string;
};

export default function InfoTooltip({ text }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            {/* Button */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
            >
                <Info className="w-4 h-4" />
            </button>

            {/* Tooltip */}
            <div
                className={`
        fixed sm:absolute
        left-0 sm:left-1/2
        bottom-0 sm:bottom-full
        sm:-translate-x-1/2
        w-full sm:w-72
        px-4 sm:px-3
        pb-6 sm:pb-2
        pointer-events-none
        transition-all duration-200
        ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
            >
                <div className="rounded-t-2xl sm:rounded-lg bg-slate-900 border border-white/10 text-xs text-gray-300 shadow-xl p-4 sm:p-3">
                    {text}
                </div>
            </div>
        </div>
    );
}