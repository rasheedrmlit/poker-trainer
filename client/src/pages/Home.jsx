import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from '../components/QRCode';

const API = import.meta.env.PROD ? '' : 'http://localhost:3000';

const STACK_TYPES = [
  { label: 'Short', desc: '50 BB', multiplier: 50, color: 'text-orange-400' },
  { label: 'Standard', desc: '100 BB', multiplier: 100, color: 'text-blue-400' },
  { label: 'Deep', desc: '200 BB', multiplier: 200, color: 'text-purple-400' },
  { label: 'Ultra Deep', desc: '300 BB', multiplier: 300, color: 'text-red-400' },
];

const BLIND_LEVELS = [
  { label: '$0.50/$1', sb: 0.5, bb: 1 },
  { label: '$1/$2', sb: 1, bb: 2 },
  { label: '$2.50/$5', sb: 2.5, bb: 5 },
  { label: '$5/$10', sb: 5, bb: 10 },
  { label: '$25/$50', sb: 25, bb: 50 },
];

export default function Home({ playerName, setPlayerName }) {
  const navigate = useNavigate();
  const [name, setName] = useState(playerName);
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [stackType, setStackType] = useState(1);
  const [blindLevel, setBlindLevel] = useState(1);
  const [customBuyIn, setCustomBuyIn] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showMobileShare, setShowMobileShare] = useState(false);
  const [mobileCopied, setMobileCopied] = useState(false);

  const selectedStack = STACK_TYPES[stackType];
  const selectedBlinds = BLIND_LEVELS[blindLevel];
  const buyIn = customBuyIn ? parseInt(customBuyIn) : selectedStack.multiplier * selectedBlinds.bb;
  const effectiveBB = Math.round(buyIn / selectedBlinds.bb);

  const saveName = () => {
    const n = name.trim() || 'Player';
    setPlayerName(n);
    localStorage.setItem('poker_name', n);
    return n;
  };

  const getConfig = () => {
    return {
      startingStack: buyIn,
      smallBlind: selectedBlinds.sb,
      bigBlind: selectedBlinds.bb
    };
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

  const MOBILE_URL = 'https://poker-trainer-m544.onrender.com';

  const copyMobileLink = () => {
    navigator.clipboard?.writeText(MOBILE_URL);
    setMobileCopied(true);
    setTimeout(() => setMobileCopied(false), 2000);
  };

  const shareMobileLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Poker Trainer',
          text: 'Play No-Limit Hold\'em with AI coaching!',
          url: MOBILE_URL,
        });
      } catch (e) {
        // user cancelled share
      }
    } else {
      copyMobileLink();
    }
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

      {/* Stack Depth Selector */}
      <div className="w-full max-w-sm mb-3">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2 text-center">Stack Depth</div>
        <div className="grid grid-cols-4 gap-1.5">
          {STACK_TYPES.map((s, i) => (
            <button
              key={i}
              onClick={() => setStackType(i)}
              className={`py-2 px-2 rounded-lg text-center transition-all ${
                stackType === i
                  ? 'bg-gold text-black font-bold ring-2 ring-gold/50'
                  : 'bg-gray-800 text-gray-300 border border-gray-700'
              }`}
            >
              <div className="text-xs font-bold">{s.label}</div>
              <div className={`text-[10px] ${stackType === i ? 'text-black/60' : s.color}`}>
                {s.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Blind Level Selector */}
      <div className="w-full max-w-sm mb-3">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2 text-center">Blinds</div>
        <div className="grid grid-cols-5 gap-1.5">
          {BLIND_LEVELS.map((b, i) => (
            <button
              key={i}
              onClick={() => setBlindLevel(i)}
              className={`py-2 px-1 rounded-lg text-center transition-all ${
                blindLevel === i
                  ? 'bg-gold text-black font-bold ring-2 ring-gold/50'
                  : 'bg-gray-800 text-gray-300 border border-gray-700'
              }`}
            >
              <div className="text-[10px] font-bold">{b.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Buy-in */}
      <div className="w-full max-w-sm mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 shrink-0">Or custom $:</span>
          <input
            type="number"
            value={customBuyIn}
            onChange={(e) => setCustomBuyIn(e.target.value)}
            placeholder={`${selectedStack.multiplier * selectedBlinds.bb}`}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/50"
            min={selectedBlinds.bb * 10}
          />
          {customBuyIn && (
            <button
              onClick={() => setCustomBuyIn('')}
              className="text-xs text-gray-500 active:text-white"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Buy-in Summary */}
      <div className="w-full max-w-sm mb-4 text-center">
        <div className="text-xs text-gray-500">
          Buy-in: <span className="text-white font-bold">${buyIn.toLocaleString()}</span>
          <span className="text-gray-600 mx-1">•</span>
          <span className={effectiveBB >= 200 ? 'text-red-400' : effectiveBB >= 150 ? 'text-purple-400' : effectiveBB >= 80 ? 'text-blue-400' : 'text-orange-400'}>{effectiveBB} BB</span>
          <span className="text-gray-600 mx-1">•</span>
          {selectedBlinds.label} blinds
          {effectiveBB >= 150 && <span className="text-purple-400 ml-1">(Deep)</span>}
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

      {/* Play on Mobile */}
      <div className="w-full max-w-sm mt-3">
        <button
          onClick={() => setShowMobileShare(!showMobileShare)}
          className="w-full bg-gray-800/50 border border-gray-700 text-gray-300 font-semibold py-3 px-6 rounded-xl text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <span className="text-gold">📱</span> Play on Mobile — QR Code &amp; Link
        </button>

        {showMobileShare && (
          <div className="mt-2 bg-gray-800 border border-gray-700 rounded-xl p-4 animate-slide-up">
            <p className="text-xs text-gray-400 text-center mb-3">
              Scan this QR code with your phone or share the link
            </p>

            {/* QR Code */}
            <div className="flex justify-center mb-3">
              <QRCode value={MOBILE_URL} size={160} />
            </div>

            {/* URL display */}
            <div className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 mb-3">
              <p className="text-xs text-gray-300 font-mono text-center truncate">{MOBILE_URL}</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={copyMobileLink}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  mobileCopied ? 'bg-green-600 text-white' : 'bg-gold text-black'
                }`}
              >
                {mobileCopied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={shareMobileLink}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform"
              >
                Share
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-6 text-center text-gray-600 text-xs">
        <p>Real-time coaching &bull; AI opponents &bull; Multiplayer</p>
      </div>
    </div>
  );
}
