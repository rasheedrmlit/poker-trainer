// ============================================================
// POKER TRAINER — Premium Audio Engine
// Realistic casino SFX + procedural lofi background music
// All generated via Web Audio API — zero external files needed
// ============================================================

let ctx = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 1.0;
    masterGain.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = parseFloat(localStorage.getItem('poker_sfx_vol') || '0.7');
    sfxGain.connect(masterGain);
    musicGain = ctx.createGain();
    musicGain.gain.value = parseFloat(localStorage.getItem('poker_music_vol') || '0.25');
    musicGain.connect(masterGain);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ===== SETTINGS =====
let muted = localStorage.getItem('poker_muted') === '1';
export function isMuted() { return muted; }
export function toggleMute() {
  muted = !muted;
  localStorage.setItem('poker_muted', muted ? '1' : '0');
  if (muted) stopMusic();
  return muted;
}

export function getSfxVolume() { return parseFloat(localStorage.getItem('poker_sfx_vol') || '0.7'); }
export function setSfxVolume(v) {
  localStorage.setItem('poker_sfx_vol', v.toString());
  if (sfxGain) sfxGain.gain.value = v;
}

export function getMusicVolume() { return parseFloat(localStorage.getItem('poker_music_vol') || '0.25'); }
export function setMusicVolume(v) {
  localStorage.setItem('poker_music_vol', v.toString());
  if (musicGain) musicGain.gain.value = v;
}

// ===== CONVOLUTION REVERB =====
let reverbNode = null;
function getReverb() {
  if (reverbNode) return reverbNode;
  const c = getCtx();
  const len = c.sampleRate * 1.5;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
  }
  reverbNode = c.createConvolver();
  reverbNode.buffer = buf;
  return reverbNode;
}

function playSfx(fn) {
  if (muted) return;
  try { fn(getCtx(), sfxGain); } catch (e) { /* ignore */ }
}

// ============================================================
// REALISTIC SOUND EFFECTS
// Each sound uses layered synthesis: noise shaping, resonant
// filters, envelopes, and subtle reverb for realism
// ============================================================

// — Card deal: paper slide + table tap
export function playDeal() {
  playSfx((c, out) => {
    const t = c.currentTime;
    // Paper slide noise
    const noise = c.createBufferSource();
    const noiseBuf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1);
    noise.buffer = noiseBuf;
    const nf = c.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = 4000; nf.Q.value = 1.2;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.18, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    noise.connect(nf).connect(ng).connect(out);
    noise.start(t);

    // Table tap — low thud
    const osc = c.createOscillator();
    osc.frequency.setValueAtTime(180, t + 0.02);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.06);
    const og = c.createGain();
    og.gain.setValueAtTime(0.15, t + 0.02);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(og).connect(out);
    osc.start(t + 0.02);
    osc.stop(t + 0.1);

    // Subtle high click
    const click = c.createOscillator();
    click.frequency.setValueAtTime(3200, t);
    click.frequency.exponentialRampToValueAtTime(1200, t + 0.015);
    const cg = c.createGain();
    cg.gain.setValueAtTime(0.06, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    click.connect(cg).connect(out);
    click.start(t);
    click.stop(t + 0.03);
  });
}

// — Chip sounds: multiple ceramic clicks with slight timing offsets
export function playChips() {
  playSfx((c, out) => {
    const t = c.currentTime;
    const numChips = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numChips; i++) {
      const offset = i * (0.018 + Math.random() * 0.012);
      const freq = 2200 + Math.random() * 2000;

      // Ceramic click
      const osc = c.createOscillator();
      osc.frequency.setValueAtTime(freq, t + offset);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + offset + 0.025);
      const g = c.createGain();
      g.gain.setValueAtTime(0.07 + Math.random() * 0.04, t + offset);
      g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.04);

      // Add resonance
      const f = c.createBiquadFilter();
      f.type = 'peaking'; f.frequency.value = 3500; f.Q.value = 3; f.gain.value = 4;

      osc.connect(f).connect(g).connect(out);
      osc.start(t + offset);
      osc.stop(t + offset + 0.05);
    }

    // Soft ceramic rattle noise
    const rattle = c.createBufferSource();
    const rattleBuf = c.createBuffer(1, c.sampleRate * 0.12, c.sampleRate);
    const rd = rattleBuf.getChannelData(0);
    for (let i = 0; i < rd.length; i++) rd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rd.length, 3);
    rattle.buffer = rattleBuf;
    const rf = c.createBiquadFilter();
    rf.type = 'bandpass'; rf.frequency.value = 5000; rf.Q.value = 2;
    const rg = c.createGain();
    rg.gain.setValueAtTime(0.06, t);
    rg.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    rattle.connect(rf).connect(rg).connect(out);
    rattle.start(t);
  });
}

