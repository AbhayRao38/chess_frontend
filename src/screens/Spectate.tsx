import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { useSocket } from "../hooks/useSocket";

interface GameInfo {
  id: string;
  white: string;
  black: string;
}

export const Spectate = () => {
  const [games, setGames] = useState<GameInfo[]>([]);
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    // Request active games immediately when socket connects
    socket.send(JSON.stringify({
      type: "GET_ACTIVE_GAMES"
    }));

    // Set up interval to refresh games list
    const interval = setInterval(() => {
      socket.send(JSON.stringify({
        type: "GET_ACTIVE_GAMES"
      }));
    }, 5000); // Refresh every 5 seconds

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message in Spectate:', message); // Debug log
        if (message.type === "ACTIVE_GAMES") {
          setGames(message.payload.games);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      clearInterval(interval);
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

  return (
    <div className="flex flex-col items-center pt-8">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <Button onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Active Games</h2>
        
        {games.length === 0 ? (
          <p className="text-white text-center text-xl">No active games at the moment</p>
        ) : (
          <div className="grid gap-4">
            {games.map((game, index) => (
              <div 
                key={game.id} 
                className="bg-slate-800 p-6 rounded-lg shadow-lg"
              >
                <div className="flex justify-between items-center">
                  <div className="text-white">
                    <p className="text-lg font-semibold">Game {index + 1}</p>
                    <p className="text-sm text-gray-400">White: {game.white}</p>
                    <p className="text-sm text-gray-400">Black: {game.black}</p>
                  </div>
                  <Button 
                    onClick={() => navigate(`/game?spectate=${game.id}`)}
                  >
                    Watch Game
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};