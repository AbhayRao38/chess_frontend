import './App.css'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Landing } from './screens/Landing';
import { Game } from './screens/Game';
import { ActiveGames } from './screens/ActiveGames';
import { SpectateGame } from './screens/SpectateGame';

function App() {
  return (
    <div className="min-h-screen bg-slate-950">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/game" element={<Game />} />
          <Route path="/spectate" element={<ActiveGames />} />
          <Route path="/spectate/:gameId" element={<SpectateGame />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;