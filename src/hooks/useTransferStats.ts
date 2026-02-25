import { useEffect, useRef, useState } from "react";

export const useTransferStats = (fileSize: number) => {
    const [receivedBytes, setReceivedBytes] = useState(0);
    const [speed, setSpeed] = useState(0);

    const lastBytes = useRef(0);
    const lastTime = useRef(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();

            const bytesDiff = receivedBytes - lastBytes.current;
            const timeDiff = (now - lastTime.current) / 1000;

            const currentSpeed = bytesDiff / timeDiff;

            // smooth speed
            setSpeed(prev => prev * 0.7 + currentSpeed * 0.3);

            lastBytes.current = receivedBytes;
            lastTime.current = now;
        }, 1000);

        return () => clearInterval(interval);
    }, [receivedBytes]);

    const remainingBytes = fileSize - receivedBytes;
    const etaSeconds = speed ? remainingBytes / speed : 0;

    return {
        receivedBytes,
        setReceivedBytes,
        speed,
        etaSeconds,
    };
};