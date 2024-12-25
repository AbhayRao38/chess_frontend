import { useEffect, useState } from "react";

const BACKEND_URL = "wss://chess-backend-dark.onrender.com";

export const useSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    let isMounted = true;
    const ws = new WebSocket(BACKEND_URL);

    ws.onopen = () => {
      console.log("WebSocket connection established.");
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed. Reconnecting...");
      if (isMounted) {
        setTimeout(() => setSocket(new WebSocket(BACKEND_URL)), 3000);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    if (isMounted) {
      setSocket(ws);
    }

    return () => {
      isMounted = false;
      ws.close();
    };
  }, []);

  return socket;
};