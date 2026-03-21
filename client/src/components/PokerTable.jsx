import Card from './Card';
import PlayerSeat from './PlayerSeat';
import PreflopBadge from './PreflopBadge';
import { formatChips } from '../utils/cards';

// Seat positions for 2-10 players arranged around an oval table
const SEAT_LAYOUTS = {
  2: [[50, 85], [50, 8]],
  3: [[50, 85], [12, 30], [88, 30]],
  4: [[50, 85], [8, 50], [50, 8], [92, 50]],
  5: [[50, 85], [8, 55], [25, 8], [75, 8], [92, 55]],
  6: [[50, 85], [5, 55], [18, 10], [50, 5], [82, 10], [95, 55]],
  7: [[50, 87], [5, 60], [5, 25], [30, 5], [70, 5], [95, 25], [95, 60]],
  8: [[50, 87], [5, 65], [5, 30], [22, 5], [50, 3], [78, 5], [95, 30], [95, 65]],
  9: [[50, 87], [5, 68], [5, 35], [15, 8], [40, 3], [60, 3], [85, 8], [95, 35], [95, 68]],
  10: [[50, 87], [5, 68], [5, 38], [12, 12], [33, 3], [50, 1], [67, 3], [88, 12], [95, 38], [95, 68]]
};

export default function PokerTable({ gameState, playerId, lastAction, isTraining = false }) {
  if (!gameState) return null;

  const players = gameState.players || [];
  const community = gameState.communityCards || [];
  const numPlayers = players.length;

  const heroIdx = players.findIndex(p => p.id === playerId);
  const reordered = [];
  if (heroIdx >= 0) {
    for (let i = 0; i < numPlayers; i++) {
      reordered.push(players[(heroIdx + i) % numPlayers]);
    }
  } else {
    reordered.push(...players);
  }

  const layout = SEAT_LAYOUTS[Math.min(numPlayers, 10)] || SEAT_LAYOUTS[10];

  // Compute effective BB for preflop badge
  const hero = players.find(p => p.id === playerId);
  const bb = gameState.config?.bigBlind || 2;
  const effectiveBB = hero ? Math.round((hero.stack + (hero.bet || 0)) / bb) : 100;

  return (
    <div className="w-full h-full relative">
      {/* Outer shadow / room backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" />

      {/* Table rail (outer rim) */}
      <div
        className="absolute inset-3 sm:inset-6 rounded-[45%]"
        style={{
          background: `linear-gradient(145deg, var(--rail-light, #8b6914), var(--rail, #5c3a1e))`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
          padding: '6px',
        }}
      >
        {/* Inner rail bevel */}
        <div
          className="w-full h-full rounded-[44%]"
          style={{
            background: `linear-gradient(165deg, var(--rail, #5c3a1e), color-mix(in srgb, var(--rail, #5c3a1e) 70%, black))`,
            padding: '4px',
          }}
        >
          {/* Felt surface */}
          <div
            className="w-full h-full rounded-[42%] relative overflow-hidden"
            style={{
              background: `radial-gradient(ellipse at 50% 40%, var(--felt-light, #2a7a42), var(--felt, #1a5c2e) 50%, var(--felt-dark, #0f3d1e))`,
              boxShadow: 'inset 0 4px 40px rgba(0,0,0,0.5), inset 0 -2px 20px rgba(0,0,0,0.3)',
            }}
          >
            {/* Felt texture overlay */}
            <div
              className="absolute inset-0 opacity-[0.04] rounded-[42%]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Center line / branding */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.06]">
              <div className="w-[60%] h-[1px] bg-white rounded-full" />
            </div>

            {/* Subtle center glow */}
            <div
              className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[200px] h-[120px] rounded-full opacity-20"
              style={{ background: `radial-gradient(ellipse, var(--felt-accent, #d4af37) 0%, transparent 70%)` }}
            />
          </div>
        </div>
      </div>

      {/* Pot display */}
      {gameState.pot > 0 && (
        <div className="absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-black/50 backdrop-blur-md rounded-full px-5 py-2 flex items-center gap-2.5 animate-chip-toss border border-white/5 shadow-lg">
            {/* Chip stack icon */}
            <div className="relative w-5 h-5">
              <div className="absolute bottom-0 left-0 w-5 h-1.5 rounded-full bg-red-600 border border-red-800" />
              <div className="absolute bottom-1 left-0 w-5 h-1.5 rounded-full bg-blue-600 border border-blue-800" />
              <div className="absolute bottom-2 left-0 w-5 h-1.5 rounded-full bg-gold border border-gold-dark" />
            </div>
            <span className="text-gold font-black text-sm tracking-wide">{formatChips(gameState.pot)}</span>
          </div>
        </div>
      )}

      {/* Community cards */}
      <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 flex gap-1.5 sm:gap-2 z-10">
        {community.map((card, i) => (
          <div key={i} className="drop-shadow-lg">
            <Card card={card} size="lg" delay={i * 100} />
          </div>
        ))}
        {Array.from({ length: Math.max(0, 5 - community.length) }).map((_, i) => (
          <div
            key={`ph-${i}`}
            className="w-[72px] h-[104px] rounded-lg border border-white/[0.03]"
          />
        ))}
      </div>

      {/* Preflop hand strength badge — training mode only, depth-aware */}
      {isTraining && (() => {
        if (hero?.holeCards?.length === 2 && gameState.state !== 'waiting' && gameState.state !== 'hand_complete') {
          return <PreflopBadge cards={hero.holeCards} effectiveBB={effectiveBB} />;
        }
        return null;
      })()}

      {/* Player seats */}
      {reordered.map((player, i) => {
        const pos = layout[i] || layout[0];
        const isHero = player.id === playerId;
        const isActive = player.id === gameState.currentPlayerId;
        const acted = lastAction?.playerId === player.id;

        return (
          <PlayerSeat
            key={player.id}
            player={player}
            position={pos}
            isHero={isHero}
            isActive={isActive}
            lastAction={acted ? lastAction : null}
            showCards={isHero || gameState.state === 'hand_complete'}
          />
        );
      })}
    </div>
  );
}
