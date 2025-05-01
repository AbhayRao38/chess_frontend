import React, { useEffect, useState, useCallback } from "react";
import { Button } from "../components/Button";
import { ChessBoard } from "../components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { Chess } from 'chess.js';
import { Timer } from "../components/Timer";
import { useNavigate } from "react-router-dom";
import GameOverModal from "../components/GameOverModal";

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
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [gameOver, setGameOver] = useState<{ winner: string; reason: string } | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  useEffect(() => {
    if (!started || gameOver) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastUpdateTime) / 1000);
      setLastUpdateTime(now);
      if (chess.turn() === 'w') {
        setWhiteTime(prev => Math.max(0, Math.floor(prev - elapsed)));
      } else {
        setBlackTime(prev => Math.max(0, Math.floor(prev - elapsed)));
      }
      console.log('[Game] Fallback timer update:', {
        whiteTime: Math.floor(whiteTime),
        blackTime: Math.floor(blackTime),
        turn: chess.turn()
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, chess, gameOver, lastUpdateTime]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[Game] Received message:', message);
        switch (message.type) {
          case INIT_GAME:
            const newChess = new Chess();
            setChess(newChess);
            setBoard(newChess.board());
            setStarted(true);
            setPlayerColor(message.payload.color);
            setWhiteTime(Math.floor(message.payload.whiteTime || 600));
            setBlackTime(Math.floor(message.payload.blackTime || 600));
            setLastUpdateTime(Date.now());
            setGameOver(null);
            console.log('[Game] Initialized game:', message.payload);
            break;
          case MOVE:
            try {
              const move = message.payload?.move;
              if (!move || !move.from || !move.to) {
                console.warn('[Game] Invalid move payload:', message.payload);
                return;
              }
              const newChess = new Chess(chess.fen());
              console.log('[Game] Processing move:', move);
              const result = newChess.move(move);
              if (result) {
                setChess(newChess);
                setBoard(newChess.board());
                console.log('[Game] Applied move:', result);
              } else {
                console.error('[Game] Invalid move:', move);
              }
            } catch (error) {
              console.error('[Game] Error applying move:', error);
            }
            break;
          case GAME_UPDATE:
            try {
              const newChess = new Chess(message.payload.fen);
              setChess(newChess);
              setBoard(newChess.board());
              setWhiteTime(Math.floor(message.payload.whiteTime));
              setBlackTime(Math.floor(message.payload.blackTime));
              setLastUpdateTime(Date.now());
              console.log('[Game] Updated state:', {
                whiteTime: Math.floor(message.payload.whiteTime),
                blackTime: Math.floor(message.payload.blackTime),
                turn: newChess.turn(),
                fen: message.payload.fen
              });
            } catch (error) {
              console.error('[Game] Error updating state:', error);
            }
            break;
          case GAME_OVER:
            setGameOver({
              winner: message.payload.winner,
              reason: message.payload.reason
            });
            console.log('[Game] Game over:', message.payload);
            break;
          case 'error':
            console.error('[Game] Server error:', message.payload.message);
            break;
          default:
            console.warn('[Game] Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('[Game] Error processing message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, chess]);

  const handleInitGame = useCallback(() => {
    if (socket) {
      console.log('[Game] Sending INIT_GAME');
      socket.send(JSON.stringify({ type: INIT_GAME }));
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
                seconds={Math.floor(playerColor === 'white' ? whiteTime : blackTime)}
                isActive={chess.turn() === (playerColor === 'white' ? 'w' : 'b') && !gameOver}
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
                seconds={Math.floor(playerColor === 'white' ? blackTime : whiteTime)}
                isActive={chess.turn() === (playerColor === 'white' ? 'b' : 'w') && !gameOver}
              />
            </div>
          </div>
          <div className="lg:col-span-2 bg-slate-900 w-full rounded-lg p-6">
            <div className="flex flex-col gap-4">
              {!started && (
                <Button onClick={handleInitGame}>Play</Button>
              )}
              {!started && (
                <Button onClick={() => navigate('/')}>Back to Home</Button>
              )}
            </div>
          </div>
        </div>
        <GameOverModal
          isOpen={!!gameOver}
          winner={gameOver?.winner || null}
          reason={gameOver?.reason || ''}
          playerColor={playerColor}
          onClose={() => setGameOver(null)}
          onPlayAgain={handleInitGame}
          onGoHome={() => navigate('/')}
        />
      </div>
    </div>
  );
};