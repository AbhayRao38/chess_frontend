import { useEffect, useState, useCallback } from "react";

const WS_URL = "wss://chess-backend-dark.onrender.com";

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 3;

  const connect = useCallback(() => {
    try {
      console.log('Attempting to connect to WebSocket...');
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setSocket(ws);
        setReconnectAttempts(0);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setSocket(null);
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = 1000 * Math.pow(2, reconnectAttempts);
          console.log(`Attempting to reconnect in ${delay}ms (Attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else {
          console.error('Max reconnect attempts reached. Please refresh the page.');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
      };

      return ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      return null;
    }
  }, [reconnectAttempts]);

  useEffect(() => {
    const ws = connect();

    return () => {
      if (ws) {
        console.log('Closing WebSocket connection');
        ws.close();
      }
    };
  }, [connect]);

  return socket;
};