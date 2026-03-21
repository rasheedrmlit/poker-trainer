import { useState, useMemo } from 'react';
import { formatChips } from '../utils/cards';

export default function ActionBar({
  gameState, playerId, isMyTurn, myPlayer,
  onAction, onGetSuggestion, showCoaching, onToggleCoaching
}) {
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);

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

  // Initialize raise amount when it becomes our turn
  useMemo(() => {
    if (raiseAction) {
      setRaiseAmount(raiseAction.min);
    }
  }, [raiseAction?.min]);

  if (!isMyTurn || gameState?.state === 'hand_complete' || gameState?.state === 'waiting') {
    return (
      <div className="safe-bottom bg-gray-900/90 border-t border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-gray-500 text-sm">
            {gameState?.state === 'waiting'
              ? 'Waiting for players...'
              : gameState?.state === 'hand_complete'
                ? 'Hand complete'
                : 'Waiting for opponent...'}
          </div>
          <button
            onClick={onToggleCoaching}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              showCoaching ? 'bg-gold/20 text-gold' : 'bg-gray-800 text-gray-500'
            }`}
          >
            Coach {showCoaching ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="safe-bottom bg-gray-900/95 border-t border-gray-800 z-30">
      {/* Raise slider */}
      {showRaiseSlider && raiseAction && (
        <div className="px-4 pt-3 pb-2 border-b border-gray-800 animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-gray-400 text-xs w-12">Raise</span>
            <input
              type="range"
              min={raiseAction.min}
              max={raiseAction.max}
              step={gameState.config?.bigBlind || 2}
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
              className="flex-1 h-2 accent-gold"
            />
            <span className="text-gold font-bold text-sm w-16 text-right">{formatChips(raiseAmount)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handlePresetRaise('min')} className="flex-1 bg-gray-800 text-gray-300 text-xs py-1.5 rounded-lg active:bg-gray-700">Min</button>
            <button onClick={() => handlePresetRaise(0.33)} className="flex-1 bg-gray-800 text-gray-300 text-xs py-1.5 rounded-lg active:bg-gray-700">1/3</button>
            <button onClick={() => handlePresetRaise(0.5)} className="flex-1 bg-gray-800 text-gray-300 text-xs py-1.5 rounded-lg active:bg-gray-700">1/2</button>
            <button onClick={() => handlePresetRaise(0.75)} className="flex-1 bg-gray-800 text-gray-300 text-xs py-1.5 rounded-lg active:bg-gray-700">3/4</button>
            <button onClick={() => handlePresetRaise('pot')} className="flex-1 bg-gray-800 text-gray-300 text-xs py-1.5 rounded-lg active:bg-gray-700">Pot</button>
            <button onClick={() => handlePresetRaise('allin')} className="flex-1 bg-red-900 text-red-300 text-xs py-1.5 rounded-lg active:bg-red-800">All-in</button>
          </div>
        </div>
      )}

      {/* Main action buttons */}
      <div className="flex gap-2 px-3 py-3">
        {/* Coaching button */}
        <button
          onClick={onGetSuggestion}
          className="w-10 h-14 flex items-center justify-center bg-gray-800 rounded-xl text-gold text-lg active:scale-95 transition-transform"
          title="Get GTO suggestion"
        >
          ?
        </button>

        {/* Fold */}
        {canFold && (
          <button
            onClick={() => onAction({ type: 'fold' })}
            className="btn-fold flex-1 min-w-0"
          >
            Fold
          </button>
        )}

        {/* Check */}
        {canCheck && (
          <button
            onClick={() => onAction({ type: 'check' })}
            className="btn-check flex-1 min-w-0"
          >
            Check
          </button>
        )}

        {/* Call */}
        {callAction && (
          <button
            onClick={() => onAction({ type: 'call', amount: callAction.amount })}
            className="btn-call flex-1 min-w-0"
          >
            <div>Call</div>
            <div className="text-xs opacity-80">{formatChips(callAction.amount)}</div>
          </button>
        )}

        {/* All-in (when can't raise normally) */}
        {allinAction && !raiseAction && (
          <button
            onClick={() => onAction({ type: 'allin', amount: allinAction.amount })}
            className="flex-1 min-w-0 btn-action bg-red-700 text-white"
          >
            <div>All In</div>
            <div className="text-xs opacity-80">{formatChips(allinAction.amount)}</div>
          </button>
        )}

        {/* Raise */}
        {raiseAction && (
          <>
            {showRaiseSlider ? (
              <button
                onClick={handleRaise}
                className="btn-raise flex-1 min-w-0"
              >
                <div>Raise</div>
                <div className="text-xs opacity-80">{formatChips(raiseAmount)}</div>
              </button>
            ) : (
              <button
                onClick={() => setShowRaiseSlider(true)}
                className="btn-raise flex-1 min-w-0"
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
