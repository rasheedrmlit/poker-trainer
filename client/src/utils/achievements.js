// Achievement system — stored in localStorage
const STORAGE_KEY = 'poker_achievements';

export const ACHIEVEMENT_DEFS = [
  { id: 'first_hand', name: 'First Hand', desc: 'Play your first hand', icon: '🃏' },
  { id: 'first_win', name: 'Winner', desc: 'Win your first pot', icon: '🏆' },
  { id: 'ten_hands', name: 'Warming Up', desc: 'Play 10 hands', icon: '🔥' },
  { id: 'fifty_hands', name: 'Grinder', desc: 'Play 50 hands', icon: '⚡' },
  { id: 'hundred_hands', name: 'Centurion', desc: 'Play 100 hands', icon: '💯' },
  { id: 'streak_3', name: 'Hot Streak', desc: 'Win 3 hands in a row', icon: '🔥' },
  { id: 'streak_5', name: 'On Fire', desc: 'Win 5 hands in a row', icon: '🌟' },
  { id: 'big_pot', name: 'Big Score', desc: 'Win a pot worth 50+ BB', icon: '💰' },
  { id: 'huge_pot', name: 'Jackpot', desc: 'Win a pot worth 200+ BB', icon: '💎' },
  { id: 'bluff_win', name: 'Stone Cold Bluff', desc: 'Win a hand with a fold (uncontested)', icon: '🎭' },
  { id: 'comeback', name: 'Comeback Kid', desc: 'Win back to starting stack after being down 50%+', icon: '🦅' },
  { id: 'grade_a', name: 'Perfect Play', desc: 'Get an A+ grade on a hand', icon: '⭐' },
  { id: 'double_up', name: 'Double Up', desc: 'Double your starting stack', icon: '📈' },
  { id: 'all_in_win', name: 'All-In Hero', desc: 'Win an all-in showdown', icon: '🦸' },
];

export function getAchievements() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

export function unlockAchievement(id) {
  const current = getAchievements();
  if (current[id]) return null; // already unlocked
  current[id] = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return ACHIEVEMENT_DEFS.find(a => a.id === id);
}

export function checkAchievements({ handsPlayed, handsWon, winStreak, bigBlind, potWon, wasAllIn, gradeAPlus, stackNow, startingStack, wasUncontested, wasDown50 }) {
  const newAchievements = [];
  const tryUnlock = (id) => {
    const a = unlockAchievement(id);
    if (a) newAchievements.push(a);
  };

  if (handsPlayed >= 1) tryUnlock('first_hand');
  if (handsPlayed >= 10) tryUnlock('ten_hands');
  if (handsPlayed >= 50) tryUnlock('fifty_hands');
  if (handsPlayed >= 100) tryUnlock('hundred_hands');
  if (handsWon >= 1) tryUnlock('first_win');
  if (winStreak >= 3) tryUnlock('streak_3');
  if (winStreak >= 5) tryUnlock('streak_5');
  if (potWon && bigBlind && potWon / bigBlind >= 50) tryUnlock('big_pot');
  if (potWon && bigBlind && potWon / bigBlind >= 200) tryUnlock('huge_pot');
  if (wasUncontested) tryUnlock('bluff_win');
  if (gradeAPlus) tryUnlock('grade_a');
  if (wasAllIn && handsWon >= 1) tryUnlock('all_in_win');
  if (startingStack && stackNow >= startingStack * 2) tryUnlock('double_up');
  if (wasDown50) tryUnlock('comeback');

  return newAchievements;
}

export function getUnlockedCount() {
  return Object.keys(getAchievements()).length;
}
