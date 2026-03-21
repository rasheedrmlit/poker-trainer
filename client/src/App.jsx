import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Table from './pages/Table';
import Guide from './pages/Guide';
import { useSocket } from './hooks/useSocket';

export default function App() {
  const socket = useSocket();
  const [playerName, setPlayerName] = useState(() =>
    localStorage.getItem('poker_name') || ''
  );

  return (
    <div className="w-full h-full bg-gray-950 text-white font-poker">
      <Routes>
        <Route path="/" element={<Home playerName={playerName} setPlayerName={setPlayerName} />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/table/:tableId" element={<Table socket={socket} playerName={playerName} />} />
      </Routes>
    </div>
  );
}
