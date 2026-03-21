// Precomputed GTO opening ranges by position
// Format: hand string -> frequency (0-1)
// Pocket pairs: "AA", "KK", etc.
// Suited: "AKs", "AQs", etc.
// Offsuit: "AKo", "AQo", etc.

const OPENING_RANGES = {
  UTG: {
    'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 0.8, '88': 0.6, '77': 0.4,
    'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 0.9, 'A5s': 0.5, 'A4s': 0.4,
    'KQs': 1, 'KJs': 0.8, 'KTs': 0.5,
    'QJs': 0.7, 'QTs': 0.4,
    'JTs': 0.7, 'J9s': 0.3,
    'T9s': 0.5,
    '98s': 0.3,
    'AKo': 1, 'AQo': 0.9, 'AJo': 0.5,
    'KQo': 0.5
  },
  MP: {
    'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 0.8, '77': 0.6, '66': 0.4,
    'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 1, 'A9s': 0.5, 'A5s': 0.7, 'A4s': 0.6, 'A3s': 0.4,
    'KQs': 1, 'KJs': 1, 'KTs': 0.7, 'K9s': 0.3,
    'QJs': 0.9, 'QTs': 0.6, 'Q9s': 0.3,
    'JTs': 0.9, 'J9s': 0.5,
    'T9s': 0.7, 'T8s': 0.3,
    '98s': 0.5, '87s': 0.3,
    'AKo': 1, 'AQo': 1, 'AJo': 0.7, 'ATo': 0.4,
    'KQo': 0.7, 'KJo': 0.3
  },
  CO: {
    'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 1, '77': 0.9, '66': 0.7, '55': 0.6, '44': 0.4,
    'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 1, 'A9s': 0.8, 'A8s': 0.7, 'A7s': 0.6, 'A6s': 0.5, 'A5s': 0.9, 'A4s': 0.8, 'A3s': 0.6, 'A2s': 0.5,
    'KQs': 1, 'KJs': 1, 'KTs': 1, 'K9s': 0.6, 'K8s': 0.3,
    'QJs': 1, 'QTs': 0.9, 'Q9s': 0.6, 'Q8s': 0.3,
    'JTs': 1, 'J9s': 0.8, 'J8s': 0.3,
    'T9s': 1, 'T8s': 0.6,
    '98s': 0.8, '97s': 0.3,
    '87s': 0.7, '76s': 0.5, '65s': 0.4,
    'AKo': 1, 'AQo': 1, 'AJo': 1, 'ATo': 0.8, 'A9o': 0.4,
    'KQo': 1, 'KJo': 0.7, 'KTo': 0.4,
    'QJo': 0.6, 'QTo': 0.3,
    'JTo': 0.4
  },
  BTN: {
    'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 1, '77': 1, '66': 1, '55': 0.9, '44': 0.8, '33': 0.6, '22': 0.5,
    'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 1, 'A9s': 1, 'A8s': 1, 'A7s': 0.9, 'A6s': 0.8, 'A5s': 1, 'A4s': 1, 'A3s': 0.8, 'A2s': 0.7,
    'KQs': 1, 'KJs': 1, 'KTs': 1, 'K9s': 0.9, 'K8s': 0.7, 'K7s': 0.5, 'K6s': 0.4, 'K5s': 0.3,
    'QJs': 1, 'QTs': 1, 'Q9s': 0.9, 'Q8s': 0.6, 'Q7s': 0.3,
    'JTs': 1, 'J9s': 1, 'J8s': 0.6, 'J7s': 0.3,
    'T9s': 1, 'T8s': 0.9, 'T7s': 0.4,
    '98s': 1, '97s': 0.6, '96s': 0.3,
    '87s': 1, '86s': 0.4,
    '76s': 0.9, '75s': 0.3,
    '65s': 0.8, '54s': 0.6,
    'AKo': 1, 'AQo': 1, 'AJo': 1, 'ATo': 1, 'A9o': 0.8, 'A8o': 0.5, 'A7o': 0.3, 'A5o': 0.4, 'A4o': 0.3,
    'KQo': 1, 'KJo': 1, 'KTo': 0.8, 'K9o': 0.4,
    'QJo': 1, 'QTo': 0.6, 'Q9o': 0.3,
    'JTo': 0.8, 'J9o': 0.3,
    'T9o': 0.5, '98o': 0.3
  },
  SB: {
    'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 0.9, '77': 0.8, '66': 0.7, '55': 0.6, '44': 0.5, '33': 0.4, '22': 0.3,
    'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 1, 'A9s': 0.9, 'A8s': 0.8, 'A7s': 0.7, 'A6s': 0.6, 'A5s': 1, 'A4s': 0.9, 'A3s': 0.7, 'A2s': 0.6,
    'KQs': 1, 'KJs': 1, 'KTs': 1, 'K9s': 0.7, 'K8s': 0.5, 'K7s': 0.4,
    'QJs': 1, 'QTs': 0.9, 'Q9s': 0.7, 'Q8s': 0.4,
    'JTs': 1, 'J9s': 0.8, 'J8s': 0.4,
    'T9s': 1, 'T8s': 0.7, 'T7s': 0.3,
    '98s': 0.9, '97s': 0.5,
    '87s': 0.8, '86s': 0.3,
    '76s': 0.7, '65s': 0.6, '54s': 0.5,
    'AKo': 1, 'AQo': 1, 'AJo': 1, 'ATo': 0.8, 'A9o': 0.5, 'A8o': 0.3,
    'KQo': 1, 'KJo': 0.8, 'KTo': 0.5, 'K9o': 0.3,
    'QJo': 0.7, 'QTo': 0.4,
    'JTo': 0.5, 'T9o': 0.3
  },
  BB: {
    // BB defends wide vs opens
    'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 1, '99': 1, '88': 1, '77': 1, '66': 1, '55': 1, '44': 0.9, '33': 0.8, '22': 0.7,
    'AKs': 1, 'AQs': 1, 'AJs': 1, 'ATs': 1, 'A9s': 1, 'A8s': 1, 'A7s': 1, 'A6s': 0.9, 'A5s': 1, 'A4s': 1, 'A3s': 0.9, 'A2s': 0.8,
    'KQs': 1, 'KJs': 1, 'KTs': 1, 'K9s': 1, 'K8s': 0.8, 'K7s': 0.7, 'K6s': 0.6, 'K5s': 0.5, 'K4s': 0.4,
    'QJs': 1, 'QTs': 1, 'Q9s': 1, 'Q8s': 0.8, 'Q7s': 0.5, 'Q6s': 0.4,
    'JTs': 1, 'J9s': 1, 'J8s': 0.8, 'J7s': 0.5,
    'T9s': 1, 'T8s': 1, 'T7s': 0.6,
    '98s': 1, '97s': 0.8, '96s': 0.5,
    '87s': 1, '86s': 0.7, '85s': 0.3,
    '76s': 1, '75s': 0.6,
    '65s': 1, '64s': 0.4,
    '54s': 0.9, '53s': 0.3,
    '43s': 0.5, '32s': 0.3,
    'AKo': 1, 'AQo': 1, 'AJo': 1, 'ATo': 1, 'A9o': 0.9, 'A8o': 0.7, 'A7o': 0.5, 'A6o': 0.4, 'A5o': 0.6, 'A4o': 0.5, 'A3o': 0.4, 'A2o': 0.3,
    'KQo': 1, 'KJo': 1, 'KTo': 0.9, 'K9o': 0.7, 'K8o': 0.4, 'K7o': 0.3,
    'QJo': 1, 'QTo': 0.8, 'Q9o': 0.6, 'Q8o': 0.3,
    'JTo': 1, 'J9o': 0.6, 'J8o': 0.3,
    'T9o': 0.8, 'T8o': 0.4,
    '98o': 0.6, '97o': 0.3,
    '87o': 0.5, '76o': 0.3
  }
};

