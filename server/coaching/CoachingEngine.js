const GTOEngine = require('../gto/GTOEngine');
const { ACTIONS, GAME_STATES, HAND_RANK_NAMES } = require('../../shared/constants');
const { getHandStrength } = require('../../shared/evaluator');
const { getHandNotation } = require('../gto/ranges');

// Street names in plain English
const STREET_NAMES = {
  [GAME_STATES.PREFLOP]: 'Before the Flop',
  [GAME_STATES.FLOP]: 'On the Flop',
  [GAME_STATES.TURN]: 'On the Turn',
  [GAME_STATES.RIVER]: 'On the River'
};

class CoachingEngine {
  constructor() {
    this.gtoEngine = new GTOEngine();
    this.playerMistakes = new Map();
    this.sessionStats = new Map();
  }

  getRealtimeSuggestion(gameState, playerId) {
    const recommendation = this.gtoEngine.getRecommendation(gameState, playerId);
    if (!recommendation) return null;

    return {
      recommendation,
      tip: this.getContextualTip(recommendation, gameState, playerId)
    };
  }

  getContextualTip(recommendation, gameState, playerId) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return '';

    const street = recommendation.street;
    const activePlayers = gameState.players.filter(p => !p.folded).length;

    // Build a rich contextual tip
    const tips = [];

    // Position awareness tip
    if (street === 'preflop') {
      if (player.position === 'BTN' || player.position === 'CO') {
        tips.push('You\'re in a late position — you get to see what most players do before you act. This is a big advantage!');
      } else if (player.position === 'HJ') {
        tips.push('You\'re in the Hijack — that\'s one before the Cutoff. You can start playing a few more hands than middle position, but don\'t go crazy.');
      } else if (player.position === 'SB' || player.position === 'BB') {
        tips.push('You\'re in the blinds — you\'ve already invested chips but will be out of position after the flop. Be selective.');
      } else if (player.position === 'UTG' || player.position === 'UTG+1' || player.position === 'UTG+2') {
        tips.push('You\'re in early position — be extra careful here. Only play strong hands because many players still get a chance to raise after you.');
      } else if (player.position === 'MP' || player.position === 'MP+1') {
        tips.push('You\'re in middle position — you can open up a little compared to early position, but still be somewhat selective with your hand choice.');
      }
    }

    // Hand strength tip
    if (recommendation.handStrength !== undefined) {
      const hs = Math.round(recommendation.handStrength * 100);
      const cat = recommendation.strengthCategory;
      if (cat) {
        tips.push(`${cat.emoji}. ${cat.detail}`);
      }
    }

    // Pot odds explanation when facing a bet
    if (recommendation.potOddsPct && recommendation.handStrengthPct) {
      tips.push(`Quick math: you need to win ${recommendation.potOddsPct}% of the time to break even. Your hand wins about ${recommendation.handStrengthPct}%.`);
    }

    // Player count context
    if (activePlayers > 3 && street !== 'preflop') {
      tips.push(`Heads up: ${activePlayers} players are still in this hand. More players means you need a stronger hand to win.`);
    }

