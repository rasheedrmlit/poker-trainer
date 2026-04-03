// Tiny inline SVG bankroll graph — no dependencies
import { formatChips } from '../utils/cards';

export default function BankrollGraph({ history = [] }) {
  if (history.length < 2) return null;

  const w = 280, h = 80, pad = 4;
  const vals = history.slice(-50); // last 50 data points
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const points = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  const last = vals[vals.length - 1];
  const first = vals[0];
  const up = last >= first;
  const color = up ? '#22c55e' : '#ef4444';
  const fillColor = up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';

  // Fill path (area under the line)
  const fillPoints = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`;

  return (
    <div className="bg-gray-800/60 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400 font-semibold">Bankroll</span>
        <span className={`text-xs font-bold ${up ? 'text-green-400' : 'text-red-400'}`}>
          {up ? '+' : ''}{formatChips(last - first)}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 60 }}>
        <polygon points={fillPoints} fill={fillColor} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Current value dot */}
        <circle cx={w - pad} cy={h - pad - ((last - min) / range) * (h - pad * 2)} r="3" fill={color} />
      </svg>
      <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
        <span>{formatChips(min)}</span>
        <span>Now: {formatChips(last)}</span>
        <span>{formatChips(max)}</span>
      </div>
    </div>
  );
}
