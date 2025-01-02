import React from 'react';
import { Chess } from 'chess.js';

interface MiniChessBoardProps {
  fen: string;
  lastMove?: { from: string; to: string };
}

export const MiniChessBoard: React.FC<MiniChessBoardProps> = ({ fen, lastMove }) => {
  const chess = new Chess(fen);
  const board = chess.board();

  return (
    <div className="w-full aspect-square">
      <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
        {board.flatMap((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const square = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
            const isLastMoveFrom = lastMove && lastMove.from === square;
            const isLastMoveTo = lastMove && lastMove.to === square;
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  ${(rowIndex + colIndex) % 2 === 0 ? 'bg-gray-300' : 'bg-gray-600'}
                  ${isLastMoveFrom ? 'bg-yellow-200' : ''}
                  ${isLastMoveTo ? 'bg-yellow-400' : ''}
                  flex items-center justify-center
                `}
              >
                {piece && (
                  <div className="text-2xl md:text-3xl lg:text-4xl">
                    {getPieceSymbol(piece.type, piece.color)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

function getPieceSymbol(type: string, color: string): string {
  const symbols: { [key: string]: { [key: string]: string } } = {
    p: { w: '♙', b: '♟' },
    n: { w: '♘', b: '♞' },
    b: { w: '♗', b: '♝' },
    r: { w: '♖', b: '♜' },
    q: { w: '♕', b: '♛' },
    k: { w: '♔', b: '♚' },
  };
  return symbols[type][color];
}