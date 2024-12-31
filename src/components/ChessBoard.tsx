import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useState, useCallback } from "react";
import { MOVE } from "../screens/Game";

interface ChessBoardProps {
  chess: Chess;
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

export const ChessBoard = ({
  chess,
  board,
  socket,
  setBoard,
  playerColor,
  isSpectator = false
}: ChessBoardProps) => {
  const [from, setFrom] = useState<null | Square>(null);
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
        socket.send(JSON.stringify({
          type: MOVE,
          payload: {
            move: {
              from,
              to: squareRepresentation
            }
          }
        }));
        
        const move = chess.move({
          from,
          to: squareRepresentation
        });

        if (move) {
          setBoard(chess.board());
        }
      } catch (error) {
        console.error('Invalid move:', error);
      }
      
      setFrom(null);
      setSelectedSquare(null);
    }
  }, [from, chess, isPlayerTurn, isSpectator, playerColor, setBoard, socket]);

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
                    ${isSelected ? 'border-2 border-yellow-400' : ''}
                    ${isPossibleMove ? 'border-2 border-blue-400' : ''}
                    ${isSpectator ? 'cursor-not-allowed' : (!isPlayerTurn ? 'cursor-not-allowed' : 'cursor-pointer')}
                    transition-all duration-200
                  `}
                >
                  <div className="w-full justify-center flex h-full">
                    <div className="h-full justify-center flex flex-col">
                      {square && (
                        <img 
                          className="w-6 transition-transform duration-200 hover:scale-110" 
                          src={`/${square.color === "b" ? square.type : `${square.type.toUpperCase()}`}.png`}
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