import { Expand, Minimize, Radio, Reply, Send, SmilePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import formatTime from "../utils/formatTime";
import type { ChatMessage } from "../types";

interface Props {
    messages: ChatMessage[];
    myName: string;
    chatInput: string;
    setChatInput: React.Dispatch<React.SetStateAction<string>>;
    sendChatMessage: () => void;
    isOpen: boolean;
    fullscreen: boolean;
    onToggleFullscreen: () => void;
    isFilePanelHidden: boolean;
}

const ChatPanel: React.FC<Props> = ({
    isOpen,
    messages,
    myName,
    chatInput,
    setChatInput,
    sendChatMessage,
    fullscreen,
    onToggleFullscreen,
    isFilePanelHidden,
}) => {
    const isDisabled = chatInput.trim() === "";
    const messagesRef = useRef<HTMLDivElement | null>(null);
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

    /* ✅ Auto scroll to bottom when new message */
    useEffect(() => {
        const el = messagesRef.current;
        if (!el) return;

        el.scrollTo({
            top: el.scrollHeight,
            behavior: "smooth",
        });
    }, [messages]);

    useEffect(() => {
        if (!isFilePanelHidden) return;

        const t = setTimeout(() => {
            messagesRef.current?.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }, 320); // slightly > animation duration

        return () => clearTimeout(t);
    }, [isFilePanelHidden]);

    /* ✅ Prevent body scroll when fullscreen */
    useEffect(() => {
        document.body.style.overflow = fullscreen ? "hidden" : "";
    }, [fullscreen]);

    return (
        <div
            className={`flex flex-col flex-1 overflow-hidden overflow-x-hidden bg-linear-to-br from-slate-900 via-black to-slate-800 text-white p-5 border border-white/10 shadow-lg transition-all duration-300 ${fullscreen ? "fixed left-0 right-0 top-0 bottom-0 z-999 rounded-none" : "rounded-2xl h-full"} ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between w-full mb-5 pb-4 shrink-0 border-b border-white/10">
                <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400  flex items-center gap-1">
                    <Radio className="w-5 h-5 mr-2" />
                    Live Chat
                </h2>

                <button
                    onClick={onToggleFullscreen}
                    className="icon-button flex justify-center items-center"
                >
                    {fullscreen ? (
                        <Minimize className="w-4 h-4 text-gray-400 hover:text-white transition" />
                    ) : (
                        <Expand className="w-4 h-4 text-gray-400 hover:text-white transition" />
                    )}
                </button>
            </div>

            {/* Messages */}
            <div
                ref={messagesRef}
                className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-4 mb-4 pr-2"
            >
                {messages.map((msg, index) => {
                    const isMe = msg.sender === myName;
                    const messageId = msg.id || `${index}`;

                    if (msg.type === "system") {
                        return (
                            <div
                                key={messageId}
                                className="text-center text-xs text-gray-500 py-2"
                            >
                                {msg.message}
                            </div>
                        );
                    }

                    return (
                        <div
                            key={messageId}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                            <div className="relative group max-w-[80%]">

                                {/* Sender name (only for others) */}
                                {!isMe && (
                                    <div className="text-xs text-gray-400 mb-1 ml-1">
                                        {msg.sender}
                                    </div>
                                )}

                                <div className={`flex items-end gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                    {/* Bubble */}
                                    <div
                                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed backdrop-blur-md transition wrap-break-word whitespace-pre-wrap ${isMe
                                            ? "bg-indigo-600 text-white rounded-br-sm shadow-indigo-900/30 shadow-lg"
                                            : "bg-slate-800/80 text-white rounded-bl-sm shadow-black/30 shadow-md"
                                            }`}
                                    >
                                        <div>{msg.message}</div>

                                        {/* Timestamp */}
                                        <div className="mt-2 text-[11px] opacity-60 text-right">
                                            {formatTime(msg.createdAt)}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className={`flex items-center gap-2 transition shrink-0 `}>
                                        {/* Only show reaction for others */}
                                        {!isMe && (
                                            <button className="p-1 rounded-md hover:bg-white/10 transition">
                                                <SmilePlus className="w-4 h-4 text-gray-400 hover:text-white transition" />
                                            </button>
                                        )}

                                        <button onClick={() => setReplyingTo(msg)} className="p-1 rounded-md hover:bg-white/10 transition">
                                            <Reply className="w-4 h-4 text-gray-400 hover:text-white transition" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <div className="flex gap-2 shrink-0 flex-col w-full">
                <div
                    className={`
        overflow-hidden
        transition-all duration-300 ease-in-out
        ${replyingTo ? "max-h-24 opacity-100 mb-2" : "max-h-0 opacity-0"}
    `}
                >
                    {replyingTo && (
                        <div className="p-3 bg-slate-800/80 border border-white/10 rounded-xl flex items-start gap-3">

                            {/* Left Border Accent */}
                            <div className="w-1 bg-indigo-500 rounded-full shrink-0" />

                            {/* Text Block */}
                            <div className="flex-1 min-w-0 text-xs">
                                <div className="text-indigo-400 font-medium truncate">
                                    Replying to {replyingTo.sender}
                                </div>
                                <div className="text-gray-300 truncate">
                                    {replyingTo.message}
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setReplyingTo(null)}
                                className="shrink-0 text-gray-400 hover:text-white transition"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 w-full">
                    <textarea
                        rows={1}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (!isDisabled) sendChatMessage();
                            }
                        }}
                        className="flex-1 resize-none outline-none bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 transition"
                        placeholder="Type message..."
                    />

                    <button
                        onClick={sendChatMessage}
                        disabled={isDisabled}
                        className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;