const { Deck } = require('../../shared/deck');
const { evaluateHand, compareHandValues } = require('../../shared/evaluator');
const { GAME_STATES, ACTIONS, DEFAULT_CONFIG, POSITIONS } = require('../../shared/constants');
const { HAND_RANK_NAMES } = require('../../shared/constants');

class GameEngine {
  constructor(tableId, config = {}) {
    this.tableId = tableId;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.players = new Map();
    this.seats = new Array(this.config.maxPlayers).fill(null);
    this.deck = new Deck();
    this.communityCards = [];
    this.pot = 0;
    this.sidePots = [];
    this.state = GAME_STATES.WAITING;
    this.dealerIndex = 0;
    this.currentPlayerIndex = -1;
    this.currentBet = 0;
    this.minRaise = this.config.bigBlind;
    this.handNumber = 0;
    this.actionHistory = [];
    this.streetActions = [];
    this.lastAggressor = -1;
    this.playersActedThisStreet = new Set();
    this.handHistory = [];
  }

  addPlayer(playerId, name, isAI = false, aiType = null) {
    if (this.players.has(playerId)) return this.getPlayerSeat(playerId);

    const seatIndex = this.seats.findIndex(s => s === null);
    if (seatIndex === -1) return -1;

    const player = {
      id: playerId,
      name: name || `Player ${seatIndex + 1}`,
      stack: this.config.startingStack,
      holeCards: [],
      bet: 0,
      totalBetThisHand: 0,
      folded: false,
      allIn: false,
      isAI,
      aiType,
      seatIndex,
      connected: true,
      stats: {
        handsPlayed: 0,
        vpip: 0,
        pfr: 0,
        aggression: 0,
        foldToCbet: 0,
        threeBet: 0,
        wtsd: 0,
        vpipHands: 0,
        pfrHands: 0,
        aggressionNumerator: 0,
        aggressionDenominator: 0,
        foldToCbetOpps: 0,
        foldToCbetCount: 0,
        threeBetOpps: 0,
        threeBetCount: 0,
        wtsdOpps: 0,
        wtsdCount: 0,
        totalWinnings: 0
      }
    };

    this.players.set(playerId, player);
    this.seats[seatIndex] = playerId;
    return seatIndex;
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;
    this.seats[player.seatIndex] = null;
    this.players.delete(playerId);
  }

  getPlayerSeat(playerId) {
    const player = this.players.get(playerId);
    return player ? player.seatIndex : -1;
  }

  getActivePlayers() {
    return this.getSeatedPlayers().filter(p => !p.folded && p.stack > 0 || (p.allIn && !p.folded));
  }

  getSeatedPlayers() {
    return this.seats
      .filter(id => id !== null)
      .map(id => this.players.get(id))
      .filter(p => p);
  }

  getPlayersInHand() {
    return this.getSeatedPlayers().filter(p => !p.folded);
  }

  getPlayersWhoCanAct() {
    return this.getSeatedPlayers().filter(p => !p.folded && !p.allIn);
  }

  canStartHand() {
    const seated = this.getSeatedPlayers();
    return seated.filter(p => p.stack > 0).length >= this.config.minPlayers;
  }

  startHand() {
    if (!this.canStartHand()) return false;

    this.handNumber++;
    this.deck.reset();
    this.communityCards = [];
    this.pot = 0;
    this.sidePots = [];
    this.currentBet = 0;
    this.minRaise = this.config.bigBlind;
    this.actionHistory = [];
    this.streetActions = [];
    this.lastAggressor = -1;
    this.playersActedThisStreet = new Set();

    // Remove busted players
    for (const [id, player] of this.players) {
      if (player.stack <= 0 && !player.isAI) {
        player.stack = this.config.startingStack; // rebuy
      } else if (player.stack <= 0 && player.isAI) {
        player.stack = this.config.startingStack;
      }
    }

    // Reset player states
    for (const [id, player] of this.players) {
      player.holeCards = [];
      player.bet = 0;
      player.totalBetThisHand = 0;
      player.folded = false;
      player.allIn = false;
      player.stats.handsPlayed++;
    }

    // Advance dealer
    this.advanceDealer();

    // Post blinds
    this.postBlinds();

    // Deal hole cards
    this.dealHoleCards();

    this.state = GAME_STATES.PREFLOP;

    // Set first player to act
    this.setFirstToAct();

    return true;
  }

