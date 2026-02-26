import { Expand, Minimize, Radio, Send } from "lucide-react";
import { useEffect, useRef } from "react";

interface ChatMessage {
    sender: string;
    message: string;
    type?: "user" | "system";
}

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
    console.log('isFilePanelHidden', isFilePanelHidden)
    const messagesRef = useRef<HTMLDivElement | null>(null);

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
            className={`
      flex flex-col flex-1 overflow-hidden
      bg-linear-to-br from-slate-900 via-black to-slate-800 text-white
      p-5 border border-white/10 shadow-lg transition-all duration-300

      ${fullscreen
                    ? "fixed left-0 right-0 top-0 bottom-0 z-999 rounded-none"
                    : "rounded-2xl h-full"
                }

      ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
    `}
        >
            {/* Header */}
            <div className="flex items-center justify-between w-full mb-5 pb-4 shrink-0">
                <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400 border-b border-white/10 flex items-center gap-1">
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
                className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-4 pr-2"
            >
                {messages.map((msg, index) => {
                    const isMe = msg.sender === myName;

                    if (msg.type === "system") {
                        return (
                            <div key={index} className="text-center text-xs text-gray-400 italic">
                                {msg.message}
                            </div>
                        );
                    }

                    return (
                        <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div
                                className={`max-w-[75%] wrap-break-word px-4 py-2 rounded-2xl text-sm shadow-sm
                ${isMe
                                        ? "bg-indigo-600 text-white rounded-br-md"
                                        : "bg-white/10 text-white rounded-bl-md"
                                    }`}
                            >
                                {!isMe && (
                                    <span className="block text-xs opacity-70 mb-1">{msg.sender}</span>
                                )}
                                {msg.message}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <div className="flex gap-2 shrink-0">
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
    );
};

export default ChatPanel;