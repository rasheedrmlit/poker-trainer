import Card from './Card';
import { formatChips } from '../utils/cards';

const TABS = [
  { key: 'stats', label: 'Stats' },
  { key: 'leaks', label: 'Leaks' },
  { key: 'history', label: 'History' }
];

export default function Sidebar({
  tab, onClose, onChangeTab,
  sessionSummary, leakReport, handHistory,
  playerId, onGetAnalysis, handAnalysis,
  onRefreshStats, onRefreshLeaks, onRefreshHistory
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-sm bg-gray-900 h-full overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 z-10 border-b border-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-lg font-bold text-white">Dashboard</h2>
            <button onClick={onClose} className="text-gray-400 active:text-white p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => {
                  onChangeTab(t.key);
                  if (t.key === 'stats') onRefreshStats();
                  if (t.key === 'leaks') onRefreshLeaks();
                  if (t.key === 'history') onRefreshHistory();
                }}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? 'text-gold border-b-2 border-gold'
                    : 'text-gray-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {tab === 'stats' && <StatsTab data={sessionSummary} />}
          {tab === 'leaks' && <LeaksTab data={leakReport} />}
          {tab === 'history' && <HistoryTab data={handHistory} playerId={playerId} onAnalyze={onGetAnalysis} analysis={handAnalysis} />}
        </div>
      </div>
    </div>
  );
}

function StatsTab({ data }) {
  if (!data || !data.hasData) {
    return <div className="text-gray-500 text-center py-8">Play some hands to see your stats!</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Hands Played" value={data.handsPlayed} />
        <StatCard label="Hands Won" value={data.handsWon} />
        <StatCard label="Win Rate" value={`${data.winPct || 0}%`} />
        <StatCard label="Avg Grade" value={data.avgGrade} highlight />
      </div>

      {/* Encouragement */}
      {data.encouragement && (
        <div className="bg-gold/10 border border-gold/20 rounded-xl p-4">
          <p className="text-sm text-gray-300">{data.encouragement}</p>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Session Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total Won</span>
            <span className="text-green-400 font-mono">{formatChips(data.totalWon)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Hands Lost</span>
            <span className="text-red-400 font-mono">{data.handsLost}</span>
          </div>
        </div>
      </div>

      {data.topTip && (
        <div className="bg-gold/10 border border-gold/20 rounded-xl p-4">
          <div className="text-xs text-gold font-semibold mb-1">Top Tip</div>
          <p className="text-sm text-gray-300">{data.topTip}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 text-center">
      <div className={`text-xl font-bold ${highlight ? 'text-gold' : 'text-white'}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function LeaksTab({ data }) {
  if (!data || !data.hasEnoughData) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">Not enough data yet</div>
        <p className="text-gray-600 text-sm">{data?.message || 'Play at least 5 hands to generate a leak report.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {data.summary && (
        <div className="bg-orange-950/30 border border-orange-500/30 rounded-xl p-4">
          <p className="text-sm text-gray-300 leading-relaxed">{data.summary}</p>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-4">
        <div className="text-sm text-gray-400 mb-1">Total Mistakes Tracked</div>
        <div className="text-2xl font-bold text-white">{data.totalMistakes}</div>
        <div className="text-xs text-gray-500 mt-1">
          Most mistakes happen: <span className="text-orange-400">{data.worstStreetName || data.worstStreet}</span>
          {data.worstStreetCount && <span className="text-gray-600"> ({data.worstStreetCount} times)</span>}
        </div>
      </div>

      {data.leaks?.map((leak, i) => (
        <div key={i} className="bg-gray-800 rounded-xl p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-orange-400">Leak #{i + 1}</span>
            <span className="text-xs text-gray-500">{leak.frequency}% of mistakes</span>
          </div>
          <p className="text-sm text-gray-200 mb-2 font-medium">{leak.description}</p>
          <p className="text-xs text-gray-400 leading-relaxed mb-2">{leak.fix}</p>
          {leak.examples && (
            <div className="bg-gray-900/50 rounded-lg p-3 mt-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Example</div>
              <p className="text-xs text-gray-400">{leak.examples}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HistoryTab({ data, playerId, onAnalyze, analysis }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center py-8">No hand history yet.</div>;
  }

  return (
    <div className="space-y-3">
      {[...data].reverse().slice(0, 20).map((hand, i) => {
        const playerData = hand.players.find(p => p.id === playerId);
        const winner = hand.winners.find(w => w.playerId === playerId);
        const isWinner = !!winner;

        return (
          <div
            key={hand.handNumber}
            className="bg-gray-800 rounded-xl p-3 active:bg-gray-700 transition-colors"
            onClick={() => onAnalyze(data.length - 1 - i)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Hand #{hand.handNumber}</span>
              <span className={`text-xs font-bold ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
                {isWinner ? `+${formatChips(winner.amount)}` : 'Lost'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Hole cards */}
              <div className="flex gap-0.5">
                {playerData?.holeCards?.map((c, j) => (
                  <Card key={j} card={c} size="sm" />
                ))}
              </div>

              {/* Community */}
              <div className="flex gap-0.5 ml-2">
                {hand.communityCards?.map((c, j) => (
                  <Card key={j} card={c} size="sm" />
                ))}
              </div>

              {/* Position */}
              <span className="ml-auto text-[10px] text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
                {playerData?.position}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
