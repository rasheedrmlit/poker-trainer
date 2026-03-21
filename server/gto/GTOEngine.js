const { OPENING_RANGES, THREE_BET_RANGES, getHandNotation, isHandInRange, getBBDefenseFreq } = require('./ranges');
const { getHandStrength } = require('../../shared/evaluator');
const { RANK_VALUES, GAME_STATES, ACTIONS } = require('../../shared/constants');

// Translate hand notation to friendly name
function describeHand(notation) {
  if (!notation) return 'your hand';
  const pairs = { 'AA': 'Pocket Aces', 'KK': 'Pocket Kings', 'QQ': 'Pocket Queens', 'JJ': 'Pocket Jacks', 'TT': 'Pocket Tens', '99': 'Pocket Nines', '88': 'Pocket Eights', '77': 'Pocket Sevens', '66': 'Pocket Sixes', '55': 'Pocket Fives', '44': 'Pocket Fours', '33': 'Pocket Threes', '22': 'Pocket Twos' };
  if (pairs[notation]) return pairs[notation];
  const rankNames = { 'A': 'Ace', 'K': 'King', 'Q': 'Queen', 'J': 'Jack', 'T': 'Ten', '9': 'Nine', '8': 'Eight', '7': 'Seven', '6': 'Six', '5': 'Five', '4': 'Four', '3': 'Three', '2': 'Two' };
  const r1 = rankNames[notation[0]] || notation[0];
  const r2 = rankNames[notation[1]] || notation[1];
  const suited = notation[2] === 's' ? ' (same suit)' : notation[2] === 'o' ? ' (different suits)' : '';
  return `${r1}-${r2}${suited}`;
}

// Translate position codes to plain English
function describePosition(pos) {
  const map = {
    'BTN': 'the Button (last to act — best seat at the table)',
    'SB': 'the Small Blind (forced bet, out of position)',
    'BB': 'the Big Blind (forced bet, but get to act last before the flop)',
    'UTG': 'Under the Gun (first to act — tightest position)',
    'UTG+1': 'Under the Gun +1 (second to act — still very tight)',
    'UTG+2': 'Under the Gun +2 (early position — play carefully)',
    'MP': 'Middle Position (act early, be selective)',
    'MP+1': 'Middle Position +1 (middle of the pack)',
    'HJ': 'the Hijack (one before the Cutoff — slightly looser than middle)',
    'CO': 'the Cutoff (second-best position, act near last)'
  };
  return map[pos] || pos;
}

function describePositionShort(pos) {
  const map = {
    'BTN': 'the Button', 'SB': 'the Small Blind', 'BB': 'the Big Blind',
    'UTG': 'Under the Gun', 'UTG+1': 'UTG+1', 'UTG+2': 'UTG+2',
    'MP': 'Middle Position', 'MP+1': 'MP+1', 'HJ': 'the Hijack', 'CO': 'the Cutoff'
  };
  return map[pos] || pos;
}

// Describe street in plain English
function describeStreet(state) {
  const map = { 'preflop': 'before any community cards', 'flop': 'on the flop (first 3 cards)', 'turn': 'on the turn (4th card)', 'river': 'on the river (final card)' };
  return map[state] || state;
}

// Categorize hand strength for plain-English descriptions
function strengthCategory(pct) {
  if (pct >= 85) return { label: 'very strong', emoji: 'You have a monster hand', detail: 'You beat most hands your opponent could have.' };
  if (pct >= 70) return { label: 'strong', emoji: 'You have a strong hand', detail: 'You\'re ahead of the majority of possible opposing hands.' };
  if (pct >= 55) return { label: 'decent', emoji: 'You have a decent hand', detail: 'You\'re likely ahead, but vulnerable to better draws and made hands.' };
  if (pct >= 40) return { label: 'mediocre', emoji: 'You have a borderline hand', detail: 'It could go either way — roughly a coin flip.' };
  if (pct >= 25) return { label: 'weak', emoji: 'You have a weak hand', detail: 'You\'re behind most of the time. Proceed with caution.' };
  return { label: 'very weak', emoji: 'You have a very weak hand', detail: 'You lose to most hands your opponent could hold.' };
}

