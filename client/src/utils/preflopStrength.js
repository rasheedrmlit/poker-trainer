/**
 * Preflop hand strength rankings.
 * Each starting hand is assigned a percentile (0–100) representing how strong
 * it is compared to all other possible starting hands.
 * 100 = the absolute best hand (pocket aces)
 *   1 = the weakest playable combination
 *
 * "s" = suited (same suit),  "o" = offsuit (different suits)
 * Pairs don't have a suffix.
 */

// Hand strength table — top 169 canonical starting hands ranked by equity.
// The number is the percentile rank (higher = stronger).
const HAND_RANKS = {
  // === Premium Pairs ===
  'AA': 100, 'KK': 99, 'QQ': 98, 'JJ': 97, 'TT': 93,
  '99': 88, '88': 83, '77': 78, '66': 73, '55': 68,
  '44': 63, '33': 58, '22': 53,

  // === Suited Aces ===
  'AKs': 96, 'AQs': 95, 'AJs': 94, 'ATs': 92, 'A9s': 85,
  'A8s': 82, 'A7s': 79, 'A6s': 76, 'A5s': 80, 'A4s': 75,
  'A3s': 72, 'A2s': 69,

  // === Offsuit Aces ===
  'AKo': 91, 'AQo': 89, 'AJo': 87, 'ATo': 84, 'A9o': 74,
  'A8o': 70, 'A7o': 66, 'A6o': 62, 'A5o': 65, 'A4o': 60,
  'A3o': 57, 'A2o': 54,

  // === Suited Kings ===
  'KQs': 90, 'KJs': 86, 'KTs': 81, 'K9s': 71, 'K8s': 64,
  'K7s': 61, 'K6s': 59, 'K5s': 56, 'K4s': 52, 'K3s': 49,
  'K2s': 46,

  // === Offsuit Kings ===
  'KQo': 77, 'KJo': 67, 'KTo': 55, 'K9o': 47, 'K8o': 39,
  'K7o': 36, 'K6o': 33, 'K5o': 30, 'K4o': 27, 'K3o': 24,
  'K2o': 21,

  // === Suited Queens ===
  'QJs': 76, 'QTs': 71, 'Q9s': 60, 'Q8s': 51, 'Q7s': 45,
  'Q6s': 43, 'Q5s': 41, 'Q4s': 38, 'Q3s': 35, 'Q2s': 32,

  // === Offsuit Queens ===
  'QJo': 58, 'QTo': 50, 'Q9o': 40, 'Q8o': 31, 'Q7o': 25,
  'Q6o': 22, 'Q5o': 19, 'Q4o': 16, 'Q3o': 14, 'Q2o': 12,

  // === Suited Jacks ===
  'JTs': 72, 'J9s': 57, 'J8s': 48, 'J7s': 42, 'J6s': 37,
  'J5s': 34, 'J4s': 29, 'J3s': 26, 'J2s': 23,

  // === Offsuit Jacks ===
  'JTo': 52, 'J9o': 37, 'J8o': 28, 'J7o': 20, 'J6o': 15,
  'J5o': 13, 'J4o': 10, 'J3o': 8, 'J2o': 6,

  // === Suited Tens ===
  'T9s': 56, 'T8s': 46, 'T7s': 39, 'T6s': 34, 'T5s': 28,
  'T4s': 24, 'T3s': 21, 'T2s': 18,

  // === Offsuit Tens ===
  'T9o': 38, 'T8o': 26, 'T7o': 18, 'T6o': 13, 'T5o': 9,
  'T4o': 7, 'T3o': 5, 'T2o': 4,

  // === Suited 9x ===
  '98s': 50, '97s': 41, '96s': 34, '95s': 27, '94s': 20,
  '93s': 16, '92s': 13,

  // === Offsuit 9x ===
  '98o': 30, '97o': 20, '96o': 14, '95o': 9, '94o': 5,
  '93o': 3, '92o': 2,

  // === Suited 8x ===
  '87s': 44, '86s': 35, '85s': 28, '84s': 21, '83s': 15,
  '82s': 11,

  // === Offsuit 8x ===
  '87o': 24, '86o': 16, '85o': 10, '84o': 5, '83o': 3,
  '82o': 2,

  // === Suited 7x ===
  '76s': 40, '75s': 32, '74s': 23, '73s': 17, '72s': 10,

  // === Offsuit 7x ===
  '76o': 22, '75o': 14, '74o': 7, '73o': 4, '72o': 1,

  // === Suited 6x ===
  '65s': 37, '64s': 28, '63s': 19, '62s': 12,

  // === Offsuit 6x ===
  '65o': 19, '64o': 10, '63o': 5, '62o': 2,

  // === Suited 5x ===
  '54s': 35, '53s': 25, '52s': 17,

  // === Offsuit 5x ===
  '54o': 17, '53o': 8, '52o': 3,

  // === Suited 4x ===
  '43s': 23, '42s': 15,

  // === Offsuit 4x ===
  '43o': 7, '42o': 3,

  // === Suited 3x ===
  '32s': 13,

  // === Offsuit 3x ===
  '32o': 2,
};

