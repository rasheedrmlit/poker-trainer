// Sound effects system using Web Audio API — zero external dependencies
const ctx = typeof AudioContext !== 'undefined'
  ? new AudioContext()
  : typeof webkitAudioContext !== 'undefined'
    ? new webkitAudioContext()
    : null;

let muted = localStorage.getItem('poker_muted') === '1';

export function isMuted() { return muted; }
export function toggleMute() {
  muted = !muted;
  localStorage.setItem('poker_muted', muted ? '1' : '0');
  return muted;
}

function play(fn) {
  if (muted || !ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  try { fn(ctx); } catch (e) { /* ignore audio errors */ }
}

// — Card deal: short percussive "thwip"
export function playDeal() {
  play((c) => {
    const o = c.createOscillator();
    const g = c.createGain();
    const n = c.createBufferSource();
    // Noise burst
    const buf = c.createBuffer(1, c.sampleRate * 0.04, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
    n.buffer = buf;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.15, c.currentTime);
    ng.gain.exponentialDecayTo && ng.gain.exponentialDecayTo(0.001, c.currentTime + 0.04);
    ng.gain.setValueAtTime(0.15, c.currentTime);
    ng.gain.linearRampToValueAtTime(0, c.currentTime + 0.04);
    n.connect(ng).connect(c.destination);
    n.start(c.currentTime);
    // Tonal click
    o.frequency.setValueAtTime(2800, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.03);
    g.gain.setValueAtTime(0.12, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.05);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime);
    o.stop(c.currentTime + 0.06);
  });
}

// — Chip bet: ceramic click
export function playChips() {
  play((c) => {
    const t = c.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = c.createOscillator();
      const g = c.createGain();
      const offset = i * 0.025;
      o.frequency.setValueAtTime(3000 + Math.random() * 1500, t + offset);
      o.frequency.exponentialRampToValueAtTime(1200, t + offset + 0.03);
      g.gain.setValueAtTime(0.08, t + offset);
      g.gain.linearRampToValueAtTime(0, t + offset + 0.04);
      o.connect(g).connect(c.destination);
      o.start(t + offset);
      o.stop(t + offset + 0.05);
    }
  });
}

// — Fold: soft whoosh
export function playFold() {
  play((c) => {
    const buf = c.createBuffer(1, c.sampleRate * 0.15, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.08;
    }
    const n = c.createBufferSource();
    n.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(600, c.currentTime);
    f.Q.setValueAtTime(0.5, c.currentTime);
    n.connect(f).connect(c.destination);
    n.start(c.currentTime);
  });
}

// — Check: light tap
export function playCheck() {
  play((c) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(1800, c.currentTime);
    g.gain.setValueAtTime(0.08, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.04);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime);
    o.stop(c.currentTime + 0.05);
  });
}

// — Win: ascending chime
export function playWin() {
  play((c) => {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'triangle';
      const t = c.currentTime + i * 0.12;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.12, t);
      g.gain.linearRampToValueAtTime(0, t + 0.3);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.35);
    });
  });
}

// — Lose: descending tone
export function playLose() {
  play((c) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(400, c.currentTime);
    o.frequency.linearRampToValueAtTime(200, c.currentTime + 0.3);
    g.gain.setValueAtTime(0.08, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime);
    o.stop(c.currentTime + 0.45);
  });
}

// — All-in: dramatic rising tone
export function playAllIn() {
  play((c) => {
    const o = c.createOscillator();
    const o2 = c.createOscillator();
    const g = c.createGain();
    o.type = 'sawtooth';
    o2.type = 'square';
    o.frequency.setValueAtTime(200, c.currentTime);
    o.frequency.linearRampToValueAtTime(800, c.currentTime + 0.3);
    o2.frequency.setValueAtTime(201, c.currentTime);
    o2.frequency.linearRampToValueAtTime(802, c.currentTime + 0.3);
    g.gain.setValueAtTime(0.06, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
    o.connect(g).connect(c.destination);
    o2.connect(g);
    o.start(c.currentTime);
    o2.start(c.currentTime);
    o.stop(c.currentTime + 0.45);
    o2.stop(c.currentTime + 0.45);
  });
}

// — Your turn: attention ping
export function playTurn() {
  play((c) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, c.currentTime);
    g.gain.setValueAtTime(0.1, c.currentTime);
    g.gain.linearRampToValueAtTime(0, c.currentTime + 0.15);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime);
    o.stop(c.currentTime + 0.2);
  });
}

// Play sound for an action type
export function playSoundForAction(type) {
  switch (type) {
    case 'fold': playFold(); break;
    case 'check': playCheck(); break;
    case 'call': playChips(); break;
    case 'raise': playChips(); break;
    case 'allin': playAllIn(); break;
  }
}