// 3-bet ranges by position
const THREE_BET_RANGES = {
  vs_UTG: {
    'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 0.5, 'AKs': 1, 'AKo': 1, 'AQs': 0.5,
    'A5s': 0.3, 'A4s': 0.2
  },
  vs_MP: {
    'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 0.7, 'TT': 0.3,
    'AKs': 1, 'AQs': 0.8, 'AJs': 0.3,
    'AKo': 1, 'AQo': 0.4,
    'A5s': 0.4, 'A4s': 0.3,
    'KQs': 0.3
  },
  vs_CO: {
    'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 0.9, 'TT': 0.5, '99': 0.2,
    'AKs': 1, 'AQs': 1, 'AJs': 0.6, 'ATs': 0.3,
    'AKo': 1, 'AQo': 0.7, 'AJo': 0.3,
    'A5s': 0.5, 'A4s': 0.4,
    'KQs': 0.5, 'KJs': 0.2,
    'QJs': 0.2
  },
  vs_BTN: {
    'AA': 1, 'KK': 1, 'QQ': 1, 'JJ': 1, 'TT': 0.7, '99': 0.4, '88': 0.2,
    'AKs': 1, 'AQs': 1, 'AJs': 0.8, 'ATs': 0.5, 'A9s': 0.3,
    'AKo': 1, 'AQo': 1, 'AJo': 0.5, 'ATo': 0.3,
    'A5s': 0.6, 'A4s': 0.5, 'A3s': 0.3,
    'KQs': 0.8, 'KJs': 0.5, 'KTs': 0.3,
    'KQo': 0.3,
    'QJs': 0.4, 'QTs': 0.2,
    'JTs': 0.3,
    'T9s': 0.2
  }
};

function getHandNotation(card1, card2) {
  const { RANK_VALUES } = require('../../shared/constants');
  const r1 = RANK_VALUES[card1.rank];
  const r2 = RANK_VALUES[card2.rank];

  let high, low;
  if (r1 >= r2) {
    high = card1;
    low = card2;
  } else {
    high = card2;
    low = card1;
  }

  if (high.rank === low.rank) {
    return high.rank + low.rank;
  }

  const suited = high.suit === low.suit ? 's' : 'o';
  return high.rank + low.rank + suited;
}

function isHandInRange(card1, card2, range) {
  const notation = getHandNotation(card1, card2);
  return range[notation] || 0;
}

module.exports = { OPENING_RANGES, THREE_BET_RANGES, getHandNotation, isHandInRange };
