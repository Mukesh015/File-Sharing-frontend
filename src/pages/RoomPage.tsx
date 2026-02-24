import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { socket } from "../socket/socket";
import { createPeerConnection, handleIncomingPeer } from "../socket/webrtc";
import ChatPanel from "../components/ChatPanel";
import FileSharePanel from "../components/FileSharePanel";
import RoomHeader from "../components/RoomHeader";
import { createFileMeta } from "../api/fileMeta";

interface User {
    socketId: string;
    userName: string;
}

interface ChatMessage {
    sender: string;
    message: string;
    type?: "user" | "system";
}

interface FileMeta {
    type: "file-meta";
    fileId: string;
    fileName: string;
    size: number;
    mimeType: string;
    owner: string;
}

type DataMessage =
    | {
        type: "chat";
        sender: string;
        message: string;
    }
    | {
        type: "system";
        message: string;
    }
    | FileMeta
    | {
        type: "file-request";
        fileId: string;
        sender: string;
    }
    | {
        type: "file-start";
        fileId: string;
    }
    | {
        type: "file-complete";
        fileId: string;
    };

function RoomPage() {

    const { roomId } = useParams<{ roomId: string }>();
    const [connected, setConnected] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [availableFiles, setAvailableFiles] = useState<FileMeta[]>([]);
    const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
    const [downloadedFilesids, setDownloadedFilesIds] = useState<string[]>([]);
    const [downloadingFileIds, setDownloadingFileIds] = useState<string[]>([]);
    const [chatInput, setChatInput] = useState("");
    const storedFilesRef = useRef<Record<string, File>>({});
    const peersRef = useRef<Record<string, { pc: RTCPeerConnection; channel?: RTCDataChannel }>>({});
    const myNameRef = useRef(
        `User-${Math.floor(Math.random() * 1000)}`
    );
    const myName = myNameRef.current;
    const receivingFileMetaRef = useRef<Record<string, FileMeta>>({});
    const currentReceivingFileIdRef = useRef<string | null>(null);
    const incomingFilesRef = useRef<Record<string, Uint8Array[]>>({});


    /* =========================================
       SOCKET + WEBRTC SETUP
    ========================================= */

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
        if (!file) {
            console.warn("File not found:", fileId);
            return;
        }

        // 🔹 Notify receiver file is starting
        channel.send(
            JSON.stringify({
                type: "file-start",
                fileId,
            })
        );

        const chunkSize = 64 * 1024;
        let offset = 0;

        channel.bufferedAmountLowThreshold = 65536;

        while (offset < file.size) {
            const chunk = await file
                .slice(offset, offset + chunkSize)
                .arrayBuffer();

            if (channel.bufferedAmount > 10 * chunkSize) {
                await new Promise<void>((resolve) => {
                    channel.onbufferedamountlow = () => resolve();
                });
            }

            channel.send(chunk);
            offset += chunkSize;
        }

        channel.send(
            JSON.stringify({
                type: "file-complete",
                fileId,
            })
        );
    };

    const finalizeDownload = (fileId: string): void => {
        setDownloadingFileIds(prev => prev.filter(id => id !== fileId));
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

        /* ============================
           🔹 Handle Binary (ArrayBuffer)
        ============================ */
        if (data instanceof ArrayBuffer) {
            const fileId = currentReceivingFileIdRef.current;
            if (!fileId) return;

            if (!incomingFilesRef.current[fileId]) {
                incomingFilesRef.current[fileId] = [];
            }

            // incomingFilesRef.current[fileId].push(new Uint8Array(data));
            const chunk = new Uint8Array(data);

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
        } catch {
            console.warn("Invalid JSON received:", data);
            return;
        }

        switch (parsed.type) {

            /* ============================
               CHAT
            ============================ */
            case "chat":
                setChatMessages(prev => [
                    ...prev,
                    {
                        sender: parsed.sender,
                        message: parsed.message,
                    }
                ]);
                break;

            /* ============================
               SYSTEM
            ============================ */
            case "system":
                setChatMessages(prev => [
                    ...prev,
                    {
                        sender: "System",
                        message: parsed.message,
                        type: "system"
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

    const sendChatMessage = () => {
        if (!chatInput.trim()) return;

        const message: DataMessage = {
            type: "chat",
            sender: myName,
            message: chatInput,
        };

        broadcastRaw(message);

        setChatMessages(prev => [
            ...prev,
            { sender: myName, message: chatInput }
        ]);

        setChatInput("");
    };

    const handleKickUser = (socketId: string) => {
        socket.emit("kick-user", { target: socketId });
    };

    useEffect(() => {
        if (!roomId) return;

        /* -------- CONNECT -------- */

        socket.connect();

        /* -------- FILE META RECEIVED FROM BACKEND -------- */

        socket.on("file-meta", (data) => {
            console.log("🔥 SOCKET file-meta:", data);

            const normalized: FileMeta = {
                type: "file-meta",
                fileId: data.fileId ?? data.id,
                fileName: data.fileName,
                size: data.size,
                mimeType: data.mimeType,
                owner: data.owner,
            };

            receivingFileMetaRef.current[normalized.fileId] = normalized;

            setAvailableFiles((prev) => {
                const exists = prev.some(
                    (f) => f.fileId === normalized.fileId
                );
                if (exists) return prev;

                return [...prev, normalized];
            });
        });

        const handleConnect = () => {
            console.log("✅ Socket connected:", socket.id);
            setConnected(true);

            socket.emit("join-room", {
                roomId,
                userName: myName,
            });
        };

        const handleDisconnect = () => {
            console.log("❌ Socket disconnected");
            setConnected(false);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        /* -------- EXISTING USERS -------- */

        socket.on("existing-users", async (existingUsers: User[]) => {
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
        });

        /* -------- NEW USER JOINED -------- */

        socket.on("user-joined", (newUser: User) => {
            setUsers((prev) => [...prev, newUser]);

            const systemMessage: ChatMessage = {
                sender: "System",
                message: `${newUser.userName} joined the room`,
                type: "system",
            };

            // Add locally
            setChatMessages((prev) => [...prev, systemMessage]);

            // Broadcast to peers
            broadcastRaw({
                type: "system",
                message: `${newUser.userName} joined the room`
            });
        });

        /* -------- OFFER RECEIVED -------- */

        socket.on("offer", async ({ sender, offer }) => {
            const pc = handleIncomingPeer(
                socket,
                sender,
                handleIncomingMessage
            );

            peersRef.current[sender] = { pc };

            await pc.setRemoteDescription(offer);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("answer", {
                target: sender,
                answer,
            });

            pc.ondatachannel = (event) => {
                const channel = event.channel;
                peersRef.current[sender].channel = channel;
                channel.onmessage = (e) => handleIncomingMessage(e.data);
            };
        });

        /* -------- ANSWER RECEIVED -------- */

        socket.on("answer", async ({ sender, answer }) => {
            const peer = peersRef.current[sender];
            if (!peer) return;

            if (peer.pc.signalingState === "have-local-offer") {
                await peer.pc.setRemoteDescription(answer);
            }
        });

        /* -------- ICE RECEIVED -------- */

        socket.on("ice-candidate", async ({ sender, candidate }) => {
            const peer = peersRef.current[sender];
            if (!peer) return;

            await peer.pc.addIceCandidate(candidate);
        });

        /* -------- USER LEFT -------- */

        socket.on("user-left", (socketId: string) => {

            setUsers((prevUsers) => {

                const leavingUser = prevUsers.find(
                    (user) => user.socketId === socketId
                );

                if (leavingUser) {
                    const systemMessage: ChatMessage = {
                        sender: "System",
                        message: `${leavingUser.userName} left the room`,
                        type: "system",
                    };

                    setChatMessages((prev) => [...prev, systemMessage]);
                    broadcastMessage(systemMessage); // optional
                }

                // return updated user list
                return prevUsers.filter(
                    (user) => user.socketId !== socketId
                );
            });

            // Close peer connection safely
            const peer = peersRef.current[socketId];
            if (peer) {
                peer.pc.close();
            }

            delete peersRef.current[socketId];
        });

        /* -------- CLEANUP -------- */

        return () => {

            // 🔹 Close all peer connections cleanly
            Object.values(peersRef.current).forEach(peer => {
                try {
                    peer.channel?.close();
                    peer.pc.close();
                } catch (err) {
                    console.warn("Peer cleanup error:", err);
                }
            });

            peersRef.current = {};

            // 🔹 Remove listeners
            socket.off("file-meta");
            socket.off("connect");
            socket.off("disconnect");
            socket.off("existing-users");
            socket.off("user-joined");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("user-left");

            // 🔹 Disconnect socket
            socket.disconnect();
        };
    }, [roomId]);

    return (
        <div className="h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 text-white flex flex-col overflow-hidden">

            {/* HEADER */}
            <div className="px-4 sm:px-6 pt-4">
                <RoomHeader
                    roomId={roomId}
                    connected={connected}
                    totalUsers={users.length + 1}
                    onKick={handleKickUser}
                    myName={myName}
                    users={users}
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
                        onCancelDownload={() => 0}
                        checkIsDownloaded={checkIsDownloaded}
                        checkIsDownloading={checkIsDownloading}
                    />
                </div>

                {/* RIGHT SIDE (Fixed Chat) */}
                <div className="hidden lg:flex h-full">
                    <ChatPanel
                        messages={chatMessages}
                        myName={myName}
                        chatInput={chatInput}
                        setChatInput={setChatInput}
                        sendChatMessage={sendChatMessage}
                    />
                </div>

            </div>

            {/* MOBILE CHAT (Bottom) */}
            {/* <div className="lg:hidden border-t border-white/10 p-3">
                <ChatPanel
                    messages={chatMessages}
                    myName={myName}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    sendChatMessage={sendChatMessage}
                />
            </div> */}

        </div>
    );
}

export default RoomPage;