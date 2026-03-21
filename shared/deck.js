const { SUITS, RANKS } = require('./constants');

class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push({ rank, suit });
      }
    }
    this.shuffle();
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(count = 1) {
    if (this.cards.length < count) throw new Error('Not enough cards');
    return this.cards.splice(0, count);
  }

  dealOne() {
    return this.deal(1)[0];
  }
}

function cardToString(card) {
  return `${card.rank}${card.suit}`;
}

function stringToCard(str) {
  return { rank: str[0], suit: str[1] };
}

function formatCard(card) {
  const suitSymbols = { h: '\u2665', d: '\u2666', c: '\u2663', s: '\u2660' };
  return `${card.rank}${suitSymbols[card.suit]}`;
}

module.exports = { Deck, cardToString, stringToCard, formatCard };
