import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { ChessBoard } from '../components/ChessBoard';
import { Button } from '../components/Button';
import { Timer } from '../components/Timer';
import { useSocket } from '../hooks/useSocket';

export const JOIN_SPECTATE = "join_spectate";
export const GAME_STATE = "game_state";
export const GAME_UPDATE = "game_update";

export const SpectateGame = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [chess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [whiteTime, setWhiteTime] = useState(0);
  const [blackTime, setBlackTime] = useState(0);

  useEffect(() => {
    if (!socket || !gameId) return;

    socket.send(JSON.stringify({
      type: JOIN_SPECTATE,
      payload: { gameId }
    }));

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case GAME_STATE:
          chess.load(message.payload.fen);
          setBoard(chess.board());
          setWhiteTime(message.payload.whiteTime);
          setBlackTime(message.payload.blackTime);
          break;
        case GAME_UPDATE:
          chess.move(message.payload.move);
          setBoard(chess.board());
          setWhiteTime(message.payload.whiteTime);
          setBlackTime(message.payload.blackTime);
          break;
      }
    };
  }, [socket, gameId, chess]);

  if (!socket) {
    return <div className="text-white text-center py-8">Connecting...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center">
      <div className="w-full max-w-6xl px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Button onClick={() => navigate('/spectate')}>Back to Games</Button>
          <h1 className="text-2xl font-bold text-white">Spectating Game</h1>
        </div>

        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-4 flex flex-col items-center">
            <Timer seconds={whiteTime} isActive={chess.turn() === 'w'} />
            <div className="my-4">
              {socket && (
                <ChessBoard
                  chess={chess}
                  board={board}
                  setBoard={setBoard}
                  socket={socket}
                  playerColor="white"
                  isSpectator={true}
                />
              )}
            </div>
            <Timer seconds={blackTime} isActive={chess.turn() === 'b'} />
          </div>
          
          <div className="col-span-2 bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Game Info</h2>
            <div className="text-gray-300">
              <p>Current Turn: {chess.turn() === 'w' ? 'White' : 'Black'}</p>
              <p>Move Number: {Math.floor(chess.moveNumber() / 2) + 1}</p>
              {chess.isCheck() && <p className="text-yellow-400">Check!</p>}
              {chess.isCheckmate() && <p className="text-red-500">Checkmate!</p>}
              {chess.isDraw() && <p className="text-blue-400">Draw!</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};