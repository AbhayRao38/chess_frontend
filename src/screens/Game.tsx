import React, { useEffect, useState, useCallback } from "react";
import { Button } from "../components/Button"
import { ChessBoard } from "../components/ChessBoard"
import { useSocket } from "../hooks/useSocket";
import { Chess } from 'chess.js'
import { Timer } from "../components/Timer";
import { useNavigate } from "react-router-dom";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";

export const Game: React.FC = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [started, setStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [whiteTime, setWhiteTime] = useState(0);
  const [blackTime, setBlackTime] = useState(0);
  const [gameOver, setGameOver] = useState<{ winner: string; reason: string } | null>(null);

  useEffect(() => {
    if (!started) return;

    const interval = setInterval(() => {
      if (chess.turn() === 'w') {
        setWhiteTime(prev => prev + 1);
      } else {
        setBlackTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [started, chess]);

  const handleGameMessage = useCallback((message: any) => {
    console.log('Received game message:', message);
    switch (message.type) {
      case INIT_GAME:
        setChess(new Chess());
        setBoard(chess.board());
        setStarted(true);
        setPlayerColor(message.payload.color);
        setWhiteTime(0);
        setBlackTime(0);
        console.log('Game initialized:', message.payload);
        break;
      case MOVE:
        try {
          const newChess = new Chess(chess.fen());
          console.log('Received move:', message.payload.move);
          console.log('Current FEN before move:', newChess.fen());
          if (message.payload.move) {
            const move = newChess.move(message.payload.move);
            if (move) {
              console.log('Move applied successfully:', move);
              console.log('New FEN after move:', newChess.fen());
              setChess(newChess);
              setBoard(newChess.board());
            } else {
              console.error('Invalid move received:', message.payload.move);
              console.log('Current board state:', newChess.fen());
            }
          } else {
            console.error('No move data received in payload');
          }
        } catch (error) {
          console.error('Error applying move:', error);
          console.log('Full message payload:', message.payload);
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
  }, [chess]);

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleGameMessage(message);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    return () => {
      socket.onmessage = null;
    };
  }, [socket, handleGameMessage]);

  useEffect(() => {
    console.log('Board updated:', board);
  }, [board]);

  useEffect(() => {
    console.log('Current game state:', {
      playerColor,
      currentTurn: chess.turn(),
      fen: chess.fen(),
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isDraw: chess.isDraw()
    });
  }, [chess, playerColor]);

  if (!socket) {
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
                seconds={playerColor === "black" ? whiteTime : blackTime} 
                isActive={chess.turn() === (playerColor === "black" ? "w" : "b")}
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
                seconds={playerColor === "white" ? whiteTime : blackTime}
                isActive={chess.turn() === (playerColor === "white" ? "w" : "b")}
              />
            </div>
          </div>
          <div className="lg:col-span-2 bg-slate-900 w-full rounded-lg p-6">
            <div className="flex flex-col gap-4">
              {!started && (
                <Button onClick={() => {
                  socket.send(JSON.stringify({
                    type: INIT_GAME
                  }));
                }}>
                  Play
                </Button>
              )}
              {!started && (
                <Button onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              )}
              {gameOver && (
                <div className="text-white text-center p-4 bg-slate-800 rounded-lg">
                  <h3 className="text-xl font-bold mb-2">Game Over</h3>
                  <p className="mb-2">{gameOver.winner} wins!</p>
                  <p className="text-gray-400">{gameOver.reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};