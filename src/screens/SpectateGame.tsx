import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Chess } from 'chess.js';
import { ChessBoard } from "../components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { Button } from "../components/Button";
import { Timer } from "../components/Timer";
import GameOverModal from "../components/GameOverModal";

export const GAME_STATE = "game_state";
export const GAME_UPDATE = "game_update";
export const MOVE = "move";
export const GAME_OVER = "game_over";

export const SpectateGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [gameOver, setGameOver] = useState<{ winner: string; reason: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGameMessage = useCallback((message: any) => {
    console.log('[SpectateGame] Received message:', message);
    switch (message.type) {
      case GAME_STATE:
      case GAME_UPDATE:
        try {
          const newChess = new Chess(message.payload.fen);
          setChess(newChess);
          setBoard(newChess.board());
          setWhiteTime(message.payload.whiteTime || 600);
          setBlackTime(message.payload.blackTime || 600);
          setError(null);
          console.log('[SpectateGame] Updated state:', {
            whiteTime: message.payload.whiteTime,
            blackTime: message.payload.blackTime,
            turn: newChess.turn(),
            fen: message.payload.fen
          });
        } catch (error) {
          console.error('[SpectateGame] Error updating state:', error);
          setError('Failed to update game state');
        }
        break;
      case MOVE:
        try {
          const newChess = new Chess(chess.fen());
          const move = message.payload.move;
          console.log('[SpectateGame] Processing move:', move);
          if (!move || !move.from || !move.to) {
            throw new Error('Invalid move payload');
          }
          const result = newChess.move(move);
          if (result) {
            setChess(newChess);
            setBoard(newChess.board());
            console.log('[SpectateGame] Applied move:', result);
          } else {
            console.error('[SpectateGame] Invalid move:', move);
          }
        } catch (error) {
          console.error('[SpectateGame] Error applying move:', error);
        }
        break;
      case GAME_OVER:
        setGameOver({
          winner: message.payload.winner,
          reason: message.payload.reason
        });
        console.log('[SpectateGame] Game over:', message.payload);
        break;
      case 'error':
        console.error('[SpectateGame] Server error:', message.payload.message);
        setError(message.payload.message);
        break;
      default:
        console.warn('[SpectateGame] Unknown message type:', message.type);
    }
  }, [chess]);

  const joinSpectate = useCallback(() => {
    if (socket && gameId) {
      const joinMessage = {
        type: "join_spectate",
        payload: { gameId }
      };
      console.log('[SpectateGame] Sending JOIN_SPECTATE:', joinMessage);
      socket.send(JSON.stringify(joinMessage));
    }
  }, [socket, gameId]);

  useEffect(() => {
    if (!socket) return;

    const handleOpen = () => {
      console.log('[SpectateGame] WebSocket opened, joining game');
      joinSpectate();
    };

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        handleGameMessage(message);
      } catch (error) {
        console.error('[SpectateGame] Error processing message:', error);
        setError('Failed to process server message');
      }
    };

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('message', handleMessage);

    if (socket.readyState === WebSocket.OPEN) {
      joinSpectate();
    }

    return () => {
      socket.removeEventListener('open', handleOpen);
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, joinSpectate, handleGameMessage]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Connecting to server...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
        <Button onClick={() => navigate('/spectate')} className="mt-4">Try Another Game</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center">
      <div className="pt-8 max-w-screen-lg w-full px-4">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 w-full">
          <div className="lg:col-span-4 w-full flex flex-col items-center">
            <div className="mb-4">
              <Timer seconds={whiteTime} isActive={chess.turn() === 'w' && !gameOver} />
            </div>
            <ChessBoard 
              chess={chess}
              setChess={setChess}
              setBoard={setBoard} 
              socket={socket} 
              board={board}
              playerColor="white"
              isSpectator={true}
            />
            <div className="mt-4">
              <Timer seconds={blackTime} isActive={chess.turn() === 'b' && !gameOver} />
            </div>
          </div>
          <div className="lg:col-span-2 bg-slate-900 w-full rounded-lg p-6">
            <div className="flex flex-col gap-4">
              <Button onClick={() => navigate('/')}>Back to Home</Button>
              <Button onClick={() => navigate('/spectate')}>Watch Another Game</Button>
            </div>
          </div>
        </div>
        <GameOverModal
          isOpen={!!gameOver}
          winner={gameOver?.winner || null}
          reason={gameOver?.reason || ''}
          playerColor=""
          onClose={() => setGameOver(null)}
          onPlayAgain={() => navigate('/spectate')}
          onGoHome={() => navigate('/')}
        />
      </div>
    </div>
  );
};