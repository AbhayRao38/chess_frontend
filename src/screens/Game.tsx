import React, { useEffect, useState, useCallback } from "react";
import { Button } from "../components/Button";
import { ChessBoard } from "../components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { Chess } from 'chess.js';
import { Timer } from "../components/Timer";
import { useNavigate } from "react-router-dom";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const GAME_UPDATE = "game_update";

export const Game: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [started, setStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [whiteTime, setWhiteTime] = useState(600); // 10 minutes
  const [blackTime, setBlackTime] = useState(600); // 10 minutes
  const [gameOver, setGameOver] = useState<{ winner: string; reason: string } | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received game message:', message);
        switch (message.type) {
          case INIT_GAME:
            const newChess = new Chess();
            setChess(newChess);
            setBoard(newChess.board());
            setStarted(true);
            setPlayerColor(message.payload.color);
            setWhiteTime(600);
            setBlackTime(600);
            setGameOver(null); // Reset game over state
            console.log('Game initialized:', message.payload);
            break;
          case MOVE:
            try {
              const newChess = new Chess(chess.fen());
              console.log('Received move payload:', message.payload);
              if (message.payload) {
                // Handle both new and old message formats
                const move = message.payload.move ? {
                  from: message.payload.move.from,
                  to: message.payload.move.to,
                  promotion: message.payload.move.promotion
                } : {
                  from: message.payload.from,
                  to: message.payload.to,
                  promotion: message.payload.promotion
                };
                console.log('Applying move:', move);
                const result = newChess.move(move);
                if (result) {
                  setChess(newChess);
                  setBoard(newChess.board());
                  console.log('Move applied successfully:', result);
                } else {
                  console.error('Invalid move:', move, 'FEN:', newChess.fen());
                }
              } else {
                console.error('Invalid move payload received:', message.payload);
              }
            } catch (error) {
              console.error('Error applying move:', error);
            }
            break;
          case GAME_UPDATE:
            try {
              const newChess = new Chess(message.payload.fen);
              setChess(newChess);
              setBoard(newChess.board());
              setWhiteTime(message.payload.whiteTime);
              setBlackTime(message.payload.blackTime);
              console.log('Game state updated:', { 
                whiteTime: message.payload.whiteTime, 
                blackTime: message.payload.blackTime, 
                turn: newChess.turn(),
                fen: message.payload.fen 
              });
            } catch (error) {
              console.error('Error updating game state:', error);
            }
            break;
          case GAME_OVER:
            setGameOver({
              winner: message.payload.winner,
              reason: message.payload.reason
            });
            console.log('Game over:', message.payload);
            break;
          case 'error':
            console.error('Game error:', message.payload.message);
            break;
          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, chess]);

  const handleInitGame = useCallback(() => {
    if (socket) {
      socket.send(JSON.stringify({
        type: INIT_GAME
      }));
    }
  }, [socket]);

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
              <Timer 
                seconds={whiteTime} 
                isActive={chess.turn() === 'w' && !gameOver}
              />
            </div>
            <ChessBoard 
              chess={chess} 
              setChess={setChess}
              setBoard={setBoard} 
              socket={socket} 
              board={board}
              playerColor={playerColor}
            />
            <div className="mt-4">
              <Timer 
                seconds={blackTime}
                isActive={chess.turn() === 'b' && !gameOver}
              />
            </div>
            {gameOver && (
              <div className="text-white text-center p-4 bg-slate-800 rounded-lg mt-4">
                <h3 className="text-xl font-bold mb-2">Game Over</h3>
                <p className="mb-2">{gameOver.winner} wins!</p>
                <p className="text-gray-400">{gameOver.reason}</p>
                <Button onClick={handleInitGame} className="mt-4">
                  Play Again
                </Button>
              </div>
            )}
          </div>
          <div className="lg:col-span-2 bg-slate-900 w-full rounded-lg p-6">
            <div className="flex flex-col gap-4">
              {!started && (
                <Button onClick={handleInitGame}>
                  Play
                </Button>
              )}
              {!started && (
                <Button onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};