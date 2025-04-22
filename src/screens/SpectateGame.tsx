import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Chess } from 'chess.js';
import { ChessBoard } from "../components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { Button } from "../components/Button";
import { Timer } from "../components/Timer";

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

  const handleGameMessage = useCallback((message: any) => {
    console.log('Received game message:', message);
    switch (message.type) {
      case GAME_STATE:
      case GAME_UPDATE:
        try {
          const newChess = new Chess(message.payload.fen);
          setChess(newChess);
          setBoard(newChess.board());
          setWhiteTime(message.payload.whiteTime);
          setBlackTime(message.payload.blackTime);
          console.log('Game state updated:', message.payload);
        } catch (error) {
          console.error('Error updating game state:', error);
        }
        break;
      case MOVE:
        try {
          const newChess = new Chess(chess.fen());
          const move = newChess.move(message.payload.move);
          if (move) {
            setChess(newChess);
            setBoard(newChess.board());
            console.log('Move applied:', move);
          } else {
            console.error('Invalid move received:', message.payload.move);
          }
        } catch (error) {
          console.error('Error applying move:', error);
        }
        break;
      case GAME_OVER:
        setGameOver({
          winner: message.payload.winner,
          reason: message.payload.reason
        });
        console.log('Game over:', message.payload);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }, [chess]);

  const joinSpectate = useCallback(() => {
    if (socket && gameId) {
      socket.send(JSON.stringify({
        type: "join_spectate",
        payload: { gameId }
      }));
    }
  }, [socket, gameId]);

  useEffect(() => {
    if (!socket) return;

    const handleOpen = () => {
      joinSpectate();
    };

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        handleGameMessage(message);
      } catch (error) {
        console.error('Error processing message:', error);
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
            {gameOver && (
              <div className="text-white text-center p-4 bg-slate-800 rounded-lg mt-4">
                <h3 className="text-xl font-bold mb-2">Game Over</h3>
                <p className="mb-2">{gameOver.winner} wins!</p>
                <p className="text-gray-400">{gameOver.reason}</p>
                <Button onClick={() => navigate('/spectate')} className="mt-4">
                  Watch Another Game
                </Button>
              </div>
            )}
          </div>
          <div className="lg:col-span-2 bg-slate-900 w-full rounded-lg p-6">
            <div className="flex flex-col gap-4">
              <Button onClick={() => navigate('/')}>
                Back to Home
              </Button>
              <Button onClick={() => navigate('/spectate')}>
                Watch Another Game
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};