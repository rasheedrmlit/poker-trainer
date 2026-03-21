import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.PROD ? '' : 'http://localhost:3000';

const BUY_IN_OPTIONS = [
  { label: '$50', value: 50, blinds: '0.25/0.50' },
  { label: '$100', value: 100, blinds: '0.50/1' },
  { label: '$200', value: 200, blinds: '1/2' },
  { label: '$500', value: 500, blinds: '2.50/5' },
  { label: '$1,000', value: 1000, blinds: '5/10' },
  { label: '$5,000', value: 5000, blinds: '25/50' },
];

export default function Home({ playerName, setPlayerName }) {
  const navigate = useNavigate();
  const [name, setName] = useState(playerName);
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [buyIn, setBuyIn] = useState(200);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedBuyIn = BUY_IN_OPTIONS.find(b => b.value === buyIn) || BUY_IN_OPTIONS[2];

  const saveName = () => {
    const n = name.trim() || 'Player';
    setPlayerName(n);
    localStorage.setItem('poker_name', n);
    return n;
  };

  const getConfig = () => {
    const opt = BUY_IN_OPTIONS.find(b => b.value === buyIn) || BUY_IN_OPTIONS[2];
    const [sb, bb] = opt.blinds.split('/').map(Number);
    return { startingStack: buyIn, smallBlind: sb, bigBlind: bb };
  };

  const startQuickPlay = async (aiCount = 3) => {
    setLoading(true);
    const pName = saveName();
    try {
      const res = await fetch(`${API}/api/quick-play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: pName, aiCount, config: getConfig() })
      });
      const data = await res.json();
      navigate(`/table/${data.tableId}`);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const startTraining = async () => {
    setLoading(true);
    const pName = saveName();
    try {
      const res = await fetch(`${API}/api/training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: pName, config: getConfig() })
      });
      const data = await res.json();
      navigate(`/table/${data.tableId}?training=1`);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const createMultiplayer = async () => {
    setLoading(true);
    const pName = saveName();
    try {
      const res = await fetch(`${API}/api/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: getConfig() })
      });
      const data = await res.json();
      const link = `${window.location.origin}/table/${data.tableId}`;
      setShareLink(link);
      setLoading(false);
      // Don't navigate yet — show the share link
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToTable = () => {
    const tableId = shareLink.split('/table/')[1];
    if (tableId) navigate(`/table/${tableId}`);
  };

  const joinMultiplayer = () => {
    if (joinCode.trim()) {
      saveName();
      // Support both full URLs and just the table code
      const code = joinCode.trim().includes('/table/')
        ? joinCode.trim().split('/table/')[1]
        : joinCode.trim();
      navigate(`/table/${code}`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-950 via-felt-dark to-gray-950 overflow-y-auto">
      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="text-5xl font-black tracking-tight mb-2">
          <span className="text-white">POKER</span>
          <span className="text-gold"> TRAINER</span>
        </div>
        <p className="text-gray-400 text-sm">Master No-Limit Hold'em with real-time coaching</p>
      </div>

      {/* Name Input */}
      <div className="w-full max-w-sm mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-center text-lg text-white placeholder-gray-500 focus:outline-none focus:border-gold/50 transition-colors"
          maxLength={20}
        />
      </div>

      {/* Buy-in Selector */}
      <div className="w-full max-w-sm mb-5">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2 text-center">Starting Buy-In</div>
        <div className="grid grid-cols-3 gap-2">
          {BUY_IN_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setBuyIn(opt.value)}
              className={`py-2 px-3 rounded-lg text-center transition-all ${
                buyIn === opt.value
                  ? 'bg-gold text-black font-bold ring-2 ring-gold/50'
                  : 'bg-gray-800 text-gray-300 border border-gray-700'
              }`}
            >
              <div className="text-sm font-bold">{opt.label}</div>
              <div className={`text-[10px] ${buyIn === opt.value ? 'text-black/60' : 'text-gray-500'}`}>
                {opt.blinds} blinds
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Share Link Panel */}
      {shareLink && (
        <div className="w-full max-w-sm mb-4 bg-gray-800 border border-gold/30 rounded-xl p-4 animate-slide-up">
          <div className="text-xs text-gold font-semibold mb-2">Share this link with friends:</div>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareLink}
              className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 font-mono truncate"
              onClick={(e) => e.target.select()}
            />
            <button
              onClick={copyLink}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                copied ? 'bg-green-600 text-white' : 'bg-gold text-black'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={goToTable}
            className="w-full mt-3 bg-green-600 text-white font-bold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
          >
            Join Your Table
          </button>
        </div>
      )}

      {/* Mode Buttons */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => startQuickPlay(9)}
          disabled={loading}
          className="w-full bg-gradient-to-r from-gold-dark to-gold text-black font-bold py-4 px-6 rounded-xl text-lg active:scale-[0.98] transition-transform disabled:opacity-50 shadow-lg shadow-gold/20"
        >
          Play vs AI
        </button>

        <button
          onClick={createMultiplayer}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-700 to-blue-500 text-white font-bold py-4 px-6 rounded-xl text-lg active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          Create Multiplayer Table
        </button>

        <button
          onClick={() => setShowJoin(!showJoin)}
          className="w-full bg-gray-800 border border-gray-600 text-white font-bold py-4 px-6 rounded-xl text-lg active:scale-[0.98] transition-transform"
        >
          Join Table
        </button>

        {showJoin && (
          <div className="flex gap-2 animate-slide-up">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Table code or link"
              className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/50"
            />
            <button
              onClick={joinMultiplayer}
              className="bg-green-600 text-white font-bold px-6 py-3 rounded-xl active:scale-95 transition-transform"
            >
              Go
            </button>
          </div>
        )}

        <button
          onClick={startTraining}
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-700 to-emerald-500 text-white font-bold py-4 px-6 rounded-xl text-lg active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          Training Mode
        </button>
      </div>

      {/* Loading */}
      {loading && !shareLink && (
        <div className="mt-6 text-gold animate-pulse-soft">Setting up table...</div>
      )}

      {/* Guides */}
      <div className="w-full max-w-sm mt-3 space-y-2">
        <button
          onClick={() => navigate('/hand-chart')}
          className="w-full bg-gray-800/50 border border-gray-700 text-gray-300 font-semibold py-3 px-6 rounded-xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <span className="text-gold">🃏</span> Hand Strength Chart — Which Hands to Play
        </button>
        <button
          onClick={() => navigate('/guide')}
          className="w-full bg-gray-800/50 border border-gray-700 text-gray-300 font-semibold py-3 px-6 rounded-xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <span className="text-gold">📖</span> Strategy Guide — Learn Poker from Scratch
        </button>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-6 text-center text-gray-600 text-xs">
        <p>Real-time coaching &bull; AI opponents &bull; Multiplayer</p>
      </div>
    </div>
  );
}
