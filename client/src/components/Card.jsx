import { getSuitColor, getSuitSymbol } from '../utils/cards';

// Professional casino-style playing cards
// Multi-pip layout for number cards, ornate face cards

const PIP_LAYOUTS = {
  'A': [{ x: 50, y: 50 }],
  '2': [{ x: 50, y: 22 }, { x: 50, y: 78, flip: true }],
  '3': [{ x: 50, y: 20 }, { x: 50, y: 50 }, { x: 50, y: 80, flip: true }],
  '4': [{ x: 30, y: 22 }, { x: 70, y: 22 }, { x: 30, y: 78, flip: true }, { x: 70, y: 78, flip: true }],
  '5': [{ x: 30, y: 22 }, { x: 70, y: 22 }, { x: 50, y: 50 }, { x: 30, y: 78, flip: true }, { x: 70, y: 78, flip: true }],
  '6': [{ x: 30, y: 22 }, { x: 70, y: 22 }, { x: 30, y: 50 }, { x: 70, y: 50 }, { x: 30, y: 78, flip: true }, { x: 70, y: 78, flip: true }],
  '7': [{ x: 30, y: 22 }, { x: 70, y: 22 }, { x: 30, y: 50 }, { x: 70, y: 50 }, { x: 50, y: 36 }, { x: 30, y: 78, flip: true }, { x: 70, y: 78, flip: true }],
  '8': [{ x: 30, y: 22 }, { x: 70, y: 22 }, { x: 30, y: 50 }, { x: 70, y: 50 }, { x: 50, y: 36 }, { x: 50, y: 64, flip: true }, { x: 30, y: 78, flip: true }, { x: 70, y: 78, flip: true }],
  '9': [{ x: 30, y: 20 }, { x: 70, y: 20 }, { x: 30, y: 40 }, { x: 70, y: 40 }, { x: 50, y: 50 }, { x: 30, y: 60, flip: true }, { x: 70, y: 60, flip: true }, { x: 30, y: 80, flip: true }, { x: 70, y: 80, flip: true }],
  'T': [{ x: 30, y: 20 }, { x: 70, y: 20 }, { x: 50, y: 30 }, { x: 30, y: 40 }, { x: 70, y: 40 }, { x: 30, y: 60, flip: true }, { x: 70, y: 60, flip: true }, { x: 50, y: 70, flip: true }, { x: 30, y: 80, flip: true }, { x: 70, y: 80, flip: true }],
};

const FACE_ART = {
  K: { symbol: '♚', title: 'KING', accent: '#ffd700' },
  Q: { symbol: '♛', title: 'QUEEN', accent: '#c0c0c0' },
  J: { symbol: '♝', title: 'JACK', accent: '#cd7f32' },
};