    return tips.join(' ');
  }

  analyzeHandAction(action, gameState, playerId) {
    const recommendation = this.gtoEngine.getRecommendation(gameState, playerId);
    if (!recommendation) return null;

    const analysis = this.gtoEngine.analyzeAction(action, recommendation);

    // Track mistakes
    if (analysis && (analysis.quality === 'mistake' || analysis.quality === 'suboptimal')) {
      if (!this.playerMistakes.has(playerId)) {
        this.playerMistakes.set(playerId, []);
      }
      this.playerMistakes.get(playerId).push({
        handNumber: gameState.handNumber,
        street: gameState.state,
        action: action.type,
        gtoAction: analysis.gtoAction,
        quality: analysis.quality,
        feedback: analysis.feedback,
        detailedFeedback: analysis.detailedFeedback,
        timestamp: Date.now()
      });

      // Keep last 100 mistakes
      const mistakes = this.playerMistakes.get(playerId);
      if (mistakes.length > 100) {
        this.playerMistakes.set(playerId, mistakes.slice(-100));
      }
    }

    return analysis;
  }

  getPostHandAnalysis(handHistory, playerId) {
    if (!handHistory) return null;

    const playerActions = handHistory.actions.filter(a => a.playerId === playerId);
    const playerData = handHistory.players.find(p => p.id === playerId);
    if (!playerData) return null;

    const isWinner = handHistory.winners.some(w => w.playerId === playerId);
    const winAmount = handHistory.winners.find(w => w.playerId === playerId)?.amount || 0;

    const analysis = {
      handNumber: handHistory.handNumber,
      position: playerData.position,
      positionExplained: this.explainPosition(playerData.position),
      holeCards: playerData.holeCards,
      communityCards: handHistory.communityCards,
      result: winAmount,
      isWinner,
      potSize: handHistory.pot,
      actions: [],
      streetBreakdown: [],
      overallGrade: 'A',
      keyMistakes: [],
      improvements: [],
      summary: ''
    };

    // Grade each action with rich feedback
    let totalScore = 0;
    let actionCount = 0;

    for (const action of playerActions) {
      const score = this.gradeAction(action, handHistory, playerId);
      analysis.actions.push(score);
      totalScore += score.score;
      actionCount++;

      if (score.score < 0.5) {
        analysis.keyMistakes.push(score.feedback);
      }
    }

    // Build street-by-street breakdown
    analysis.streetBreakdown = this.buildStreetBreakdown(playerActions, handHistory, playerId);

    // Calculate overall grade
    const avgScore = actionCount > 0 ? totalScore / actionCount : 1;
    if (avgScore >= 0.9) analysis.overallGrade = 'A+';
    else if (avgScore >= 0.8) analysis.overallGrade = 'A';
    else if (avgScore >= 0.7) analysis.overallGrade = 'B+';
    else if (avgScore >= 0.6) analysis.overallGrade = 'B';
    else if (avgScore >= 0.5) analysis.overallGrade = 'C';
    else if (avgScore >= 0.3) analysis.overallGrade = 'D';
    else analysis.overallGrade = 'F';

    // Generate improvements
    analysis.improvements = this.generateImprovements(playerData, playerActions, handHistory);

    // Build human-readable summary
    analysis.summary = this.buildHandSummary(analysis, playerData, handHistory);

    return analysis;
  }

  buildStreetBreakdown(playerActions, handHistory, playerId) {
    const streets = [];
    const playerData = handHistory.players.find(p => p.id === playerId);
    if (!playerData?.holeCards) return streets;

    const streetOrder = [GAME_STATES.PREFLOP, GAME_STATES.FLOP, GAME_STATES.TURN, GAME_STATES.RIVER];

    for (const street of streetOrder) {
      const actions = playerActions.filter(a => a.street === street);
      if (actions.length === 0) continue;

      let community = [];
      if (street === GAME_STATES.FLOP) community = handHistory.communityCards.slice(0, 3);
      else if (street === GAME_STATES.TURN) community = handHistory.communityCards.slice(0, 4);
      else if (street === GAME_STATES.RIVER) community = handHistory.communityCards.slice(0, 5);

      let strength = null;
      let strengthDesc = '';
      if (community.length > 0) {
        strength = getHandStrength(playerData.holeCards, community, 200);
        const pct = Math.round(strength * 100);
        if (pct >= 80) strengthDesc = `Very strong (${pct}% win rate)`;
        else if (pct >= 65) strengthDesc = `Strong (${pct}% win rate)`;
        else if (pct >= 50) strengthDesc = `Decent (${pct}% win rate)`;
        else if (pct >= 35) strengthDesc = `Weak (${pct}% win rate)`;
        else strengthDesc = `Very weak (${pct}% win rate)`;
      }

      streets.push({
        street,
        streetName: STREET_NAMES[street] || street,
        actions: actions.map(a => this.describeAction(a)),
        communityCards: community,
        handStrength: strength,
        handStrengthDesc: strengthDesc
      });
    }

    return streets;
  }

  describeAction(action) {
    const actionNames = {
      fold: 'Folded',
      check: 'Checked',
      call: `Called ${action.amount || ''}`,
      raise: `Raised to ${action.amount || ''}`,
      bet: `Bet ${action.amount || ''}`,
      allin: `Went All-In for ${action.amount || ''}`
    };
    return actionNames[action.type] || action.type;
  }

  explainPosition(pos) {
    const map = {
      'BTN': 'Button — best seat, acts last after the flop',
      'SB': 'Small Blind — posted a forced half-bet, acts first after the flop',
      'BB': 'Big Blind — posted a forced full bet',
      'UTG': 'Under the Gun — first to act, tightest position',
      'UTG+1': 'UTG+1 — second to act, still a very tight position',
      'UTG+2': 'UTG+2 — early position, play carefully',
      'MP': 'Middle Position — act in the middle',
      'MP+1': 'Middle Position +1 — slightly better than middle',
      'HJ': 'Hijack — one seat before the Cutoff, can start opening up',
      'CO': 'Cutoff — second-best seat, acts second-to-last'
    };
    return map[pos] || pos;
  }

  buildHandSummary(analysis, playerData, handHistory) {
    const parts = [];

    // Position and starting hand
    const notation = playerData.holeCards?.length === 2
      ? getHandNotation(playerData.holeCards[0], playerData.holeCards[1])
      : '??';
    parts.push(`You played ${notation} from ${analysis.positionExplained || playerData.position}.`);

    // Result
    if (analysis.isWinner) {
      parts.push(`You won $${analysis.result}!`);
    } else {
      parts.push('You didn\'t win this hand.');
    }

    // Key takeaway
    if (analysis.keyMistakes.length > 0) {
      parts.push(`Main issue: ${analysis.keyMistakes[0]}`);
    } else if (analysis.overallGrade.startsWith('A')) {
      parts.push('You played this hand very well. No major mistakes detected.');
    } else {
      parts.push('Decent play overall with room for small improvements.');
    }

    return parts.join(' ');
  }

  gradeAction(action, handHistory, playerId) {
    const playerData = handHistory.players.find(p => p.id === playerId);
    if (!playerData || !playerData.holeCards || playerData.holeCards.length < 2) {
      return { action: action.type, score: 0.5, feedback: 'Unable to grade this action.' };
    }

    let communityAtTime = [];
    if (action.street === GAME_STATES.FLOP) communityAtTime = handHistory.communityCards.slice(0, 3);
    else if (action.street === GAME_STATES.TURN) communityAtTime = handHistory.communityCards.slice(0, 4);
    else if (action.street === GAME_STATES.RIVER) communityAtTime = handHistory.communityCards.slice(0, 5);

    const streetName = STREET_NAMES[action.street] || action.street;
    let score = 0.7;
    let feedback = '';

    if (action.street === GAME_STATES.PREFLOP) {
      const notation = getHandNotation(playerData.holeCards[0], playerData.holeCards[1]);
      if (action.type === ACTIONS.FOLD) {
        const premiums = ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs'];
        const good = ['TT', '99', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs'];
        if (premiums.includes(notation)) {
          score = 0.05;
          feedback = `${streetName}: You folded ${notation} — this is one of the strongest starting hands in poker! You should almost never fold this before the flop, regardless of the action.`;
        } else if (good.includes(notation)) {
          score = 0.3;
          feedback = `${streetName}: Folding ${notation} was probably too tight. This is a solid starting hand that can make strong combinations after the flop.`;
        } else {
          score = 0.8;
          feedback = `${streetName}: Folding ${notation} was fine. Not every hand is worth playing.`;
        }
      } else if (action.type === ACTIONS.RAISE || action.type === ACTIONS.ALL_IN) {
        score = 0.75;
        feedback = `${streetName}: Raising with ${notation} — good aggression. Taking the lead before the flop gives you control of the hand.`;
      } else if (action.type === ACTIONS.CALL) {
        score = 0.65;
        feedback = `${streetName}: Calling with ${notation}. This keeps you in the hand, but consider whether raising might have been better to take control.`;
      } else {
        score = 0.7;
        feedback = `${streetName}: Reasonable play.`;
      }
    } else {
      if (communityAtTime.length > 0) {
        const strength = getHandStrength(playerData.holeCards, communityAtTime, 200);
        const pct = Math.round(strength * 100);

        if (action.type === ACTIONS.FOLD) {
          if (strength >= 0.7) {
            score = 0.05;
            feedback = `${streetName}: You folded with about a ${pct}% chance of winning — that's a very strong hand! This was a big mistake. Trust your hand strength and stay in.`;
          } else if (strength >= 0.45) {
            score = 0.35;
            feedback = `${streetName}: You folded with a ${pct}% win rate. This is borderline — depending on the bet size, you may have been getting a good enough price to call. Check if the amount you'd pay is small compared to what's in the pot.`;
          } else if (strength >= 0.25) {
            score = 0.7;
            feedback = `${streetName}: Folding with a ${pct}% win rate. This is reasonable — your hand was weak and the bet was probably too expensive to call profitably.`;
          } else {
            score = 0.9;
            feedback = `${streetName}: Good fold. Your hand only won about ${pct}% of the time — no point throwing more chips at it.`;
          }
        } else if (action.type === ACTIONS.RAISE || action.type === ACTIONS.ALL_IN) {
          if (strength >= 0.75) {
            score = 0.95;
            feedback = `${streetName}: Great raise with a ${pct}% win rate! You have a strong hand and you're building the pot while you're ahead. This is textbook play.`;
          } else if (strength >= 0.55) {
            score = 0.7;
            feedback = `${streetName}: Raising with a ${pct}% win rate. You're probably ahead, and betting protects your hand from getting outdrawn. Nice aggression.`;
          } else if (strength >= 0.35) {
            score = 0.45;
            feedback = `${streetName}: Risky raise with only a ${pct}% win rate. This works as a bluff sometimes, but you're putting in a lot of chips when you're not likely to have the best hand.`;
          } else {
            score = 0.25;
            feedback = `${streetName}: Bold bluff with only a ${pct}% win rate. This is high-risk — it can work against timid opponents but will cost you big when they call.`;
          }
        } else if (action.type === ACTIONS.CALL) {
          if (strength >= 0.75) {
            score = 0.55;
            feedback = `${streetName}: You called with a ${pct}% win rate. Your hand is very strong — consider raising instead! Raising builds a bigger pot when you're the favorite and makes opponents pay more.`;
          } else if (strength >= 0.45) {
            score = 0.8;
            feedback = `${streetName}: Solid call with a ${pct}% win rate. You're getting a good price to see the next card or showdown.`;
          } else if (strength >= 0.25) {
            score = 0.5;
            feedback = `${streetName}: Calling with a ${pct}% win rate is borderline. Make sure the pot is offering you a good price — you need the potential payout to justify the risk.`;
          } else {
            score = 0.2;
            feedback = `${streetName}: Calling with only a ${pct}% win rate is too loose. You're paying too much to see cards when you're a big underdog. Save those chips.`;
          }
        } else if (action.type === ACTIONS.CHECK) {
          if (strength >= 0.75) {
            score = 0.4;
            feedback = `${streetName}: Checking with a ${pct}% win rate was too passive. You have a great hand — bet to get value! If you check, your opponent sees the next card for free and might catch up.`;
          } else if (strength >= 0.45) {
            score = 0.75;
            feedback = `${streetName}: Checking with a ${pct}% win rate is reasonable. Your hand is decent but not strong enough to bet for value confidently.`;
          } else {
            score = 0.85;
            feedback = `${streetName}: Good check. With a ${pct}% win rate, there's no point betting — you'd only get called by better hands.`;
          }
        }
      }
    }

    return {
      action: action.type,
      street: action.street,
      streetName,
      score,
      feedback
    };
  }

  generateImprovements(playerData, actions, handHistory) {
    const improvements = [];

    const foldCount = actions.filter(a => a.type === ACTIONS.FOLD).length;
    const raiseCount = actions.filter(a => a.type === ACTIONS.RAISE || a.type === ACTIONS.ALL_IN).length;
    const callCount = actions.filter(a => a.type === ACTIONS.CALL).length;
    const checkCount = actions.filter(a => a.type === ACTIONS.CHECK).length;

    if (callCount > raiseCount * 2 && callCount > 2) {
      improvements.push('You called a lot this hand without raising. Try to raise more when you think you have the best hand — it builds bigger pots when you\'re winning and makes opponents fold weaker hands.');
    }

    if (checkCount > 1 && raiseCount === 0 && callCount <= 1) {
      improvements.push('You played this hand very passively (mostly checking). Even with a mediocre hand, an occasional bet can win the pot without a showdown. Don\'t be afraid to take the lead.');
    }

    if (playerData.position === 'BTN' || playerData.position === 'CO') {
      if (foldCount > 0 && actions.length <= 2) {
        improvements.push('You were in one of the best seats at the table (acting late gives you an advantage), but you folded early. In late position, you can play more hands because you have more information about what other players are doing.');
      }
    }

    if (playerData.position === 'SB' || playerData.position === 'BB') {
      if (callCount > 1 && raiseCount === 0) {
        improvements.push('Playing from the blinds is tough because you act first after the flop. When you decide to play a hand, consider raising instead of just calling — it gives you the initiative and puts your opponent on the defensive.');
      }
    }

    if (improvements.length === 0) {
      improvements.push('Well played! You made solid decisions throughout this hand. Keep studying and staying disciplined.');
    }

    return improvements;
  }

  getLeakReport(playerId) {
    const mistakes = this.playerMistakes.get(playerId) || [];
    if (mistakes.length < 5) {
      return {
        hasEnoughData: false,
        message: 'Play at least 5 more hands to generate your personalized leak report. The more hands you play, the more accurate it becomes!'
      };
    }

    const leaks = [];
    const streetMistakes = {};
    const typeMistakes = {};

    for (const mistake of mistakes) {
      streetMistakes[mistake.street] = (streetMistakes[mistake.street] || 0) + 1;
      const pattern = `${mistake.action}_when_gto_${mistake.gtoAction}`;
      typeMistakes[pattern] = (typeMistakes[pattern] || 0) + 1;
    }

    // Find most common leaks
    const sortedTypes = Object.entries(typeMistakes).sort((a, b) => b[1] - a[1]);

    for (const [pattern, count] of sortedTypes.slice(0, 5)) {
      const [played, _, gto] = pattern.split('_when_gto_');
      const freq = Math.round(count / mistakes.length * 100);
      leaks.push({
        pattern,
        count,
        frequency: freq,
        description: this.describeLeakPattern(played, gto),
        fix: this.getLeakFix(played, gto),
        examples: this.getLeakExamples(played, gto)
      });
    }

    const worstStreet = Object.entries(streetMistakes).sort((a, b) => b[1] - a[1])[0];

    return {
      hasEnoughData: true,
      totalMistakes: mistakes.length,
      leaks,
      worstStreet: worstStreet?.[0] || 'unknown',
      worstStreetName: STREET_NAMES[worstStreet?.[0]] || 'Unknown',
      worstStreetCount: worstStreet?.[1] || 0,
      summary: this.buildLeakSummary(leaks, worstStreet)
    };
  }

  buildLeakSummary(leaks, worstStreet) {
    if (leaks.length === 0) return 'No significant patterns detected. Keep playing!';
    const top = leaks[0];
    const streetName = STREET_NAMES[worstStreet?.[0]] || 'various streets';
    return `Your biggest weakness is "${top.description.toLowerCase()}". Most of your mistakes happen ${streetName.toLowerCase()}. Focus on ${top.fix.split('.')[0].toLowerCase()}.`;
  }

  describeLeakPattern(played, gto) {
    if (played === 'fold' && (gto === 'call' || gto === 'raise')) {
      return 'Giving up too easily — folding hands that are worth playing';
    }
    if ((played === 'call' || played === 'raise') && gto === 'fold') {
      return 'Chasing too much — putting money in with weak hands';
    }
    if (played === 'call' && gto === 'raise') {
      return 'Playing too timidly — just calling when you should raise with strong hands';
    }
    if (played === 'raise' && gto === 'call') {
      return 'Over-betting — raising too aggressively when just calling would be smarter';
    }
    if (played === 'check' && (gto === 'raise' || gto === 'bet')) {
      return 'Missing value — checking when you should bet your strong hands';
    }
    return `Playing ${played} in spots where ${gto} would be more profitable`;
  }

  getLeakFix(played, gto) {
    if (played === 'fold' && (gto === 'call' || gto === 'raise')) {
      return 'Before folding, do the math: compare what it costs to call vs what you could win. If your chance of winning is higher than the fraction of the pot you\'re paying, calling is profitable. You don\'t have to win every time — just often enough.';
    }
    if ((played === 'call' || played === 'raise') && gto === 'fold') {
      return 'Be more disciplined about letting go of weak hands. It\'s tempting to "see one more card," but those extra calls add up. Ask yourself: "If I played this spot 100 times, would I make money?" If the answer is no, fold.';
    }
    if (played === 'call' && gto === 'raise') {
      return 'When you have a strong hand, raise instead of just calling! Raising builds bigger pots when you\'re the favorite and forces opponents to pay more to stay in. A raise also gives you information about whether your opponent has a strong hand too.';
    }
    if (played === 'raise' && gto === 'call') {
      return 'Not every strong hand needs a raise. Sometimes calling keeps weaker hands in the pot (so they can pay you off later) and disguises the strength of your hand. Save the big raises for your very best and very worst hands.';
    }
    if (played === 'check' && (gto === 'raise' || gto === 'bet')) {
      return 'Don\'t be afraid to bet when you have a good hand! Checking gives opponents a free chance to improve. A bet either wins the pot right away or gets called by a worse hand — both good outcomes for you.';
    }
    return `Try ${gto} more often in these situations instead of ${played}. Review the coaching tips for specific reasoning.`;
  }

  getLeakExamples(played, gto) {
    if (played === 'fold' && gto === 'call') {
      return 'Example: The pot is $20, someone bets $5, and your hand wins about 30% of the time. You\'re paying $5 for a chance to win $25 — you only need to win 20% of the time. That\'s a profitable call!';
    }
    if (played === 'call' && gto === 'fold') {
      return 'Example: The pot is $10, someone bets $10, and your hand only wins 20% of the time. You\'re paying $10 for $20 — you need to win 33%. At 20%, you\'re losing money every time you call.';
    }
    if (played === 'call' && gto === 'raise') {
      return 'Example: You have top pair with a good kicker. Instead of just matching their bet, raise to 3x their bet. This charges draws and gets value from weaker pairs.';
    }
    return '';
  }

  getSessionSummary(playerId, handHistories) {
    if (!handHistories || handHistories.length === 0) {
      return { hasData: false, message: 'No hands played yet. Start a game to see your stats!' };
    }

    let totalWon = 0;
    let handsWon = 0;
    let handsLost = 0;
    let handsFolded = 0;
    let biggestWin = 0;
    let biggestLoss = 0;
    const grades = [];

    for (const hand of handHistories) {
      const winner = hand.winners.find(w => w.playerId === playerId);
      const playerInHand = hand.players.find(p => p.id === playerId);
      if (!playerInHand) continue;

      // Check if player actually played (took actions beyond just posting blinds)
      const playerActions = hand.actions.filter(a => a.playerId === playerId);
      const didFold = playerInHand.folded;
      const didPlay = playerActions.some(a => a.type !== 'fold') || !didFold;

      if (winner) {
        totalWon += winner.amount;
        handsWon++;
        if (winner.amount > biggestWin) biggestWin = winner.amount;
      } else if (didFold && playerActions.length <= 1) {
        // Player just folded preflop — don't count as "lost"
        handsFolded++;
      } else {
        handsLost++;
      }

      // Only grade hands where the player actually played
      if (didPlay) {
        const analysis = this.getPostHandAnalysis(hand, playerId);
        if (analysis) {
          grades.push(analysis.overallGrade);
        }
      }
    }

    const leakReport = this.getLeakReport(playerId);
    const avgGrade = this.calculateAvgGrade(grades);

    return {
      hasData: true,
      handsPlayed: handHistories.length,
      handsWon,
      handsLost,
      handsFolded,
      winPct: handHistories.length > 0 ? Math.round(handsWon / handHistories.length * 100) : 0,
      totalWon,
      winRate: handHistories.length > 0 ? +(totalWon / handHistories.length).toFixed(2) : 0,
      biggestWin,
      avgGrade,
      leakReport,
      topTip: this.getTopTip(leakReport, avgGrade),
      encouragement: this.getEncouragement(avgGrade, handsWon, handHistories.length)
    };
  }

  calculateAvgGrade(grades) {
    if (grades.length === 0) return 'N/A';
    const gradeValues = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C': 6, 'D': 4, 'F': 2 };
    const avg = grades.reduce((sum, g) => sum + (gradeValues[g] || 5), 0) / grades.length;
    if (avg >= 9.5) return 'A+';
    if (avg >= 8.5) return 'A';
    if (avg >= 7.5) return 'B+';
    if (avg >= 6.5) return 'B';
    if (avg >= 5) return 'C';
    if (avg >= 3) return 'D';
    return 'F';
  }

  getTopTip(leakReport, avgGrade) {
    if (!leakReport.hasEnoughData) return 'Keep playing to build your profile! The coach needs more data to give you personalized advice.';
    if (leakReport.leaks.length === 0) return 'Excellent play! Focus on maintaining consistency and keep studying hand ranges.';
    return leakReport.leaks[0].fix;
  }

  getEncouragement(grade, wins, total) {
    if (grade === 'A+' || grade === 'A') return 'Outstanding work! You\'re making very few mistakes. Keep sharpening those skills.';
    if (grade === 'B+' || grade === 'B') return 'Good solid play! You\'re making mostly right decisions. Focus on the specific areas flagged in your leak report.';
    if (grade === 'C') return 'You\'re on the right track but have some areas to work on. Pay attention to the coaching suggestions and try to apply them.';
    if (grade === 'D' || grade === 'F') return 'Poker is a skill game and everyone starts somewhere. Focus on the basics: play fewer hands, pay attention to position, and check the math before calling big bets.';
    return 'Keep playing! Every hand is a learning opportunity.';
  }
}

module.exports = CoachingEngine;
