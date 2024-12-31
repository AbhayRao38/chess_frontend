import { useNavigate } from "react-router-dom"
import { Button } from "../components/Button";

export const Landing = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-slate-950 flex justify-center">
      <div className="pt-8 max-w-screen-lg w-full px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex justify-center items-center">
            <img 
              src="/chessboard.jpeg" 
              className="max-w-96 rounded-lg shadow-xl transition-transform hover:scale-105" 
              alt="Chess Board" 
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold text-white mb-6">
                Play chess online on the #2 Site!
              </h1>
              <p className="text-gray-400 mb-8">
                Challenge players from around the world or watch live matches
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Button onClick={() => navigate("/game")} className="w-full">
                Play Online
              </Button>
              <Button 
                onClick={() => navigate("/spectate")} 
                className="w-full bg-slate-700 hover:bg-slate-600"
              >
                Watch Games
              </Button>
            </div>    
          </div>
        </div>
      </div>
    </div>
  );
};