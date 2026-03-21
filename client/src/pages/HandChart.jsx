import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHandGrid, getPreflopStrength } from '../utils/preflopStrength';

const TIER_INFO = [
  { tier: 'premium', label: 'Premium', color: '#facc15', range: '95–100%', plainEnglish: 'The absolute best starting hands. Always raise or re-raise before the flop.' },
  { tier: 'strong', label: 'Strong', color: '#22c55e', range: '85–94%', plainEnglish: 'Very good hands you should almost always play. Raise to build the pot and narrow the field.' },
  { tier: 'good', label: 'Good', color: '#3b82f6', range: '70–84%', plainEnglish: 'Solid hands that do well from middle or late position. Raise or call depending on what happened before you.' },
  { tier: 'playable', label: 'Playable', color: '#a78bfa', range: '50–69%', plainEnglish: 'Decent cards that depend on your position. Best when you act last (button/cutoff). Fold from early seats.' },
  { tier: 'marginal', label: 'Marginal', color: '#f97316', range: '30–49%', plainEnglish: 'Weak hands. Only consider playing from late position when nobody has raised.' },
  { tier: 'trash', label: 'Fold', color: '#ef4444', range: 'Below 30%', plainEnglish: 'These hands lose money over time. Fold them unless you\'re in the big blind with no raise.' },
];