export default function Card({ card, size = 'md', faceDown = false, delay = 0 }) {
  const sizes = {
    xs: { w: 28, h: 40, rank: 7, suit: 6, pip: 6, face: 12, corner: 1 },
    sm: { w: 38, h: 54, rank: 10, suit: 8, pip: 8, face: 16, corner: 1.5 },
    md: { w: 50, h: 70, rank: 12, suit: 9, pip: 10, face: 20, corner: 2 },
    lg: { w: 62, h: 88, rank: 14, suit: 10, pip: 12, face: 24, corner: 2.5 },
    xl: { w: 70, h: 100, rank: 16, suit: 12, pip: 14, face: 28, corner: 3 },
    hero: { w: 80, h: 114, rank: 18, suit: 14, pip: 16, face: 32, corner: 3 },
  };

  const s = sizes[size] || sizes.md;

  if (faceDown || !card) {
    return (
      <div
        className="flex-shrink-0 animate-deal relative overflow-hidden"
        style={{
          width: s.w, height: s.h,
          borderRadius: s.corner * 2.5,
          animationDelay: `${delay}ms`,
          background: 'linear-gradient(145deg, #1a3a5c 0%, #0d2240 50%, #091a33 100%)',
          border: '1px solid rgba(212,175,55,0.3)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Ornate back pattern */}
        <div className="absolute inset-[3px] overflow-hidden" style={{ borderRadius: s.corner * 2 }}>
          {/* Diamond lattice */}
          <div className="absolute inset-0" style={{
            background: `repeating-conic-gradient(rgba(212,175,55,0.12) 0% 25%, transparent 0% 50%) 0 0 / ${Math.max(6, s.w * 0.12)}px ${Math.max(6, s.w * 0.12)}px`,
          }} />
          {/* Border frame */}
          <div className="absolute inset-[2px] border border-gold/20" style={{ borderRadius: s.corner * 1.5 }} />
          <div className="absolute inset-[4px] border border-gold/10" style={{ borderRadius: s.corner * 1.2 }} />
          {/* Center medallion */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div style={{
              width: s.w * 0.35, height: s.w * 0.35,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,175,55,0.15), transparent 70%)',
              border: '1px solid rgba(212,175,55,0.2)',
            }} />
          </div>
        </div>
      </div>
    );
  }

  const color = getSuitColor(card.suit);
  const symbol = getSuitSymbol(card.suit);
  const displayRank = card.rank === 'T' ? '10' : card.rank;
  const isFace = ['K', 'Q', 'J'].includes(card.rank);
  const isAce = card.rank === 'A';
  const isRed = card.suit === 'h' || card.suit === 'd';
  const pips = PIP_LAYOUTS[card.rank];

  return (
    <div
      className="flex-shrink-0 animate-deal relative overflow-hidden"
      style={{
        width: s.w, height: s.h,
        borderRadius: s.corner * 2.5,
        animationDelay: `${delay}ms`,
        background: 'linear-gradient(170deg, #ffffff 0%, #f9f9f9 30%, #f0f0f0 70%, #e8e8e8 100%)',
        border: '1px solid rgba(0,0,0,0.15)',
        boxShadow: '0 3px 12px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.95)',
      }}
    >
      {/* Subtle inner border line */}
      <div className="absolute inset-[1.5px] border border-black/[0.04]" style={{ borderRadius: s.corner * 2 }} />

      {/* Top-left corner: rank + suit */}
      <div className="absolute leading-none select-none" style={{ top: s.corner + 1, left: s.corner + 2, color }}>
        <div style={{ fontSize: s.rank, fontWeight: 900, lineHeight: 1, fontFamily: '"Georgia", serif', letterSpacing: '-0.5px' }}>
          {displayRank}
        </div>
        <div style={{ fontSize: s.suit, lineHeight: 1, marginTop: -1 }}>
          {symbol}
        </div>
      </div>

      {/* Bottom-right corner: rank + suit (rotated) */}
      <div className="absolute leading-none select-none" style={{
        bottom: s.corner + 1, right: s.corner + 2, color, transform: 'rotate(180deg)'
      }}>
        <div style={{ fontSize: s.rank, fontWeight: 900, lineHeight: 1, fontFamily: '"Georgia", serif', letterSpacing: '-0.5px' }}>
          {displayRank}
        </div>
        <div style={{ fontSize: s.suit, lineHeight: 1, marginTop: -1 }}>
          {symbol}
        </div>
      </div>

      {/* Center content */}
      {isFace ? (
        // Face card — ornate center design
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Decorative frame */}
          <div style={{
            width: s.w * 0.65, height: s.h * 0.52,
            borderRadius: s.corner,
            border: `1px solid ${color}22`,
            background: `linear-gradient(135deg, ${color}08, ${color}03)`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Crown/symbol */}
            <div style={{ fontSize: s.face, color, lineHeight: 1, filter: `drop-shadow(0 1px 2px ${color}40)` }}>
              {FACE_ART[card.rank].symbol}
            </div>
            {/* Small suit below */}
            <div style={{ fontSize: s.suit, color, opacity: 0.5, marginTop: 1 }}>
              {symbol}
            </div>
          </div>
        </div>
      ) : isAce ? (
        // Ace — large ornate center suit
        <div className="absolute inset-0 flex items-center justify-center">
          <div style={{
            fontSize: s.face * 1.5,
            color,
            lineHeight: 1,
            filter: `drop-shadow(0 2px 4px ${color}30)`,
          }}>
            {symbol}
          </div>
        </div>
      ) : pips ? (
        // Number card — pip layout
        <div className="absolute" style={{
          top: s.h * 0.12, bottom: s.h * 0.12,
          left: s.w * 0.2, right: s.w * 0.2,
        }}>
          {pips.map((pip, i) => (
            <div key={i} className="absolute" style={{
              left: `${pip.x}%`, top: `${pip.y}%`,
              transform: `translate(-50%, -50%) ${pip.flip ? 'rotate(180deg)' : ''}`,
              fontSize: s.pip,
              color,
              lineHeight: 1,
            }}>
              {symbol}
            </div>
          ))}
        </div>
      ) : null}

      {/* Glossy top highlight */}
      <div className="absolute top-0 left-0 right-0" style={{
        height: '35%',
        borderRadius: `${s.corner * 2.5}px ${s.corner * 2.5}px 0 0`,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
