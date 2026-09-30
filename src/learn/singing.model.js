import { NOTES } from '../dictionary/notes.js';

// The singing lesson — pure parts: hear a pitch, read it as a note in any
// voice's octave, and judge whether a note has been held in tune.
//
// Voices differ by an octave or more, so a sung note is read by its place
// in the octave (do = C … si = B), wherever the octave is. No DOM, no
// Web Audio: every piece here is tested with synthetic voices.

// ── hearing ──────────────────────────────────────────────────────────
// A YIN-style detector (de Cheveigné & Kawahara, 2002), limited to the
// range of a singing voice so it is cheap enough for a phone at 30 fps.
export function detectPitch(buf, sampleRate, { min = 70, max = 1050, threshold = 0.15 } = {}) {
  const n = buf.length;
  let energy = 0;
  for (let i = 0; i < n; i++) energy += buf[i] * buf[i];
  if (Math.sqrt(energy / n) < 0.008) return null;                 // silence

  const minLag = Math.max(2, Math.floor(sampleRate / max));
  const maxLag = Math.min(Math.floor(n / 2), Math.ceil(sampleRate / min));
  const W = n - maxLag;
  const d = new Float32Array(maxLag + 2);
  for (let lag = 1; lag <= maxLag + 1; lag++) {
    let sum = 0;
    for (let i = 0; i < W; i++) { const x = buf[i] - buf[i + lag]; sum += x * x; }
    d[lag] = sum;
  }
  // cumulative mean normalised difference
  let running = 0;
  const cmnd = new Float32Array(maxLag + 2);
  cmnd[0] = 1;
  for (let lag = 1; lag <= maxLag + 1; lag++) {
    running += d[lag];
    cmnd[lag] = running ? (d[lag] * lag) / running : 1;
  }
  // the first dip under the threshold, walked down to its floor
  let tau = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (cmnd[lag] < threshold) {
      while (lag + 1 <= maxLag && cmnd[lag + 1] < cmnd[lag]) lag++;
      tau = lag; break;
    }
  }
  if (tau < 0) return null;                                       // no clear pitch (noise, breath)
  // parabolic interpolation for sub-sample accuracy
  const a = cmnd[tau - 1], b = cmnd[tau], c = cmnd[tau + 1];
  const den = a + c - 2 * b;
  const shift = den ? (a - c) / (2 * den) : 0;
  return sampleRate / (tau + Math.max(-1, Math.min(1, shift)));
}

// ── reading a pitch as a note ────────────────────────────────────────
const SEMITONE = [0, 2, 4, 5, 7, 9, 11];                          // do re mi fa sol la si above C
const C4 = 261.6256;

// freq → { note, cents, octave, midi }: the nearest of the seven notes in
// whatever octave it was sung, how far off (−50…+50 cents, more between
// mi–fa / si–do), and which octave (0 = the middle C octave).
export function hear(freq) {
  if (!freq || freq <= 0) return null;
  const st = 12 * Math.log2(freq / C4);                            // semitones above middle C
  const octave = Math.floor(st / 12);
  let within = st - octave * 12;                                   // 0 … 12
  let best = 0, bestDiff = Infinity;
  for (let i = 0; i < 8; i++) {                                   // 8th = the do above
    const diff = within - (i < 7 ? SEMITONE[i] : 12);
    if (Math.abs(diff) < Math.abs(bestDiff)) { bestDiff = diff; best = i; }
  }
  const up = best === 7;                                           // nearer the next octave's do
  return {
    note: NOTES[up ? 0 : best].name,
    cents: Math.round(bestDiff * 100),
    octave: octave + (up ? 1 : 0),
    midi: 60 + st,
  };
}

// The height of a sung pitch on the seven-rung ladder, relative to a
// reference octave: do = 0 … si = 6, 7 = the do above, fractions between.
export function ladderPosition(freq, refOctave = 0) {
  const st = 12 * Math.log2(freq / C4) - refOctave * 12;
  const table = [...SEMITONE, 12];
  const oct = Math.floor(st / 12), w = st - oct * 12;
  let i = 0;
  while (i < 7 && w > table[i + 1]) i++;
  const span = table[i + 1] - table[i];
  return oct * 7 + i + (w - table[i]) / span;
}

// The frequency of a note in a given octave (0 = middle C octave).
export const freqOf = (name, octave = 0) =>
  (NOTES.find((n) => n.name === name)?.freq || C4) * Math.pow(2, octave);

// ── smoothing ────────────────────────────────────────────────────────
// A voice wobbles; the tuner should not. The median of the last few
// readings throws away a stray octave jump or a consonant's noise.
export function smoother(size = 5) {
  const xs = [];
  return (x) => {
    if (x == null) { xs.length = 0; return null; }
    xs.push(x); if (xs.length > size) xs.shift();
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
}

// ── the lesson ───────────────────────────────────────────────────────
// A lesson is a list of target notes to sing in order. Feed it what was
// heard each frame; a target is sung once it has been held in tune for
// `hold` seconds (a slip resets the hold, silence only pauses it).
export function lesson(targets, { tolerance = 35, hold = 0.7 } = {}) {
  let index = 0, held = 0, best = Infinity;
  const self = {
    get index() { return index; },
    get target() { return targets[index] || null; },
    get done() { return index >= targets.length; },
    get progress() { return Math.min(1, held / hold); },
    get best() { return best; },
    // reading: null (silence) or { note, cents }; dt in seconds.
    // Returns 'silent' | 'wrong' | 'flat' | 'sharp' | 'holding' | 'sung' | 'done'.
    feed(reading, dt) {
      if (self.done) return 'done';
      if (!reading) return 'silent';
      if (reading.note !== self.target) { held = Math.max(0, held - dt * 2); return 'wrong'; }
      const off = Math.abs(reading.cents);
      if (off > tolerance) { held = Math.max(0, held - dt); return reading.cents < 0 ? 'flat' : 'sharp'; }
      held += dt; best = Math.min(best, off);
      if (held >= hold) {
        index++; held = 0;
        return self.done ? 'done' : 'sung';
      }
      return 'holding';
    },
    reset() { index = 0; held = 0; best = Infinity; },
  };
  return self;
}

// How well it went, from how close the best moments came (in cents).
export function grade(bestCents) {
  if (bestCents <= 8) return { stars: 3, word: 'dead in tune' };
  if (bestCents <= 18) return { stars: 2, word: 'sweetly in tune' };
  return { stars: 1, word: 'in tune' };
}
