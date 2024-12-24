import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useSocket } from '../hooks/useSocket';

interface Game {
  id: string;
  player1: string;
  player2: string;
  status: string;
}

export const FETCH_GAMES = "fetch_games";
export const GAMES_LIST = "games_list";

export const ActiveGames = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.send(JSON.stringify({ type: FETCH_GAMES }));

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === GAMES_LIST) {
        setGames(message.payload.games);
      }
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center">
      <div className="w-full max-w-4xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Active Games</h1>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
        
        {games.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-xl">No active games at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game, index) => (
              <div 
                key={game.id}
                className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors"
              >
                <h3 className="text-xl font-semibold text-white mb-4">Game {index + 1}</h3>
                <div className="text-gray-300 mb-4">
                  <p>Player 1: {game.player1}</p>
                  <p>Player 2: {game.player2}</p>
                  <p>Status: {game.status}</p>
                </div>
                <Button 
                  onClick={() => navigate(`/spectate/${game.id}`)}
                >
                  Watch Game
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};