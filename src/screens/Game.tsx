import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { ChessBoard } from "../components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { Chess } from 'chess.js';
import { Timer } from "../components/Timer";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";

export const Game = () => {
    const socket = useSocket();
    const [chess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [started, setStarted] = useState(false);
    const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
    const [whiteTime, setWhiteTime] = useState(0);
    const [blackTime, setBlackTime] = useState(0);

    useEffect(() => {
        if (!started) return;

        const interval = setInterval(() => {
            if (chess.turn() === 'w') {
                setWhiteTime(prev => prev + 1);
            } else {
                setBlackTime(prev => prev + 1);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [started, chess.turn()]);

    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case INIT_GAME:
                    setBoard(chess.board());
                    setStarted(true);
                    setPlayerColor(message.payload.color);
                    setWhiteTime(0);
                    setBlackTime(0);
                    break;
                case MOVE:
                    const move = message.payload;
                    chess.move(move);
                    setBoard(chess.board());
                    break;
                case GAME_OVER:
                    console.log("Game over");
                    break;
            }
        }
    }, [socket]);

    if (!socket) return <div>Connecting...</div>

    return (
        <div className="flex flex-col items-center">
            <div className="pt-8 max-w-screen-lg w-full">
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 w-full">
                    <div className="col-span-1 lg:col-span-4 w-full flex flex-col items-center">
                        <div className="mb-4">
                            <Timer 
                                seconds={playerColor === "black" ? whiteTime : blackTime} 
                                isActive={chess.turn() === (playerColor === "black" ? "w" : "b")}
                            />
                        </div>
                        <ChessBoard 
                            chess={chess} 
                            setBoard={setBoard} 
                            socket={socket} 
                            board={board}
                            playerColor={playerColor}
                        />
                        <div className="mt-4">
                            <Timer 
                                seconds={playerColor === "white" ? whiteTime : blackTime}
                                isActive={chess.turn() === (playerColor === "white" ? "w" : "b")}
                            />
                        </div>
                    </div>
                    <div className="col-span-1 lg:col-span-2 bg-slate-900 w-full flex justify-center">
                        <div className="pt-8">
                            {!started && (
                                <Button onClick={() => {
                                    socket.send(JSON.stringify({ type: INIT_GAME }));
                                }}>
                                    Play
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};