  advanceDealer() {
    const seated = this.getSeatedPlayers();
    if (seated.length === 0) return;

    let nextDealer = (this.dealerIndex + 1) % this.seats.length;
    let attempts = 0;
    while (this.seats[nextDealer] === null && attempts < this.seats.length) {
      nextDealer = (nextDealer + 1) % this.seats.length;
      attempts++;
    }
    this.dealerIndex = nextDealer;
  }

  postBlinds() {
    const seated = this.getSeatedPlayers();
    if (seated.length < 2) return;

    let sbIndex, bbIndex;

    if (seated.length === 2) {
      sbIndex = this.dealerIndex;
      bbIndex = this.getNextActiveSeat(this.dealerIndex);
    } else {
      sbIndex = this.getNextActiveSeat(this.dealerIndex);
      bbIndex = this.getNextActiveSeat(sbIndex);
    }

    const sbPlayer = this.players.get(this.seats[sbIndex]);
    const bbPlayer = this.players.get(this.seats[bbIndex]);

    if (sbPlayer) this.postBlind(sbPlayer, this.config.smallBlind);
    if (bbPlayer) this.postBlind(bbPlayer, this.config.bigBlind);

    this.currentBet = this.config.bigBlind;
    this.sbIndex = sbIndex;
    this.bbIndex = bbIndex;
  }

  postBlind(player, amount) {
    const actual = Math.min(amount, player.stack);
    player.bet = actual;
    player.totalBetThisHand = actual;
    player.stack -= actual;
    this.pot += actual;
    if (player.stack === 0) player.allIn = true;
  }

  dealHoleCards() {
    for (const player of this.getSeatedPlayers()) {
      player.holeCards = this.deck.deal(2);
    }
  }

  getNextActiveSeat(fromIndex) {
    let next = (fromIndex + 1) % this.seats.length;
    let attempts = 0;
    while (attempts < this.seats.length) {
      if (this.seats[next] !== null) {
        const player = this.players.get(this.seats[next]);
        if (player && player.stack >= 0) return next;
      }
      next = (next + 1) % this.seats.length;
      attempts++;
    }
    return fromIndex;
  }

  setFirstToAct() {
    const seated = this.getSeatedPlayers();
    if (seated.length === 0) return;

    let startIndex;
    if (this.state === GAME_STATES.PREFLOP) {
      if (seated.length === 2) {
        startIndex = this.dealerIndex;
      } else {
        startIndex = this.getNextActiveSeat(this.bbIndex);
      }
    } else {
      startIndex = this.getNextActiveSeat(this.dealerIndex);
    }

    // Find first player who can act
    let idx = startIndex;
    let attempts = 0;
    while (attempts < this.seats.length) {
      if (this.seats[idx] !== null) {
        const player = this.players.get(this.seats[idx]);
        if (player && !player.folded && !player.allIn) {
          this.currentPlayerIndex = idx;
          return;
        }
      }
      idx = (idx + 1) % this.seats.length;
      attempts++;
    }

    this.currentPlayerIndex = -1;
  }

  getCurrentPlayer() {
    if (this.currentPlayerIndex === -1) return null;
    const playerId = this.seats[this.currentPlayerIndex];
    return playerId ? this.players.get(playerId) : null;
  }

  getValidActions(playerId) {
    const player = this.players.get(playerId);
    if (!player || player.folded || player.allIn) return [];

    const actions = [];
    const toCall = this.currentBet - player.bet;

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
      const minRaiseAmount = this.currentBet + this.minRaise;
      const maxRaise = player.stack + player.bet;

      if (maxRaise <= minRaiseAmount) {
        actions.push({ type: ACTIONS.ALL_IN, amount: maxRaise });
      } else {
        actions.push({
          type: ACTIONS.RAISE,
          min: minRaiseAmount,
          max: maxRaise
        });
        actions.push({ type: ACTIONS.ALL_IN, amount: maxRaise });
      }
    }

