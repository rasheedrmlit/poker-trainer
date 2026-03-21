import Card from './Card';
import PlayerSeat from './PlayerSeat';
import { formatChips } from '../utils/cards';

// Seat positions for 2-10 players arranged around an oval table
// Positions are percentages [left%, top%] - mobile-optimized
const SEAT_LAYOUTS = {
  2: [
    [50, 85],  // bottom (hero)
    [50, 8],   // top
  ],
  3: [
    [50, 85],
    [12, 30],
    [88, 30],
  ],
  4: [
    [50, 85],
    [8, 50],
    [50, 8],
    [92, 50],
  ],
  5: [
    [50, 85],
    [8, 55],
    [25, 8],
    [75, 8],
    [92, 55],
  ],
  6: [
    [50, 85],
    [5, 55],
    [18, 10],
    [50, 5],
    [82, 10],
    [95, 55],
  ],
  7: [
    [50, 87],
    [5, 60],
    [5, 25],
    [30, 5],
    [70, 5],
    [95, 25],
    [95, 60],
  ],
  8: [
    [50, 87],
    [5, 65],
    [5, 30],
    [22, 5],
    [50, 3],
    [78, 5],
    [95, 30],
    [95, 65],
  ],
  9: [
    [50, 87],
    [5, 68],
    [5, 35],
    [15, 8],
    [40, 3],
    [60, 3],
    [85, 8],
    [95, 35],
    [95, 68],
  ],
  10: [
    [50, 87],
    [5, 68],
    [5, 38],
    [12, 12],
    [33, 3],
    [50, 1],
    [67, 3],
    [88, 12],
    [95, 38],
    [95, 68],
  ]
};

export default function PokerTable({ gameState, playerId, lastAction }) {
  if (!gameState) return null;

  const players = gameState.players || [];
  const community = gameState.communityCards || [];
  const numPlayers = players.length;

  // Find hero index and reorder so hero is at bottom
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

  return (
    <div className="w-full h-full relative">
      {/* Table felt */}
      <div className="absolute inset-4 sm:inset-8 rounded-[40%] bg-gradient-to-br from-felt-light via-felt to-felt-dark border-4 border-amber-900/60 shadow-[inset_0_4px_30px_rgba(0,0,0,0.5)]" />

      {/* Pot display */}
      {gameState.pot > 0 && (
        <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-2 animate-chip-toss">
            <div className="w-4 h-4 rounded-full bg-gold border border-gold-dark" />
            <span className="text-gold font-bold text-sm">{formatChips(gameState.pot)}</span>
          </div>
        </div>
      )}

      {/* Community cards */}
      <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 flex gap-2 z-10">
        {community.map((card, i) => (
          <Card key={i} card={card} size="lg" delay={i * 100} />
        ))}
        {/* Placeholders for undealt cards */}
        {Array.from({ length: Math.max(0, 5 - community.length) }).map((_, i) => (
          <div key={`ph-${i}`} className="w-[72px] h-[104px] rounded-lg border border-white/5" />
        ))}
      </div>

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
