import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatChips } from '../utils/cards';
import { FELT_THEMES, applyFeltTheme, getStoredFelt } from '../utils/feltThemes';
import BankrollGraph from './BankrollGraph';

export default function TopBar({ gameState, tableId, isTraining, onOpenSidebar, onAddAI, bankrollHistory }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [currentFelt, setCurrentFelt] = useState(getStoredFelt());
  const [showFelts, setShowFelts] = useState(false);

  const changeFelt = (themeId) => {
    applyFeltTheme(themeId);
    setCurrentFelt(themeId);
  };

  const copyTableLink = () => {
    const link = `${window.location.origin}/table/${tableId}`;
    navigator.clipboard?.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800 z-40 relative">
      <button onClick={() => navigate('/')} className="text-gray-400 active:text-white transition-colors p-1">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="text-center flex-1">
        <div className="text-xs text-gray-500">
          {isTraining ? 'TRAINING' : 'TABLE'} {tableId?.slice(0, 6)}
          <button onClick={copyTableLink} className="ml-2 text-gold/70 active:text-gold inline-flex items-center gap-0.5">
            {linkCopied ? 'Copied!' : 'Share'}
            <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
        <div className="text-sm font-semibold text-gray-300">
          Hand #{gameState?.handNumber || 0} &bull; Pot: {formatChips(gameState?.pot || 0)}
        </div>
      </div>

      <button onClick={() => setShowMenu(!showMenu)} className="text-gray-400 active:text-white transition-colors p-1">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-2 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 w-64 animate-fade-in overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>

            {/* Bankroll mini-graph */}
            {bankrollHistory && bankrollHistory.length >= 2 && (
              <div className="px-3 pt-3 pb-1">
                <BankrollGraph history={bankrollHistory} />
              </div>
            )}

            <button onClick={() => { onOpenSidebar('stats'); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 active:bg-gray-600 transition-colors border-b border-gray-700">
              Session Stats
            </button>
            <button onClick={() => { onOpenSidebar('leaks'); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 active:bg-gray-600 transition-colors border-b border-gray-700">
              Leak Report
            </button>
            <button onClick={() => { onOpenSidebar('history'); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 active:bg-gray-600 transition-colors border-b border-gray-700">
              Hand History
            </button>
            <button onClick={() => { onOpenSidebar('achievements'); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 active:bg-gray-600 transition-colors border-b border-gray-700 flex items-center gap-2">
              <span>🏆</span> Achievements
            </button>
            <button onClick={() => { onOpenSidebar('settings'); setShowMenu(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 active:bg-gray-600 transition-colors border-b border-gray-700 flex items-center gap-2">
              <span>⚙️</span> Settings
            </button>

            {/* Add AI */}
            <div className="border-t border-gray-700">
              <div className="px-4 py-2 text-xs text-gray-500 uppercase">Add AI Opponent</div>
              {['gto_bot', 'aggro_pro', 'nit_reg', 'loose_rec', 'elite_hybrid'].map(type => (
                <button key={type} onClick={() => { onAddAI(type); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 active:bg-gray-600 transition-colors">
                  + {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>

            {/* Felt selector */}
            <div className="border-t border-gray-700">
              <button onClick={() => setShowFelts(!showFelts)}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 active:bg-gray-600 transition-colors flex items-center justify-between">
                <span>Table Felt</span>
                <span className="text-xs text-gray-500">{showFelts ? '▼' : '▶'}</span>
              </button>
              {showFelts && (
                <div className="px-3 pb-3 grid grid-cols-4 gap-1.5">
                  {FELT_THEMES.map(theme => (
                    <button key={theme.id} onClick={() => changeFelt(theme.id)}
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
                        currentFelt === theme.id ? 'ring-2 ring-white bg-gray-700' : 'active:bg-gray-700'
                      }`}>
                      <div className="w-8 h-8 rounded-full border-2"
                        style={{ background: `radial-gradient(circle, ${theme.feltLight}, ${theme.felt})`, borderColor: theme.rail }} />
                      <span className="text-[8px] text-gray-400 leading-tight text-center">{theme.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => {
              const link = `${window.location.origin}/table/${tableId}`;
              navigator.clipboard?.writeText(link);
              setShowMenu(false);
            }} className="w-full text-left px-4 py-3 text-sm text-gold hover:bg-gray-700 active:bg-gray-600 transition-colors border-t border-gray-700">
              Copy Table Link
            </button>
          </div>
        </>
      )}
    </div>
  );
}
