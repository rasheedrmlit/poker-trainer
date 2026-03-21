import { useState, useEffect } from 'react';
import Card from './Card';
import { formatChips } from '../utils/cards';

const gradeColors = {
  'A+': 'text-green-300', 'A': 'text-green-400',
  'B+': 'text-yellow-300', 'B': 'text-yellow-400',
  'C': 'text-orange-400', 'D': 'text-red-400', 'F': 'text-red-500'
};

const gradeEmojis = {
  'A+': 'Excellent!', 'A': 'Great play!',
  'B+': 'Good job!', 'B': 'Solid.',
  'C': 'Room to improve.', 'D': 'Needs work.', 'F': 'Big mistakes found.'
};

export default function HandComplete({ data, playerId, onGetAnalysis, analysis, onNextHand, isTraining = false }) {
  if (!data) return null;

  const [showStreets, setShowStreets] = useState(false);
  const [showImprovements, setShowImprovements] = useState(false);
  const [countdown, setCountdown] = useState(isTraining ? null : 5);

  const myWinner = data.winners?.find(w => w.playerId === playerId);
  const isWinner = !!myWinner;
  const myWinnings = myWinner?.amount || 0;

  // Auto-request analysis when hand completes
  useEffect(() => {
    if (!analysis) {
      const timer = setTimeout(() => onGetAnalysis(), 300);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-advance to next hand after 3s in non-training mode
  useEffect(() => {
    if (isTraining || countdown === null) return;
    if (countdown <= 0) {
      onNextHand();
      return;
    }
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, isTraining, onNextHand]);

  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="bg-gray-900/97 backdrop-blur-md rounded-t-2xl sm:rounded-2xl p-5 mx-0 sm:mx-4 max-w-lg w-full border-t sm:border border-gray-700 animate-slide-up pointer-events-auto max-h-[95vh] overflow-y-auto pb-24 sm:pb-5">

        {/* Result Banner */}
        <div className="text-center mb-4">
          <div className={`text-2xl font-black ${isWinner ? 'text-gold' : 'text-white'}`}>
            {isWinner ? `You Won ${formatChips(myWinnings)}!` : 'You Didn\'t Win This One'}
          </div>
          {isWinner && myWinner && myWinner.netGain !== undefined && (
            <div className="mt-1 flex items-center justify-center gap-3 text-sm">
              <span className="text-gray-400">Stack: {formatChips(myWinner.stackBefore)}</span>
              <span className="text-gold font-bold">→</span>
              <span className="text-green-400 font-bold">{formatChips(myWinner.stackAfter)}</span>
              <span className="text-green-400 text-xs">(+{formatChips(myWinner.netGain)})</span>
            </div>
          )}
          {!isWinner && (
            <p className="text-gray-300 text-sm mt-1">Every hand is a chance to learn. Let's review what happened.</p>
          )}
        </div>

        {/* Winners */}
        {data.winners?.map((w, i) => (
          <div key={i} className="flex items-center gap-3 mb-3 bg-gray-800/50 rounded-xl p-3">
            <div className="flex gap-1">
              {w.holeCards?.map((c, j) => (
                <Card key={j} card={c} size="sm" />
              ))}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">{w.name}</div>
              {w.handName && <div className="text-sm text-gray-200">{w.handName}</div>}
            </div>
            <div className="text-gold font-bold text-sm">+{formatChips(w.amount)}</div>
          </div>
        ))}

        {/* Showdown cards */}
        {data.showdown && data.players && (
          <div className="mt-2 pt-2 border-t border-gray-700/50">
            <div className="text-xs text-gray-300 uppercase tracking-wide font-bold mb-2">Other Hands</div>
            <div className="space-y-1.5">
              {data.players.filter(p => !p.folded && !data.winners?.some(w => w.playerId === p.id)).map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {p.holeCards?.map((c, j) => (
                      <Card key={j} card={c} size="sm" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-200">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== COACHING ANALYSIS ========== */}
        {analysis ? (
          <div className="mt-4 pt-4 border-t border-gray-600">
            {/* Grade + Summary */}
            <div className="flex items-start gap-3 mb-3">
              <div className="text-center">
                <div className={`text-3xl font-black ${gradeColors[analysis.overallGrade] || 'text-gray-200'}`}>
                  {analysis.overallGrade}
                </div>
                <div className="text-xs text-gray-300 font-bold">GRADE</div>
              </div>
              <div className="flex-1">
                <div className="text-base font-bold text-white mb-1">
                  {gradeEmojis[analysis.overallGrade] || 'Review'}
                </div>
                {analysis.summary && (
                  <p className="text-sm text-gray-100 leading-relaxed">{analysis.summary}</p>
                )}
              </div>
            </div>

            {/* Key Mistakes (shown prominently) */}
            {analysis.keyMistakes?.length > 0 && (
              <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-3 mb-3">
                <div className="text-xs text-red-300 uppercase tracking-wide font-bold mb-1.5">Key Mistakes</div>
                <div className="space-y-1.5">
                  {analysis.keyMistakes.map((m, i) => (
                    <p key={i} className="text-sm text-red-100 leading-relaxed">{m}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Street-by-Street Breakdown (expandable) */}
            {analysis.streetBreakdown?.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={() => setShowStreets(!showStreets)}
                  className="w-full flex items-center justify-between bg-gray-800/60 rounded-xl px-3 py-2.5 active:bg-gray-800"
                >
                  <span className="text-sm text-white font-bold">Street-by-Street Breakdown</span>
                  <span className="text-gray-300 text-xs">{showStreets ? '▼' : '▶'}</span>
                </button>

                {showStreets && (
                  <div className="mt-2 space-y-3 animate-fade-in">
                    {analysis.streetBreakdown.map((street, i) => (
                      <div key={i} className="bg-gray-800/40 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold text-gold">{street.streetName}</span>
                          {street.handStrengthDesc && (
                            <span className="text-xs text-gray-200">{street.handStrengthDesc}</span>
                          )}
                        </div>

                        {/* Community cards for this street */}
                        {street.communityCards?.length > 0 && (
                          <div className="flex gap-1 mb-2">
                            {street.communityCards.map((c, j) => (
                              <Card key={j} card={c} size="xs" />
                            ))}
                          </div>
                        )}

                        {/* Actions taken */}
                        <div className="space-y-1">
                          {street.actions.map((a, j) => (
                            <div key={j} className="text-sm text-white flex items-center gap-2">
                              <span className="text-gray-300 font-semibold">You:</span>
                              <span>{a}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action-by-action grades */}
            {analysis.actions?.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-200 uppercase tracking-wide font-bold mb-2">Your Decisions</div>
                <div className="space-y-1.5">
                  {analysis.actions.map((a, i) => {
                    const scoreColor = a.score >= 0.8 ? 'text-green-300' : a.score >= 0.5 ? 'text-yellow-300' : 'text-red-300';
                    const scoreBg = a.score >= 0.8 ? 'bg-green-900/30' : a.score >= 0.5 ? 'bg-yellow-900/30' : 'bg-red-900/30';
                    const scoreLabel = a.score >= 0.8 ? 'Good' : a.score >= 0.5 ? 'Okay' : 'Mistake';
                    return (
                      <div key={i} className={`${scoreBg} rounded-lg px-3 py-2`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm text-white font-semibold">
                            {a.streetName || ''}: {a.action}
                          </span>
                          <span className={`text-xs font-bold ${scoreColor}`}>{scoreLabel}</span>
                        </div>
                        {a.feedback && (
                          <p className="text-sm text-gray-100 leading-relaxed">{a.feedback}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Improvements (expandable) */}
            {analysis.improvements?.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={() => setShowImprovements(!showImprovements)}
                  className="w-full flex items-center justify-between bg-emerald-950/30 border border-emerald-800/30 rounded-xl px-3 py-2.5 active:bg-emerald-950/50"
                >
                  <span className="text-sm text-emerald-300 font-bold">Tips to Improve</span>
                  <span className="text-emerald-400 text-xs">{showImprovements ? '▼' : '▶'}</span>
                </button>

                {showImprovements && (
                  <div className="mt-2 bg-emerald-950/20 rounded-xl p-3 animate-fade-in">
                    <div className="space-y-2">
                      {analysis.improvements.map((imp, i) => (
                        <p key={i} className="text-sm text-emerald-100 leading-relaxed">{imp}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-gray-700 text-center">
            <div className="text-white text-sm animate-pulse-soft">Analyzing your play...</div>
          </div>
        )}

        {/* ========== DEAL NEXT HAND ========== */}
        <div className="mt-4 sticky bottom-0 pt-2 bg-gray-900/95">
          {isTraining ? (
            <>
              <button
                onClick={onNextHand}
                className="w-full bg-gradient-to-r from-gold-dark to-gold text-black font-bold py-4 rounded-xl text-lg active:scale-[0.97] transition-transform shadow-lg shadow-gold/20"
              >
                Deal Next Hand
              </button>
              <p className="text-center text-gray-400 text-xs mt-1">Take your time reviewing the analysis above</p>
            </>
          ) : (
            <div className="text-center">
              <p className="text-gray-300 text-sm">
                Next hand in <span className="text-gold font-bold">{countdown ?? 0}s</span>
              </p>
              <button
                onClick={onNextHand}
                className="text-gray-400 text-xs underline mt-1 active:text-white"
              >
                Deal now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
