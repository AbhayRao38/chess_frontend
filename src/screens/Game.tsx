import { useEffect, useState } from "react";
import { Button } from "../components/Button"
import { ChessBoard } from "../components/ChessBoard"
import { useSocket } from "../hooks/useSocket";
import { Chess } from 'chess.js'
import { Timer } from "../components/Timer";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const GAME_UPDATE = "game_update";

export const Game = () => {
    const socket = useSocket();
    const [chess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [started, setStarted] = useState(false);
    const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
    const [whiteTime, setWhiteTime] = useState(600);
    const [blackTime, setBlackTime] = useState(600);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [gameOverReason, setGameOverReason] = useState<string | null>(null);

    useEffect(() => {
        if (!socket) return;

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case INIT_GAME:
                    setBoard(chess.board());
                    setStarted(true);
                    setPlayerColor(message.payload.color);
                    if (message.payload.timeControl) {
                        setWhiteTime(message.payload.timeControl);
                        setBlackTime(message.payload.timeControl);
                    }
                    break;
                case MOVE:
                    const move = message.payload;
                    chess.move(move);
                    setBoard(chess.board());
                    break;
                case GAME_UPDATE:
                    if (typeof message.payload.whiteTime === 'number') {
                        setWhiteTime(message.payload.whiteTime);
                    }
                    if (typeof message.payload.blackTime === 'number') {
                        setBlackTime(message.payload.blackTime);
                    }
                    if (message.payload.fen) {
                        chess.load(message.payload.fen);
                        setBoard(chess.board());
                    }
                    break;
                case GAME_OVER:
                    setGameOver(true);
                    setWinner(message.payload.winner);
                    setGameOverReason(message.payload.reason);
                    break;
            }
        };
    }, [socket]);

    if (!socket) return <div className="text-white">Connecting...</div>;

    return (
        <div className="justify-center flex">
            <div className="pt-8 max-w-screen-lg w-full">
                <div className="grid grid-cols-6 gap-4 w-full">
                    <div className="col-span-4 w-full flex flex-col items-center">
                        <div className="mb-4">
                            <Timer 
                                seconds={playerColor === "black" ? whiteTime : blackTime} 
                                isActive={started && !gameOver && chess.turn() === (playerColor === "black" ? "w" : "b")}
                            />
                        </div>
                        <ChessBoard 
                            chess={chess} 
                            setBoard={setBoard} 
                            socket={socket} 
                            board={board}
                            playerColor={playerColor}
                            disabled={gameOver}
                        />
                        <div className="mt-4">
                            <Timer 
                                seconds={playerColor === "white" ? whiteTime : blackTime}
                                isActive={started && !gameOver && chess.turn() === (playerColor === "white" ? "w" : "b")}
                            />
                        </div>
                    </div>
                    <div className="col-span-2 bg-slate-900 w-full flex flex-col items-center">
                        <div className="pt-8">
                            {!started && (
                                <Button 
                                    onClick={() => {
                                        socket.send(JSON.stringify({ type: INIT_GAME }));
                                    }}
                                >
                                    Play
                                </Button>
                            )}
                            {gameOver && (
                                <div className="text-white text-center">
                                    <h2 className="text-xl font-bold mb-2">Game Over</h2>
                                    <p>{winner === playerColor ? "You won!" : "You lost!"}</p>
                                    <p className="text-sm text-gray-400">Reason: {gameOverReason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}