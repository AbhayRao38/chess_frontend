import './App.css'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Landing } from './screens/Landing';
import { Game } from './screens/Game';
import { Spectate } from './screens/Spectate';

function App() {
  return (
    <div className='h-screen bg-slate-950'>
     <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} /> 
        <Route path="/game" element={<Game />} /> 
        <Route path="/spectate" element={<Spectate />} />
      </Routes>
    </BrowserRouter>
    </div>
  )
}

export default App