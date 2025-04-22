import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useSocket } from '../hooks/useSocket';
import { MiniChessBoard } from '../components/MiniChessBoard';

export const FETCH_GAMES = "fetch_games";
export const GAMES_LIST = "games_list";
export const GAME_STATES_UPDATE = "game_states_update";

interface Game {
  id: string;
  fen: string;
  turn: 'w' | 'b';
  status: string;
  lastMove?: {
    from: string;
    to: string;
  };
}

export const ActiveGames: React.FC = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchGames = useCallback(() => {
    if (!socket || !isConnected) {
      console.error("Cannot fetch games: Socket not connected");
      setError("Not connected to server");
      setLoading(false);
      return;
    }
    
    try {
      const message = JSON.stringify({ type: FETCH_GAMES });
      console.log("Sending FETCH_GAMES message:", message);
      socket.send(message);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error sending FETCH_GAMES:', err);
      setError('Failed to fetch games');
      setLoading(false);
    }
  }, [socket, isConnected]);

  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Loading timeout reached. No games received.");
        setLoading(false);
        setError("No games received from server");
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(loadingTimeout);
  }, [loading]);

  useEffect(() => {
    if (!socket || !isConnected) {
      console.warn("Socket not connected, skipping effect");
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        console.log("Raw message received in ActiveGames:", event.data);
        const message = JSON.parse(event.data);
        console.log("Parsed message in ActiveGames:", message);

        if (message.type === GAMES_LIST || message.type === GAME_STATES_UPDATE) {
          console.log(`Received ${message.type}:`, message.payload.games);
          setGames(message.payload.games || []);
          setLoading(false);
          setError(null);
          setLastUpdate(new Date());
        } else if (message.type === 'ping') {
          console.log("Received ping from server");
        } else {
          console.warn("Received unknown message type:", message.type);
        }
      } catch (err) {
        console.error('Error processing message:', err);
        setError('Failed to process server response');
        setLoading(false);
      }
    };

    console.log("Adding message event listener");
    socket.addEventListener('message', handleMessage);
    console.log("Calling fetchGames");
    fetchGames();

    // Fetch games periodically
    console.log("Setting up interval for fetchGames");
    const interval = setInterval(fetchGames, 5000);

    return () => {
      console.log("Cleaning up effect");
      socket.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [socket, isConnected, fetchGames]);

  const handleWatchGame = useCallback((gameId: string) => () => {
    navigate(`/spectate/${gameId}`);
  }, [navigate]);

  const handleStartNewGame = useCallback(() => {
    navigate('/game');
  }, [navigate]);

  console.log("Raw games data:", JSON.stringify(games, null, 2));
  console.log("Rendering ActiveGames. State:", { games, loading, error, lastUpdate });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Connecting to server...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center">
      <div className="w-full max-w-7xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Active Games</h1>
            {lastUpdate && (
              <p className="text-gray-400 text-sm mt-1">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <Button onClick={handleStartNewGame}>Start New Game</Button>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-xl">Loading games...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-12">
            <p className="text-xl">{error}</p>
            <Button onClick={() => {
              setError(null);
              setLoading(true);
              fetchGames();
            }} className="mt-4">
              Retry
            </Button>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-xl">No active games found</p>
            <p className="mt-2">Start a new game or check back later</p>
            <Button onClick={handleStartNewGame} className="mt-4">
              Start New Game
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {games.map((game) => (
              <div 
                key={game.id}
                className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-all duration-200 transform hover:-translate-y-1"
              >
                <h3 className="text-lg font-semibold text-white mb-2">Game {game.id}</h3>
                <MiniChessBoard fen={game.fen} lastMove={game.lastMove} />
                <div className="text-gray-300 mt-2 flex justify-between items-center">
                  <span className={`
                    inline-block px-2 py-1 rounded text-sm
                    ${game.status === 'In Progress' ? 'bg-green-600' :
                      game.status === 'Check' ? 'bg-yellow-600' :
                      'bg-red-600'}
                  `}>
                    {game.status}
                  </span>
                  <span className="text-sm">
                    Turn: {game.turn === 'w' ? 'White' : 'Black'}
                  </span>
                </div>
                <Button 
                  onClick={handleWatchGame(game.id)}
                  className="w-full mt-2"
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