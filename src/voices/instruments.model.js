// The instruments — how each voice of the instrument is built, as data.
//
// A note is a few partials (oscillators at multiples of its pitch), a
// filter, an envelope, perhaps a vibrato and a breath of noise. Keeping
// the recipes here, apart from Web Audio, means their shape is tested,
// and tone.js only has to wire them up.
//
// Ids stay the old timbre names so saved preferences keep working.

export const INSTRUMENTS = {
  bell: {        // a celesta: struck, bright, and dying away on its own
    label: 'Celesta',
    partials: [
      { ratio: 1,    type: 'sine', gain: 1,    decay: 1.6 },
      { ratio: 2,    type: 'sine', gain: 0.28, decay: 0.7 },
      { ratio: 3,    type: 'sine', gain: 0.12, decay: 0.35 },
      { ratio: 4.07, type: 'sine', gain: 0.06, decay: 0.18 },   // a touch inharmonic: the metal
    ],
    attack: 0.004, sustain: 0, release: 0.2, struck: true,
    filter: 6000, level: 0.44,
  },
  sine: {        // a flute: round, breathy, with a late vibrato
    label: 'Flute',
    partials: [
      { ratio: 1, type: 'sine', gain: 1 },
      { ratio: 2, type: 'sine', gain: 0.1 },
      { ratio: 3, type: 'sine', gain: 0.035 },
    ],
    attack: 0.05, sustain: 0.82, release: 0.28,
    vibrato: { rate: 5.2, cents: 7, delay: 0.16 },
    breath: 0.045, filter: 3200, level: 0.22,
  },
  triangle: {    // a reed: the hollow odd harmonics of a clarinet
    label: 'Reed',
    partials: [
      { ratio: 1, type: 'square',   gain: 0.55 },
      { ratio: 1, type: 'triangle', gain: 0.6, detune: 4 },
    ],
    attack: 0.035, sustain: 0.85, release: 0.2,
    vibrato: { rate: 4.8, cents: 4, delay: 0.2 },
    breath: 0.025, filter: 1500, filterTrack: 1.2, q: 0.9, level: 0.2,
  },
  sawtooth: {    // bowed strings: two bows a hair apart, slow to speak
    label: 'Bowed',
    partials: [
      { ratio: 1, type: 'sawtooth', gain: 0.5, detune: -6 },
      { ratio: 1, type: 'sawtooth', gain: 0.5, detune: 6 },
    ],
    attack: 0.09, sustain: 0.9, release: 0.38,
    vibrato: { rate: 5.6, cents: 11, delay: 0.12 },
    filter: 1900, filterTrack: 1.5, q: 0.6, level: 0.3,
  },
  square: {      // a pipe organ: drawbars of pure tone, steady, no vibrato
    label: 'Organ',
    partials: [
      { ratio: 1, type: 'sine', gain: 1 },
      { ratio: 2, type: 'sine', gain: 0.55 },
      { ratio: 3, type: 'sine', gain: 0.3 },
      { ratio: 4, type: 'sine', gain: 0.18 },
      { ratio: 6, type: 'sine', gain: 0.07 },
    ],
    attack: 0.014, sustain: 1, release: 0.1,
    filter: 5000, level: 0.145,
  },
};

export const INSTRUMENT_IDS = ['bell', 'sine', 'triangle', 'sawtooth', 'square'];
export const DEFAULT_INSTRUMENT = 'bell';

export const instrumentFor = (id) => INSTRUMENTS[id] || INSTRUMENTS[DEFAULT_INSTRUMENT];

// How loud and how long one note is. `step` is 0 (do) … 6 (si); `dur` is
// how long the note is held. Low notes sit a little louder (the ear hears
// them as quieter), and a struck instrument rings out whatever the hold.
export function noteShape(inst, step, dur) {
  const s = Math.max(0, Math.min(6, Number(step) || 0));
  const gain = inst.level * (1 + (6 - s) * 0.035);
  if (inst.struck) {
    const ring = Math.max(...inst.partials.map((p) => p.decay || 0)) * (1 + (6 - s) * 0.05);
    return { gain, attack: inst.attack, hold: 0, end: inst.attack + ring };
  }
  const hold = Math.max(dur, inst.attack + 0.05);
  return { gain, attack: inst.attack, hold, end: hold + inst.release };
}
