const SUIT_SYMBOLS = { h: '\u2665', d: '\u2666', c: '\u2663', s: '\u2660' };
const SUIT_COLORS = { h: '#ef4444', d: '#3b82f6', c: '#22c55e', s: '#111827' };
const SUIT_NAMES = { h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades' };

export function formatCard(card) {
  if (!card) return '';
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

export function getSuitColor(suit) {
  return SUIT_COLORS[suit] || '#000';
}

export function getSuitSymbol(suit) {
  return SUIT_SYMBOLS[suit] || '';
}

export function formatChips(amount) {
  if (amount == null) return '$0';
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 10000) return `$${(amount / 1000).toFixed(1)}K`;
  if (Number.isInteger(amount)) return `$${amount}`;
  return `$${amount.toFixed(2)}`;
}

export function getPositionColor(position) {
  const colors = {
    BTN: '#d4af37',
    SB: '#9ca3af',
    BB: '#6b7280',
    UTG: '#ef4444',
    MP: '#3b82f6',
    CO: '#22c55e'
  };
  return colors[position] || '#9ca3af';
}