export default function HandChart() {
  const navigate = useNavigate();
  const { grid, ranks } = getHandGrid();
  const [selected, setSelected] = useState(null);
  const [filterTier, setFilterTier] = useState(null);

  const handleCellTap = (cell) => {
    setSelected(selected?.key === cell.key ? null : cell);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900/90 border-b border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 text-gray-400 active:bg-gray-700"
        >
          ←
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">Hand Strength Chart</h1>
          <p className="text-[10px] text-gray-500">Tap any hand to learn more • Suited above diagonal, offsuit below</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {/* Legend */}
        <div className="flex flex-wrap gap-1.5 mb-3 px-1">
          {TIER_INFO.map(t => (
            <button
              key={t.tier}
              onClick={() => setFilterTier(filterTier === t.tier ? null : t.tier)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border transition-all ${
                filterTier && filterTier !== t.tier ? 'opacity-30' : 'opacity-100'
              }`}
              style={{
                borderColor: t.color + '60',
                backgroundColor: filterTier === t.tier ? t.color + '30' : 'transparent',
                color: t.color,
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
              {t.label}
            </button>
          ))}
        </div>

        {/* The 13×13 grid */}
        <div className="overflow-x-auto pb-2">
          <table className="border-collapse mx-auto" style={{ minWidth: '340px' }}>
            <thead>
              <tr>
                <th className="w-6" />
                {ranks.map(r => (
                  <th key={r} className="text-[9px] text-gray-500 font-mono font-bold w-[26px] text-center pb-0.5">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, r) => (
                <tr key={r}>
                  <td className="text-[9px] text-gray-500 font-mono font-bold text-right pr-1">
                    {ranks[r]}
                  </td>
                  {row.map((cell, c) => {
                    const dimmed = filterTier && cell.tier !== filterTier;
                    const isSelected = selected?.key === cell.key;
                    return (
                      <td
                        key={c}
                        onClick={() => handleCellTap(cell)}
                        className={`
                          w-[26px] h-[26px] text-center cursor-pointer select-none
                          border border-gray-800/50 rounded-[3px] transition-all
                          ${isSelected ? 'ring-2 ring-white scale-110 z-10 relative' : ''}
                          ${dimmed ? 'opacity-15' : ''}
                        `}
                        style={{
                          backgroundColor: cell.tierColor + (dimmed ? '10' : '35'),
                          fontSize: '8px',
                          fontWeight: 700,
                          color: dimmed ? '#333' : cell.tierColor,
                          lineHeight: 1,
                          padding: '2px',
                        }}
                      >
                        <div className="leading-none">
                          {cell.key.replace('s', '').replace('o', '')}
                        </div>
                        <div className="text-[6px] opacity-70" style={{ color: dimmed ? '#333' : cell.tierColor }}>
                          {cell.suited ? 's' : cell.offsuit ? 'o' : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* How to read callout */}
        <div className="mx-1 mt-2 mb-3 bg-gray-900/60 border border-gray-800 rounded-xl px-3 py-2.5">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">How to Read This Chart</div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            The <strong className="text-white">diagonal</strong> shows pairs (AA, KK, etc.).{' '}
            Hands <strong className="text-white">above</strong> the diagonal are <strong className="text-blue-400">suited</strong> (same suit — slightly stronger because they can make flushes).{' '}
            Hands <strong className="text-white">below</strong> the diagonal are <strong className="text-orange-400">offsuit</strong> (different suits).{' '}
            Tap any square to see a plain-English explanation.
          </p>
        </div>

        {/* Selected hand detail */}
        {selected && (
          <div className="mx-1 mb-3 bg-gray-900 border rounded-xl overflow-hidden animate-slide-up" style={{ borderColor: selected.tierColor + '50' }}>
            <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: selected.tierColor + '15' }}>
              <div className="text-2xl font-black font-mono" style={{ color: selected.tierColor }}>
                {selected.key}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: selected.tierColor + '30', color: selected.tierColor }}>
                    {selected.tierLabel}
                  </span>
                  <span className="text-sm font-bold" style={{ color: selected.tierColor }}>
                    {selected.winEquity?.toFixed(1)}% win rate
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Wins {selected.winEquity?.toFixed(1)}% vs a random hand heads-up
                  {selected.suited && ' • Same suit (can make flushes)'}
                  {selected.offsuit && ' • Different suits'}
                  {selected.pair && ' • Pocket pair'}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t" style={{ borderColor: selected.tierColor + '20' }}>
              {(() => {
                const info = getPreflopStrength(
                  { rank: selected.key[0], suit: 'h' },
                  { rank: selected.key[1], suit: selected.suited ? 'h' : 'd' }
                );
                return (
                  <>
                    <p className="text-sm text-gray-200 leading-relaxed">{info?.description}</p>
                    {renderPositionAdvice(selected)}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Tier Breakdown */}
        <div className="mx-1 mb-6">
          <h3 className="text-sm font-bold text-white mb-2 px-1">What Each Tier Means</h3>
          <div className="space-y-2">
            {TIER_INFO.map(t => (
              <div key={t.tier} className="bg-gray-900/60 border border-gray-800 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-xs font-bold" style={{ color: t.color }}>{t.label}</span>
                  <span className="text-[10px] text-gray-600 ml-auto">{t.range}</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">{t.plainEnglish}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick tips */}
        <div className="mx-1 mb-8 bg-gray-900/60 border border-gold/20 rounded-xl px-3 py-3">
          <h3 className="text-sm font-bold text-gold mb-2">Quick Tips for Beginners</h3>
          <ul className="space-y-1.5">
            {[
              'Pros fold 70–80% of their hands before the flop. Don\'t feel like you need to play every deal.',
              'Suited hands are better than offsuit because they can make flushes — but only slightly (about 3% more).',
              'Pairs are powerful because they can become "sets" (three of a kind) on the flop — and sets are hard for opponents to spot.',
              'Position matters more than your cards. A medium hand on the button often beats a good hand from early position.',
              'When in doubt, fold. Saving chips is just as important as winning them.',
            ].map((tip, i) => (
              <li key={i} className="flex gap-2 text-[11px] text-gray-400 leading-relaxed">
                <span className="text-gold shrink-0">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Position-specific advice for the selected hand */
function renderPositionAdvice(cell) {
  const pct = cell.percentile;
  let positions = [];

  if (pct >= 95) {
    positions = [
      { pos: 'Any Position', action: 'Raise', color: '#22c55e' },
      { pos: 'Facing a Raise', action: 'Re-raise', color: '#facc15' },
    ];
  } else if (pct >= 85) {
    positions = [
      { pos: 'Early Seat', action: 'Raise', color: '#22c55e' },
      { pos: 'Middle Seat', action: 'Raise', color: '#22c55e' },
      { pos: 'Late Seat', action: 'Raise', color: '#22c55e' },
      { pos: 'Facing a Raise', action: 'Call or Re-raise', color: '#facc15' },
    ];
  } else if (pct >= 70) {
    positions = [
      { pos: 'Early Seat', action: 'Fold or Raise', color: '#f97316' },
      { pos: 'Middle Seat', action: 'Raise', color: '#22c55e' },
      { pos: 'Late Seat', action: 'Raise', color: '#22c55e' },
      { pos: 'Facing a Raise', action: 'Call', color: '#3b82f6' },
    ];
  } else if (pct >= 50) {
    positions = [
      { pos: 'Early Seat', action: 'Fold', color: '#ef4444' },
      { pos: 'Middle Seat', action: 'Fold or Call', color: '#f97316' },
      { pos: 'Late Seat', action: 'Raise', color: '#22c55e' },
      { pos: 'Facing a Raise', action: 'Usually Fold', color: '#ef4444' },
    ];
  } else if (pct >= 30) {
    positions = [
      { pos: 'Early Seat', action: 'Fold', color: '#ef4444' },
      { pos: 'Middle Seat', action: 'Fold', color: '#ef4444' },
      { pos: 'Late Seat', action: 'Raise if no action', color: '#f97316' },
      { pos: 'Facing a Raise', action: 'Fold', color: '#ef4444' },
    ];
  } else {
    positions = [
      { pos: 'Any Position', action: 'Fold', color: '#ef4444' },
    ];
  }

  return (
    <div className="mt-2.5 pt-2.5 border-t border-gray-800">
      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1.5">What To Do By Position</div>
      <div className="grid grid-cols-2 gap-1.5">
        {positions.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 bg-gray-800/50 rounded-lg px-2 py-1.5">
            <span className="text-[10px] text-gray-400">{p.pos}</span>
            <span className="text-[10px] font-bold ml-auto" style={{ color: p.color }}>{p.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
