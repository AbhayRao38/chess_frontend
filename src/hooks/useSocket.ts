import { useEffect, useState, useCallback, useRef } from "react";

const WS_URL = "wss://chess-backend-dark.onrender.com";

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  const connect = useCallback(() => {
    try {
      console.log('Attempting to connect to WebSocket...');
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setSocket(ws);
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onclose = (event) => {
        console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        setSocket(null);
        setIsConnected(false);
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = 1000 * Math.pow(2, reconnectAttempts.current);
          console.log(`Attempting to reconnect in ${delay}ms (Attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          setTimeout(() => {
            reconnectAttempts.current += 1;
            connect();
          }, delay);
        } else {
          console.error('Max reconnect attempts reached. Please refresh the page.');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const ws = connect();

    return () => {
      if (ws) {
        console.log('Closing WebSocket connection due to component unmount');
        ws.close();
      }
    };
  }, [connect]);

  return { socket, isConnected };
};