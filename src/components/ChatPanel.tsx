import { Radio, Send } from "lucide-react";
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
}

const ChatPanel: React.FC<Props> = ({
    messages,
    myName,
    chatInput,
    setChatInput,
    sendChatMessage,
}) => {
    const isDisabled = chatInput.trim() === "";

    const bottomRef = useRef<HTMLDivElement | null>(null);

    // Auto scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex flex-col overflow-hidden bg-gradient-to-br p-5 rounded-2xl flex-1 from-slate-900 via-black to-slate-800 text-white">
            {/* Header */}
            <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-400 pb-4 mb-4 border-b border-white/10">
                <Radio className="w-5 h-5 inline mr-2" />
                Live Chat
            </h2>

            {/* Messages */}
            <div className="flex-1 h-full overflow-y-auto space-y-3 mb-4 pr-2">

                {messages.map((msg, index) => {
                    const isMe = msg.sender === myName;

                    // System Message
                    if (msg.type === "system") {
                        return (
                            <div
                                key={index}
                                className="text-center text-xs text-gray-400 italic"
                            >
                                {msg.message}
                            </div>
                        );
                    }

                    return (
                        <div
                            key={index}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[75%] break-words px-4 py-2 rounded-2xl text-sm shadow-sm transition-all
                  ${isMe
                                        ? "bg-indigo-600 text-white rounded-br-md"
                                        : "bg-white/10 text-white rounded-bl-md"
                                    }`}
                            >
                                {!isMe && (
                                    <span className="block text-xs opacity-70 mb-1">
                                        {msg.sender}
                                    </span>
                                )}
                                {msg.message}
                            </div>
                        </div>
                    );
                })}

                {/* Scroll Anchor */}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
                <textarea
                    rows={1}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (!isDisabled) {
                                sendChatMessage();
                            }
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