// Rank ordering for normalizing hand notation
const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

/**
 * Given two hole cards, return the canonical hand key (e.g. "AKs", "QQ", "T9o")
 */
function getHandKey(card1, card2) {
  if (!card1 || !card2) return null;

  const r1 = card1.rank;
  const r2 = card2.rank;
  const idx1 = RANK_ORDER.indexOf(r1);
  const idx2 = RANK_ORDER.indexOf(r2);

  const suited = card1.suit === card2.suit;

  // Pair
  if (r1 === r2) return `${r1}${r2}`;

  // High card first
  const high = idx1 < idx2 ? r1 : r2;
  const low  = idx1 < idx2 ? r2 : r1;

  return `${high}${low}${suited ? 's' : 'o'}`;
}

/**
 * Return preflop data for a two-card starting hand.
 *
 * @param {Object} card1  – { rank, suit }
 * @param {Object} card2  – { rank, suit }
 * @returns {Object}      – { key, percentile, tier, tierLabel, tierColor, description }
 */
export function getPreflopStrength(card1, card2) {
  const key = getHandKey(card1, card2);
  if (!key) return null;

  const pct = HAND_RANKS[key] ?? null;
  if (pct === null) return { key, percentile: 30, tier: 'weak', tierLabel: 'Weak', tierColor: '#ef4444', description: 'This hand is below average. Fold it most of the time unless you have great position.' };

  let tier, tierLabel, tierColor, description;

  if (pct >= 95) {
    tier = 'premium';
    tierLabel = 'Premium';
    tierColor = '#facc15';
    description = 'One of the best possible starting hands. Raise or re-raise every time.';
  } else if (pct >= 85) {
    tier = 'strong';
    tierLabel = 'Strong';
    tierColor = '#22c55e';
    description = 'A strong hand you should almost always play. Raise to build the pot.';
  } else if (pct >= 70) {
    tier = 'good';
    tierLabel = 'Good';
    tierColor = '#3b82f6';
    description = 'A solid hand, especially from middle or late position. Raise or call depending on the action.';
  } else if (pct >= 50) {
    tier = 'playable';
    tierLabel = 'Playable';
    tierColor = '#a78bfa';
    description = 'Decent but position-dependent. Best from the button or cutoff. Fold from early seats.';
  } else if (pct >= 30) {
    tier = 'marginal';
    tierLabel = 'Marginal';
    tierColor = '#f97316';
    description = 'A weak hand. Only consider playing from late position if no one has raised.';
  } else {
    tier = 'trash';
    tierLabel = 'Fold';
    tierColor = '#ef4444';
    description = 'This hand loses money long-term. Fold unless you\'re in the big blind and no one raised.';
  }

  return { key, percentile: pct, tier, tierLabel, tierColor, description };
}

/**
 * Full grid data for the Hand % Guide chart.
 * Returns a 13×13 array where rows and columns correspond to ranks A–2.
 * Upper-right = suited hands, lower-left = offsuit, diagonal = pairs.
 */
export function getHandGrid() {
  const ranks = RANK_ORDER; // A K Q J T 9 8 7 6 5 4 3 2
  const grid = [];

  for (let r = 0; r < 13; r++) {
    const row = [];
    for (let c = 0; c < 13; c++) {
      let key;
      if (r === c) {
        key = `${ranks[r]}${ranks[c]}`;           // pair
      } else if (c > r) {
        key = `${ranks[r]}${ranks[c]}s`;           // suited (upper-right)
      } else {
        key = `${ranks[c]}${ranks[r]}o`;           // offsuit (lower-left)
      }

      const pct = HAND_RANKS[key] ?? 5;
      const data = getPreflopStrength(
        { rank: ranks[r], suit: 'h' },
        { rank: ranks[c], suit: c > r ? 'h' : 'd' }
      );

      row.push({
        key,
        percentile: pct,
        tier: data?.tier || 'trash',
        tierLabel: data?.tierLabel || 'Fold',
        tierColor: data?.tierColor || '#ef4444',
        suited: c > r,
        offsuit: c < r,
        pair: r === c,
      });
    }
    grid.push(row);
  }

  return { grid, ranks };
}
