import { useEffect, useRef, useState } from "react";

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000;

  const connect = () => {
    console.log("Attempting to connect to WebSocket...");
    const wsUrl = 'wss://chess-backend-dark.onrender.com';
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected successfully");
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
      try {
        const message = JSON.parse(event.data);
        console.log("Parsed WebSocket message:", message);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
      if (reconnectAttempts.current < maxReconnectAttempts) {
        setTimeout(() => {
          reconnectAttempts.current += 1;
          console.log(`Reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
          connect();
        }, reconnectInterval);
      } else {
        console.error("Max reconnection attempts reached");
      }
    };
  };

  useEffect(() => {
    connect();
    return () => {
      console.log("Closing WebSocket connection due to component unmount");
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
};