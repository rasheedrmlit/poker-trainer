import { getSuitColor, getSuitSymbol } from '../utils/cards';

const FACE_SYMBOLS = { K: '♚', Q: '♛', J: '♝' };

export default function Card({ card, size = 'md', faceDown = false, delay = 0 }) {
  const sizes = {
    xs: { w: 'w-6', h: 'h-[36px]', rank: 'text-[7px]', suit: 'text-[6px]', center: 'text-xs', face: 'text-[10px]' },
    sm: { w: 'w-9', h: 'h-[52px]', rank: 'text-[10px]', suit: 'text-[8px]', center: 'text-base', face: 'text-sm' },
    md: { w: 'w-12', h: 'h-[68px]', rank: 'text-xs', suit: 'text-[9px]', center: 'text-xl', face: 'text-lg' },
    lg: { w: 'w-[60px]', h: 'h-[86px]', rank: 'text-sm', suit: 'text-[10px]', center: 'text-2xl', face: 'text-xl' },
    xl: { w: 'w-[68px]', h: 'h-[98px]', rank: 'text-base', suit: 'text-xs', center: 'text-3xl', face: 'text-2xl' },
    hero: { w: 'w-[76px]', h: 'h-[108px]', rank: 'text-lg', suit: 'text-sm', center: 'text-4xl', face: 'text-3xl' },
  };

  const s = sizes[size] || sizes.md;

  if (faceDown || !card) {
    return (
      <div
        className={`${s.w} ${s.h} rounded-lg flex-shrink-0 animate-deal relative overflow-hidden`}
        style={{
          animationDelay: `${delay}ms`,
          background: 'linear-gradient(135deg, #1e3a5f 0%, #162d4a 100%)',
          border: '1.5px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Back pattern */}
        <div className="absolute inset-1 rounded-md opacity-30" style={{
          background: `repeating-linear-gradient(
            45deg, transparent, transparent 3px, rgba(212,175,55,0.3) 3px, rgba(212,175,55,0.3) 4px
          )`,
        }} />
        <div className="absolute inset-1 rounded-md opacity-30" style={{
          background: `repeating-linear-gradient(
            -45deg, transparent, transparent 3px, rgba(212,175,55,0.3) 3px, rgba(212,175,55,0.3) 4px
          )`,
        }} />
        {/* Center diamond */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rotate-45 border border-gold/40 bg-gold/10 rounded-sm" />
        </div>
      </div>
    );
  }

  const color = getSuitColor(card.suit);
  const symbol = getSuitSymbol(card.suit);
  const displayRank = card.rank === 'T' ? '10' : card.rank;
  const isFace = ['K', 'Q', 'J'].includes(card.rank);
  const isRed = card.suit === 'h' || card.suit === 'd';

  return (
    <div
      className={`${s.w} ${s.h} rounded-lg flex-shrink-0 animate-deal relative overflow-hidden flex flex-col items-center justify-center`}
      style={{
        animationDelay: `${delay}ms`,
        background: 'linear-gradient(175deg, #ffffff 0%, #f8f8f8 40%, #ededed 100%)',
        border: '1px solid rgba(0,0,0,0.12)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      {/* Glossy highlight */}
      <div className="absolute top-0 left-0 right-0 h-[40%] rounded-t-lg" style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)',
        pointerEvents: 'none'
      }} />

      {/* Top-left rank + suit */}
      <div className="absolute top-1 left-1.5 font-bold leading-none select-none" style={{ color }}>
        <div className={`${s.rank} font-black`}>{displayRank}</div>
        <div className={`${s.suit} -mt-0.5`}>{symbol}</div>
      </div>

      {/* Center */}
      {isFace ? (
        <div className="flex flex-col items-center justify-center">
          <div className={`${s.face} leading-none`} style={{ color: '#1a1a2e' }}>
            {FACE_SYMBOLS[card.rank]}
          </div>
          <div className={`${s.suit} leading-none mt-0.5 opacity-60`} style={{ color }}>
            {symbol}
          </div>
        </div>
      ) : (
        <div className={`${s.center} font-bold`} style={{ color }}>
          {symbol}
        </div>
      )}

      {/* Bottom-right rank + suit (rotated) */}
      <div className="absolute bottom-1 right-1.5 font-bold leading-none rotate-180 select-none" style={{ color }}>
        <div className={`${s.rank} font-black`}>{displayRank}</div>
        <div className={`${s.suit} -mt-0.5`}>{symbol}</div>
      </div>
    </div>
  );
}
