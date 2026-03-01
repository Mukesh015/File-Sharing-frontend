import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createFileMeta } from "../api/fileMeta";
import ChatPanel from "../components/ChatPanel";
import FileSharePanel from "../components/FileSharePanel";
import RoomHeader from "../components/RoomHeader";
import { socket } from "../socket/socket";
import { createPeerConnection, handleIncomingPeer } from "../socket/webrtc";
import type { ChatMessage, DataMessage, FileMeta, Reaction, User } from "../types";
import NameModal from "../components/NameModal";
import { getChatMessages, initiateMessage } from "../api/chat";
import { getRoom } from "../api/room";
import { clearMessageReaction, reactMessage } from "../api/reaction";

const RoomPage = () => {

    const navigate = useNavigate();
    const { roomId } = useParams<{ roomId: string }>();
    // const [myName, setMyName] = useState(localStorage.getItem("name") || " ");
    const [myName, setMyName] = useState(
        `user-${Math.floor(Math.random() * 1000) + 1}`
    );
    const [connected, setConnected] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [availableFiles, setAvailableFiles] = useState<FileMeta[]>([]);
    const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
    const [isChatPanelOpen, setIsChatPanelOpen] = useState(true);
    const [isMessageSending, setIsMessageSending] = useState(false);
    const [isNameModalOpen, setIsNameModalOpen] = useState(!myName);
    const [isFilePanelOpen, setIsFilePanelOpen] = useState(true);
    const [fullscreenFilePanel, setFullscreenFilePanel] = useState(false);
    const [fullscreenChat, setFullscreenChat] = useState(false);
    const [downloadedFilesids, setDownloadedFilesIds] = useState<string[]>([]);
    const [downloadingFileIds, setDownloadingFileIds] = useState<string[]>([]);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [nameError, setNameError] = useState<string>("");
    const [chatInput, setChatInput] = useState("");
    const storedFilesRef = useRef<Record<string, File>>({});
    const peersRef = useRef<Record<string, { pc: RTCPeerConnection; channel?: RTCDataChannel }>>({});
    const receivingFileMetaRef = useRef<Record<string, FileMeta>>({});
    const currentReceivingFileIdRef = useRef<string | null>(null);
    const incomingFilesRef = useRef<Record<string, Uint8Array[]>>({});
    const activeTransfersRef = useRef<Record<string, AbortController>>({});
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


    const [transferStats, setTransferStats] = useState<{
        [fileId: string]: {
            received: number;
            speed: number;
            eta: number;
            lastBytes: number;
            lastTime: number;
        };
    }>({});

    const updateFileStats = (fileId: string, chunkSize: number, fileSize: number) => {
        setTransferStats(prev => {
            const now = Date.now();

            const stat = prev[fileId] || {
                received: 0,
                speed: 0,
                eta: 0,
                lastBytes: 0,
                lastTime: now,
            };

            const received = stat.received + chunkSize;

            const bytesDiff = received - stat.lastBytes;
            const timeDiff = (now - stat.lastTime) / 1000 || 1;

            const currentSpeed = bytesDiff / timeDiff;

            const smoothSpeed = stat.speed * 0.7 + currentSpeed * 0.3;

            const remaining = fileSize - received;
            const eta = smoothSpeed ? remaining / smoothSpeed : 0;

            return {
                ...prev,
                [fileId]: {
                    received,
                    speed: smoothSpeed,
                    eta,
                    lastBytes: received,
                    lastTime: now,
                },
            };
        });
    }

    const handleFullScreenFilePanel = () => {
        setFullscreenFilePanel(prev => !prev);
    };

    const handleToggleChatFullscreen = () => {
        setFullscreenChat(prev => !prev);
        if (fullscreenFilePanel) {
            setFullscreenFilePanel(false);

        }
    };

    const handleOpenFilePanel = () => {
        setIsFilePanelOpen(prev => !prev);
        if (fullscreenChat) {
            setFullscreenChat(false);
        }
    };

    const handleOpenChatPanel = () => {
        setIsChatPanelOpen(prev => !prev);
        if (fullscreenFilePanel) {
            setFullscreenFilePanel(false);
        }
    };

    const checkIsDownloaded = (fileId: string) => {
        return downloadedFilesids.includes(fileId);
    };

    const checkIsDownloading = (fileId: string) => {
        return downloadingFileIds.includes(fileId);
    };

    const broadcastRaw = (data: DataMessage) => {
        const payload = JSON.stringify(data);

        Object.values(peersRef.current).forEach(peer => {
            if (peer.channel?.readyState === "open") {
                peer.channel.send(payload);
            }
        });
    };

    const handleFileReady = async (file: File): Promise<FileMeta> => {
        if (!roomId || !socket.id) {
            throw new Error("Missing roomId or socket.id");
        }

        const savedFile = await createFileMeta({
            fileName: file.name,
            size: file.size,
            mimeType: file.type,
            owner: socket.id,
            roomId,
        });

        const normalized: FileMeta = {
            type: "file-meta",
            fileId: savedFile.id,
            fileName: savedFile.fileName,
            size: savedFile.size,
            mimeType: savedFile.mimeType,
            owner: savedFile.owner,
        };

        // store actual file for WebRTC transfer
        storedFilesRef.current[normalized.fileId] = file;

        return normalized;
    };

    const requestFileDownload = (file: FileMeta) => {
        const ownerPeer = peersRef.current[file.owner];

        if (!ownerPeer?.channel) {
            console.warn("Owner channel not available");
            return;
        }
        setDownloadingFileIds(prev => [...prev, file.fileId]);
        ownerPeer.channel.send(
            JSON.stringify({
                type: "file-request",
                fileId: file.fileId,
                sender: socket.id,
            })
        );
    };

    const sendFile = async (
        fileId: string,
        channel: RTCDataChannel
    ): Promise<void> => {

        const file = storedFilesRef.current[fileId];
        if (!file) return;

        const controller = new AbortController();
        activeTransfersRef.current[fileId] = controller;

        channel.send(JSON.stringify({
            type: "file-start",
            fileId,
        }));

        const chunkSize = 64 * 1024;
        let offset = 0;

        while (offset < file.size) {

            // 🔥 STOP IF CANCELED
            if (controller.signal.aborted) {
                console.log("Transfer aborted:", fileId);
                delete activeTransfersRef.current[fileId];
                return;
            }

            const chunk = await file
                .slice(offset, offset + chunkSize)
                .arrayBuffer();

            channel.send(chunk);
            offset += chunkSize;
        }

        channel.send(JSON.stringify({
            type: "file-complete",
            fileId,
        }));

        delete activeTransfersRef.current[fileId];
    };

    const finalizeDownload = (fileId: string): void => {
        const chunks = incomingFilesRef.current[fileId];
        if (!chunks || chunks.length === 0) return;

        const meta = receivingFileMetaRef.current[fileId];

        const blob = new Blob(chunks as BlobPart[], {
            type: meta?.mimeType || "application/octet-stream",
        });

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = meta?.fileName || "downloaded-file";
        a.click();
        URL.revokeObjectURL(url);
        delete incomingFilesRef.current[fileId];
        setDownloadedFilesIds(prev => [...prev, fileId]);
    };

    const handleIncomingMessage = async (data: unknown) => {

        if (data instanceof ArrayBuffer) {
            const fileId = currentReceivingFileIdRef.current;
            if (!fileId) return;

            if (!incomingFilesRef.current[fileId]) {
                incomingFilesRef.current[fileId] = [];
            }

            // incomingFilesRef.current[fileId].push(new Uint8Array(data));
            const chunk = new Uint8Array(data);

            const fileSize = receivingFileMetaRef.current[fileId]?.size || 0;

            updateFileStats(fileId, chunk.byteLength, fileSize);

            incomingFilesRef.current[fileId].push(chunk);

            // 🔥 Calculate progress
            const totalReceived = incomingFilesRef.current[fileId]
                .reduce((acc, curr) => acc + curr.byteLength, 0);

            const totalSize = receivingFileMetaRef.current[fileId]?.size || 1;

            const percentage = Math.min(
                Math.floor((totalReceived / totalSize) * 100),
                100
            );

            setDownloadProgress(prev => ({
                ...prev,
                [fileId]: percentage,
            }));
            return;
        }

        /* ============================
           🔹 Handle Blob (Safari / some browsers)
        ============================ */
        if (data instanceof Blob) {
            const buffer = await data.arrayBuffer();
            handleIncomingMessage(buffer);
            return;
        }

        /* ============================
           🔹 Must be JSON string
        ============================ */
        if (typeof data !== "string") return;

        let parsed: DataMessage;

        try {
            parsed = JSON.parse(data);
        } catch (e) {
            console.warn("Invalid JSON received:", data);
            return;
        }

        switch (parsed.type) {

            //  🔥 Typing indicators
            case "typing":
                setTypingUsers(prev => {
                    if (prev.includes(parsed.sender)) return prev;
                    return [...prev, parsed.sender];
                });
                break;

            case "stop-typing":
                setTypingUsers(prev =>
                    prev.filter(name => name !== parsed.sender)
                );
                break;

            // file metadata from other peers or self (after upload)
            case "file-cancel":
                const controller = activeTransfersRef.current[parsed.fileId];
                if (controller) {
                    controller.abort();
                    delete activeTransfersRef.current[parsed.fileId];
                }
                break;

            /* ============================
               CHAT
            ============================ */
            // case "chat":
            //     setChatMessages(prev => [
            //         ...prev,
            //         {
            //             sender: parsed.sender,
            //             message: parsed.message,
            //             createdAt: parsed.createdAt,
            //             id: parsed.id, // use provided id if available
            //         }
            //     ]);
            //     break;

            /* ============================
               SYSTEM
            ============================ */
            case "system":
                setChatMessages(prev => [
                    ...prev,
                    {
                        sender: "System",
                        message: parsed.message,
                        type: "system",
                        createdAt: parsed.createdAt,
                        id: "system"
                    }
                ]);
                break;

            /* ============================
               FILE REQUEST
            ============================ */
            case "file-request":

                // prevent sending to self
                if (parsed.sender === socket.id) return;

                const peer = peersRef.current[parsed.sender];

                if (peer?.channel?.readyState === "open") {
                    sendFile(parsed.fileId, peer.channel);
                }

                break;

            /* ============================
               FILE START
            ============================ */
            case "file-start":
                currentReceivingFileIdRef.current = parsed.fileId;
                incomingFilesRef.current[parsed.fileId] = [];
                break;

            /* ============================
               FILE COMPLETE
            ============================ */
            case "file-complete":
                finalizeDownload(parsed.fileId);

                setDownloadProgress(prev => ({
                    ...prev,
                    [parsed.fileId]: 100,
                }));

                currentReceivingFileIdRef.current = null;
                break;

            default:
                console.warn("Unknown message type:", parsed);
        }
    };

    const broadcastMessage = (message: ChatMessage) => {
        const payload = JSON.stringify(message);

        Object.values(peersRef.current).forEach((peer) => {
            if (peer.channel?.readyState === "open") {
                peer.channel.send(payload);
            }
        });
    };

    const sendChatMessage = async () => {
        if (!chatInput.trim() || !roomId) return;
        setIsMessageSending(true);
        try {
            await initiateMessage(roomId, myName, chatInput);
            setChatInput("");
        } catch (error) {
            console.log("Error saving chat message:", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setIsMessageSending(false);
        }


        // ⭐ 2. Broadcast realtime (instant)
        // broadcastRaw(message);
    };

    const handleKickUser = (socketId: string) => {
        socket.emit("kick-user", { target: socketId });
    };

    const handleLoadOldChats = async (page: number) => {
        if (!roomId) return;

        try {
            const data = await getChatMessages(roomId, page);

            if (!data || data.length === 0) return;

            setChatMessages(prev => {
                // prevent duplicates
                const existingIds = new Set(prev.map(m => m.id));

                const filtered = data.filter((m: ChatMessage) => !existingIds.has(m.id));

                return [
                    ...filtered,
                    ...prev,
                ];
            });

        } catch (error) {
            console.log("Error loading old chats:", error);
        }
    };

    const handleCancelDownload = (file: FileMeta) => {
        // stop local progress UI
        setDownloadingFileIds(prev =>
            prev.filter(id => id !== file.fileId)
        );

        setDownloadProgress(prev => {
            const updated = { ...prev };
            delete updated[file.fileId];
            return updated;
        });

        delete incomingFilesRef.current[file.fileId];

        // 🔥 Notify sender to stop sending
        const ownerPeer = peersRef.current[file.owner];

        if (ownerPeer?.channel?.readyState === "open") {
            ownerPeer.channel.send(
                JSON.stringify({
                    type: "file-cancel",
                    fileId: file.fileId,
                })
            );
        }
    };

    const handleFindRoom = async (id: string) => {
        try {
            const res = await getRoom(id || "");
            if (!res?.id) {
                navigate("/");
            }
        } catch (error) {
            console.log('error during find room', error)
        }
    }

    const broadcastTyping = () => {
        broadcastRaw({ type: "typing", sender: myName });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            broadcastRaw({ type: "stop-typing", sender: myName });
        }, 1500);
    };

    const clearReaction = async (messageId: string) => {
        if (!roomId) return;
        try {
            await clearMessageReaction(messageId, myName, roomId);
        } catch (error) {
            console.log("Error clearing reaction:", error);
        }
    };

    const handleReact = async (messageId: string, reactionKey: string) => {
        console.log('reactionKey', reactionKey)
        if (!roomId) return;
        try {
            await reactMessage(reactionKey, myName, messageId, roomId);
        } catch (error) {
            console.log("Error toggling reaction:", error);
        }
    };

    // socket connection and events
    useEffect(() => {
        if (!roomId || !myName) return;

        /* ================= CONNECT ================= */

        if (!socket.connected) socket.connect();

        /* ================= Connect to room ================= */

        const joinRoom = () => {
            socket.emit("join-room", {
                roomId,
                userName: myName,
            });
            setIsNameModalOpen(false);
            localStorage.setItem("name", myName);
        };

        /* ================= re-connect socket ================= */

        const handleConnect = () => {
            if (!socket.id) return;

            console.log("✅ Socket connected:", socket.id);
            setConnected(true);

            // ⭐ add self FIRST
            setUsers(prev => {
                const map = new Map<string, User>();

                [...prev, { socketId: socket.id!, userName: myName }].forEach(u => {
                    map.set(u.socketId, u);
                });

                return Array.from(map.values());
            });

            // ⭐ then join
            joinRoom();
        };

        /* ================= Name already exists ================= */

        const handleNameTaken = () => {
            localStorage.removeItem("name");
            setMyName("");
            setNameError("Name already exists in this room");
            setIsNameModalOpen(true);
        };

        /* ================= FILE META ================= */

        const handleFileMeta = (data: any) => {
            const normalized: FileMeta = {
                type: "file-meta",
                fileId: data.fileId ?? data.id,
                fileName: data.fileName,
                size: data.size,
                mimeType: data.mimeType,
                owner: data.owner,
            };

            receivingFileMetaRef.current[normalized.fileId] = normalized;

            setAvailableFiles(prev => {
                if (prev.some(f => f.fileId === normalized.fileId)) return prev;
                return [...prev, normalized];
            });
        };

        /* ================= EXISTING USERS → OFFER ================= */

        const handleExistingUsers = async (existingUsers: User[]) => {
            setUsers(existingUsers);

            for (const user of existingUsers) {
                const { pc, dataChannel } = createPeerConnection(
                    socket,
                    user.socketId,
                    handleIncomingMessage
                );

                peersRef.current[user.socketId] = {
                    pc,
                    channel: dataChannel,
                };

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                socket.emit("offer", {
                    target: user.socketId,
                    offer,
                });
            }
        };

        /* ================= USER JOINED ================= */

        const handleUserJoined = (newUser: User) => {
            setUsers(prev => [...prev, newUser]);

            const systemMessage: ChatMessage = {
                sender: "System",
                message: `${newUser.userName} joined the room`,
                type: "system",
                createdAt: new Date().toISOString(),
                id: `system-${newUser.socketId}`, // unique id for this system message
            };

            setChatMessages(prev => [...prev, systemMessage]);

            broadcastRaw({
                type: "system",
                message: `${newUser.userName} joined the room`,
                createdAt: new Date().toISOString(),
                id: `system`,
            });
        };

        /* ================= OFFER ================= */

        const handleOffer = async ({ sender, offer }: any) => {
            const pc = handleIncomingPeer(socket, sender, handleIncomingMessage);
            peersRef.current[sender] = { pc };

            await pc.setRemoteDescription(offer);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("answer", { target: sender, answer });

            pc.ondatachannel = (event) => {
                const channel = event.channel;
                peersRef.current[sender].channel = channel;
                channel.onmessage = (e) => handleIncomingMessage(e.data);
            };
        };

        /* ================= ANSWER ================= */

        const handleAnswer = async ({ sender, answer }: any) => {
            const peer = peersRef.current[sender];
            if (!peer) return;

            if (peer.pc.signalingState === "have-local-offer") {
                await peer.pc.setRemoteDescription(answer);
            }
        };

        /* ================= ICE ================= */

        const handleIce = async ({ sender, candidate }: any) => {
            const peer = peersRef.current[sender];
            if (!peer) return;

            await peer.pc.addIceCandidate(candidate);
        };

        /* ================= USER LEFT ================= */

        const handleUserLeft = (socketId: string) => {
            setUsers(prevUsers => {
                const leavingUser = prevUsers.find(
                    u => u.socketId === socketId
                );

                if (leavingUser) {
                    const systemMessage: ChatMessage = {
                        sender: "System",
                        message: `${leavingUser.userName} left the room`,
                        type: "system",
                        createdAt: new Date().toISOString(),
                        id: `system-${socketId}`, // unique id for this system message
                    };

                    setChatMessages(prev => [...prev, systemMessage]);

                    // ⭐ keep broadcast — same as your original
                    broadcastMessage(systemMessage);
                }

                return prevUsers.filter(u => u.socketId !== socketId);
            });

            const peer = peersRef.current[socketId];
            if (peer) {
                peer.pc.close();
                delete peersRef.current[socketId];
            }
        };

        /* ================= room disconnect ================= */

        const handleRoomDeleted = () => {
            alert("Room has been deleted");

            // Close all peer connections
            Object.values(peersRef.current).forEach(peer => {
                peer.channel?.close();
                peer.pc.close();
            });

            peersRef.current = {};

            socket.disconnect();

            // redirect to homepage
            window.location.href = "/";
        };

        /* ================= reaction updation ================= */

        const handleReactionUpdated = ({
            messageId,
            reactions,
        }: {
            messageId: string;
            reactions: Reaction[];
        }) => {
            setChatMessages(prev =>
                prev.map(msg =>
                    msg.id === messageId
                        ? { ...msg, reactions }
                        : msg
                )
            );
        };

        /* ================= reaction clear ================= */

        const handleClearReaction = ({
            messageId,
            user,
        }: {
            messageId: string;
            user: string;
        }) => {
            setChatMessages((prev) =>
                prev.map((msg) => {
                    if (msg.id === messageId) {
                        const filteredReactions =
                            msg.reactions?.filter((r) => r.user !== user) || [];

                        return { ...msg, reactions: filteredReactions };
                    }
                    return msg;
                })
            );
        };

        /* ================= NEW MESSAGE ================= */

        const handleNewMessage = (message: ChatMessage) => {
            setChatMessages(prev => [...prev, message]);
        }

        /* ================= REGISTER ================= */

        socket.on("connect", handleConnect);
        socket.on("name-taken", handleNameTaken);
        socket.on("file-meta", handleFileMeta);
        socket.on("existing-users", handleExistingUsers);
        socket.on("user-joined", handleUserJoined);
        socket.on("offer", handleOffer);
        socket.on("answer", handleAnswer);
        socket.on("ice-candidate", handleIce);
        socket.on("user-left", handleUserLeft);
        socket.on("room-deleted", handleRoomDeleted);
        socket.on("reaction-updated", handleReactionUpdated);
        socket.on("new-message", handleNewMessage);
        socket.on("reaction-cleared", handleClearReaction);

        // ⭐ already connected case
        if (socket.connected) handleConnect();

        /* ================= CLEANUP ================= */
        return () => {
            socket.off("connect", handleConnect);
            socket.off("name-taken", handleNameTaken);
            socket.off("file-meta", handleFileMeta);
            socket.off("existing-users", handleExistingUsers);
            socket.off("user-joined", handleUserJoined);
            socket.off("offer", handleOffer);
            socket.off("answer", handleAnswer);
            socket.off("ice-candidate", handleIce);
            socket.off("user-left", handleUserLeft);
            socket.off("room-deleted", handleRoomDeleted);
            socket.off("reaction-updated", handleReactionUpdated);
            socket.off("new-message", handleNewMessage);
            socket.off("reaction-cleared", handleClearReaction);
        };
    }, [roomId, myName]);

    useEffect(() => {
        if (!roomId) return;
        handleFindRoom(roomId);
    }, [roomId]);

    useEffect(() => {
        if (!roomId) return;
        handleLoadOldChats(1); // load first page of chats on mount
    }, [roomId]);

    return (
        <>
            <NameModal
                isOpen={isNameModalOpen}
                error={nameError}
                onSubmit={(name) => {
                    setMyName(name);
                }}
            />
            <div className="h-screen bg-linear-to-br from-slate-900 via-black to-slate-800 text-white flex flex-col overflow-hidden">

                {/* HEADER */}
                <div className="px-4 sm:px-6 pt-4 mb-5">
                    <RoomHeader
                        roomId={roomId}
                        connected={connected}
                        totalUsers={users.length + 1}
                        onKick={handleKickUser}
                        myName={myName}
                        users={users}
                        isChatPanelOpen={isChatPanelOpen}
                        onOpenChatPanel={handleOpenChatPanel}
                        isFilePanelOpen={isFilePanelOpen}
                        onOpenFilePanel={handleOpenFilePanel}
                    />
                </div>

                {/* MAIN CONTENT */}
                <div className=" px-4 sm:px-6 pb-4 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">

                    {/* LEFT SIDE (Scrollable) */}
                    <div className="lg:col-span-3 h-fit gap-6 overflow-y-auto pr-2">
                        <FileSharePanel
                            downloadProgress={downloadProgress}
                            onDownload={requestFileDownload}
                            availableFiles={availableFiles}
                            onFileReady={handleFileReady}
                            mySocketId={socket.id || ""}
                            onCancelDownload={handleCancelDownload}
                            checkIsDownloaded={checkIsDownloaded}
                            checkIsDownloading={checkIsDownloading}
                            isOpen={isFilePanelOpen}
                            onOpenFilePanel={handleOpenFilePanel}
                            fullscreen={fullscreenFilePanel}
                            onToggleFullscreen={handleFullScreenFilePanel}
                            transferStats={transferStats}
                        />
                    </div>

                    {/* RIGHT SIDE (Fixed Chat) */}
                    <div className="hidden lg:flex h-full flex-1 min-h-0">
                        <ChatPanel
                            messages={chatMessages}
                            myName={myName}
                            chatInput={chatInput}
                            setChatInput={setChatInput}
                            sendChatMessage={sendChatMessage}
                            isOpen={isChatPanelOpen}
                            fullscreen={fullscreenChat}
                            onToggleFullscreen={handleToggleChatFullscreen}
                            isFilePanelHidden={!isFilePanelOpen}
                            broadcastTyping={broadcastTyping}
                            typingUsers={typingUsers}
                            handleReact={handleReact}
                            clearReaction={clearReaction}
                            isLoading={isMessageSending}
                        />
                    </div>

                </div>

                {/* MOBILE CHAT (Bottom) */}
                <div className="lg:hidden p-3 h-full flex-1 min-h-0">
                    <ChatPanel
                        messages={chatMessages}
                        myName={myName}
                        chatInput={chatInput}
                        setChatInput={setChatInput}
                        sendChatMessage={sendChatMessage}
                        isOpen={isChatPanelOpen}
                        fullscreen={fullscreenChat}
                        onToggleFullscreen={handleToggleChatFullscreen}
                        isFilePanelHidden={!isFilePanelOpen}
                        broadcastTyping={broadcastTyping}
                        typingUsers={typingUsers}
                        handleReact={handleReact}
                        clearReaction={clearReaction}
                        isLoading={isMessageSending}
                    />
                </div>

            </div>
        </>
    );
}

export default RoomPage;