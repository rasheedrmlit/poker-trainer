import { useState } from 'react';
import { getPreflopStrength, getDeepStackStrength } from '../utils/preflopStrength';

export default function PreflopBadge({ cards, effectiveBB = 100, compact = false }) {
  const [expanded, setExpanded] = useState(false);

  if (!cards || cards.length < 2) return null;

  const isDeep = effectiveBB >= 150;
  const data = isDeep
    ? getDeepStackStrength(cards[0], cards[1])
    : getPreflopStrength(cards[0], cards[1]);
  if (!data) return null;

  const { key, winEquity, tierLabel, tierColor, description, deepBonus } = data;

  // Mobile: right of hero cards, same row; Desktop: centered below cards
  const posStyle = compact
    ? { position: 'absolute', left: '70%', bottom: '6%', transform: 'translateX(-50%)', zIndex: 30 }
    : { position: 'absolute', left: '50%', bottom: '30%', transform: 'translateX(-50%)', zIndex: 30 };

  return (
    <div style={posStyle} className="animate-fade-in" onClick={() => setExpanded(!expanded)}>
      <div
        className="flex items-center gap-1 rounded-full cursor-pointer select-none shadow-lg"
        style={{
          backgroundColor: 'rgba(0,0,0,0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: compact ? '2px 8px' : '4px 12px',
        }}
      >
        <div className="rounded-full shrink-0" style={{ width: compact ? 8 : 10, height: compact ? 8 : 10, backgroundColor: tierColor }} />

        <span style={{ color: tierColor, fontSize: compact ? 10 : 13, fontWeight: 900 }}>
          {winEquity.toFixed(1)}%
        </span>

        {!compact && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}>{key}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>|</span>
            <span style={{ backgroundColor: tierColor + '25', color: tierColor, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 9999 }}>
              {tierLabel}
            </span>
            {isDeep && <span style={{ color: '#f87171', fontSize: 9, fontWeight: 700 }}>DEEP</span>}
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{expanded ? '▼' : '▶'}</span>
          </>
        )}
      </div>

      {expanded && (
        <div
          className="animate-slide-up"
          style={{
            marginTop: 6,
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 12,
            lineHeight: 1.5,
            maxWidth: compact ? 220 : 300,
            backgroundColor: 'rgba(0,0,0,0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 11, marginBottom: 4 }}>{key} — {tierLabel}</p>
          <p style={{ color: '#e5e7eb', fontSize: 11 }}>{description}</p>
          <p style={{ color: '#9ca3af', fontSize: 10, marginTop: 4 }}>
            Wins ~<strong style={{ color: '#fff' }}>{winEquity.toFixed(1)}%</strong> heads-up all-in.
            {winEquity >= 70 && ' Monster hand!'}
            {winEquity >= 60 && winEquity < 70 && ' Strong favorite.'}
            {winEquity >= 50 && winEquity < 60 && ' Slight edge — play matters.'}
            {winEquity < 50 && ' Underdog — be selective.'}
          </p>
          {isDeep && deepBonus > 0 && (
            <p style={{ color: '#fca5a5', fontSize: 9, marginTop: 4 }}>
              Deep-stack bonus: more playable at {effectiveBB} BB.
            </p>
          )}
          <p style={{ color: '#4b5563', fontSize: 8, marginTop: 4 }}>Tap to close</p>
        </div>
      )}
    </div>
  );
}
