import { useEffect, useState, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useSocket } from '../hooks/useSocket';

interface Game {
  id: string;
  player1: string;
  player2: string;
  status: string;
  spectators: number;
}

export const FETCH_GAMES = "fetch_games";
export const GAMES_LIST = "games_list";

export const ActiveGames = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const fetchGames = () => {
      try {
        socket.send(JSON.stringify({ type: FETCH_GAMES }));
      } catch (err) {
        console.error('Error sending fetch games request:', err);
        setError('Failed to fetch games');
      }
    };

    // Initial fetch
    fetchGames();

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

    const handleError = (event: Event) => {
      console.error('WebSocket error:', event);
      setError('Connection error');
      setLoading(false);
    };

    socket.addEventListener('message', handleMessage);
    socket.addEventListener('error', handleError);

    // Fetch games every 3 seconds
    const interval = setInterval(fetchGames, 3000);

    return () => {
      socket.removeEventListener('message', handleMessage);
      socket.removeEventListener('error', handleError);
      clearInterval(interval);
    };
  }, [socket]);

  const handleWatchGame = (gameId: string) => {
    return (event?: MouseEvent<HTMLButtonElement>) => {
      if (event) {
        event.stopPropagation();
      }
      navigate(`/spectate/${gameId}`);
    };
  };

  if (!socket) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="text-white text-xl">Connecting to server...</div>
      </div>
    );
  }

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
            <Button onClick={() => window.location.reload()} className="mt-4">
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
                <div className="text-gray-300 mb-4">
                  <p className="text-lg font-semibold text-white">{game.player1} vs {game.player2}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className={`inline-block px-2 py-1 rounded ${
                      game.status === 'In Progress' ? 'bg-green-600' :
                      game.status === 'Check' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}>
                      {game.status}
                    </span>
                    <span className="text-sm">
                      {game.spectators} {game.spectators === 1 ? 'spectator' : 'spectators'}
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={handleWatchGame(game.id)}
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