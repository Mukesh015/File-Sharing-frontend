import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { socket } from "../socket/socket";
import { createPeerConnection, handleIncomingPeer } from "../socket/webrtc";

import DevicesPanel from "../components/DevicesPanel";
import TransfersPanel from "../components/TransfersPanel";
import ChatPanel from "../components/ChatPanel";
import FileSharePanel from "../components/FileSharePanel";
import RoomHeader from "../components/RoomHeader";

interface User {
    socketId: string;
    userName: string;
}

interface ChatMessage {
    sender: string;
    message: string;
    type?: "user" | "system";
}

function RoomPage() {
    const { roomId } = useParams<{ roomId: string }>();

    const [connected, setConnected] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");

    const peersRef = useRef<
        Record<string, { pc: RTCPeerConnection; channel?: RTCDataChannel }>
    >({});

    const myNameRef = useRef(
        `User-${Math.floor(Math.random() * 1000)}`
    );
    const myName = myNameRef.current;

    /* =========================================
       SOCKET + WEBRTC SETUP
    ========================================= */

    useEffect(() => {
        if (!roomId) return;

        /* -------- CONNECT -------- */

        socket.connect();

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
            broadcastMessage(systemMessage);
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

                channel.onmessage = (e) =>
                    handleIncomingMessage(e.data);
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
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, [roomId]);

    /* =========================================
       CHAT LOGIC
    ========================================= */

    const handleIncomingMessage = (data: string) => {
        try {
            const parsed: ChatMessage = JSON.parse(data);
            setChatMessages((prev) => [...prev, parsed]);
        } catch (err) {
            console.error("Invalid message format");
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

        const message: ChatMessage = {
            sender: myName,
            message: chatInput,
        };

        broadcastMessage(message);
        setChatMessages((prev) => [...prev, message]);
        setChatInput("");
    };

    const handleKickUser = (socketId: string) => {
        socket.emit("kick-user", { target: socketId });
    };

    /* =========================================
       UI
    ========================================= */

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-black to-slate-800 text-white p-6">

            <RoomHeader
                roomId={roomId}
                connected={connected}
                totalUsers={users.length + 1}
            />

            <div className="grid grid-cols-1 w-full lg:grid-cols-4 gap-6">
                <div className="flex flex-col gap-6 lg:col-span-3">
                    <DevicesPanel
                        onKick={handleKickUser}
                        myName={myName}
                        users={users}
                    />
                    <FileSharePanel />
                </div>

                <ChatPanel
                    messages={chatMessages}
                    myName={myName}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    sendChatMessage={sendChatMessage}
                />
            </div>

            <TransfersPanel />
        </div>
    );
}

export default RoomPage;