import { getSuitColor, getSuitSymbol } from '../utils/cards';

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

  return (
    <div
      className={`${sizes[size]} card-front flex-shrink-0 animate-deal relative`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0.5 left-1 font-bold leading-none" style={{ color }}>
        <div className={rankSizes[size]}>{card.rank}</div>
        <div className={suitLabelSizes[size]}>{symbol}</div>
      </div>
      <div className={`${centerSizes[size]} mt-1`} style={{ color }}>
        {symbol}
      </div>
      <div className="absolute bottom-0.5 right-1 font-bold leading-none rotate-180" style={{ color }}>
        <div className={rankSizes[size]}>{card.rank}</div>
        <div className={suitLabelSizes[size]}>{symbol}</div>
      </div>
    </div>
  );
}
