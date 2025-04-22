import React, { useState, useCallback } from "react";
import { Chess, Color, PieceSymbol, Square } from "chess.js";
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
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [showPromotion, setShowPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const isPlayerTurn = chess.turn() === (playerColor === "white" ? "w" : "b");
  const displayBoard = playerColor === "black" ? [...board].reverse().map(row => [...row].reverse()) : board;

  const handlePromotion = useCallback((promotion: PieceSymbol) => {
    if (!showPromotion || !socket) return;

    try {
      const move = {
        from: showPromotion.from,
        to: showPromotion.to,
        promotion
      };

      const newChess = new Chess(chess.fen());
      const result = newChess.move(move);

      if (result) {
        setChess(newChess);
        setBoard(newChess.board());
        socket.send(JSON.stringify({
          type: MOVE,
          payload: { move: result }
        }));
        console.log('Move with promotion sent to server:', result);
      } else {
        console.error('Invalid move:', move);
      }
    } catch (error) {
      console.error('Error applying move:', error);
    }

    setShowPromotion(null);
    setFrom(null);
    setSelectedSquare(null);
  }, [showPromotion, chess, setChess, setBoard, socket]);

  const handleSquareClick = useCallback((squareRepresentation: Square) => {
    if (isSpectator || !isPlayerTurn || !socket) return;

    if (!from) {
      const piece = chess.get(squareRepresentation);
      if (piece && piece.color === (playerColor === "white" ? "w" : "b")) {
        setFrom(squareRepresentation);
        setSelectedSquare(squareRepresentation);
      }
    } else {
      const moves = chess.moves({ square: from, verbose: true });
      const isPromotion = moves.some(move => 
        move.to === squareRepresentation && move.flags.includes('p')
      );

      if (isPromotion) {
        setShowPromotion({ from, to: squareRepresentation });
      } else {
        try {
          const move = {
            from,
            to: squareRepresentation
          };

          const newChess = new Chess(chess.fen());
          const result = newChess.move(move);

          if (result) {
            setChess(newChess);
            setBoard(newChess.board());
            socket.send(JSON.stringify({
              type: MOVE,
              payload: { move: result }
            }));
            console.log('Move sent to server:', result);
          } else {
            console.error('Invalid move:', move);
          }
        } catch (error) {
          console.error('Error applying move:', error);
        }

        setFrom(null);
        setSelectedSquare(null);
      }
    }
  }, [from, chess, isPlayerTurn, isSpectator, playerColor, setBoard, setChess, socket]);

  const getPieceImagePath = (piece: { color: Color; type: PieceSymbol }) => {
    return `/${piece.color === "b" ? piece.type : `${piece.type.toUpperCase()} copy`}.png`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-white-200">
        {displayBoard.map((row, i) => (
          <div key={i} className="flex">
            {row.map((square, j) => {
              const squareRepresentation = playerColor === "black"
                ? String.fromCharCode(104 - (j % 8)) + "" + (i + 1) as Square
                : String.fromCharCode(97 + (j % 8)) + "" + (8 - i) as Square;

              const isSelected = selectedSquare === squareRepresentation;
              const isPossibleMove = from && chess.moves({ square: from }).some(
                move => move.includes(squareRepresentation)
              );

              return (
                <div 
                  onClick={() => handleSquareClick(squareRepresentation)}
                  key={j} 
                  className={`
                    w-16 h-16 relative
                    ${(i+j)%2 === 0 ? 'bg-green-500' : 'bg-slate-500'}
                    ${isSelected ? 'border-2 border-yellow-400' : ''}
                    ${isSpectator || !socket ? 'cursor-not-allowed' : (!isPlayerTurn ? 'cursor-not-allowed' : 'cursor-pointer')}
                    transition-all duration-200
                  `}
                >
                  {isPossibleMove && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3 h-3 bg-blue-400 rounded-full opacity-70"></div>
                    </div>
                  )}
                  <div className="w-full justify-center flex h-full">
                    <div className="h-full justify-center flex flex-col">
                      {square && (
                        <img 
                          className="w-6 transition-transform duration-200 hover:scale-110" 
                          src={getPieceImagePath(square)}
                          alt={`${square.color} ${square.type}`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {!isSpectator && (
        <div className={`
          mt-4 text-lg font-semibold px-4 py-2 rounded
          ${isPlayerTurn ? 'bg-green-600' : 'bg-slate-700'}
          transition-colors duration-300
        `}>
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
                  onClick={() => handlePromotion(piece)}
                  className="w-16 h-16 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
                >
                  <img
                    src={getPieceImagePath({ color: playerColor === "white" ? "w" : "b", type: piece })}
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