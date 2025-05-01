import { useEffect, useState, useCallback, useRef } from "react";

const WS_URL = "wss://chess-backend-dark.onrender.com";
const NORMAL_CLOSE = 1000;
const RECONNECT_INTERVAL = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      console.log('Attempting to connect to WebSocket...');
      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('WebSocket connected successfully');
        setSocket(ws);
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        setSocket(null);
        setIsConnected(false);

        if (event.code !== NORMAL_CLOSE && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          setTimeout(() => {
            reconnectAttempts.current += 1;
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
            connect();
          }, RECONNECT_INTERVAL);
        }
      };

      ws.onerror = (error) => {
        if (!mountedRef.current) return;
        console.error('WebSocket error:', error);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        console.log('WebSocket message received:', event.data);
        try {
          const parsedData = JSON.parse(event.data);
          console.log('Parsed WebSocket message:', parsedData);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Failed to create WebSocket connection:', error);
      setSocket(null);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Send a ping every 30 seconds

    return () => {
      mountedRef.current = false;
      clearInterval(pingInterval);
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        console.log('Closing WebSocket connection due to component unmount');
        socketRef.current.close(NORMAL_CLOSE);
      }
    };
  }, [connect]);

  return { socket, isConnected };
};