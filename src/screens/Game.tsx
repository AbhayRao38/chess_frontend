import React, { useCallback, useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '../components/ChessBoard';
import { Timer } from '../components/Timer';
import { useSocket } from '../hooks/useSocket';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';

export const INIT_GAME = 'INIT_GAME';
export const MOVE = 'MOVE';
export const GAME_UPDATE = 'GAME_UPDATE';
export const GAME_OVER = 'GAME_OVER';
export const JOIN_SPECTATE = 'JOIN_SPECTATE';

const Game: React.FC = () => {
  const [chess, setChess] = useState<Chess>(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [started, setStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState<"white" | "black" | null>(null);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [gameOver, setGameOver] = useState<{ winner: string; reason: string } | null>(null);
  const { socket, isConnected } = useSocket();
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const isSpectator = gameId !== undefined;

  const handleGameMessage = useCallback((message: any) => {
    console.log('Received game message:', message);
    switch (message.type) {
      case INIT_GAME:
        setChess(new Chess());
        setBoard(chess.board());
        setStarted(true);
        setPlayerColor(message.payload.color);
        setWhiteTime(600);
        setBlackTime(600);
        console.log('Game initialized:', message.payload);
        break;
      case MOVE:
        try {
          const newChess = new Chess(chess.fen());
          if (message.payload && message.payload.move) {
            const result = newChess.move(message.payload.move);
            if (result) {
              setChess(newChess);
              setBoard(newChess.board());
              console.log('Move applied:', result);
            } else {
              console.error('Invalid move:', message.payload.move);
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
          if (message.payload.isCheck) {
            // Handle check state
          }
          if (message.payload.isCheckmate || message.payload.isDraw) {
            setGameOver({
              winner: message.payload.turn === 'w' ? 'Black' : 'White',
              reason: message.payload.isCheckmate ? 'Checkmate' : 'Draw'
            });
          }
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
      default:
        console.warn('Unknown message type:', message.type);
    }
  }, [chess]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      handleGameMessage(message);
    };

    socket.addEventListener('message', handleMessage);

    if (isSpectator && gameId) {
      socket.send(JSON.stringify({
        type: JOIN_SPECTATE,
        payload: { gameId }
      }));
    } else if (!isSpectator) {
      socket.send(JSON.stringify({ type: INIT_GAME }));
    }

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, handleGameMessage, isSpectator, gameId]);

  if (!isConnected) {
    return <div>Connecting to server...</div>;
  }

  if (!started && !isSpectator) {
    return <div>Waiting for opponent...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <Timer seconds={blackTime} isActive={chess.turn() === 'b'} />
          <div className="text-2xl font-bold">
            {gameOver ? `Game Over - ${gameOver.winner} wins by ${gameOver.reason}` : 'Chess Game'}
          </div>
          <Timer seconds={whiteTime} isActive={chess.turn() === 'w'} />
        </div>
        <ChessBoard
          chess={chess}
          setChess={setChess}
          board={board}
          setBoard={setBoard}
          socket={socket}
          playerColor={playerColor || "white"}
          isSpectator={isSpectator}
        />
        {gameOver && (
          <div className="mt-4 text-center">
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;