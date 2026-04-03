// Haptic feedback for mobile — uses navigator.vibrate() where available
const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

let enabled = localStorage.getItem('poker_vibrate') !== '0';

export function isVibrationEnabled() { return enabled && canVibrate; }
export function toggleVibration() {
  enabled = !enabled;
  localStorage.setItem('poker_vibrate', enabled ? '1' : '0');
  return enabled;
}

function vibrate(pattern) {
  if (!enabled || !canVibrate) return;
  try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
}

// Your turn — short double pulse
export function vibrateTurn() { vibrate([30, 50, 30]); }

// Win — celebration pattern
export function vibrateWin() { vibrate([50, 30, 50, 30, 100]); }

// All-in — long buzz
export function vibrateAllIn() { vibrate([100, 50, 150]); }

// Fold — single tap
export function vibrateFold() { vibrate([15]); }

// General tap
export function vibrateTap() { vibrate([10]); }