    return actions;
  }

  processAction(playerId, action) {
    const player = this.players.get(playerId);
    if (!player) return { success: false, error: 'Player not found' };

    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    const result = { success: true, action: null, advanceStreet: false, handComplete: false };

    switch (action.type) {
      case ACTIONS.FOLD:
        player.folded = true;
        result.action = { type: ACTIONS.FOLD, player: player.name, playerId };
        break;

      case ACTIONS.CHECK:
        if (this.currentBet > player.bet) {
          return { success: false, error: 'Cannot check, there is a bet to call' };
        }
        result.action = { type: ACTIONS.CHECK, player: player.name, playerId };
        break;

      case ACTIONS.CALL: {
        const toCall = Math.min(this.currentBet - player.bet, player.stack);
        player.stack -= toCall;
        player.bet += toCall;
        player.totalBetThisHand += toCall;
        this.pot += toCall;
        if (player.stack === 0) player.allIn = true;
        result.action = { type: ACTIONS.CALL, amount: toCall, player: player.name, playerId };

        // Track VPIP
        if (this.state === GAME_STATES.PREFLOP) {
          player.stats.vpipHands++;
        }
        break;
      }

      case ACTIONS.RAISE: {
        const raiseAmount = action.amount;
        if (raiseAmount < this.currentBet + this.minRaise && raiseAmount < player.stack + player.bet) {
          return { success: false, error: `Minimum raise is ${this.currentBet + this.minRaise}` };
        }
        const additional = raiseAmount - player.bet;
        if (additional > player.stack) {
          return { success: false, error: 'Not enough chips' };
        }

        this.minRaise = raiseAmount - this.currentBet;
        player.stack -= additional;
        this.pot += additional;
        player.bet = raiseAmount;
        player.totalBetThisHand += additional;
        this.currentBet = raiseAmount;
        this.lastAggressor = player.seatIndex;
        if (player.stack === 0) player.allIn = true;

        result.action = { type: ACTIONS.RAISE, amount: raiseAmount, player: player.name, playerId };

        // Track PFR / 3-bet
        if (this.state === GAME_STATES.PREFLOP) {
          player.stats.vpipHands++;
          player.stats.pfrHands++;
        }

        // Track aggression
        player.stats.aggressionNumerator++;
        player.stats.aggressionDenominator++;

        this.playersActedThisStreet = new Set();
        this.playersActedThisStreet.add(playerId);
        break;
      }

      case ACTIONS.ALL_IN: {
        const allInAmount = player.stack;
        const totalBet = player.bet + allInAmount;
        if (totalBet > this.currentBet) {
          this.minRaise = Math.max(this.minRaise, totalBet - this.currentBet);
          this.currentBet = totalBet;
          this.lastAggressor = player.seatIndex;
          player.stats.aggressionNumerator++;
          player.stats.aggressionDenominator++;
          this.playersActedThisStreet = new Set();
          this.playersActedThisStreet.add(playerId);
        }
        this.pot += allInAmount;
        player.bet = totalBet;
        player.totalBetThisHand += allInAmount;
        player.stack = 0;
        player.allIn = true;

        if (this.state === GAME_STATES.PREFLOP) {
          player.stats.vpipHands++;
          player.stats.pfrHands++;
        }

        result.action = { type: ACTIONS.ALL_IN, amount: totalBet, player: player.name, playerId };
        break;
      }

      default:
        return { success: false, error: 'Invalid action' };
    }

    if (action.type !== ACTIONS.RAISE && action.type !== ACTIONS.ALL_IN) {
      if (action.type === ACTIONS.CALL) {
        player.stats.aggressionDenominator++;
      }
      this.playersActedThisStreet.add(playerId);
    }

    this.streetActions.push(result.action);
    this.actionHistory.push({ ...result.action, street: this.state });

    // Check if hand is over (only one player left)
    const playersInHand = this.getPlayersInHand();
    if (playersInHand.length === 1) {
      result.handComplete = true;
      result.winners = this.resolveHandOnePlayer(playersInHand[0]);
      this.state = GAME_STATES.HAND_COMPLETE;
      this.recordHandHistory(result.winners);
      return result;
    }

    // Check if we advance street
    if (this.shouldAdvanceStreet()) {
      result.advanceStreet = true;
      const advResult = this.advanceStreet();
      if (advResult.handComplete) {
        result.handComplete = true;
        result.winners = advResult.winners;
        result.showdown = advResult.showdown;
        this.recordHandHistory(result.winners);
      }
    } else {
      this.advanceToNextPlayer();
    }

    return result;
  }

  shouldAdvanceStreet() {
    const canAct = this.getPlayersWhoCanAct();
    if (canAct.length === 0) return true;

    // All players who can act have acted and bets are equal
    const allActed = canAct.every(p => this.playersActedThisStreet.has(p.id));
    const allBetsEqual = canAct.every(p => p.bet === this.currentBet);

    return allActed && allBetsEqual;
  }

  advanceToNextPlayer() {
    let next = (this.currentPlayerIndex + 1) % this.seats.length;
    let attempts = 0;
    while (attempts < this.seats.length) {
      if (this.seats[next] !== null) {
        const player = this.players.get(this.seats[next]);
        if (player && !player.folded && !player.allIn) {
          this.currentPlayerIndex = next;
          return;
        }
      }
      next = (next + 1) % this.seats.length;
      attempts++;
    }
    this.currentPlayerIndex = -1;
  }

  advanceStreet() {
    // Reset bets
    for (const [id, player] of this.players) {
      player.bet = 0;
    }
    this.currentBet = 0;
    this.minRaise = this.config.bigBlind;
    this.streetActions = [];
    this.playersActedThisStreet = new Set();
    this.lastAggressor = -1;

    const result = { handComplete: false };

    switch (this.state) {
      case GAME_STATES.PREFLOP:
        this.communityCards = this.deck.deal(3);
        this.state = GAME_STATES.FLOP;
        break;
      case GAME_STATES.FLOP:
        this.communityCards.push(this.deck.dealOne());
        this.state = GAME_STATES.TURN;
        break;
      case GAME_STATES.TURN:
        this.communityCards.push(this.deck.dealOne());
        this.state = GAME_STATES.RIVER;
        break;
      case GAME_STATES.RIVER:
        this.state = GAME_STATES.SHOWDOWN;
        result.handComplete = true;
        result.showdown = true;
        result.winners = this.resolveShowdown();
        this.state = GAME_STATES.HAND_COMPLETE;
        return result;
    }

    // Check if only one player can act (rest all-in or one left)
    const canAct = this.getPlayersWhoCanAct();
    if (canAct.length <= 1) {
      // Run out remaining cards if needed
      const playersInHand = this.getPlayersInHand();
      if (playersInHand.length > 1 && canAct.length === 0) {
        // All remaining players are all-in, run out the board
        while (this.communityCards.length < 5) {
          this.communityCards.push(this.deck.dealOne());
        }
        this.state = GAME_STATES.SHOWDOWN;
        result.handComplete = true;
        result.showdown = true;
        result.winners = this.resolveShowdown();
        this.state = GAME_STATES.HAND_COMPLETE;
        return result;
      } else if (canAct.length === 1) {
        this.setFirstToAct();
      }
    } else {
      this.setFirstToAct();
    }

    return result;
  }

  resolveHandOnePlayer(winner) {
    const potAmount = this.pot;
    winner.stack += potAmount;
    winner.stats.totalWinnings += potAmount;
    const result = [{
      playerId: winner.id,
      name: winner.name,
      amount: potAmount,
      hand: null,
      holeCards: winner.holeCards
    }];
    this.pot = 0;
    return result;
  }

  resolveShowdown() {
    const playersInHand = this.getPlayersInHand();
    const winners = [];

    if (playersInHand.length === 0) return winners;

    // Fallback: if side pot calculation fails, use simple pot distribution
    const totalPot = this.pot;
    let distributed = 0;

    try {
      // Calculate side pots
      const pots = this.calculateSidePots(playersInHand);

      for (const pot of pots) {
        const eligible = pot.eligible;
        let bestEval = null;
        let potWinners = [];

        for (const player of eligible) {
          const handEval = evaluateHand(player.holeCards, this.communityCards);
          if (!handEval) continue; // skip if evaluation fails
          if (!bestEval || compareHandValues(handEval, bestEval) > 0) {
            bestEval = handEval;
            potWinners = [{ player, eval: handEval }];
          } else if (compareHandValues(handEval, bestEval) === 0) {
            potWinners.push({ player, eval: handEval });
          }
        }

        if (potWinners.length === 0) continue;

        const share = Math.floor(pot.amount / potWinners.length);
        const remainder = pot.amount - share * potWinners.length;

        potWinners.forEach((pw, i) => {
          const amount = share + (i === 0 ? remainder : 0);
          pw.player.stack += amount;
          pw.player.stats.totalWinnings += amount;
          distributed += amount;

          const existing = winners.find(w => w.playerId === pw.player.id);
          if (existing) {
            existing.amount += amount;
          } else {
            winners.push({
              playerId: pw.player.id,
              name: pw.player.name,
              amount,
              hand: pw.eval,
              handName: HAND_RANK_NAMES[pw.eval.rank],
              holeCards: pw.player.holeCards
            });
          }
        });
      }
    } catch (err) {
      console.error('Side pot calculation error:', err.message);
    }

    // Safety net: if pot wasn't fully distributed, give remainder to first winner
    // or if no winners found, give to first non-folded player
    if (distributed < totalPot) {
      const undistributed = totalPot - distributed;
      if (winners.length > 0) {
        const firstWinner = playersInHand.find(p => p.id === winners[0].playerId);
        if (firstWinner) {
          firstWinner.stack += undistributed;
          firstWinner.stats.totalWinnings += undistributed;
          winners[0].amount += undistributed;
        }
      } else {
        // No winners found at all — give pot to first non-folded player
        const fallbackWinner = playersInHand[0];
        if (fallbackWinner) {
          fallbackWinner.stack += totalPot;
          fallbackWinner.stats.totalWinnings += totalPot;
          winners.push({
            playerId: fallbackWinner.id,
            name: fallbackWinner.name,
            amount: totalPot,
            hand: null,
            handName: 'Winner',
            holeCards: fallbackWinner.holeCards
          });
        }
      }
    }

    // Clear pot — it's been distributed
    this.pot = 0;

    // Track WTSD
    for (const p of playersInHand) {
      p.stats.wtsdOpps++;
      p.stats.wtsdCount++;
    }

    return winners;
  }

  calculateSidePots(playersInHand) {
    const sorted = [...playersInHand].sort((a, b) => a.totalBetThisHand - b.totalBetThisHand);
    const pots = [];
    let processedBet = 0;

    for (let i = 0; i < sorted.length; i++) {
      const player = sorted[i];
      const betLevel = player.totalBetThisHand;

      if (betLevel > processedBet) {
        const contribution = betLevel - processedBet;
        const eligible = sorted.filter(p => p.totalBetThisHand >= betLevel);
        // Include folded players' contributions
        let potAmount = 0;
        for (const [id, p] of this.players) {
          const contrib = Math.min(p.totalBetThisHand, betLevel) - Math.min(p.totalBetThisHand, processedBet);
          potAmount += Math.max(0, contrib);
        }

        pots.push({ amount: potAmount, eligible });
        processedBet = betLevel;
      }
    }

    if (pots.length === 0 && this.pot > 0) {
      pots.push({ amount: this.pot, eligible: playersInHand });
    }

    return pots;
  }

  recordHandHistory(winners) {
    this.handHistory.push({
      handNumber: this.handNumber,
      players: this.getSeatedPlayers().map(p => ({
        id: p.id,
        name: p.name,
        position: this.getPlayerPosition(p.seatIndex),
        holeCards: [...p.holeCards],
        stack: p.stack,
        folded: p.folded
      })),
      communityCards: [...this.communityCards],
      actions: [...this.actionHistory],
      winners,
      pot: winners.reduce((sum, w) => sum + w.amount, 0)
    });

    // Keep last 100 hands
    if (this.handHistory.length > 100) {
      this.handHistory = this.handHistory.slice(-100);
    }
  }

  getPlayerPosition(seatIndex) {
    const seated = this.getSeatedPlayers();
    const numPlayers = seated.length;
    if (numPlayers === 0) return 'BTN';

    if (seatIndex === this.dealerIndex) return 'BTN';
    if (seatIndex === this.sbIndex) return 'SB';
    if (seatIndex === this.bbIndex) return 'BB';

    // Build the full ring position labels based on player count
    // Positions between BB and BTN (acting order after BB)
    const fullPositions = {
      3: ['UTG'],
      4: ['UTG', 'CO'],
      5: ['UTG', 'MP', 'CO'],
      6: ['UTG', 'MP', 'CO'],
      7: ['UTG', 'UTG+1', 'MP', 'CO'],
      8: ['UTG', 'UTG+1', 'MP', 'HJ', 'CO'],
      9: ['UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO'],
      10: ['UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'HJ', 'CO']
    };
    const positions = fullPositions[Math.min(numPlayers, 10)] || fullPositions[10];
    let posIdx = 0;
    let current = this.getNextActiveSeat(this.bbIndex);
    while (current !== this.dealerIndex && posIdx < positions.length) {
      if (current === seatIndex) return positions[posIdx];
      current = this.getNextActiveSeat(current);
      posIdx++;
    }
    return 'MP';
  }

  getGameState(forPlayerId = null) {
    const players = this.getSeatedPlayers().map(p => ({
      id: p.id,
      name: p.name,
      stack: p.stack,
      bet: p.bet,
      folded: p.folded,
      allIn: p.allIn,
      isAI: p.isAI,
      seatIndex: p.seatIndex,
      position: this.getPlayerPosition(p.seatIndex),
      isDealer: p.seatIndex === this.dealerIndex,
      isSB: p.seatIndex === this.sbIndex,
      isBB: p.seatIndex === this.bbIndex,
      connected: p.connected,
      holeCards: (forPlayerId === p.id || this.state === GAME_STATES.HAND_COMPLETE) ? p.holeCards : [],
      stats: {
        handsPlayed: p.stats.handsPlayed,
        vpip: p.stats.vpipHands > 0 ? Math.round(p.stats.vpipHands / p.stats.handsPlayed * 100) : 0,
        pfr: p.stats.pfrHands > 0 ? Math.round(p.stats.pfrHands / p.stats.handsPlayed * 100) : 0,
        aggression: p.stats.aggressionDenominator > 0 ? +(p.stats.aggressionNumerator / p.stats.aggressionDenominator).toFixed(1) : 0,
        totalWinnings: p.stats.totalWinnings
      }
    }));

    return {
      tableId: this.tableId,
      state: this.state,
      players,
      communityCards: this.communityCards,
      pot: this.pot,
      currentBet: this.currentBet,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerId: this.getCurrentPlayer()?.id || null,
      dealerIndex: this.dealerIndex,
      handNumber: this.handNumber,
      config: this.config,
      streetActions: this.streetActions,
      actionHistory: this.actionHistory
    };
  }

  getUpdatedStats(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;
    return {
      handsPlayed: player.stats.handsPlayed,
      vpip: player.stats.handsPlayed > 0 ? Math.round(player.stats.vpipHands / player.stats.handsPlayed * 100) : 0,
      pfr: player.stats.handsPlayed > 0 ? Math.round(player.stats.pfrHands / player.stats.handsPlayed * 100) : 0,
      aggression: player.stats.aggressionDenominator > 0 ? +(player.stats.aggressionNumerator / player.stats.aggressionDenominator).toFixed(1) : 0,
      foldToCbet: player.stats.foldToCbetOpps > 0 ? Math.round(player.stats.foldToCbetCount / player.stats.foldToCbetOpps * 100) : 0,
      threeBet: player.stats.threeBetOpps > 0 ? Math.round(player.stats.threeBetCount / player.stats.threeBetOpps * 100) : 0,
      wtsd: player.stats.wtsdOpps > 0 ? Math.round(player.stats.wtsdCount / player.stats.wtsdOpps * 100) : 0,
      totalWinnings: player.stats.totalWinnings,
      netProfit: player.stats.totalWinnings - (player.stats.handsPlayed * 0)
    };
  }
}

module.exports = GameEngine;
