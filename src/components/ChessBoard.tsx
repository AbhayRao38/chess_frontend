import React, { useState, useCallback } from "react";
import { Chess } from "chess.js";
import type { Color, PieceSymbol, Square } from "chess.js";
import { MOVE } from "../screens/Game";

interface ChessBoardProps {
  chess: Chess;
  setChess: React.Dispatch<React.SetStateAction<Chess>>;
  setBoard: React.Dispatch<React.SetStateAction<({
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null)[][]>>;
  board: ({
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null)[][];
  socket: WebSocket | null;
  playerColor: "white" | "black";
  isSpectator?: boolean;
}

const Square: React.FC<{
  square: { square: Square; type: PieceSymbol; color: Color } | null;
  squareRepresentation: Square;
  isSelected: boolean;
  isPossibleMove: boolean;
  isSpectator: boolean;
  isPlayerTurn: boolean;
  socket: WebSocket | null;
  onClick: () => void;
}> = ({ square, squareRepresentation, isSelected, isPossibleMove, isSpectator, isPlayerTurn, socket, onClick }) => (
  <div
    onClick={onClick}
    className={`
      w-16 h-16 flex justify-center items-center
      ${(squareRepresentation.charCodeAt(0) + parseInt(squareRepresentation[1])) % 2 === 0 ? 'bg-green-500' : 'bg-slate-500'}
      ${isSelected ? 'border-2 border-yellow-400' : ''}
      ${isSpectator || !socket || !isPlayerTurn ? 'cursor-not-allowed' : 'cursor-pointer'}
      transition-all duration-200
    `}
  >
    {isPossibleMove && (
      <div className="absolute w-3 h-3 bg-blue-400 rounded-full opacity-70"></div>
    )}
    {square && (
      <img
        className="w-6 transition-transform duration-200 hover:scale-110"
        src={`/${square.color === "b" ? square.type : `${square.type.toUpperCase()} copy`}.png`}
        alt={`${square.color} ${square.type}`}
      />
    )}
  </div>
);

export const ChessBoard: React.FC<ChessBoardProps> = ({
  chess,
  setChess,
  board,
  socket,
  setBoard,
  playerColor,
  isSpectator = false
}) => {
  const [from, setFrom] = useState<Square | null>(null);
  const [showPromotion, setShowPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const isPlayerTurn = chess.turn() === (playerColor === "white" ? "w" : "b");
  const displayBoard = playerColor === "black" ? [...board].reverse().map(row => [...row].reverse()) : board;

  const handleMove = useCallback((squareRepresentation: Square, promotion?: PieceSymbol) => {
    if (isSpectator || !isPlayerTurn || !socket) {
      console.log('[ChessBoard] Move ignored:', { isSpectator, isPlayerTurn, socket });
      return;
    }

    if (!from && !promotion) {
      const piece = chess.get(squareRepresentation);
      if (piece && piece.color === (playerColor === "white" ? "w" : "b")) {
        setFrom(squareRepresentation);
        console.log('[ChessBoard] Selected square:', squareRepresentation);
      }
      return;
    }

    const move = { from: from!, to: squareRepresentation, promotion };
    console.log('[ChessBoard] Attempting move:', move);

    try {
      const newChess = new Chess(chess.fen());
      const moves = chess.moves({ square: from!, verbose: true });
      const isPromotion = !promotion && moves.some(m => m.to === squareRepresentation && m.flags.includes('p'));

      if (isPromotion) {
        setShowPromotion({ from: from!, to: squareRepresentation });
        return;
      }

      const result = newChess.move(move);
      if (result) {
        setChess(newChess);
        setBoard(newChess.board());
        const moveMessage = { type: MOVE, payload: { move: { from: move.from, to: move.to, promotion } } };
        socket.send(JSON.stringify(moveMessage));
        console.log('[ChessBoard] Sent move to server:', moveMessage);
        setFrom(null);
        setShowPromotion(null);
      } else {
        console.error('[ChessBoard] Invalid move:', move);
      }
    } catch (error) {
      console.error('[ChessBoard] Error applying move:', error);
    }
  }, [from, chess, isPlayerTurn, isSpectator, playerColor, setBoard, setChess, socket]);

  return (
    <div className="flex flex-col items-center">
      {displayBoard.map((row, i) => (
        <div key={i} className="flex">
          {row.map((square, j) => {
            const squareRepresentation = playerColor === "black"
              ? String.fromCharCode(104 - (j % 8)) + "" + (i + 1) as Square
              : String.fromCharCode(97 + (j % 8)) + "" + (8 - i) as Square;
            const isPossibleMove = from ? chess.moves({ square: from }).some(m => m.includes(squareRepresentation)) : false;

            return (
              <Square
                key={j}
                square={square}
                squareRepresentation={squareRepresentation}
                isSelected={from === squareRepresentation}
                isPossibleMove={isPossibleMove}
                isSpectator={isSpectator}
                isPlayerTurn={isPlayerTurn}
                socket={socket}
                onClick={() => handleMove(squareRepresentation)}
              />
            );
          })}
        </div>
      ))}
      {!isSpectator && (
        <div className={`mt-4 text-lg font-semibold px-4 py-2 rounded ${isPlayerTurn ? 'bg-green-600' : 'bg-slate-700'}`}>
          {isPlayerTurn ? "Your turn" : "Opponent's turn"}
        </div>
      )}
      {showPromotion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg flex flex-col gap-4">
            <h3 className="text-white text-lg font-bold">Promote Pawn</h3>
            <div className="flex gap-4">
              {(['q', 'r', 'n', 'b'] as PieceSymbol[]).map(piece => (
                <button
                  key={piece}
                  onClick={() => handleMove(showPromotion.to, piece)}
                  className="w-16 h-16 bg-slate-700 rounded hover:bg-slate-600"
                >
                  <img
                    src={`/${playerColor === "white" ? piece.toUpperCase() + ' copy' : piece}.png`}
                    alt={`${playerColor} ${piece}`}
                    className="w-10 h-10 mx-auto"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};