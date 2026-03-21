import { useState } from 'react';

export default function CoachingPanel({ coaching, onDismiss }) {
  if (!coaching) return null;

  const rec = coaching.recommendation || coaching.suggestion?.recommendation;
  const analysis = coaching.analysis;
  const tip = coaching.tip || coaching.suggestion?.tip;

  if (!rec && !analysis) return null;

  const [expanded, setExpanded] = useState(false);

  const qualityColors = {
    optimal: 'border-green-500 bg-green-950/50',
    acceptable: 'border-yellow-500 bg-yellow-950/50',
    suboptimal: 'border-orange-500 bg-orange-950/50',
    mistake: 'border-red-500 bg-red-950/50'
  };

  const qualityLabels = {
    optimal: 'Great Play!',
    acceptable: 'Okay Move',
    suboptimal: 'Could Be Better',
    mistake: 'Costly Mistake'
  };

  const qualityTextColors = {
    optimal: 'text-green-400',
    acceptable: 'text-yellow-400',
    suboptimal: 'text-orange-400',
    mistake: 'text-red-400'
  };

  const confidenceLabels = {
    high: 'Strong recommendation',
    medium: 'Moderate confidence',
    low: 'Borderline — could go either way'
  };

  const confidenceColors = {
    high: 'bg-green-600',
    medium: 'bg-yellow-600',
    low: 'bg-orange-600'
  };

  return (
    <div className="coaching-overlay" onClick={(e) => { if (!expanded) onDismiss(); }}>
      {/* Pre-action suggestion */}
      {rec && !analysis && (
        <div onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-gold font-bold text-sm">Coach Says:</span>
              {rec.confidence && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${confidenceColors[rec.confidence]}`}>
                  {confidenceLabels[rec.confidence]}
                </span>
              )}
            </div>
          </div>

          {/* Plain action recommendation */}
          {rec.plainAction && (
            <div className="bg-gold/10 border border-gold/30 rounded-lg px-3 py-2 mb-3">
              <p className="text-gold text-sm font-semibold">{rec.plainAction}</p>
              {rec.suggestedAmount && (
                <p className="text-gold/70 text-xs mt-0.5">Suggested bet: ${rec.suggestedAmount}</p>
              )}
            </div>
          )}

          {/* Main reasoning */}
          {rec.reasoning && (
            <p className="text-gray-300 text-xs leading-relaxed mb-2">{rec.reasoning}</p>
          )}

          {/* Expandable "why" section */}
          {rec.whyItMatters && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="w-full text-left"
            >
              <div className="flex items-center gap-1 text-blue-400 text-xs mb-1">
                <span>{expanded ? '▼' : '▶'}</span>
                <span className="font-semibold">Why does this matter?</span>
              </div>
              {expanded && (
                <p className="text-gray-400 text-xs leading-relaxed pl-4 mb-2 animate-fade-in">{rec.whyItMatters}</p>
              )}
            </button>
          )}

          {/* Math breakdown for postflop */}
          {rec.mathBreakdown && (
            <div className="bg-gray-800/50 rounded-lg px-3 py-2 mt-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">The Math</div>
              <p className="text-gray-300 text-xs">{rec.mathBreakdown}</p>
            </div>
          )}

          {/* Tip */}
          {tip && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <p className="text-gray-400 text-xs italic leading-relaxed">{tip}</p>
            </div>
          )}

          <div className="text-gray-600 text-[10px] mt-2">Tap outside to dismiss</div>
        </div>
      )}

      {/* Post-action analysis */}
      {analysis && (
        <div className={`border-l-4 rounded-r-xl pl-3 ${qualityColors[analysis.quality] || 'border-gray-500'}`}
             onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`font-bold text-sm ${qualityTextColors[analysis.quality]}`}>
              {qualityLabels[analysis.quality] || 'Review'}
            </span>
          </div>

          <p className="text-gray-200 text-sm mb-2">{analysis.feedback}</p>

          {/* Detailed explanation */}
          {analysis.detailedFeedback && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="w-full text-left"
            >
              <div className="flex items-center gap-1 text-blue-400 text-xs mb-1">
                <span>{expanded ? '▼' : '▶'}</span>
                <span className="font-semibold">Learn more about this</span>
              </div>
              {expanded && (
                <p className="text-gray-400 text-xs leading-relaxed pl-4 animate-fade-in">{analysis.detailedFeedback}</p>
              )}
            </button>
          )}

          {/* Math */}
          {analysis.mathBreakdown && expanded && (
            <div className="bg-gray-800/50 rounded-lg px-3 py-2 mt-2 animate-fade-in">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">The Math</div>
              <p className="text-gray-300 text-xs">{analysis.mathBreakdown}</p>
            </div>
          )}

          <div className="text-gray-600 text-[10px] mt-2">Tap outside to dismiss</div>
        </div>
      )}
    </div>
  );
}
