import React from 'react';
import { PieceSymbol } from 'chess.js';

interface PromotionModalProps {
  onSelect: (piece: PieceSymbol) => void;
  color: 'w' | 'b';
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ onSelect, color }) => {
  const pieces: PieceSymbol[] = ['q', 'r', 'b', 'n'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-center">Choose promotion piece</h2>
        <div className="flex justify-center space-x-4">
          {pieces.map((piece) => (
            <button
              key={piece}
              onClick={() => onSelect(piece)}
              className="w-16 h-16 bg-slate-200 hover:bg-slate-300 rounded-lg flex items-center justify-center"
            >
              <img
                src={`/${color === 'w' ? piece.toUpperCase() + ' copy' : piece}.png`}
                alt={`${color === 'w' ? 'White' : 'Black'} ${piece}`}
                className="w-12 h-12"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};