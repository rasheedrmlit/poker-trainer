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

/**
 * Preflop WIN EQUITY — the actual percentage chance of winning against
 * ONE random opponent heads-up, all-in preflop to the river.
 * These are standard values from Monte Carlo simulations.
 */
const WIN_EQUITY = {
  // Pairs
  'AA': 85.3, 'KK': 82.4, 'QQ': 79.9, 'JJ': 77.5, 'TT': 75.0,
  '99': 72.1, '88': 69.2, '77': 66.2, '66': 63.3, '55': 60.3,
  '44': 57.0, '33': 53.7, '22': 50.3,
  // Suited Aces
  'AKs': 67.0, 'AQs': 66.1, 'AJs': 65.4, 'ATs': 64.7, 'A9s': 63.0,
  'A8s': 62.1, 'A7s': 61.1, 'A6s': 60.0, 'A5s': 60.5, 'A4s': 59.5,
  'A3s': 58.7, 'A2s': 57.8,
  // Offsuit Aces
  'AKo': 65.4, 'AQo': 64.5, 'AJo': 63.6, 'ATo': 62.9, 'A9o': 60.9,
  'A8o': 59.9, 'A7o': 58.7, 'A6o': 57.5, 'A5o': 58.0, 'A4o': 57.1,
  'A3o': 56.3, 'A2o': 55.5,
  // Suited Kings
  'KQs': 63.4, 'KJs': 62.6, 'KTs': 61.9, 'K9s': 60.0, 'K8s': 58.5,
  'K7s': 57.8, 'K6s': 56.8, 'K5s': 55.8, 'K4s': 54.9, 'K3s': 54.1,
  'K2s': 53.2,
  // Offsuit Kings
  'KQo': 61.4, 'KJo': 60.6, 'KTo': 59.9, 'K9o': 57.9, 'K8o': 56.3,
  'K7o': 55.4, 'K6o': 54.3, 'K5o': 53.3, 'K4o': 52.3, 'K3o': 51.5,
  'K2o': 50.7,
  // Suited Queens
  'QJs': 60.3, 'QTs': 59.5, 'Q9s': 57.9, 'Q8s': 56.2, 'Q7s': 54.6,
  'Q6s': 54.0, 'Q5s': 53.1, 'Q4s': 52.1, 'Q3s': 51.3, 'Q2s': 50.4,
  // Offsuit Queens
  'QJo': 58.2, 'QTo': 57.4, 'Q9o': 55.5, 'Q8o': 53.8, 'Q7o': 52.2,
  'Q6o': 51.4, 'Q5o': 50.3, 'Q4o': 49.3, 'Q3o': 48.5, 'Q2o': 47.7,
  // Suited Jacks
  'JTs': 57.5, 'J9s': 55.8, 'J8s': 54.2, 'J7s': 52.4, 'J6s': 51.1,
  'J5s': 50.4, 'J4s': 49.4, 'J3s': 48.6, 'J2s': 47.8,
  // Offsuit Jacks
  'JTo': 55.4, 'J9o': 53.4, 'J8o': 51.7, 'J7o': 49.9, 'J6o': 48.5,
  'J5o': 47.6, 'J4o': 46.6, 'J3o': 45.8, 'J2o': 44.9,
  // Suited Tens
  'T9s': 54.3, 'T8s': 52.6, 'T7s': 51.0, 'T6s': 49.3, 'T5s': 48.0,
  'T4s': 47.2, 'T3s': 46.3, 'T2s': 45.5,
  // Offsuit Tens
  'T9o': 52.1, 'T8o': 50.2, 'T7o': 48.5, 'T6o': 46.7, 'T5o': 45.2,
  'T4o': 44.3, 'T3o': 43.4, 'T2o': 42.6,
  // Suited 9x
  '98s': 51.1, '97s': 49.5, '96s': 47.8, '95s': 46.2, '94s': 44.5,
  '93s': 43.9, '92s': 43.1,
  // Offsuit 9x
  '98o': 48.9, '97o': 47.0, '96o': 45.2, '95o': 43.5, '94o': 41.7,
  '93o': 41.0, '92o': 40.2,
  // Suited 8x
  '87s': 48.2, '86s': 46.5, '85s': 44.8, '84s': 43.1, '83s': 41.6,
  '82s': 41.0,
  // Offsuit 8x
  '87o': 45.9, '86o': 44.0, '85o': 42.2, '84o': 40.4, '83o': 38.8,
  '82o': 38.1,
  // Suited 7x
  '76s': 45.2, '75s': 43.6, '74s': 41.8, '73s': 40.3, '72s': 38.9,
  // Offsuit 7x
  '76o': 42.9, '75o': 41.1, '74o': 39.1, '73o': 37.5, '72o': 36.0,
  // Suited 6x
  '65s': 42.4, '64s': 40.7, '63s': 39.1, '62s': 37.8,
  // Offsuit 6x
  '65o': 40.0, '64o': 38.1, '63o': 36.4, '62o': 35.0,
  // Suited 5x
  '54s': 40.1, '53s': 38.5, '52s': 37.2,
  // Offsuit 5x
  '54o': 37.6, '53o': 35.8, '52o': 34.4,
  // Suited 4x
  '43s': 37.0, '42s': 35.7,
  // Offsuit 4x
  '43o': 34.1, '42o': 32.7,
  // Suited 3x
  '32s': 34.3,
  // Offsuit 3x
  '32o': 31.2,
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
  const equity = WIN_EQUITY[key] ?? null;
  if (pct === null) return { key, percentile: 30, winEquity: equity || 32, tier: 'weak', tierLabel: 'Weak', tierColor: '#ef4444', description: 'This hand is below average. Fold it most of the time unless you have great position.' };

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

  return { key, percentile: pct, winEquity: equity || 40, tier, tierLabel, tierColor, description };
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
        winEquity: data?.winEquity || 32,
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

/**
 * Deep-stack playability bonuses.
 * These represent how much MORE playable a hand becomes at 200-300bb deep,
 * expressed as a percentile boost. Speculative hands get the biggest bumps.
 */
const DEEP_STACK_BONUS = {
  // Small pairs — set mining is hugely +EV deep
  '22': 25, '33': 22, '44': 20, '55': 18, '66': 15, '77': 10, '88': 5,
  // Suited connectors — straights/flushes pay off massively
  '32s': 28, '43s': 26, '54s': 24, '65s': 22, '76s': 20, '87s': 18,
  '98s': 15, 'T9s': 12, 'JTs': 8,
  // Suited gappers
  '42s': 22, '53s': 22, '63s': 20, '64s': 20, '74s': 18, '75s': 18,
  '85s': 16, '86s': 16, '96s': 14, '97s': 14, 'T7s': 12, 'T8s': 10,
  'J7s': 10, 'J8s': 10, 'J9s': 8, 'Q8s': 8, 'Q9s': 6,
  // Suited aces — nut flush draw potential
  'A2s': 15, 'A3s': 14, 'A4s': 12, 'A5s': 10, 'A6s': 12, 'A7s': 10,
  'A8s': 8, 'A9s': 6,
  // Suited kings
  'K2s': 12, 'K3s': 11, 'K4s': 10, 'K5s': 10, 'K6s': 8, 'K7s': 8, 'K8s': 6,
  // Offsuit connectors get a small bump
  '87o': 8, '76o': 8, '65o': 8, '98o': 6, 'T9o': 5,
  'J9o': 4, 'JTo': 3, 'T8o': 4,
  // Offsuit gappers — marginal bump
  '97o': 4, '86o': 4, '75o': 4, '64o': 4,
};

/**
 * Get deep-stack adjusted strength for a starting hand.
 * Returns the same shape as getPreflopStrength but with boosted tiers
 * for hands that gain implied odds value at 200-300bb.
 */
export function getDeepStackStrength(card1, card2) {
  const base = getPreflopStrength(card1, card2);
  if (!base) return null;

  const bonus = DEEP_STACK_BONUS[base.key] || 0;
  const deepPct = Math.min(100, base.percentile + bonus);

  let tier, tierLabel, tierColor, description;

  if (deepPct >= 95) {
    tier = 'premium'; tierLabel = 'Premium'; tierColor = '#facc15';
    description = 'Elite hand at any depth. Raise or re-raise aggressively.';
  } else if (deepPct >= 85) {
    tier = 'strong'; tierLabel = 'Strong'; tierColor = '#22c55e';
    description = 'Very strong deep. The implied odds make this hand a money-maker.';
  } else if (deepPct >= 70) {
    tier = 'good'; tierLabel = 'Good'; tierColor = '#3b82f6';
    description = 'Plays well deep thanks to implied odds. Great from middle and late position.';
  } else if (deepPct >= 50) {
    tier = 'playable'; tierLabel = 'Playable'; tierColor = '#a78bfa';
    description = 'Worth playing deep, especially in position. The extra stack depth gives you room to maneuver.';
  } else if (deepPct >= 30) {
    tier = 'marginal'; tierLabel = 'Marginal'; tierColor = '#f97316';
    description = 'Borderline even deep. Only play from the button or in the big blind facing a small raise.';
  } else {
    tier = 'trash'; tierLabel = 'Fold'; tierColor = '#ef4444';
    description = 'Still not playable even with deep stacks. Fold and wait for a better spot.';
  }

  return {
    ...base,
    percentile: deepPct,
    deepBonus: bonus,
    tier, tierLabel, tierColor, description,
  };
}

/**
 * Deep-stack version of the hand grid.
 */
export function getDeepHandGrid() {
  const ranks = RANK_ORDER;
  const grid = [];

  for (let r = 0; r < 13; r++) {
    const row = [];
    for (let c = 0; c < 13; c++) {
      let key;
      if (r === c) key = `${ranks[r]}${ranks[c]}`;
      else if (c > r) key = `${ranks[r]}${ranks[c]}s`;
      else key = `${ranks[c]}${ranks[r]}o`;

      const data = getDeepStackStrength(
        { rank: ranks[r], suit: 'h' },
        { rank: ranks[c], suit: c > r ? 'h' : 'd' }
      );

      row.push({
        key,
        percentile: data?.percentile || 5,
        winEquity: data?.winEquity || 32,
        deepBonus: data?.deepBonus || 0,
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
