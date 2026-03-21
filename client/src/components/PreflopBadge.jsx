import { useState } from 'react';
import { getPreflopStrength } from '../utils/preflopStrength';

/**
 * A small badge shown near the hero's cards during a hand (training mode).
 * Shows the preflop win percentage against a random opponent.
 * Tap to expand/collapse the description.
 */
export default function PreflopBadge({ cards }) {
  const [expanded, setExpanded] = useState(false);

  if (!cards || cards.length < 2) return null;

  const data = getPreflopStrength(cards[0], cards[1]);
  if (!data) return null;

  const { key, winEquity, tierLabel, tierColor, description } = data;

  return (
    <div
      className="absolute left-1/2 bottom-[42%] -translate-x-1/2 z-30 animate-fade-in"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Compact badge */}
      <div
        className="flex items-center gap-1.5 rounded-full px-3 py-1 cursor-pointer select-none shadow-lg border border-white/10"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      >
        {/* Colored dot */}
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tierColor }} />

        {/* Hand label */}
        <span className="text-white/80 text-[11px] font-mono font-bold">{key}</span>

        {/* Separator */}
        <span className="text-white/20 text-[10px]">|</span>

        {/* Win percentage */}
        <span className="text-[13px] font-black" style={{ color: tierColor }}>
          {winEquity.toFixed(1)}% win
        </span>

        {/* Tier */}
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: tierColor + '25', color: tierColor }}
        >
          {tierLabel}
        </span>

        {/* Expand chevron */}
        <span className="text-white/40 text-[10px]">{expanded ? '▼' : '▶'}</span>
      </div>

      {/* Expanded description */}
      {expanded && (
        <div
          className="mt-1.5 rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed max-w-[300px] animate-slide-up shadow-xl border border-white/10"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
        >
          <p className="text-gray-200">{description}</p>
          <p className="text-gray-400 text-[11px] mt-1.5">
            Against one random opponent, this hand wins about <strong className="text-white">{winEquity.toFixed(1)}%</strong> of the time when both players go all-in before the flop.
            {winEquity >= 70 && ' That\'s a monster — you\'re a huge favorite!'}
            {winEquity >= 60 && winEquity < 70 && ' You\'re a solid favorite heads-up.'}
            {winEquity >= 50 && winEquity < 60 && ' Slightly better than a coin flip — position and post-flop play matter a lot.'}
            {winEquity < 50 && ' You\'re an underdog — be selective about when you play this.'}
          </p>
          <p className="text-gray-600 text-[9px] mt-1.5">
            With more opponents at the table, your win % goes down. Tap to close.
          </p>
        </div>
      )}
    </div>
  );
}
