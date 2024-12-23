import { useEffect, useState, useCallback } from "react";

const WS_URL = "wss://chess-backend-dark.onrender.com";
const RECONNECT_DELAY = 3000;

export const useSocket = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const connect = useCallback(() => {
        try {
            const ws = new WebSocket(WS_URL);

            ws.onopen = () => {
                console.log('WebSocket connected successfully');
                setSocket(ws);
                setRetryCount(0);
            };

            ws.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                setSocket(null);
                
                // Attempt to reconnect after delay
                if (retryCount < 5) {
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                        connect();
                    }, RECONNECT_DELAY);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (error) {
            console.error('Error creating WebSocket:', error);
        }
    }, [retryCount]);

    useEffect(() => {
        connect();

        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, [connect]);

    // Return both socket and connection status
    return socket;
};