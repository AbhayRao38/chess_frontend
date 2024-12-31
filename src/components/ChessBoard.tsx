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
  socket: WebSocket;
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
  const isPlayerTurn = chess.turn() === (playerColor === "white" ? "w" : "b");
  const displayBoard = playerColor === "black" ? [...board].reverse().map(row => [...row].reverse()) : board;

  const handleSquareClick = useCallback((squareRepresentation: Square) => {
    if (isSpectator || !isPlayerTurn) return;

    if (!from) {
      const piece = chess.get(squareRepresentation);
      if (piece && piece.color === (playerColor === "white" ? "w" : "b")) {
        setFrom(squareRepresentation);
        setSelectedSquare(squareRepresentation);
      }
    } else {
      try {
        const move = {
          from,
          to: squareRepresentation,
          promotion: 'q' // Default to queen promotion
        };

        const newChess = new Chess(chess.fen());
        const result = newChess.move(move);

        if (result) {
          console.log('Move result:', result);
          console.log('New FEN after move:', newChess.fen());
          setChess(newChess);
          setBoard(newChess.board());
          const moveToSend = {
            from: result.from,
            to: result.to,
            promotion: result.promotion,
            color: result.color,
            flags: result.flags,
            piece: result.piece,
            san: result.san
          };
          socket.send(JSON.stringify({
            type: MOVE,
            payload: moveToSend
          }));
          console.log('Move sent to server:', moveToSend);
        } else {
          console.error('Invalid move:', move);
          console.log('Current board state:', chess.fen());
        }
      } catch (error) {
        console.error('Error applying move:', error);
      }
      
      setFrom(null);
      setSelectedSquare(null);
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
                    w-16 h-16 
                    ${(i+j)%2 === 0 ? 'bg-green-500' : 'bg-slate-500'}
                    ${isSelected ? 'border-4 border-yellow-400' : ''}
                    ${isPossibleMove ? 'border-4 border-red-600' : ''}
                    ${isSpectator ? 'cursor-not-allowed' : (!isPlayerTurn ? 'cursor-not-allowed' : 'cursor-pointer')}
                    transition-all duration-200
                  `}
                >
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
    </div>
  );
};