class GTOEngine {
  constructor() {
    this.cache = new Map();
  }

  getRecommendation(gameState, playerId) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || !player.holeCards || player.holeCards.length < 2) {
      return null;
    }

    const position = player.position;
    const street = gameState.state;
    const holeCards = player.holeCards;
    const community = gameState.communityCards || [];
    const potSize = gameState.pot;
    const toCall = gameState.currentBet - player.bet;
    const stackSize = player.stack;

    if (street === GAME_STATES.PREFLOP) {
      return this.getPreflopRecommendation(holeCards, position, gameState);
    } else {
      return this.getPostflopRecommendation(holeCards, community, position, gameState, player);
    }
  }

  getPreflopRecommendation(holeCards, position, gameState) {
    const notation = getHandNotation(holeCards[0], holeCards[1]);
    const handName = describeHand(notation);
    const posDesc = describePosition(position);
    const posShort = describePositionShort(position);
    // Map full ring positions to the closest defined range
    const rangeMap = { 'UTG+1': 'UTG', 'UTG+2': 'UTG', 'MP+1': 'MP', 'HJ': 'CO' };
    const range = OPENING_RANGES[position] || OPENING_RANGES[rangeMap[position]] || OPENING_RANGES['MP'];

    // For BB, use depth-adjusted defense frequencies
    const player = gameState.players.find(p => p.holeCards?.length === 2 && p.position === position);
    const bb = gameState.config?.bigBlind || 2;
    const effectiveBB = player ? Math.round((player.stack + (player.bet || 0)) / bb) : 100;
    const frequency = (position === 'BB')
      ? getBBDefenseFreq(notation, effectiveBB)
      : (range[notation] || 0);

    const hasRaise = gameState.actionHistory.some(a =>
      a.street === GAME_STATES.PREFLOP && (a.type === ACTIONS.RAISE || a.type === ACTIONS.ALL_IN)
    );

    const raiseCount = gameState.actionHistory.filter(a =>
      a.street === GAME_STATES.PREFLOP && (a.type === ACTIONS.RAISE || a.type === ACTIONS.ALL_IN)
    ).length;

    let recommendation;

    if (!hasRaise) {
      // No one has raised yet — should we open?
      // Deep-stack context for coaching tips
      const depthLabel = effectiveBB >= 200 ? 'very deep' : effectiveBB >= 150 ? 'deep' : 'standard';
      const depthTip = effectiveBB >= 150
        ? ` With ${effectiveBB} big blinds (${depthLabel} stacks), speculative hands like small pairs and suited connectors gain extra value because you can win a huge pot when you hit.`
        : '';

      if (frequency >= 0.8) {
        recommendation = {
          action: ACTIONS.RAISE,
          confidence: 'high',
          frequencies: { raise: frequency, fold: 1 - frequency },
          reasoning: `${handName} is a strong starting hand. From ${posShort}, you should raise to build the pot and put pressure on the other players. A good bet here is about 2.5 times the big blind.${depthTip}`,
          whyItMatters: `Raising with strong hands is important because it (1) builds the pot when you\'re likely ahead, (2) makes weaker hands pay to see more cards, and (3) narrows down how many opponents you face.`,
          plainAction: `Raise — you have a premium hand in ${posShort}.`,
          ev: this.estimateEV(frequency, gameState.config?.bigBlind || 2)
        };
      } else if (frequency >= 0.3) {
        recommendation = {
          action: ACTIONS.RAISE,
          confidence: 'medium',
          frequencies: { raise: frequency, fold: 1 - frequency },
          reasoning: `${handName} is a playable hand from ${posShort}, but not a powerhouse. You can raise here to take the lead, but it\'s not a slam dunk. If you feel unsure, folding is fine too — this is a borderline spot.`,
          whyItMatters: `From ${posShort}, you act ${position === 'BTN' || position === 'CO' ? 'near last, which gives you an advantage — you get to see what others do first. This means you can play more hands.' : 'early, which means many players still get to act after you. Play tighter because someone behind you might have a better hand.'}`,
          plainAction: `Raise if you're feeling confident, or fold if the table is aggressive.`,
          ev: this.estimateEV(frequency * 0.7, gameState.config?.bigBlind || 2)
        };
      } else {
        recommendation = {
          action: ACTIONS.FOLD,
          confidence: 'high',
          frequencies: { fold: 1, raise: 0 },
          reasoning: `${handName} isn't strong enough to play from ${posShort}. Folding here saves you money in the long run. It might feel boring, but the best players fold most of their hands — that\'s how they stay profitable.`,
          whyItMatters: `The key to winning poker is picking your battles wisely. Playing weak hands costs money over time, even if you occasionally get lucky. Patience is a superpower at the poker table.`,
          plainAction: 'Fold — this hand isn\'t worth the risk from this seat.',
          ev: 0
        };
      }
    } else if (raiseCount === 1) {
      // Someone raised — should we call, re-raise, or fold?
      const raiser = gameState.actionHistory.find(a =>
        a.street === GAME_STATES.PREFLOP && a.type === ACTIONS.RAISE
      );
      const raiserPlayer = gameState.players.find(p => p.id === raiser?.playerId);
      const raiserPos = raiserPlayer?.position || 'CO';
      const raiserName = raiserPlayer?.name || 'an opponent';
      const raiserPosShort = describePositionShort(raiserPos);
      const threeBetRange = THREE_BET_RANGES[`vs_${raiserPos}`] || THREE_BET_RANGES['vs_CO'];
      const threeBetFreq = threeBetRange[notation] || 0;

      if (threeBetFreq >= 0.5) {
        recommendation = {
          action: ACTIONS.RAISE,
          confidence: 'high',
          frequencies: { raise: threeBetFreq, call: frequency * 0.5, fold: Math.max(0, 1 - threeBetFreq - frequency * 0.5) },
          reasoning: `${raiserName} raised from ${raiserPosShort}, and your ${handName} is strong enough to re-raise. By raising again, you build a bigger pot with a great hand and put pressure on them to make a tough decision.`,
          whyItMatters: `Re-raising (also called a "3-bet") does two things: it builds the pot when you have a strong hand, and it forces your opponent to either commit more chips or fold. This is one of the most powerful moves in poker.`,
          plainAction: `Re-raise — your hand is strong enough to fight back against their raise.`,
          ev: this.estimateEV(threeBetFreq, (gameState.config?.bigBlind || 2) * 3)
        };
      } else if (frequency >= 0.5) {
        const callFreq = Math.min(frequency, 0.8);
        const costToCall = gameState.currentBet - (gameState.players.find(p => p.id === gameState.currentPlayerId)?.bet || 0);
        recommendation = {
          action: ACTIONS.CALL,
          confidence: 'medium',
          frequencies: { call: callFreq, fold: 1 - callFreq, raise: threeBetFreq },
          reasoning: `${raiserName} raised from ${raiserPosShort}. Your ${handName} is good enough to call and see the flop, but not quite strong enough to re-raise. You'll need to make good decisions after the community cards come out.`,
          whyItMatters: `Calling a raise is the right move when your hand has potential but isn\'t a top-tier hand. You want to see the flop cheaply and evaluate from there. The key is having a plan for what you'll do on later streets.`,
          plainAction: `Call — your hand is worth seeing the flop, but don't get carried away.`,
          ev: this.estimateEV(callFreq * 0.5, gameState.currentBet)
        };
      } else {
        recommendation = {
          action: ACTIONS.FOLD,
          confidence: 'high',
          frequencies: { fold: 1, call: frequency * 0.3, raise: 0 },
          reasoning: `${raiserName} raised from ${raiserPosShort}, and your ${handName} isn't strong enough to continue. When someone raises, they\'re claiming to have a good hand — and yours just doesn't stack up. Save your chips for a better spot.`,
          whyItMatters: `Calling raises with weak hands is one of the most common mistakes in poker. It feels like "just a small call," but those chips add up quickly. Good players fold here and wait for a better opportunity.`,
          plainAction: `Fold — don't throw good money after bad.`,
          ev: 0
        };
      }
    } else {
      // Facing multiple raises (3-bet or more)
      const raiserName = 'your opponent';
      if (frequency >= 0.9 && ['AA', 'KK', 'QQ', 'AKs', 'AKo'].includes(notation)) {
        recommendation = {
          action: ACTIONS.RAISE,
          confidence: 'high',
          frequencies: { raise: 1, call: 0, fold: 0 },
          reasoning: `There have been multiple raises, but your ${handName} is one of the absolute best starting hands in poker. You should raise again or go all-in. This is the dream scenario — you want to get as many chips in the pot as possible.`,
          whyItMatters: `When you have a top-5 starting hand and there's already a lot of action, it means someone else also thinks they have a great hand. This is where you make your money — get your chips in while you're a huge favorite.`,
          plainAction: `Raise big or go all-in — you have one of the best hands possible.`,
          ev: this.estimateEV(0.8, gameState.pot)
        };
      } else if (frequency >= 0.7) {
        recommendation = {
          action: ACTIONS.CALL,
          confidence: 'medium',
          frequencies: { call: 0.6, fold: 0.3, raise: 0.1 },
          reasoning: `There have been multiple raises already. Your ${handName} is decent but not great in this situation. You can call cautiously, but be ready to let it go if the board doesn\'t help you. Don't fall in love with this hand.`,
          whyItMatters: `When there's a lot of raising before the flop, it usually means someone has a very strong hand. Calling with a decent hand is okay, but be disciplined about cutting your losses after the flop if things don\'t improve.`,
          plainAction: `Call cautiously — but be prepared to fold if the flop doesn't help.`,
          ev: this.estimateEV(0.4, gameState.currentBet)
        };
      } else {
        recommendation = {
          action: ACTIONS.FOLD,
          confidence: 'high',
          frequencies: { fold: 0.9, call: 0.1 },
          reasoning: `Multiple raises means at least one player likely has a very strong hand. Your ${handName} is in trouble here. Folding might feel frustrating, but playing into heavy action with a weak hand is how you lose stacks quickly.`,
          whyItMatters: `This is a situation where most players lose money by "hoping to get lucky." The math is against you. Smart poker is knowing when to step aside.`,
          plainAction: `Fold — too much action for this hand. Wait for a better spot.`,
          ev: 0
        };
      }
    }

    recommendation.handNotation = notation;
    recommendation.handName = handName;
    recommendation.positionExplained = posDesc;
    recommendation.street = 'preflop';
    return recommendation;
  }

  getPostflopRecommendation(holeCards, community, position, gameState, player) {
    const handStrength = getHandStrength(holeCards, community, 300);
    const hsPct = Math.round(handStrength * 100);
    const hsCategory = strengthCategory(hsPct);
    const potSize = gameState.pot;
    const toCall = gameState.currentBet - (player.bet || 0);
    const stack = player.stack;
    const spr = potSize > 0 ? stack / potSize : 20;
    const potOdds = toCall > 0 ? toCall / (potSize + toCall) : 0;
    const potOddsPct = Math.round(potOdds * 100);
    const streetName = describeStreet(gameState.state);

    const facingBet = toCall > 0;

    let recommendation;

    if (!facingBet) {
      // We can check or bet
      if (handStrength >= 0.85) {
        const betSize = Math.round(potSize * 0.75);
        recommendation = {
          action: ACTIONS.BET || ACTIONS.RAISE,
          confidence: 'high',
          frequencies: { bet: 0.85, check: 0.15 },
          reasoning: `${hsCategory.emoji} ${streetName}. Your hand wins about ${hsPct}% of the time against a random hand — that's excellent. You should bet about 75% of the pot (around ${Math.min(betSize, stack)} chips) to make your opponents pay to stay in.`,
          whyItMatters: `When you have a strong hand, the biggest mistake is playing it too passively. Checking gives free cards that could let someone catch up. Betting accomplishes two things: you win more when they call with worse hands, and you protect against draws that could beat you.`,
          plainAction: `Bet — you're in great shape. Make them pay to stay in.`,
          suggestedAmount: Math.min(betSize, stack),
          ev: this.estimateEV(handStrength, potSize * 0.75)
        };
      } else if (handStrength >= 0.65) {
        const betSize = Math.round(potSize * 0.5);
        recommendation = {
          action: ACTIONS.BET || ACTIONS.RAISE,
          confidence: 'medium',
          frequencies: { bet: 0.6, check: 0.4 },
          reasoning: `${hsCategory.emoji} ${streetName} — about ${hsPct}% win rate. You\'re likely ahead, so a medium-sized bet (about half the pot, around ${Math.min(betSize, stack)} chips) makes sense. This gets value from weaker hands while keeping the pot manageable.`,
          whyItMatters: `With a good but not great hand, you want to bet enough to get value from worse hands but not so much that only better hands call. A half-pot bet is a nice balance — it charges draws and extracts value without overcommitting.`,
          plainAction: `Bet medium — you're probably winning, but stay alert.`,
          suggestedAmount: Math.min(betSize, stack),
          ev: this.estimateEV(handStrength, potSize * 0.5)
        };
      } else if (handStrength >= 0.45) {
        recommendation = {
          action: ACTIONS.CHECK,
          confidence: 'medium',
          frequencies: { check: 0.65, bet: 0.35 },
          reasoning: `${hsCategory.emoji} ${streetName} — about ${hsPct}% win rate. This is a "coin-flip" type hand. Checking is smart here because betting would only chase away worse hands while better hands would happily call or raise you.`,
          whyItMatters: `In poker, a key concept is "pot control." When your hand is decent but not great, keeping the pot small protects you from losing big. If your opponent bets after you check, you can then make a better informed decision.`,
          plainAction: `Check — your hand is okay but not worth building a big pot.`,
          ev: this.estimateEV(handStrength, 0)
        };
      } else if (handStrength >= 0.25 && spr > 3) {
        const betSize = Math.round(potSize * 0.33);
        recommendation = {
          action: ACTIONS.CHECK,
          confidence: 'low',
          frequencies: { check: 0.55, bet: 0.45 },
          reasoning: `${hsCategory.emoji} ${streetName} — only about ${hsPct}% win rate. Checking is usually best here. You could occasionally make a small bet as a bluff (about 1/3 of the pot) to try to win without a showdown, but only do this if you think your opponent is likely to fold.`,
          whyItMatters: `Bluffing is a part of good poker, but it should be done selectively. A small bet is less risky than a big one if you decide to try it. But honestly, checking and giving up is perfectly fine with a weak hand.`,
          plainAction: `Check — your hand is weak. Don't invest more chips without improvement.`,
          suggestedAmount: Math.min(betSize, stack),
          ev: this.estimateEV(0.3, potSize * 0.33)
        };
      } else {
        recommendation = {
          action: ACTIONS.CHECK,
          confidence: 'high',
          frequencies: { check: 0.9, bet: 0.1 },
          reasoning: `${hsCategory.emoji} ${streetName} — only about ${hsPct}% win rate. Your hand is very weak right now. Check and hope to see the next card for free. If you don\'t improve, be ready to fold to any bet.`,
          whyItMatters: `One of the most important skills in poker is recognizing when you\'re beaten and minimizing your losses. There\'s no shame in checking a weak hand — it\'s far better than throwing chips away trying to bluff.`,
          plainAction: `Check and hope for help — your hand needs to improve.`,
          ev: 0
        };
      }
    } else {
      // Facing a bet
      const betterName = gameState.streetActions?.length > 0
        ? (gameState.players.find(p => p.id !== player.id && !p.folded)?.name || 'Your opponent')
        : 'Your opponent';

      if (handStrength >= 0.8) {
        const raiseAmount = Math.round(toCall * 3 + potSize);
        recommendation = {
          action: ACTIONS.RAISE,
          confidence: 'high',
          frequencies: { raise: 0.7, call: 0.3, fold: 0 },
          reasoning: `${betterName} bet, but ${hsCategory.emoji.toLowerCase()} — about ${hsPct}% win rate. This is a great spot to raise! Your hand is very likely the best one out there. Raising to about ${Math.min(raiseAmount, stack + player.bet)} chips builds the pot while you\'re ahead.`,
          whyItMatters: `When you have a strong hand and your opponent is betting, it means they also think they have something good. This is the ideal time to raise — you\'re extracting maximum value from their weaker hand. Don\'t just call and leave money on the table.`,
          plainAction: `Raise — you likely have the best hand. Build the pot!`,
          suggestedAmount: Math.min(raiseAmount, stack + player.bet),
          ev: this.estimateEV(handStrength, raiseAmount)
        };
      } else if (handStrength >= potOdds + 0.1) {
        const profitMargin = hsPct - potOddsPct;
        recommendation = {
          action: ACTIONS.CALL,
          confidence: handStrength >= potOdds + 0.2 ? 'high' : 'medium',
          frequencies: { call: 0.7, raise: 0.1, fold: 0.2 },
          reasoning: `${betterName} bet ${toCall} chips into a pot of ${potSize}. Here's the key math: you need to win about ${potOddsPct}% of the time for calling to be profitable, and your hand wins roughly ${hsPct}% of the time. Since ${hsPct}% > ${potOddsPct}%, calling is a profitable play in the long run.`,
          whyItMatters: `This is called "pot odds" — comparing what you need to invest vs what you could win. Think of it like this: you're paying ${toCall} chips for a chance to win ${potSize + toCall} chips. At a ${hsPct}% win rate, that's a good deal. You don't need to win every hand — just enough to profit over time.`,
          mathBreakdown: `Cost to call: ${toCall} chips. Pot you'd win: ${potSize + toCall} chips. You need ${potOddsPct}% win rate to break even. You have ~${hsPct}%. That's +${profitMargin}% profit margin.`,
          plainAction: `Call — the math says this is profitable. You win often enough to justify the cost.`,
          ev: this.estimateEV(handStrength - potOdds, potSize + toCall)
        };
      } else if (handStrength >= potOdds - 0.05) {
        recommendation = {
          action: ACTIONS.CALL,
          confidence: 'low',
          frequencies: { call: 0.45, fold: 0.55 },
          reasoning: `This is a really close spot. ${betterName} bet ${toCall} into ${potSize}. You need to win about ${potOddsPct}% of the time and your hand wins roughly ${hsPct}%. It's almost exactly break-even. A small call is okay, but folding isn't a mistake either.`,
          whyItMatters: `When the math is this close, other factors matter: How does this opponent play? Have they been bluffing a lot? Do you have position (acting last)? If you think they might be bluffing even a little, calling is fine. If they tend to only bet with strong hands, folding is smarter.`,
          mathBreakdown: `Cost to call: ${toCall} chips. Pot you'd win: ${potSize + toCall} chips. You need ~${potOddsPct}% and have ~${hsPct}%. Basically break-even.`,
          plainAction: `Tough call — either calling or folding is reasonable. Trust your read on the opponent.`,
          ev: this.estimateEV(handStrength - potOdds, potSize + toCall)
        };
      } else {
        const deficit = potOddsPct - hsPct;
        recommendation = {
          action: ACTIONS.FOLD,
          confidence: 'high',
          frequencies: { fold: 0.85, call: 0.15 },
          reasoning: `${betterName} bet ${toCall} into ${potSize}. You'd need to win about ${potOddsPct}% of the time to justify calling, but your hand only wins around ${hsPct}%. That's a ${deficit}% gap — calling here loses money over time. Folding is the smart move.`,
          whyItMatters: `It's tempting to call "just to see," but that habit is one of the biggest money-losers in poker. Every time you call when the math doesn't work, you're essentially donating chips. The best players have the discipline to fold in these spots.`,
          mathBreakdown: `Cost to call: ${toCall} chips. Pot: ${potSize + toCall} chips. Need ${potOddsPct}% win rate but only have ~${hsPct}%. You'd lose ${deficit} cents per dollar long-term.`,
          plainAction: `Fold — the price is too high for what your hand is worth.`,
          ev: 0
        };
      }
    }

    recommendation.handStrength = handStrength;
    recommendation.handStrengthPct = hsPct;
    recommendation.strengthCategory = hsCategory;
    recommendation.potOdds = potOdds;
    recommendation.potOddsPct = potOddsPct;
    recommendation.spr = spr;
    recommendation.street = gameState.state;
    recommendation.streetExplained = streetName;
    return recommendation;
  }

  estimateEV(winProb, investment) {
    return +(winProb * investment - (1 - winProb) * investment * 0.5).toFixed(2);
  }

  analyzeAction(action, recommendation) {
    if (!recommendation) return null;

    const recAction = recommendation.action;
    const played = action.type;
    const handName = recommendation.handName || 'your hand';

    let quality;
    let feedback;
    let detailedFeedback;

    if (played === recAction) {
      quality = 'optimal';
      feedback = 'Nice one! That\'s exactly the right play here.';
      detailedFeedback = recommendation.whyItMatters || 'You matched the optimal strategy. Keep it up!';
    } else if (
      (played === ACTIONS.CALL && recAction === ACTIONS.RAISE) ||
      (played === ACTIONS.RAISE && recAction === ACTIONS.CALL)
    ) {
      quality = 'acceptable';
      if (played === ACTIONS.CALL && recAction === ACTIONS.RAISE) {
        feedback = `Calling works, but raising would have been slightly better here.`;
        detailedFeedback = `Your call isn't bad — you're staying in with a good hand. But raising would have built the pot while you're likely ahead, and it puts pressure on your opponent. Think about raising more in spots like this.`;
      } else {
        feedback = `Raising is aggressive, but just calling would have been a bit better here.`;
        detailedFeedback = `Your raise isn't terrible, but a call keeps the pot smaller and keeps weaker hands in. Sometimes playing it cool with a call disguises your hand strength and lets your opponent make mistakes later.`;
      }
    } else if (played === ACTIONS.FOLD && (recAction === ACTIONS.CALL || recAction === ACTIONS.RAISE)) {
      quality = 'mistake';
      feedback = `You folded too early! ${recommendation.plainAction || 'Your hand was worth continuing with.'}`;
      detailedFeedback = recommendation.reasoning || 'Your hand had enough potential to stay in the hand. Folding here means you\'re leaving profitable situations on the table. Try to trust the math — if your win percentage is higher than the cost to play, stay in.';
    } else if ((played === ACTIONS.CALL || played === ACTIONS.RAISE) && recAction === ACTIONS.FOLD) {
      quality = 'mistake';
      feedback = `You should have folded here. ${recommendation.plainAction || 'Your hand wasn\'t strong enough to continue.'}`;
      detailedFeedback = recommendation.reasoning || 'Putting more chips in with a weak hand is the most common and costly mistake in poker. It feels bad to fold, but it saves you money over many hands. Think of folding as an investment in your future winnings.';
    } else if (played === ACTIONS.CHECK && (recAction === ACTIONS.RAISE || recAction === ACTIONS.BET)) {
      quality = 'suboptimal';
      feedback = `Checking was too passive. You should have bet to build the pot with your strong hand.`;
      detailedFeedback = `When you have a good hand and check, you miss the chance to win more chips. Your opponents get a free look at the next card, which could improve their hand and cost you the pot. Bet to protect your hand and get value.`;
    } else {
      quality = 'suboptimal';
      feedback = `Not the ideal play. ${recommendation.plainAction || ''}`;
      detailedFeedback = recommendation.reasoning || '';
    }

    return {
      quality,
      feedback,
      detailedFeedback,
      evDiff: recommendation.ev || 0,
      gtoAction: recAction,
      playerAction: played,
      confidence: recommendation.confidence,
      handName,
      mathBreakdown: recommendation.mathBreakdown || null
    };
  }
}

module.exports = GTOEngine;
