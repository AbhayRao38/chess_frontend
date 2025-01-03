import React, { useMemo } from 'react';
import { Chess } from 'chess.js';

interface MiniChessBoardProps {
  fen: string;
  lastMove?: { from: string; to: string };
}

export const MiniChessBoard: React.FC<MiniChessBoardProps> = ({ fen, lastMove }) => {
  const chess = useMemo(() => new Chess(fen), [fen]);
  const board = useMemo(() => chess.board(), [chess]);

  return (
    <div className="w-full aspect-square border border-slate-700 rounded-lg overflow-hidden">
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
                  ${(rowIndex + colIndex) % 2 === 0 ? 'bg-slate-600' : 'bg-slate-800'}
                  ${isLastMoveFrom ? 'bg-yellow-700' : ''}
                  ${isLastMoveTo ? 'bg-yellow-600' : ''}
                  flex items-center justify-center
                  transition-colors duration-200
                `}
              >
                {piece && (
                  <div 
                    className={`
                      text-2xl md:text-3xl lg:text-4xl
                      ${piece.color === 'w' ? 'text-gray-200' : 'text-gray-900'}
                    `}
                  >
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