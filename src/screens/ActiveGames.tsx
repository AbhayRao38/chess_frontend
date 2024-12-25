import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";

export const ActiveGames = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [activeGames, setActiveGames] = useState<string[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Request active games on mount
    socket.send(JSON.stringify({ type: "list_games" }));

    const handleSocketMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      if (message.type === "active_games") {
        setActiveGames(message.payload.games || []);
      }
    };

    // Add event listener
    socket.addEventListener("message", handleSocketMessage);

    return () => {
      socket.removeEventListener("message", handleSocketMessage);
    };
  }, [socket]);

  if (!socket) {
    return <div className="text-white text-center py-8">Connecting...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Active Games</h1>
      {activeGames.length === 0 ? (
        <div className="text-gray-400">No active games available.</div>
      ) : (
        <div className="w-full max-w-4xl">
          <ul className="space-y-4">
            {activeGames.map((gameId) => (
              <li
                key={gameId}
                className="bg-slate-800 p-4 rounded-lg cursor-pointer hover:bg-slate-700"
                onClick={() => navigate(`/spectate/${gameId}`)}
              >
                <p className="text-white font-semibold">Game ID: {gameId}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};