import { useState, useMemo, useEffect } from 'react';
import { formatChips } from '../utils/cards';

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const c = () => setM(window.innerHeight < 500 && window.innerWidth > window.innerHeight);
    c(); window.addEventListener('resize', c);
    return () => window.removeEventListener('resize', c);
  }, []);
  return m;
}

export default function ActionBar({
  gameState, playerId, isMyTurn, myPlayer,
  onAction, onGetSuggestion, showCoaching, onToggleCoaching
}) {
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);
  const isMobile = useIsMobile();

  const validActions = useMemo(() => {
    if (!isMyTurn || !myPlayer || !gameState) return [];

    const actions = [];
    const toCall = gameState.currentBet - (myPlayer.bet || 0);

    actions.push({ type: 'fold' });

    if (toCall === 0) {
      actions.push({ type: 'check' });
    } else {
      if (myPlayer.stack <= toCall) {
        actions.push({ type: 'allin', amount: myPlayer.stack + (myPlayer.bet || 0) });
      } else {
        actions.push({ type: 'call', amount: toCall });
      }
    }

    if (myPlayer.stack > toCall) {
      const bb = gameState.config?.bigBlind || 2;
      const minRaise = gameState.currentBet + bb;
      const maxRaise = myPlayer.stack + (myPlayer.bet || 0);
      if (maxRaise > minRaise) {
        actions.push({ type: 'raise', min: minRaise, max: maxRaise });
      }
    }

    return actions;
  }, [isMyTurn, myPlayer, gameState]);

  const raiseAction = validActions.find(a => a.type === 'raise');
  const callAction = validActions.find(a => a.type === 'call');
  const canCheck = validActions.some(a => a.type === 'check');
  const canFold = validActions.some(a => a.type === 'fold');
  const allinAction = validActions.find(a => a.type === 'allin');

  const handleRaise = () => {
    if (raiseAction) {
      const amount = Math.max(raiseAction.min, Math.min(raiseAmount, raiseAction.max));
      onAction({ type: 'raise', amount });
      setShowRaiseSlider(false);
    }
  };

  const handlePresetRaise = (multiplier) => {
    if (raiseAction) {
      const pot = gameState.pot;
      let amount;
      if (multiplier === 'min') amount = raiseAction.min;
      else if (multiplier === 'pot') amount = pot + (gameState.currentBet || 0);
      else if (multiplier === 'allin') amount = raiseAction.max;
      else amount = Math.round(pot * multiplier);

      amount = Math.max(raiseAction.min, Math.min(amount, raiseAction.max));
      setRaiseAmount(amount);
    }
  };

  useMemo(() => {
    if (raiseAction) {
      setRaiseAmount(raiseAction.min);
    }
  }, [raiseAction?.min]);

  if (!isMyTurn || gameState?.state === 'hand_complete' || gameState?.state === 'waiting') {
    return (
      <div className="safe-bottom border-t border-gray-800/50 px-4 py-3" style={{
        background: 'linear-gradient(180deg, rgba(15,15,25,0.95) 0%, rgba(10,10,18,0.98) 100%)',
      }}>
        <div className="flex items-center justify-between">
          <div className="text-gray-500 text-sm font-medium">
            {gameState?.state === 'waiting'
              ? 'Waiting for players...'
              : gameState?.state === 'hand_complete'
                ? 'Hand complete'
                : 'Waiting for opponent...'}
          </div>
          <button
            onClick={onToggleCoaching}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all font-bold ${
              showCoaching
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'bg-gray-800/80 text-gray-500 border border-gray-700/50'
            }`}
          >
            Coach {showCoaching ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="safe-bottom z-30 border-t border-gray-800/50" style={{
      background: 'linear-gradient(180deg, rgba(15,15,25,0.95) 0%, rgba(10,10,18,0.98) 100%)',
    }}>
      {/* Raise slider panel */}
      {showRaiseSlider && raiseAction && (
        <div className="px-4 pt-3 pb-2 border-b border-gray-800/50 animate-slide-up">
          <div className="flex items-center gap-3 mb-2.5">
            <span className="text-gray-400 text-xs font-medium w-10">Raise</span>
            <div className="flex-1 relative">
              <input
                type="range"
                min={raiseAction.min}
                max={raiseAction.max}
                step={gameState.config?.bigBlind || 2}
                value={raiseAmount}
                onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                className="w-full h-2 appearance-none rounded-full bg-gray-700 outline-none"
                style={{
                  background: `linear-gradient(90deg, #d4af37 0%, #d4af37 ${((raiseAmount - raiseAction.min) / (raiseAction.max - raiseAction.min)) * 100}%, #374151 ${((raiseAmount - raiseAction.min) / (raiseAction.max - raiseAction.min)) * 100}%, #374151 100%)`
                }}
              />
            </div>
            {/* Editable amount input */}
            <div className="relative w-20">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gold/60 text-sm font-bold pointer-events-none">$</span>
              <input
                type="number"
                inputMode="numeric"
                min={raiseAction.min}
                max={raiseAction.max}
                value={raiseAmount}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    setRaiseAmount(Math.max(raiseAction.min, Math.min(val, raiseAction.max)));
                  }
                }}
                onBlur={() => {
                  setRaiseAmount(Math.max(raiseAction.min, Math.min(raiseAmount, raiseAction.max)));
                }}
                className="w-full bg-gray-800 border border-gold/30 rounded-lg text-gold font-black text-sm text-right pr-2 pl-5 py-1.5 outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 appearance-none"
                style={{ MozAppearance: 'textfield' }}
              />
            </div>
          </div>
          <div className="flex gap-1.5">
            {[
              { label: 'Min', val: 'min' },
              { label: '1/3', val: 0.33 },
              { label: '1/2', val: 0.5 },
              { label: '3/4', val: 0.75 },
              { label: 'Pot', val: 'pot' },
              { label: 'All-in', val: 'allin', red: true },
            ].map(p => (
              <button
                key={p.label}
                onClick={() => handlePresetRaise(p.val)}
                className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg active:scale-95 transition-all ${
                  p.red
                    ? 'bg-red-900/60 text-red-300 border border-red-700/30'
                    : 'bg-gray-800/80 text-gray-300 border border-gray-700/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main action buttons */}
      <div className="flex gap-2 px-3 py-2" style={isMobile ? { gap: 4, padding: '4px 8px' } : {}}>
        {/* Coaching hint button */}
        <button
          onClick={onGetSuggestion}
          className="flex items-center justify-center rounded-xl text-gold font-bold active:scale-95 transition-transform"
          style={{
            width: isMobile ? 28 : 44,
            fontSize: isMobile ? 12 : 18,
            background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
            border: '1px solid rgba(212,175,55,0.25)',
            borderRadius: isMobile ? 8 : 12,
          }}
          title="Get coaching hint"
        >
          ?
        </button>

        {/* Fold */}
        {canFold && (
          <button
            onClick={() => onAction({ type: 'fold' })}
            className="flex-1 min-w-0 font-black active:scale-95 transition-all"
            style={{
              padding: isMobile ? '6px 4px' : '14px 8px',
              fontSize: isMobile ? 11 : 16,
              borderRadius: isMobile ? 8 : 12,
              background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)',
              boxShadow: '0 4px 12px rgba(220,38,38,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            Fold
          </button>
        )}

        {/* Check */}
        {canCheck && (
          <button
            onClick={() => onAction({ type: 'check' })}
            className="flex-1 min-w-0 font-black active:scale-95 transition-all"
            style={{
              padding: isMobile ? '6px 4px' : '14px 8px',
              fontSize: isMobile ? 11 : 16,
              borderRadius: isMobile ? 8 : 12,
              background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            Check
          </button>
        )}

        {/* Call */}
        {callAction && (
          <button
            onClick={() => onAction({ type: 'call', amount: callAction.amount })}
            className="flex-1 min-w-0 font-black active:scale-95 transition-all flex flex-col items-center"
            style={{
              padding: isMobile ? '4px 4px' : '10px 8px',
              fontSize: isMobile ? 11 : 16,
              borderRadius: isMobile ? 8 : 12,
              background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
              boxShadow: '0 4px 12px rgba(22,163,74,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            <span>Call</span>
            <span style={{ fontSize: isMobile ? 8 : 10, opacity: 0.8, fontWeight: 700 }}>{formatChips(callAction.amount)}</span>
          </button>
        )}

        {/* All-in (when can't raise) */}
        {allinAction && !raiseAction && (
          <button
            onClick={() => onAction({ type: 'allin', amount: allinAction.amount })}
            className="flex-1 min-w-0 font-black active:scale-95 transition-all flex flex-col items-center"
            style={{
              padding: isMobile ? '4px 4px' : '10px 8px',
              fontSize: isMobile ? 11 : 16,
              borderRadius: isMobile ? 8 : 12,
              background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
              boxShadow: '0 4px 12px rgba(220,38,38,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            <span>All In</span>
            <span style={{ fontSize: isMobile ? 8 : 10, opacity: 0.8, fontWeight: 700 }}>{formatChips(allinAction.amount)}</span>
          </button>
        )}

        {/* Raise */}
        {raiseAction && (
          <>
            {showRaiseSlider ? (
              <button
                onClick={handleRaise}
                className="flex-1 min-w-0 font-black active:scale-95 transition-all flex flex-col items-center"
                style={{
                  padding: isMobile ? '4px 4px' : '10px 8px',
                  fontSize: isMobile ? 11 : 16,
                  borderRadius: isMobile ? 8 : 12,
                  background: 'linear-gradient(180deg, #eab308 0%, #ca8a04 100%)',
                  boxShadow: '0 4px 12px rgba(234,179,8,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  color: '#1a1a2e',
                  textShadow: '0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <span>Raise</span>
                <span style={{ fontSize: isMobile ? 8 : 10, opacity: 0.7, fontWeight: 700 }}>{formatChips(raiseAmount)}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowRaiseSlider(true)}
                className="flex-1 min-w-0 font-black active:scale-95 transition-all"
                style={{
                  padding: isMobile ? '6px 4px' : '14px 8px',
                  fontSize: isMobile ? 11 : 16,
                  borderRadius: isMobile ? 8 : 12,
                  background: 'linear-gradient(180deg, #eab308 0%, #ca8a04 100%)',
                  boxShadow: '0 4px 12px rgba(234,179,8,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  color: '#1a1a2e',
                  textShadow: '0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                Raise
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
