import React from 'react';
import { Button } from './Button';

interface GameOverModalProps {
  isOpen: boolean;
  winner: string | null;
  reason: string;
  playerColor: string;
  onClose: () => void;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  reason,
  playerColor,
  onClose,
  onPlayAgain,
  onGoHome,
}) => {
  if (!isOpen) return null;

  const isWinner = winner === playerColor;
  const message = winner
    ? isWinner
      ? 'Game Over: You Won!'
      : 'Game Over: You Lost'
    : 'Game Over: Draw';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 text-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-2">{message}</h2>
        <p className="text-gray-400 mb-4">{reason}</p>
        <div className="flex justify-between gap-2">
          <Button onClick={onPlayAgain} className="bg-blue-500 hover:bg-blue-600">
            Play Again
          </Button>
          <Button onClick={onGoHome} className="bg-gray-500 hover:bg-gray-600">
            Go Home
          </Button>
          <Button onClick={onClose} className="bg-red-500 hover:bg-red-600">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;