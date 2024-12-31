import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { ChessBoard } from '../components/ChessBoard';
import { Button } from '../components/Button';
import { Timer } from '../components/Timer';
import { useSocket } from '../hooks/useSocket';

export const JOIN_SPECTATE = "join_spectate";
export const GAME_STATE = "game_state";
export const GAME_UPDATE = "game_update";
export const GAME_OVER = "game_over";

export const SpectateGame = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [chess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [whiteTime, setWhiteTime] = useState(0);
  const [blackTime, setBlackTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState<{ winner: string; reason: string } | null>(null);

  const handleGameMessage = useCallback((message: any) => {
    try {
      switch (message.type) {
        case GAME_STATE:
        case GAME_UPDATE:
          if (message.payload.fen) {
            chess.load(message.payload.fen);
            setBoard(chess.board());
            setWhiteTime(message.payload.whiteTime);
            setBlackTime(message.payload.blackTime);
          }
          break;
        case GAME_OVER:
          setGameOver({
            winner: message.payload.winner,
            reason: message.payload.reason
          });
          break;
      }
    } catch (err) {
      console.error('Error processing message:', err);
      setError('Failed to process game update');
    }
  }, [chess]);

  useEffect(() => {
    if (!socket || !gameId) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        handleGameMessage(message);
      } catch (err) {
        console.error('Error parsing message:', err);
        setError('Failed to process server message');
      }
    };

    // Join as spectator
    socket.send(JSON.stringify({
      type: JOIN_SPECTATE,
      payload: { gameId }
    }));

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
      socket.send(JSON.stringify({
        type: 'leave_spectate',
        payload: { gameId }
      }));
    };
  }, [socket, gameId, handleGameMessage]);

  if (!socket) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="text-white text-xl">Connecting to server...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center">
      <div className="w-full max-w-6xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Button onClick={() => navigate('/spectate')}>Back to Games</Button>
          <h1 className="text-2xl font-bold text-white">Spectating Game</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-4 flex flex-col items-center">
            <Timer seconds={whiteTime} isActive={chess.turn() === 'w'} />
            <div className="my-4">
              <ChessBoard
                chess={chess}
                board={board}
                setBoard={setBoard}
                socket={socket}
                playerColor="white"
                isSpectator={true}
              />
            </div>
            <Timer seconds={blackTime} isActive={chess.turn() === 'b'} />
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-slate-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Game Info</h2>
              <div className="text-gray-300 space-y-2">
                <p>Current Turn: {chess.turn() === 'w' ? 'White' : 'Black'}</p>
                <p>Move Number: {Math.floor(chess.moveNumber() / 2) + 1}</p>
                {chess.isCheck() && (
                  <p className="text-yellow-400 font-semibold">Check!</p>
                )}
                {chess.isCheckmate() && (
                  <p className="text-red-500 font-semibold">Checkmate!</p>
                )}
                {chess.isDraw() && (
                  <p className="text-blue-400 font-semibold">Draw!</p>
                )}
              </div>
            </div>

            {gameOver && (
              <div className="mt-4 bg-slate-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-2">Game Over</h3>
                <p className="text-gray-300">{gameOver.winner} wins!</p>
                <p className="text-gray-400 mt-1">{gameOver.reason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};