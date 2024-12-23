import { useEffect, useState } from "react";
import { Button } from "../components/Button"
import { ChessBoard } from "../components/ChessBoard"
import { useSocket } from "../hooks/useSocket";
import { Chess } from 'chess.js'
import { Timer } from "../components/Timer";
import { useNavigate, useLocation } from "react-router-dom";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const SPECTATE = "spectate";

export const Game = () => {
    const socket = useSocket();
    const [chess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [started, setStarted] = useState(false);
    const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
    const [whiteTime, setWhiteTime] = useState(0);
    const [blackTime, setBlackTime] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const isSpectator = new URLSearchParams(location.search).get('spectate');

    useEffect(() => {
        if (!socket) {
            return;
        }

        if (isSpectator) {
            socket.send(JSON.stringify({
                type: SPECTATE,
                payload: { gameId: isSpectator }
            }));
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
    }, [socket, isSpectator]);

    if (!socket) return <div>Connecting...</div>

    return <div className="justify-center flex">
        <div className="pt-8 max-w-screen-lg w-full">
            <div className="grid grid-cols-6 gap-4 w-full">
                <div className="col-span-4 w-full flex flex-col items-center">
                    {isSpectator && (
                        <div className="mb-4 w-full">
                            <Button onClick={() => navigate("/spectate")}>
                                Back to Games
                            </Button>
                        </div>
                    )}
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
                        isSpectator={Boolean(isSpectator)}
                    />
                    <div className="mt-4">
                        <Timer 
                            seconds={playerColor === "white" ? whiteTime : blackTime}
                            isActive={chess.turn() === (playerColor === "white" ? "w" : "b")}
                        />
                    </div>
                </div>
                <div className="col-span-2 bg-slate-900 w-full flex justify-center">
                    <div className="pt-8">
                        {!started && !isSpectator && <Button onClick={() => {
                            socket.send(JSON.stringify({
                                type: INIT_GAME
                            }))
                        }} >
                            Play
                        </Button>}
                    </div>
                </div>
            </div>
        </div>
    </div>
}