const { OPENING_RANGES, THREE_BET_RANGES, getHandNotation, isHandInRange } = require('../gto/ranges');
const { getHandStrength } = require('../../shared/evaluator');
const { ACTIONS, GAME_STATES, RANK_VALUES } = require('../../shared/constants');

const AI_PROFILES = {
  gto_bot: {
    name: 'GTO Bot',
    description: 'Plays near-optimal game theory strategy',
    vpipTarget: 24,
    pfrTarget: 19,
    aggressionTarget: 2.5,
    bluffFreq: 0.33,
    foldToCbetFreq: 0.42,
    adjustToPlayer: false,
    tightness: 0,
    randomness: 0.05
  },
  aggro_pro: {
    name: 'Aggro Pro',
    description: 'Aggressive professional player who puts pressure on opponents',
    vpipTarget: 30,
    pfrTarget: 25,
    aggressionTarget: 3.5,
    bluffFreq: 0.45,
    foldToCbetFreq: 0.35,
    adjustToPlayer: true,
    tightness: -0.15,
    randomness: 0.1
  },
  nit_reg: {
    name: 'Nit Reg',
    description: 'Very tight regular who only plays premium hands',
    vpipTarget: 16,
    pfrTarget: 14,
    aggressionTarget: 2.0,
    bluffFreq: 0.15,
    foldToCbetFreq: 0.55,
    adjustToPlayer: false,
    tightness: 0.25,
    randomness: 0.05
  },
  loose_rec: {
    name: 'Loose Rec',
    description: 'Recreational player who plays too many hands and calls too much',
    vpipTarget: 45,
    pfrTarget: 12,
    aggressionTarget: 1.2,
    bluffFreq: 0.2,
    foldToCbetFreq: 0.3,
    adjustToPlayer: false,
    tightness: -0.35,
    randomness: 0.25
  },
  elite_hybrid: {
    name: 'Elite Hybrid',
    description: 'Expert player who mixes GTO with exploitative adjustments',
    vpipTarget: 26,
    pfrTarget: 21,
    aggressionTarget: 2.8,
    bluffFreq: 0.35,
    foldToCbetFreq: 0.40,
    adjustToPlayer: true,
    tightness: 0,
    randomness: 0.08
  },
  maniac: {
    name: 'The Maniac',
    description: 'Hyper-aggressive player who bets and raises at every opportunity',
    vpipTarget: 52,
    pfrTarget: 38,
    aggressionTarget: 4.5,
    bluffFreq: 0.55,
    foldToCbetFreq: 0.2,
    adjustToPlayer: false,
    tightness: -0.45,
    randomness: 0.3
  },
  rock: {
    name: 'The Rock',
    description: 'Ultra-tight player who only plays the absolute best hands',
    vpipTarget: 12,
    pfrTarget: 10,
    aggressionTarget: 1.8,
    bluffFreq: 0.08,
    foldToCbetFreq: 0.65,
    adjustToPlayer: false,
    tightness: 0.4,
    randomness: 0.03
  },
  trappy: {
    name: 'Trappy Mike',
    description: 'Deceptive player who slow-plays strong hands and sets traps',
    vpipTarget: 28,
    pfrTarget: 16,
    aggressionTarget: 1.8,
    bluffFreq: 0.25,
    foldToCbetFreq: 0.38,
    adjustToPlayer: true,
    tightness: -0.05,
    randomness: 0.12
  },
  calling_station: {
    name: 'Calling Carl',
    description: 'Loves to call everything — rarely folds and rarely raises',
    vpipTarget: 55,
    pfrTarget: 8,
    aggressionTarget: 0.8,
    bluffFreq: 0.05,
    foldToCbetFreq: 0.15,
    adjustToPlayer: false,
    tightness: -0.5,
    randomness: 0.2
  },
  lag_shark: {
    name: 'LAG Shark',
    description: 'Loose-aggressive shark who plays many hands very aggressively',
    vpipTarget: 35,
    pfrTarget: 28,
    aggressionTarget: 3.8,
    bluffFreq: 0.42,
    foldToCbetFreq: 0.3,
    adjustToPlayer: true,
    tightness: -0.2,
    randomness: 0.15
  }
};

