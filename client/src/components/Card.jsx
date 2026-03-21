import { getSuitColor, getSuitSymbol } from '../utils/cards';

// Face card symbols for the center of K, Q, J cards
const FACE_SYMBOLS = {
  K: '♚',
  Q: '♛',
  J: '♝',
};

export default function Card({ card, size = 'md', faceDown = false, delay = 0 }) {
  const sizes = {
    sm: 'w-10 h-14 text-xs',
    md: 'w-14 h-20 text-sm',
    lg: 'w-[72px] h-[104px] text-lg',
    xl: 'w-20 h-28 text-xl',
    hero: 'w-[88px] h-[124px] text-2xl'
  };

  const rankSizes = {
    sm: 'text-[11px]',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    hero: 'text-xl'
  };

  const suitLabelSizes = {
    sm: 'text-[9px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
    hero: 'text-lg'
  };

  const centerSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
    hero: 'text-5xl'
  };

  // Slightly smaller center for face cards to fit the symbol
  const faceCenterSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    hero: 'text-4xl'
  };

  if (faceDown || !card) {
    return (
      <div
        className={`${sizes[size]} card-back flex-shrink-0 animate-deal`}
        style={{ animationDelay: `${delay}ms` }}
      />
    );
  }

  const color = getSuitColor(card.suit);
  const symbol = getSuitSymbol(card.suit);
  const displayRank = card.rank === 'T' ? '10' : card.rank;
  const isFace = ['K', 'Q', 'J'].includes(card.rank);
  const faceSymbol = FACE_SYMBOLS[card.rank];

  return (
    <div
      className={`${sizes[size]} card-front flex-shrink-0 animate-deal relative`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top-left rank + suit */}
      <div className="absolute top-0.5 left-1 font-bold leading-none" style={{ color }}>
        <div className={rankSizes[size]}>{displayRank}</div>
        <div className={suitLabelSizes[size]}>{symbol}</div>
      </div>

      {/* Center: face symbol for K/Q/J, suit symbol for others */}
      {isFace ? (
        <div className="flex flex-col items-center justify-center mt-0.5">
          <div className={`${faceCenterSizes[size]} leading-none`} style={{ color: '#1a1a2e' }}>
            {faceSymbol}
          </div>
          <div className={`${suitLabelSizes[size]} leading-none mt-0.5 opacity-70`} style={{ color }}>
            {symbol}
          </div>
        </div>
      ) : (
        <div className={`${centerSizes[size]} mt-1`} style={{ color }}>
          {symbol}
        </div>
      )}

      {/* Bottom-right rank + suit (rotated) */}
      <div className="absolute bottom-0.5 right-1 font-bold leading-none rotate-180" style={{ color }}>
        <div className={rankSizes[size]}>{displayRank}</div>
        <div className={suitLabelSizes[size]}>{symbol}</div>
      </div>
    </div>
  );
}
