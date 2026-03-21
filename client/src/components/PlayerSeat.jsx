import Card from './Card';
import { formatChips, getPositionColor } from '../utils/cards';

export default function PlayerSeat({ player, position, isHero, isActive, lastAction, showCards }) {
  const [left, top] = position;

  const posLabel = player.position;
  const posColor = getPositionColor(posLabel);

  const dealerBadge = player.isDealer ? 'BTN' : player.isSB ? 'SB' : player.isBB ? 'BB' : null;

  return (
    <div
      className="player-seat z-20"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Action bubble */}
      {lastAction && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap animate-fade-in z-30">
          {lastAction.type === 'fold' && 'FOLD'}
          {lastAction.type === 'check' && 'CHECK'}
          {lastAction.type === 'call' && `CALL $${lastAction.amount}`}
          {lastAction.type === 'raise' && `RAISE $${lastAction.amount}`}
          {lastAction.type === 'allin' && 'ALL IN!'}
        </div>
      )}

      {/* Cards */}
      <div className="flex gap-0.5 mb-1 justify-center">
        {player.holeCards && player.holeCards.length === 2 && showCards ? (
          <>
            <Card card={player.holeCards[0]} size={isHero ? 'hero' : 'md'} />
            <Card card={player.holeCards[1]} size={isHero ? 'hero' : 'md'} delay={50} />
          </>
        ) : player.folded ? null : (
          <>
            <Card faceDown size={isHero ? 'hero' : 'md'} />
            <Card faceDown size={isHero ? 'hero' : 'md'} delay={50} />
          </>
        )}
      </div>

      {/* Player info */}
      <div
        className={`
          relative rounded-xl px-3 py-1.5 text-center min-w-[70px]
          ${isActive ? 'ring-2 ring-gold animate-pulse-soft' : ''}
          ${player.folded ? 'opacity-40' : ''}
          ${isHero ? 'bg-gray-800 border border-gold/40' : 'bg-gray-800/90 border border-gray-600/50'}
        `}
      >
        {/* Position badge */}
        {dealerBadge && (
          <div
            className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-gray-800"
            style={{ backgroundColor: posColor, color: dealerBadge === 'BTN' ? '#000' : '#fff' }}
          >
            {dealerBadge}
          </div>
        )}

        <div className={`text-xs font-semibold truncate max-w-[80px] ${isHero ? 'text-gold' : 'text-gray-200'}`}>
          {player.name}
          {player.isAI && <span className="text-gray-500 ml-1">AI</span>}
        </div>
        <div className="text-[11px] text-gray-400 font-mono">
          {formatChips(player.stack)}
        </div>

        {/* Bet amount */}
        {player.bet > 0 && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-gray-700/80 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
            {formatChips(player.bet)}
          </div>
        )}

        {/* All-in indicator */}
        {player.allIn && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            ALL IN
          </div>
        )}

        {/* Disconnected */}
        {!player.connected && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-800 text-red-200 text-[8px] px-1.5 py-0.5 rounded-full">
            DC
          </div>
        )}
      </div>
    </div>
  );
}
