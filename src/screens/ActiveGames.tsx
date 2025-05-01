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
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const fetchGames = useCallback(() => {
    if (!socket || !isConnected) {
      console.error('[ActiveGames] Cannot fetch games: socket not connected');
      setError('Not connected to server');
      setLoading(false);
      return;
    }
    try {
      const message = { type: FETCH_GAMES };
      console.log('[ActiveGames] Sending FETCH_GAMES:', message);
      socket.send(JSON.stringify(message));
      setLastUpdate(new Date());
    } catch (err) {
      console.error('[ActiveGames] Error sending FETCH_GAMES:', err);
      setError('Failed to fetch games');
      setLoading(false);
    }
  }, [socket, isConnected]);

  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading && retryCount < maxRetries) {
        console.warn('[ActiveGames] Loading timeout reached, retrying:', retryCount + 1);
        setRetryCount(prev => prev + 1);
        fetchGames();
      } else if (loading) {
        console.error('[ActiveGames] Max retries reached');
        setLoading(false);
        setError('No games received from server');
      }
    }, 15000);
    return () => clearTimeout(loadingTimeout);
  }, [loading, retryCount, fetchGames]);

  useEffect(() => {
    if (!socket || !isConnected) {
      console.warn('[ActiveGames] Socket not connected, skipping effect');
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[ActiveGames] Received message:', message);

        if (message.type === GAMES_LIST || message.type === GAME_STATES_UPDATE) {
          console.log('[ActiveGames] Updating games:', message.payload.games);
          setGames(message.payload.games || []);
          setLoading(false);
          setError(null);
          setRetryCount(0);
          setLastUpdate(new Date());
        } else if (message.type === 'ping') {
          console.log('[ActiveGames] Received ping');
        } else if (message.type === 'error') {
          console.error('[ActiveGames] Server error:', message.payload.message);
          setError(message.payload.message);
          setLoading(false);
        } else {
          console.warn('[ActiveGames] Unknown message type:', message.type);
        }
      } catch (err) {
        console.error('[ActiveGames] Error processing message:', err);
        setError('Failed to process server response');
        setLoading(false);
      }
    };

    console.log('[ActiveGames] Adding message listener');
    socket.addEventListener('message', handleMessage);
    fetchGames();
    const interval = setInterval(fetchGames, 30000);
    return () => {
      console.log('[ActiveGames] Cleaning up listener and interval');
      socket.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [socket, isConnected, fetchGames]);

  const handleWatchGame = useCallback((gameId: string) => () => {
    console.log('[ActiveGames] Navigating to spectate game:', gameId);
    navigate(`/spectate/${gameId}`);
  }, [navigate]);

  const handleStartNewGame = useCallback(() => {
    console.log('[ActiveGames] Starting new game');
    navigate('/game');
  }, [navigate]);

  console.log('[ActiveGames] Rendering state:', { games, loading, error, lastUpdate });

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
              setRetryCount(0);
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