class AIEngine {
  constructor(profile = 'gto_bot') {
    this.profile = AI_PROFILES[profile] || AI_PROFILES.gto_bot;
    this.profileKey = profile;
  }

  static getProfiles() {
    return Object.entries(AI_PROFILES).map(([key, p]) => ({
      key,
      name: p.name,
      description: p.description
    }));
  }

  decide(gameState, playerId) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || !player.holeCards || player.holeCards.length < 2) return null;

    const validActions = this.getValidActions(player, gameState);
    if (validActions.length === 0) return null;

    const street = gameState.state;

    if (street === GAME_STATES.PREFLOP) {
      return this.decidePreflopAction(player, gameState, validActions);
    } else {
      return this.decidePostflopAction(player, gameState, validActions);
    }
  }

  getValidActions(player, gameState) {
    const actions = [];
    const toCall = gameState.currentBet - player.bet;

    actions.push({ type: ACTIONS.FOLD });

    if (toCall === 0) {
      actions.push({ type: ACTIONS.CHECK });
    } else {
      if (player.stack <= toCall) {
        actions.push({ type: ACTIONS.ALL_IN, amount: player.stack + player.bet });
      } else {
        actions.push({ type: ACTIONS.CALL, amount: toCall });
      }
    }

    if (player.stack > toCall) {
      const minRaise = gameState.currentBet + (gameState.config?.bigBlind || 2);
      const maxRaise = player.stack + player.bet;
      if (maxRaise > minRaise) {
        actions.push({ type: ACTIONS.RAISE, min: minRaise, max: maxRaise });
      }
      actions.push({ type: ACTIONS.ALL_IN, amount: maxRaise });
    }

    return actions;
  }

  decidePreflopAction(player, gameState, validActions) {
    const notation = getHandNotation(player.holeCards[0], player.holeCards[1]);
    const position = player.position || 'MP';
    // Map full ring positions to closest defined range
    const rangeMap = { 'UTG+1': 'UTG', 'UTG+2': 'UTG', 'MP+1': 'MP', 'HJ': 'CO' };
    const range = OPENING_RANGES[position] || OPENING_RANGES[rangeMap[position]] || OPENING_RANGES['MP'];
    const handFreq = (range[notation] || 0) - this.profile.tightness;

    const hasRaise = gameState.actionHistory?.some(a =>
      a.street === GAME_STATES.PREFLOP && (a.type === ACTIONS.RAISE || a.type === ACTIONS.ALL_IN)
    );

    const raiseCount = gameState.actionHistory?.filter(a =>
      a.street === GAME_STATES.PREFLOP && (a.type === ACTIONS.RAISE || a.type === ACTIONS.ALL_IN)
    ).length || 0;

    const roll = Math.random();
    const noise = (Math.random() - 0.5) * this.profile.randomness * 2;

    if (!hasRaise) {
      // First to act
      const adjustedFreq = handFreq + noise;
      if (adjustedFreq > 0.3) {
        const raiseAction = validActions.find(a => a.type === ACTIONS.RAISE);
        if (raiseAction) {
          const bb = gameState.config?.bigBlind || 2;
          const raiseSize = this.profileKey === 'aggro_pro'
            ? bb * 3
            : this.profileKey === 'nit_reg'
              ? bb * 2.5
              : bb * 2.5;
          return { type: ACTIONS.RAISE, amount: Math.min(Math.max(raiseSize, raiseAction.min), raiseAction.max) };
        }
        return validActions.find(a => a.type === ACTIONS.CALL) || { type: ACTIONS.CHECK };
      }
      return validActions.find(a => a.type === ACTIONS.CHECK) || { type: ACTIONS.FOLD };
    }

    if (raiseCount === 1) {
      // Facing a raise
      const raiser = gameState.actionHistory?.find(a =>
        a.street === GAME_STATES.PREFLOP && a.type === ACTIONS.RAISE
      );
      const raiserPlayer = gameState.players.find(p => p.id === raiser?.playerId);
      const raiserPos = raiserPlayer?.position || 'CO';
      const threeBetRange = THREE_BET_RANGES[`vs_${raiserPos}`] || THREE_BET_RANGES['vs_CO'];
      const threeBetFreq = (threeBetRange[notation] || 0) - this.profile.tightness * 0.5 + noise;

      // Adjust based on opponent's stats if this profile does that
      let callThreshold = handFreq + noise;
      if (this.profile.adjustToPlayer) {
        const opponentStats = raiserPlayer?.stats;
        if (opponentStats && opponentStats.vpip > 35) {
          callThreshold += 0.15; // Widen range vs loose player
          threeBetFreq > 0 && (callThreshold += 0.1);
        }
      }

      if (threeBetFreq > 0.4 && roll < threeBetFreq + (this.profile.aggressionTarget > 3 ? 0.1 : 0)) {
        const raiseAction = validActions.find(a => a.type === ACTIONS.RAISE);
        if (raiseAction) {
          const threeBetSize = gameState.currentBet * 3;
          return { type: ACTIONS.RAISE, amount: Math.min(Math.max(threeBetSize, raiseAction.min), raiseAction.max) };
        }
      }

      if (callThreshold > 0.3) {
        return validActions.find(a => a.type === ACTIONS.CALL) || { type: ACTIONS.FOLD };
      }

      return { type: ACTIONS.FOLD };
    }

    // Facing 3-bet or more
    const premiums = ['AA', 'KK', 'QQ', 'AKs', 'AKo'];
    if (premiums.includes(notation)) {
      const raiseAction = validActions.find(a => a.type === ACTIONS.RAISE);
      if (raiseAction && roll < 0.7) {
        return { type: ACTIONS.ALL_IN, amount: player.stack + player.bet };
      }
      return validActions.find(a => a.type === ACTIONS.CALL) || { type: ACTIONS.FOLD };
    }

    const decent = ['JJ', 'TT', 'AQs', 'AQo', 'AJs'];
    if (decent.includes(notation) && roll < 0.4 - this.profile.tightness) {
      return validActions.find(a => a.type === ACTIONS.CALL) || { type: ACTIONS.FOLD };
    }

    return { type: ACTIONS.FOLD };
  }

  decidePostflopAction(player, gameState, validActions) {
    const community = gameState.communityCards || [];
    const handStrength = getHandStrength(player.holeCards, community, 200);
    const potSize = gameState.pot;
    const toCall = gameState.currentBet - (player.bet || 0);
    const spr = potSize > 0 ? player.stack / potSize : 20;
    const potOdds = toCall > 0 ? toCall / (potSize + toCall) : 0;

    const facingBet = toCall > 0;
    const roll = Math.random();
    const noise = (Math.random() - 0.5) * this.profile.randomness;

    const adjustedStrength = handStrength + noise;

    if (!facingBet) {
      // Check or bet
      if (adjustedStrength >= 0.8) {
        // Strong hand - value bet
        const raiseAction = validActions.find(a => a.type === ACTIONS.RAISE);
        if (raiseAction) {
          const betSize = this.getBetSize(potSize, adjustedStrength, player.stack, raiseAction);
          return { type: ACTIONS.RAISE, amount: betSize };
        }
        return { type: ACTIONS.CHECK };
      }

      if (adjustedStrength >= 0.6) {
        // Medium strength - mix
        if (roll < 0.5 + this.profile.aggressionTarget * 0.1) {
          const raiseAction = validActions.find(a => a.type === ACTIONS.RAISE);
          if (raiseAction) {
            const betSize = Math.round(potSize * 0.5);
            return { type: ACTIONS.RAISE, amount: Math.min(Math.max(betSize, raiseAction.min), raiseAction.max) };
          }
        }
        return { type: ACTIONS.CHECK };
      }

      if (adjustedStrength >= 0.3) {
        // Weak - check mostly, sometimes bluff
        if (roll < this.profile.bluffFreq * 0.5) {
          const raiseAction = validActions.find(a => a.type === ACTIONS.RAISE);
          if (raiseAction) {
            const betSize = Math.round(potSize * 0.33);
            return { type: ACTIONS.RAISE, amount: Math.min(Math.max(betSize, raiseAction.min), raiseAction.max) };
          }
        }
        return { type: ACTIONS.CHECK };
      }

      // Very weak - check or bluff
      if (roll < this.profile.bluffFreq * 0.3) {
        const raiseAction = validActions.find(a => a.type === ACTIONS.RAISE);
        if (raiseAction && spr > 2) {
          const betSize = Math.round(potSize * 0.67);
          return { type: ACTIONS.RAISE, amount: Math.min(Math.max(betSize, raiseAction.min), raiseAction.max) };
        }
      }
      return { type: ACTIONS.CHECK };
    }

    // Facing a bet
    if (adjustedStrength >= 0.85) {
      // Very strong - raise
      if (roll < 0.6 + this.profile.aggressionTarget * 0.05) {
        const raiseAction = validActions.find(a => a.type === ACTIONS.RAISE);
        if (raiseAction) {
          const raiseSize = Math.round(toCall * 3 + potSize);
          return { type: ACTIONS.RAISE, amount: Math.min(Math.max(raiseSize, raiseAction.min), raiseAction.max) };
        }
      }
      return validActions.find(a => a.type === ACTIONS.CALL) || { type: ACTIONS.FOLD };
    }

    if (adjustedStrength >= potOdds + 0.05) {
      // Enough equity to call
      if (adjustedStrength >= 0.7 && roll < 0.3 * this.profile.aggressionTarget / 2.5) {
        const raiseAction = validActions.find(a => a.type === ACTIONS.RAISE);
        if (raiseAction) {
          const raiseSize = Math.round(toCall * 2.5 + potSize);
          return { type: ACTIONS.RAISE, amount: Math.min(Math.max(raiseSize, raiseAction.min), raiseAction.max) };
        }
      }
      return validActions.find(a => a.type === ACTIONS.CALL) || { type: ACTIONS.FOLD };
    }

    // Not enough equity
    if (roll < this.profile.bluffFreq * 0.2 && spr > 3) {
      // Bluff raise occasionally
      const raiseAction = validActions.find(a => a.type === ACTIONS.RAISE);
      if (raiseAction) {
        const raiseSize = Math.round(toCall * 3 + potSize);
        return { type: ACTIONS.RAISE, amount: Math.min(Math.max(raiseSize, raiseAction.min), raiseAction.max) };
      }
    }

    // Personality-driven overrides for specific AI types
    if (this.profileKey === 'loose_rec' && roll < 0.35) {
      return validActions.find(a => a.type === ACTIONS.CALL) || { type: ACTIONS.FOLD };
    }
    if (this.profileKey === 'calling_station' && roll < 0.55) {
      return validActions.find(a => a.type === ACTIONS.CALL) || { type: ACTIONS.FOLD };
    }
    if (this.profileKey === 'maniac' && roll < 0.3 && spr > 2) {
      const raiseAction = validActions.find(a => a.type === ACTIONS.RAISE);
      if (raiseAction) {
        const raiseSize = Math.round(toCall * 3.5 + potSize);
        return { type: ACTIONS.RAISE, amount: Math.min(Math.max(raiseSize, raiseAction.min), raiseAction.max) };
      }
    }
    if (this.profileKey === 'trappy' && adjustedStrength >= 0.75 && roll < 0.5) {
      // Slow-play strong hands — just call instead of raising
      return validActions.find(a => a.type === ACTIONS.CALL) || { type: ACTIONS.FOLD };
    }

    return { type: ACTIONS.FOLD };
  }

  getBetSize(potSize, strength, stack, raiseAction) {
    let sizePct;
    if (strength >= 0.9) {
      sizePct = this.profileKey === 'aggro_pro' ? 0.85 : 0.75;
    } else if (strength >= 0.75) {
      sizePct = 0.6;
    } else {
      sizePct = 0.33;
    }

    const amount = Math.round(potSize * sizePct);
    return Math.min(Math.max(amount, raiseAction.min), raiseAction.max);
  }
}

module.exports = { AIEngine, AI_PROFILES };
