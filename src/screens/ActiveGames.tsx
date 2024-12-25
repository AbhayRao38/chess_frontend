import { useEffect, useState, useCallback } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(() => {
    if (!socket) return;

    try {
      socket.send(JSON.stringify({ type: FETCH_GAMES }));
    } catch (err) {
      console.error('Error sending fetch games request:', err);
      setError('Failed to fetch games');
    }
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === GAMES_LIST) {
          setGames(message.payload.games);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error processing message:', err);
        setError('Failed to process server response');
        setLoading(false);
      }
    };

    const handleError = () => {
      setError('Connection error');
      setLoading(false);
    };

    socket.addEventListener('message', handleMessage);
    socket.addEventListener('error', handleError);

    fetchGames();
    const interval = setInterval(fetchGames, 5000);

    return () => {
      socket.removeEventListener('message', handleMessage);
      socket.removeEventListener('error', handleError);
      clearInterval(interval);
    };
  }, [socket, fetchGames]);

  if (!socket) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="text-white text-xl">Connecting to server...</div>
      </div>
    );
  }

  const handleWatchGame = useCallback((gameId: string) => {
    navigate(`/spectate/${gameId}`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center">
      <div className="w-full max-w-4xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Active Games</h1>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>

        {error ? (
          <div className="text-center text-red-400 py-12">
            <p className="text-xl">{error}</p>
            <Button 
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchGames();
              }} 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-xl">Loading games...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-xl">No active games at the moment</p>
            <p className="mt-2">Start a new game or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <div 
                key={game.id}
                className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors"
              >
                <h3 className="text-xl font-semibold text-white mb-4">Game {game.id}</h3>
                <div className="text-gray-300 mb-4">
                  <p>Player 1: {game.player1}</p>
                  <p>Player 2: {game.player2}</p>
                  <p className="mt-2">
                    <span className={`inline-block px-2 py-1 rounded ${
                      game.status === 'In Progress' ? 'bg-green-600' :
                      game.status === 'Check' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}>
                      {game.status}
                    </span>
                  </p>
                </div>
                <Button 
                  onClick={() => handleWatchGame(game.id)}
                  className="w-full"
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