import React from "react";
import { Expand, Loader, Minimize, Radio, Reply, Send, SmilePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import formatTime from "../utils/formatTime";
import type { ChatMessage } from "../types";
import { formatChatDateLabel } from "../utils/formatChatDate";
import { REACTIONS } from "../utils/reaction";
import type { ReactionKey } from "../utils/reaction";

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
    broadcastTyping: () => void;
    typingUsers: string[];
    handleReact: (messageId: string, reactionKey: string) => void;
    clearReaction: (messageId: string) => void;
    isLoading: boolean;
    handleSetReplyingTo: (message: ChatMessage | null) => void;
    replyTo: ChatMessage | null;
    handleShowMentionList: (show: boolean) => void;
    showMentionList: boolean;
    mentionQuery: string;
    handleUpdateMentionQuery: (text: string) => void;
    users: string[];
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
    broadcastTyping,
    typingUsers = [],
    handleReact,
    clearReaction,
    isLoading,
    handleSetReplyingTo,
    replyTo,
    handleShowMentionList,
    showMentionList,
    mentionQuery,
    handleUpdateMentionQuery,
    users
}) => {

    const isDisabled = chatInput.trim() === "" || isLoading;
    const messagesRef = useRef<HTMLDivElement | null>(null);
    const [showReactionTrayFor, setShowReactionTray] = useState<string | null>(null);


    const handleClearReaction = (messageId: string | undefined) => {
        if (!messageId) return;
        setShowReactionTray(null);
        clearReaction(messageId);
    }

    const handleReactMessages = (messageId: string, reactionKey: string) => {
        setShowReactionTray(prev => prev === messageId ? null : messageId)
        handleReact(messageId, reactionKey);
    };

    const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setChatInput(value);

        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = value.slice(0, cursorPos);

        const match = textBeforeCursor.match(/@(\w*)$/);

        if (match) {
            handleUpdateMentionQuery(match[1]); // show dropdown
            handleShowMentionList(true);
        } else {
            handleShowMentionList(false);
        }

        broadcastTyping();
    };

    const insertMention = (username: string) => {
        const newText = chatInput.replace(/@(\w*)$/, `@${username} `);
        setChatInput(newText);
        handleShowMentionList(false);
    };

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
                    const currentDateLabel = formatChatDateLabel(msg.createdAt || new Date().toISOString());
                    const prevMessage = messages[index - 1];
                    const prevDateLabel = prevMessage
                        ? formatChatDateLabel(prevMessage.createdAt || new Date().toISOString())
                        : null;

                    const shouldShowDate =
                        !prevMessage || currentDateLabel !== prevDateLabel;

                    const groupedReactions = msg.reactions?.reduce((acc, r) => {
                        const key = r.reactionKey as ReactionKey;

                        if (!acc[key]) acc[key] = [];
                        acc[key].push(r.user);

                        return acc;
                    }, {} as Record<ReactionKey, string[]>) ?? {};

                    const reactionEntries = Object.entries(groupedReactions) as [ReactionKey, string[]][];

                    const myReactionKey = msg.reactions?.find(
                        r => r.user === myName
                    )?.reactionKey;

                    return (
                        <React.Fragment key={messageId + Date.now().toString()}>

                            {/* ✅ DATE LABEL (Only when date changes) */}
                            {shouldShowDate && (
                                <div className="flex justify-center my-4">
                                    <div className="px-4 py-1 text-xs text-gray-400 bg-white/5 rounded-full backdrop-blur-sm">
                                        {currentDateLabel}
                                    </div>
                                </div>
                            )}

                            {/* SYSTEM MESSAGE */}
                            {msg.type === "system" ? (
                                <div className="text-center text-xs text-gray-500 py-2">
                                    {msg.message}
                                </div>
                            ) : (
                                <div
                                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                >
                                    <div className="relative group max-w-[80%]">

                                        {!isMe && (
                                            <div className="text-xs text-gray-400 mb-1 ml-1">
                                                {msg.sender}
                                            </div>
                                        )}

                                        <div className={`flex items-center gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>

                                            {/* BUBBLE */}
                                            <div
                                                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed backdrop-blur-md whitespace-pre-wrap wrap-break-word ${isMe ? "bg-indigo-600 text-white rounded-br-sm shadow-indigo-900/30 shadow-lg" : "bg-slate-800/80 text-white rounded-bl-sm shadow-black/30 shadow-md"}`}
                                            >
                                                {msg.replyTo && (
                                                    <div className="mb-2 p-2 bg-white/5 rounded-lg text-xs border-l-2 border-indigo-500">
                                                        <div className="text-indigo-400 font-medium">
                                                            {msg.replyTo.sender}
                                                        </div>
                                                        <div className="truncate opacity-70">
                                                            {msg.replyTo.message}
                                                        </div>
                                                    </div>
                                                )}
                                                <div>
                                                    {msg.message.split(/(@\w+)/g).map((part, i) =>
                                                        part.startsWith("@") ? (
                                                            <span key={i} className="text-indigo-400 font-medium">
                                                                {part}
                                                            </span>
                                                        ) : (
                                                            part
                                                        )
                                                    )}
                                                </div>

                                                <div className="mt-2 text-[11px] opacity-60 text-right">
                                                    {formatTime(msg.createdAt)}
                                                </div>

                                            </div>

                                            {/* Reactions below bubble */}
                                            {(() => {
                                                const visibleReactions = reactionEntries
                                                    .map(([key, users]) => ({
                                                        key,
                                                        users: users.filter(u => u !== myName),
                                                    }))
                                                    .filter(r => r.users.length > 0);

                                                if (visibleReactions.length === 0) return null;

                                                return (
                                                    <div
                                                        className={`absolute -bottom-3 ${isMe ? "right-4" : "left-4"
                                                            } flex gap-1`}
                                                    >
                                                        {visibleReactions.map(({ key, users }) => (
                                                            <div
                                                                key={key}
                                                                className="flex items-center gap-1 text-xs bg-black/50 px-2 py-0.5 rounded-full"
                                                            >
                                                                {REACTIONS.find(r => r.id === key)?.emoji}
                                                                <span>{users.length}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}

                                            {/* ACTIONS */}
                                            <div className="flex items-center gap-2 shrink-0 transition relative">
                                                <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 rounded-full p-2 flex gap-2 shadow-lg ${showReactionTrayFor === messageId ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"} transition-all`}>
                                                    {Object.entries(REACTIONS).map(([key, emoji]) => (
                                                        <button
                                                            key={key}
                                                            onClick={() => handleReactMessages(msg.id, emoji.id)}
                                                            className="text-2xl hover:scale-125 transition"
                                                        >
                                                            {emoji.emoji}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Reaction Toggle Button */}
                                                {!isMe && (
                                                    myReactionKey ? (
                                                        <button
                                                            onClick={() => handleClearReaction(msg.id)}
                                                            className="text-xl transition hover:scale-110"
                                                        >
                                                            {REACTIONS.find(r => r.id === myReactionKey)?.emoji}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setShowReactionTray(msg.id || "")}
                                                            className="p-1 rounded-md hover:bg-white/10 transition"
                                                        >
                                                            <SmilePlus className="w-4 h-4 text-gray-400 hover:text-white" />
                                                        </button>
                                                    )
                                                )}

                                                <button
                                                    onClick={() => handleSetReplyingTo(msg)}
                                                    className="p-1 rounded-md hover:bg-white/10 transition"
                                                >
                                                    <Reply className="w-4 h-4 text-gray-400 hover:text-white" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </React.Fragment>
                    );
                })}
            </div>

            {/* Input */}
            <div className="flex gap-2 shrink-0 flex-col w-full">
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${replyTo ? "max-h-24 opacity-100 mb-2" : "max-h-0 opacity-0"}`}
                >
                    {replyTo && (
                        <div className="p-3 bg-slate-800/80 border border-white/10 rounded-xl flex items-start gap-3">

                            {/* Left Border Accent */}
                            <div className="w-1 bg-indigo-500 rounded-full shrink-0" />

                            {/* Text Block */}
                            <div className="flex-1 min-w-0 text-xs">
                                <div className="text-indigo-400 font-medium truncate">
                                    Replying to {replyTo.sender}
                                </div>
                                <div className="text-gray-300 truncate">
                                    {replyTo?.message}
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => handleSetReplyingTo(null)}
                                className="shrink-0 text-gray-400 hover:text-white transition"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <div
                        className={`transition-all duration-300 ease-out overflow-hidden ${typingUsers.length > 0 ? "max-h-10 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"}`}
                    >
                        {typingUsers.length > 0 && (
                            <div className="text-xs text-gray-400 italic flex items-center gap-2">
                                <span>
                                    {typingUsers.join(", ")}{" "}
                                    {typingUsers.length === 1 ? "is" : "are"} typing
                                </span>

                                {/* Animated dots */}
                                <div className="flex gap-1">
                                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 w-full relative">
                        {showMentionList && (
                            <div className="absolute bottom-20 left-5 bg-slate-800 border border-white/10 rounded-lg shadow-lg p-2 w-48">
                                {users
                                    .filter(u =>
                                        u.toLowerCase().includes(mentionQuery.toLowerCase())
                                    )
                                    .map(user => (
                                        <div
                                            key={user}
                                            onClick={() => insertMention(user)}  // 👈 HERE
                                            className="px-2 py-1 hover:bg-white/10 cursor-pointer rounded"
                                        >
                                            {user}
                                        </div>
                                    ))}
                            </div>
                        )}
                        <textarea
                            rows={1}
                            value={chatInput}
                            onChange={(e) => handleTyping(e)}
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
                            onClick={() => sendChatMessage()}
                            disabled={isDisabled}
                            className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader className="w-4 h-4 animate-spin text-white" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;