// — Fold: soft card toss / whoosh
export function playFold() {
  playSfx((c, out) => {
    const t = c.currentTime;
    const noise = c.createBufferSource();
    const buf = c.createBuffer(1, c.sampleRate * 0.2, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    noise.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 800;
    f.frequency.linearRampToValueAtTime(300, t + 0.15);
    f.Q.value = 0.7;
    const g = c.createGain();
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    noise.connect(f).connect(g).connect(out);
    noise.start(t);
  });
}

// — Check: light double-tap (knocking on table)
export function playCheck() {
  playSfx((c, out) => {
    const t = c.currentTime;
    for (let i = 0; i < 2; i++) {
      const offset = i * 0.07;
      const osc = c.createOscillator();
      osc.frequency.setValueAtTime(220, t + offset);
      osc.frequency.exponentialRampToValueAtTime(80, t + offset + 0.03);
      const g = c.createGain();
      g.gain.setValueAtTime(0.12, t + offset);
      g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.05);
      osc.connect(g).connect(out);
      osc.start(t + offset);
      osc.stop(t + offset + 0.06);
    }
  });
}

// — Win: elegant ascending chime with harmonics and reverb
export function playWin() {
  playSfx((c, out) => {
    const t = c.currentTime;
    const notes = [523, 659, 784, 1047, 1319]; // C5 E5 G5 C6 E6
    const reverb = getReverb();
    const wetGain = c.createGain();
    wetGain.gain.value = 0.3;
    reverb.connect(wetGain).connect(out);

    notes.forEach((freq, i) => {
      const delay = i * 0.1;
      // Fundamental
      const osc = c.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + delay);
      const g = c.createGain();
      g.gain.setValueAtTime(0.12, t + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.6);
      osc.connect(g);
      g.connect(out);
      g.connect(reverb);
      osc.start(t + delay);
      osc.stop(t + delay + 0.65);

      // Harmonic shimmer
      const h = c.createOscillator();
      h.type = 'sine';
      h.frequency.setValueAtTime(freq * 2, t + delay);
      const hg = c.createGain();
      hg.gain.setValueAtTime(0.04, t + delay);
      hg.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.4);
      h.connect(hg).connect(out);
      h.start(t + delay);
      h.stop(t + delay + 0.45);
    });

    // Sparkle noise at the end
    const sparkle = c.createBufferSource();
    const sBuf = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate);
    const sd = sBuf.getChannelData(0);
    for (let i = 0; i < sd.length; i++) sd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sd.length, 4);
    sparkle.buffer = sBuf;
    const sf = c.createBiquadFilter();
    sf.type = 'highpass'; sf.frequency.value = 6000;
    const sg = c.createGain();
    sg.gain.setValueAtTime(0.05, t + 0.3);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    sparkle.connect(sf).connect(sg).connect(out);
    sparkle.start(t + 0.3);
  });
}

// — Lose: muted descending tone
export function playLose() {
  playSfx((c, out) => {
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.4);
    const g = c.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.linearRampToValueAtTime(0, t + 0.5);
    const f = c.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 800;
    osc.connect(f).connect(g).connect(out);
    osc.start(t);
    osc.stop(t + 0.55);
  });
}

// — All-in: dramatic rising sweep with sub-bass
export function playAllIn() {
  playSfx((c, out) => {
    const t = c.currentTime;
    // Rising sweep
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.35);
    // Detuned layer for thickness
    const osc2 = c.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(102, t);
    osc2.frequency.exponentialRampToValueAtTime(604, t + 0.35);
    const g = c.createGain();
    g.gain.setValueAtTime(0.06, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    // Filter sweep
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(4000, t + 0.3);
    f.Q.value = 3;
    osc.connect(f);
    osc2.connect(f);
    f.connect(g).connect(out);
    osc.start(t); osc2.start(t);
    osc.stop(t + 0.55); osc2.stop(t + 0.55);

    // Impact hit at the peak
    const impact = c.createOscillator();
    impact.frequency.setValueAtTime(80, t + 0.3);
    impact.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    const ig = c.createGain();
    ig.gain.setValueAtTime(0.15, t + 0.3);
    ig.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    impact.connect(ig).connect(out);
    impact.start(t + 0.3);
    impact.stop(t + 0.6);
  });
}

// — Your turn: gentle attention chime (two-note bell)
export function playTurn() {
  playSfx((c, out) => {
    const t = c.currentTime;
    [880, 1100].forEach((freq, i) => {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      const g = c.createGain();
      g.gain.setValueAtTime(0.1, t + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);
      osc.connect(g).connect(out);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.3);
    });
  });
}

export function playSoundForAction(type) {
  switch (type) {
    case 'fold': playFold(); break;
    case 'check': playCheck(); break;
    case 'call': playChips(); break;
    case 'raise': playChips(); break;
    case 'allin': playAllIn(); break;
  }
}

