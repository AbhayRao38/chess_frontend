import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
import { MOVE } from "../screens/Game";

export const ChessBoard = ({ chess, board, socket, setBoard, playerColor }: {
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
}) => {
    const [from, setFrom] = useState<null | Square>(null);
    const isPlayerTurn = chess.turn() === (playerColor === "white" ? "w" : "b");
    
    // Flip board if player is black
    const displayBoard = playerColor === "black" ? [...board].reverse().map(row => [...row].reverse()) : board;

    return (
        <div className="flex flex-col items-center">
            <div className="text-white-200">
                {displayBoard.map((row, i) => {
                    return <div key={i} className="flex">
                        {row.map((square, j) => {
                            const squareRepresentation = playerColor === "black" 
                                ? String.fromCharCode(104 - (j % 8)) + "" + (i + 1) as Square
                                : String.fromCharCode(97 + (j % 8)) + "" + (8 - i) as Square;

                            return <div 
                                onClick={() => {
                                    if (!isPlayerTurn) return;
                                    
                                    if (!from) {
                                        const piece = chess.get(squareRepresentation);
                                        if (piece && piece.color === (playerColor === "white" ? "w" : "b")) {
                                            setFrom(squareRepresentation);
                                        }
                                    } else {
                                        socket.send(JSON.stringify({
                                            type: MOVE,
                                            payload: {
                                                move: {
                                                    from,
                                                    to: squareRepresentation
                                                }
                                            }
                                        }));
                                        
                                        setFrom(null);
                                        chess.move({
                                            from,
                                            to: squareRepresentation
                                        });
                                        setBoard(chess.board());
                                    }
                                }} 
                                key={j} 
                                className={`w-16 h-16 ${(i+j)%2 === 0 ? 'bg-green-500' : 'bg-slate-500'} 
                                    ${from === squareRepresentation ? 'border-2 border-yellow-400' : ''}
                                    ${!isPlayerTurn ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="w-full justify-center flex h-full">
                                    <div className="h-full justify-center flex flex-col">
                                        {square ? <img className="w-6" src={`/${square?.color === "b" ? square?.type : `${square?.type?.toUpperCase()} copy`}.png`} /> : null} 
                                    </div>
                                </div>
                            </div>
                        })}
                    </div>
                })}
            </div>
            <div className="mt-4 text-lg font-semibold bg-slate-700 text-white px-4 py-2 rounded">
                {isPlayerTurn ? "Your turn" : "Opponent's turn"} 
            </div>
        </div>
    );
}