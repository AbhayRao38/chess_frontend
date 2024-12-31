import React from 'react';
import { Button } from './Button';

interface GameOverPopupProps {
  winner: string;
  playerColor: "white" | "black";
  onClose: () => void;
}

export const GameOverPopup: React.FC<GameOverPopupProps> = ({ winner, playerColor, onClose }) => {
  const isWinner = (winner === 'white' && playerColor === 'white') || (winner === 'black' && playerColor === 'black');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-4">
          {isWinner ? 'Congratulations!' : 'Game Over'}
        </h2>
        <p className="text-xl mb-6">
          {isWinner ? 'You won!' : 'Better luck next time!'}
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};