// ============================================================
// PROCEDURAL LOFI BACKGROUND MUSIC
// Jazz-influenced chord progression with soft piano, bass,
// and vinyl crackle — all generated in real-time
// ============================================================

let musicPlaying = false;
let musicNodes = [];

// Jazz chord voicings (frequencies in Hz)
const CHORDS = [
  [261.6, 329.6, 392, 493.9],   // Cmaj7
  [293.7, 370, 440, 554.4],     // Dm7
  [329.6, 415.3, 493.9, 587.3], // Em7
  [349.2, 440, 523.3, 659.3],   // Fmaj7
  [392, 493.9, 587.3, 740],     // G7
  [440, 523.3, 659.3, 830.6],   // Am7
  [261.6, 311.1, 392, 466.2],   // Cm7 (minor flavor)
  [349.2, 415.3, 523.3, 622.3], // Fm7
];

export function startMusic() {
  if (musicPlaying || muted) return;
  const c = getCtx();
  musicPlaying = true;

  // Vinyl crackle — continuous filtered noise
  const crackleNoise = c.createBufferSource();
  const crackleBuf = c.createBuffer(1, c.sampleRate * 8, c.sampleRate);
  const cd = crackleBuf.getChannelData(0);
  for (let i = 0; i < cd.length; i++) {
    cd[i] = Math.random() > 0.997 ? (Math.random() * 2 - 1) * 0.3 : (Math.random() * 2 - 1) * 0.005;
  }
  crackleNoise.buffer = crackleBuf;
  crackleNoise.loop = true;
  const crackleFilter = c.createBiquadFilter();
  crackleFilter.type = 'highpass'; crackleFilter.frequency.value = 2000;
  const crackleGain = c.createGain();
  crackleGain.gain.value = 0.15;
  crackleNoise.connect(crackleFilter).connect(crackleGain).connect(musicGain);
  crackleNoise.start();
  musicNodes.push(crackleNoise);

  // Chord pad — evolving warm pad
  let chordIdx = 0;
  function playNextChord() {
    if (!musicPlaying) return;
    const chord = CHORDS[chordIdx % CHORDS.length];
    chordIdx++;
    const t = c.currentTime;

    chord.forEach((freq, i) => {
      // Soft sine pad
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 0.5, t); // octave down for warmth
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.03, t + 0.5);
      g.gain.setValueAtTime(0.03, t + 3);
      g.gain.linearRampToValueAtTime(0, t + 3.8);
      // Slight detuned layer
      const osc2 = c.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 0.5 * 1.003, t);
      const g2 = c.createGain();
      g2.gain.setValueAtTime(0, t);
      g2.gain.linearRampToValueAtTime(0.015, t + 0.5);
      g2.gain.setValueAtTime(0.015, t + 3);
      g2.gain.linearRampToValueAtTime(0, t + 3.8);

      const f = c.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 600;
      osc.connect(f); osc2.connect(f);
      f.connect(g).connect(musicGain);
      osc2.connect(g2).connect(musicGain);
      osc.start(t); osc2.start(t);
      osc.stop(t + 4); osc2.stop(t + 4);
    });

    // Soft "piano" hits — triangle wave with fast decay
    chord.forEach((freq, i) => {
      const delay = i * 0.06;
      const osc = c.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + delay);
      const g = c.createGain();
      g.gain.setValueAtTime(0.05, t + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + 1.2);
      const f = c.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 2000;
      f.frequency.exponentialRampToValueAtTime(400, t + delay + 1);
      osc.connect(f).connect(g).connect(musicGain);
      osc.start(t + delay);
      osc.stop(t + delay + 1.5);
    });

    // Sub bass note (root, octave down)
    const bass = c.createOscillator();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(chord[0] * 0.25, t);
    const bg = c.createGain();
    bg.gain.setValueAtTime(0.06, t);
    bg.gain.setValueAtTime(0.06, t + 3);
    bg.gain.linearRampToValueAtTime(0, t + 3.8);
    bass.connect(bg).connect(musicGain);
    bass.start(t);
    bass.stop(t + 4);

    // Schedule next chord
    if (musicPlaying) {
      const nextTime = 4000 + Math.random() * 500;
      const timerId = setTimeout(playNextChord, nextTime);
      musicNodes.push({ stop: () => clearTimeout(timerId) });
    }
  }

  playNextChord();
}

export function stopMusic() {
  musicPlaying = false;
  musicNodes.forEach(n => {
    try { n.stop ? n.stop() : null; } catch (e) { /* already stopped */ }
  });
  musicNodes = [];
}

export function isMusicPlaying() { return musicPlaying; }

export function toggleMusic() {
  if (musicPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
  return musicPlaying;
}
