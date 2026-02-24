// src/webrtc.ts

import { Socket } from "socket.io-client";

/* =====================================================
   Types
===================================================== */

// Result returned when creating a peer connection
export interface PeerConnectionResult {
    pc: RTCPeerConnection;          // The actual WebRTC connection
    dataChannel?: RTCDataChannel;   // Present only for initiator
}

/* =====================================================
   Common ICE Configuration
   (STUN helps discover public IP address)
===================================================== */

const rtcConfig: RTCConfiguration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302", // Public STUN server
        },
    ],
};

/* =====================================================
   Create Peer (Initiator / Sender)
   - Creates data channel
   - Sends ICE candidates
===================================================== */

export const createPeerConnection = (
    socket: Socket,
    targetId: string,
    onMessage: (data: string) => void
): PeerConnectionResult => {
    // Create peer connection using STUN config
    const pc = new RTCPeerConnection(rtcConfig);

    // Initiator creates the data channel
    const dataChannel = pc.createDataChannel("data-channel");

    /* ---------- Data Channel Events ---------- */

    // Fires when P2P channel is fully ready
    dataChannel.onopen = () => {
        console.log("✅ DataChannel OPEN with:", targetId);
    };

    // Receives data from remote peer
    dataChannel.onmessage = (event: MessageEvent<string>) => {
        onMessage(event.data);
    };

    // Log errors
    dataChannel.onerror = (error) => {
        console.error("❌ DataChannel error:", error);
    };

    /* ---------- ICE Handling ---------- */

    // Send ICE candidates to remote peer via signaling server
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice-candidate", {
                target: targetId,
                candidate: event.candidate,
            });
        }
    };

    /* ---------- Connection State Monitoring ---------- */

    pc.onconnectionstatechange = () => {
        console.log("Peer connection state:", pc.connectionState);

        if (pc.connectionState === "failed") {
            console.error("❌ Connection failed");
        }

        if (pc.connectionState === "connected") {
            console.log("🎉 P2P Connection Established");
        }
    };

    return { pc, dataChannel };
};

/* =====================================================
   Handle Incoming Peer (Receiver)
   - Waits for data channel
   - Sends ICE candidates
===================================================== */

export const handleIncomingPeer = (
    socket: Socket,
    senderId: string,
    onMessage: (data: string) => void
): RTCPeerConnection => {

    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }
        ],
    });

    /* When sender creates data channel,
       this event fires on receiver */
    pc.ondatachannel = (event) => {
        const channel = event.channel;

        // When channel is ready
        channel.onopen = () => {
            console.log("✅ Receiver DataChannel OPEN");
        };

        // When message received
        channel.onmessage = (e) => {
            onMessage(e.data);
        };
    };

    // ICE
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice-candidate", {
                target: senderId,
                candidate: event.candidate,
            });
        }
    };

    return pc;
};