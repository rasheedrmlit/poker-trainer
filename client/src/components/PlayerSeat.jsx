import Card from './Card';
import { formatChips } from '../utils/cards';

// Avatar colors per AI type
const AVATAR_COLORS = {
  gto_bot: '#60a5fa',
  aggro_pro: '#f87171',
  nit_reg: '#94a3b8',
  loose_rec: '#fbbf24',
  elite_hybrid: '#a78bfa',
  maniac: '#fb923c',
  rock: '#6b7280',
  trappy: '#34d399',
  calling_station: '#f472b6',
  lag_shark: '#c084fc',
};

function getAvatarColor(player) {
  if (!player.isAI) return '#d4af37'; // gold for human
  return AVATAR_COLORS[player.aiType] || '#94a3b8';
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function PlayerSeat({ player, position, isHero, isActive, lastAction, showCards, compact = false }) {
  const [left, top] = position;
  const avatarColor = getAvatarColor(player);
  const dealerBadge = player.isDealer ? 'D' : player.isSB ? 'SB' : player.isBB ? 'BB' : null;

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
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
          <div className="relative">
            <div className={`
              text-xs font-black px-3 py-1 rounded-lg whitespace-nowrap shadow-lg
              ${lastAction.type === 'fold' ? 'bg-gray-700 text-gray-300' : ''}
              ${lastAction.type === 'check' ? 'bg-blue-900/90 text-blue-300' : ''}
              ${lastAction.type === 'call' ? 'bg-green-900/90 text-green-300' : ''}
              ${lastAction.type === 'raise' ? 'bg-yellow-900/90 text-yellow-300' : ''}
              ${lastAction.type === 'allin' ? 'bg-red-600 text-white' : ''}
            `}>
              {lastAction.type === 'fold' && 'FOLD'}
              {lastAction.type === 'check' && 'CHECK'}
              {lastAction.type === 'call' && `CALL ${formatChips(lastAction.amount)}`}
              {lastAction.type === 'raise' && `RAISE ${formatChips(lastAction.amount)}`}
              {lastAction.type === 'allin' && 'ALL IN'}
            </div>
            {/* Arrow */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
              style={{ background: lastAction.type === 'allin' ? '#dc2626' : lastAction.type === 'fold' ? '#374151' : '#1a1a2e' }} />
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="flex gap-0.5 mb-0.5 justify-center">
        {player.holeCards && player.holeCards.length === 2 && showCards ? (
          <>
            <Card card={player.holeCards[0]} size={isHero ? (compact ? 'xl' : 'lg') : (compact ? 'sm' : 'sm')} />
            <Card card={player.holeCards[1]} size={isHero ? (compact ? 'xl' : 'lg') : (compact ? 'sm' : 'sm')} delay={50} />
          </>
        ) : player.folded ? null : (
          <>
            <Card faceDown size={isHero ? (compact ? 'xl' : 'lg') : (compact ? 'sm' : 'xs')} />
            <Card faceDown size={isHero ? (compact ? 'xl' : 'lg') : (compact ? 'sm' : 'xs')} delay={50} />
          </>
        )}
      </div>

      {/* Player nameplate */}
      <div className={`relative ${player.folded ? 'opacity-35' : ''}`}>
        {/* Active glow ring */}
        {isActive && !player.folded && (
          <div className="absolute -inset-1 rounded-2xl animate-pulse-soft" style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.4), rgba(212,175,55,0.1))',
            filter: 'blur(4px)',
          }} />
        )}

        <div className={`
          relative flex items-center gap-1.5 rounded-xl px-1.5 py-1 ${compact ? 'min-w-[60px]' : 'min-w-[80px]'}
          ${isActive ? 'ring-2 ring-gold/80' : ''}
          ${isHero
            ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-gold/30'
            : 'bg-gradient-to-b from-gray-800/95 to-gray-900/95 border border-gray-600/30'
          }
        `}
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
        >
          {/* Avatar */}
          <div
            className={`${compact ? 'w-5 h-5 text-[7px] border' : 'w-7 h-7 text-[10px] border-2'} rounded-full flex items-center justify-center font-black shrink-0`}
            style={{
              background: `linear-gradient(135deg, ${avatarColor}, color-mix(in srgb, ${avatarColor} 60%, black))`,
              borderColor: `color-mix(in srgb, ${avatarColor} 70%, white)`,
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            {getInitials(player.name)}
          </div>

          {/* Name + Stack */}
          <div className="flex flex-col min-w-0">
            <div className={`${compact ? 'text-[9px] max-w-[50px]' : 'text-[11px] max-w-[65px]'} font-bold truncate leading-tight ${isHero ? 'text-gold' : 'text-gray-200'}`}>
              {player.name}
            </div>
            <div className={`${compact ? 'text-[8px]' : 'text-[10px]'} font-mono leading-tight`} style={{ color: 'rgba(255,255,255,0.5)' }}>
              {formatChips(player.stack)}
            </div>
          </div>

          {/* Dealer / Blind badge */}
          {dealerBadge && (
            <div
              className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black shadow-lg"
              style={{
                background: dealerBadge === 'D'
                  ? 'linear-gradient(135deg, #fde68a, #d4af37)'
                  : dealerBadge === 'SB'
                    ? 'linear-gradient(135deg, #94a3b8, #64748b)'
                    : 'linear-gradient(135deg, #6b7280, #4b5563)',
                color: dealerBadge === 'D' ? '#1a1a2e' : '#fff',
                border: '2px solid rgba(0,0,0,0.4)',
              }}
            >
              {dealerBadge}
            </div>
          )}
        </div>

        {/* Bet chip display */}
        {player.bet > 0 && !player.allIn && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 animate-chip-toss">
            <div className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-md"
              style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }} />
            <span className="text-yellow-400 text-[10px] font-bold drop-shadow-sm">{formatChips(player.bet)}</span>
          </div>
        )}

        {/* All-in badge */}
        {player.allIn && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 animate-fade-in">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-lg border border-red-400/30"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              ALL IN
            </div>
          </div>
        )}

        {/* Disconnected */}
        {!player.connected && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-900 text-red-300 text-[7px] font-bold px-1.5 py-0.5 rounded-full border border-red-700">
            DC
          </div>
        )}
      </div>
    </div>
  );
}
