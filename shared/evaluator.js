const { RANK_VALUES, HAND_RANKS } = require('./constants');

function evaluateHand(holeCards, communityCards) {
  const allCards = [...holeCards, ...communityCards];
  if (allCards.length < 5) return null;

  const combos = getCombinations(allCards, 5);
  let best = null;

  for (const combo of combos) {
    const result = evaluate5Cards(combo);
    if (!best || compareHandValues(result, best) > 0) {
      best = result;
    }
  }

  return best;
}

function evaluate5Cards(cards) {
  const sorted = [...cards].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank]);
  const ranks = sorted.map(c => RANK_VALUES[c.rank]);
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = checkStraight(ranks);
  const groups = getGroups(sorted);

  if (isFlush && isStraight) {
    const highCard = isStraight;
    if (highCard === 14) return { rank: HAND_RANKS.ROYAL_FLUSH, values: [14], cards: sorted };
    return { rank: HAND_RANKS.STRAIGHT_FLUSH, values: [highCard], cards: sorted };
  }

  if (groups.four) {
    return { rank: HAND_RANKS.FOUR_OF_A_KIND, values: [groups.four[0], groups.kickers[0]], cards: sorted };
  }

  if (groups.three && groups.pairs.length > 0) {
    return { rank: HAND_RANKS.FULL_HOUSE, values: [groups.three[0], groups.pairs[0]], cards: sorted };
  }

  if (isFlush) {
    return { rank: HAND_RANKS.FLUSH, values: ranks, cards: sorted };
  }

  if (isStraight) {
    return { rank: HAND_RANKS.STRAIGHT, values: [isStraight], cards: sorted };
  }

  if (groups.three) {
    return { rank: HAND_RANKS.THREE_OF_A_KIND, values: [groups.three[0], ...groups.kickers.slice(0, 2)], cards: sorted };
  }

  if (groups.pairs.length === 2) {
    return { rank: HAND_RANKS.TWO_PAIR, values: [...groups.pairs, groups.kickers[0]], cards: sorted };
  }

  if (groups.pairs.length === 1) {
    return { rank: HAND_RANKS.PAIR, values: [groups.pairs[0], ...groups.kickers.slice(0, 3)], cards: sorted };
  }

  return { rank: HAND_RANKS.HIGH_CARD, values: ranks, cards: sorted };
}

function checkStraight(ranks) {
  const unique = [...new Set(ranks)].sort((a, b) => b - a);
  if (unique.length < 5) return false;

  for (let i = 0; i <= unique.length - 5; i++) {
    if (unique[i] - unique[i + 4] === 4) {
      let isConsec = true;
      for (let j = i; j < i + 4; j++) {
        if (unique[j] - unique[j + 1] !== 1) { isConsec = false; break; }
      }
      if (isConsec) return unique[i];
    }
  }

  // Check A-2-3-4-5 (wheel)
  if (unique.includes(14) && unique.includes(2) && unique.includes(3) && unique.includes(4) && unique.includes(5)) {
    return 5;
  }

  return false;
}

function getGroups(cards) {
  const counts = {};
  for (const card of cards) {
    counts[RANK_VALUES[card.rank]] = (counts[RANK_VALUES[card.rank]] || 0) + 1;
  }

  const result = { four: null, three: null, pairs: [], kickers: [] };

  const entries = Object.entries(counts)
    .map(([v, c]) => [parseInt(v), c])
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  for (const [value, count] of entries) {
    if (count === 4) result.four = [value];
    else if (count === 3) result.three = [value];
    else if (count === 2) result.pairs.push(value);
    else result.kickers.push(value);
  }

  result.pairs.sort((a, b) => b - a);
  result.kickers.sort((a, b) => b - a);

  return result;
}

function compareHandValues(a, b) {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.min(a.values.length, b.values.length); i++) {
    if (a.values[i] !== b.values[i]) return a.values[i] - b.values[i];
  }
  return 0;
}

function compareHands(handA, handB, community) {
  const evalA = evaluateHand(handA, community);
  const evalB = evaluateHand(handB, community);
  return compareHandValues(evalA, evalB);
}

function getCombinations(arr, k) {
  const result = [];
  function helper(start, combo) {
    if (combo.length === k) { result.push([...combo]); return; }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return result;
}

function getHandStrength(holeCards, communityCards, numSimulations = 500) {
  const { SUITS, RANKS } = require('./constants');
  const allKnown = [...holeCards, ...communityCards];
  const knownSet = new Set(allKnown.map(c => `${c.rank}${c.suit}`));

  const remaining = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      if (!knownSet.has(`${rank}${suit}`)) remaining.push({ rank, suit });
    }
  }

  let wins = 0;
  let ties = 0;
  const sims = Math.min(numSimulations, 500);

  for (let i = 0; i < sims; i++) {
    const shuffled = [...remaining].sort(() => Math.random() - 0.5);
    let idx = 0;

    const oppHole = [shuffled[idx++], shuffled[idx++]];
    const extraCommunity = [];
    const needed = 5 - communityCards.length;
    for (let j = 0; j < needed; j++) {
      extraCommunity.push(shuffled[idx++]);
    }

    const fullCommunity = [...communityCards, ...extraCommunity];
    const cmp = compareHands(holeCards, oppHole, fullCommunity);

    if (cmp > 0) wins++;
    else if (cmp === 0) ties++;
  }

  return (wins + ties * 0.5) / sims;
}

module.exports = { evaluateHand, compareHands, compareHandValues, getHandStrength, getCombinations };
