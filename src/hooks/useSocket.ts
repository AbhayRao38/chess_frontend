import { useEffect, useState, useCallback, useRef } from "react";

const WS_URL = "wss://chess-backend-dark.onrender.com";
const NORMAL_CLOSE = 1000;
const RECONNECT_INTERVAL = 2000;

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      console.log('Attempting to connect to WebSocket...');
      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;
      setSocket(ws);

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onclose = (event) => {
        console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        setSocket(null);
        setIsConnected(false);

        // Only attempt to reconnect if it wasn't a normal closure
        if (event.code !== NORMAL_CLOSE && reconnectAttempts.current < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectAttempts.current += 1;
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            connect();
          }, RECONNECT_INTERVAL);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onmessage = (event) => {
        if (event.data === 'heartbeat') {
          ws.send('pong');
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setSocket(null);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        console.log('Closing WebSocket connection due to component unmount');
        socketRef.current.close(NORMAL_CLOSE);
      }
    };
  }, [connect]);

  return { socket, isConnected };
};