import { Send } from "lucide-react";
import { useEffect, useState } from "react";

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

    const [isDisabled, setIsDisabled] = useState(true);

    useEffect(() => {
        setIsDisabled(chatInput.trim() === "");
    }, [chatInput]);

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col">
            <h2 className="font-semibold pb-4 mb-4 border-b border-white/10">
                Live Chat
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                {messages.map((msg, index) => {
                    const isMe = msg.sender === myName;

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
                                className={`max-w-[75%] break-words px-4 py-2 rounded-2xl text-sm shadow-sm
            ${isMe
                                        ? "bg-indigo-600 text-white rounded-br-md"
                                        : "bg-white/10 text-white rounded-bl-md"
                                    }`}
                            >
                                <span className="block text-xs opacity-70 mb-1">
                                    {msg.sender}
                                </span>
                                {msg.message}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-2">
                <textarea
                    rows={1}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendChatMessage();
                        }
                    }}
                    className="flex-1 resize-none outline-none bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm"
                    placeholder="Type message..."
                />
                <button
                    onClick={sendChatMessage}
                    disabled={isDisabled}
                    className="bg-indigo-600 px-4 rounded-xl disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ChatPanel;