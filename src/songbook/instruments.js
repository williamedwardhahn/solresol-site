import { unlockAudio } from '../voices/tone.js?v=c115d42191';
import { frequency } from './songs.js?v=c115d42191';

// The songbook's band — one small recipe per instrument.
//
// Every instrument is the same machine with different settings: a few
// oscillators (or a custom harmonic spectrum), a filter, an envelope,
// vibrato, and optionally a puff of breath noise. A note is a voice that
// sounds until it is released, so a key held down sustains; songs release
// each voice on schedule. Plucked and struck instruments (harp, piano,
// chimes…) decay on their own even while held, as the real ones do.

// osc: [type or partial amplitudes, gain, frequency multiple, detune cents]
// env: attack, decay, sustain level, release (seconds); pluck = decays while held
export const INSTRUMENTS = {
  chimes:    { label: 'Chimes',      osc: [['sine', 1, 1], ['sine', .45, 2.76], ['sine', .25, 5.4]], env: [.002, 1.8, 0, 1.6], pluck: true },
  lamb:      { label: 'Lamb',        osc: [['sawtooth', 1, 1]], filter: ['bandpass', 900, 1.4], env: [.04, .2, .8, .15], vib: [7, 22, .05] },
  trombone:  { label: 'Trombone',    osc: [['sawtooth', 1, 1]], filter: ['lowpass', 1100, 1.5], env: [.06, .2, .85, .12], octave: -1, vib: [5, 4, .3] },
  clarinet:  { label: 'Clarinet',    osc: [[[1, 0, .5, 0, .3, 0, .18, 0, .1], 1, 1]], filter: ['lowpass', 2400, .7], env: [.03, .1, .9, .1] },
  saxophone: { label: 'Saxophone',   osc: [['sawtooth', 1, 1]], filter: ['bandpass', 1300, .9], env: [.03, .15, .85, .12], vib: [5.5, 7, .2], noise: .04 },
  panpipe:   { label: 'Panpipe',     osc: [['sine', 1, 1], ['sine', .12, 2]], env: [.05, .1, .85, .25], vib: [5, 3, .25], noise: .1 },
  duck:      { label: 'Duck',        osc: [['square', 1, 1]], filter: ['bandpass', 1100, 4], env: [.01, .12, .55, .08], bend: -0.25 },
  harp:      { label: 'Harp',        osc: [['triangle', 1, 1], ['sine', .3, 2]], env: [.002, 1.2, 0, .8], pluck: true },
  kazoo:     { label: 'Kazoo',       osc: [['sawtooth', 1, 1], ['square', .4, 1, 8]], filter: ['bandpass', 1500, 2.5], env: [.02, .1, .9, .08], vib: [6, 10, .1] },
  horn:      { label: 'French Horn', osc: [['triangle', 1, 1], ['sawtooth', .35, 1]], filter: ['lowpass', 900, .8], env: [.08, .2, .85, .2], vib: [4.5, 3, .4] },
  tuba:      { label: 'Tuba',        osc: [['sawtooth', 1, 1]], filter: ['lowpass', 600, 1], env: [.05, .2, .8, .12], octave: -1 },
  glass:     { label: 'Glass',       osc: [['sine', 1, 1], ['sine', .2, 2], ['sine', .08, 3]], env: [.12, .3, .8, .9], vib: [3, 2, .4] },
  flute:     { label: 'Flute',       osc: [['sine', 1, 1], ['sine', .15, 2]], env: [.05, .1, .85, .15], vib: [5, 5, .25], noise: .06 },
  trumpet:   { label: 'Trumpet',     osc: [['sawtooth', 1, 1]], filter: ['lowpass', 2600, 1.2], env: [.03, .15, .85, .1], vib: [5.5, 4, .3] },
  cello:     { label: 'Cello',       osc: [['sawtooth', 1, 1, -4], ['sawtooth', .6, 1, 5]], filter: ['lowpass', 1400, .8], env: [.09, .2, .85, .25], octave: -1, vib: [5.5, 10, .2] },
  harmonica: { label: 'Harmonica',   osc: [['square', .6, 1], ['sawtooth', .6, 1, 6]], filter: ['bandpass', 1800, 1.2], env: [.04, .1, .85, .1], trem: [6, .25] },
  oboe:      { label: 'Oboe',        osc: [[[1, .9, .8, .7, .5, .4, .3, .2], 1, 1]], filter: ['bandpass', 1400, 1.6], env: [.04, .1, .85, .1], vib: [5, 6, .3] },
  strings:   { label: 'Strings',     osc: [['sawtooth', .7, 1, -7], ['sawtooth', .7, 1, 7], ['sawtooth', .4, 2]], filter: ['lowpass', 2200, .7], env: [.18, .3, .85, .45], vib: [5, 6, .3] },
  bassoon:   { label: 'Bassoon',     osc: [['sawtooth', 1, 1]], filter: ['lowpass', 750, 2], env: [.04, .1, .85, .1], octave: -1 },
  bass:      { label: 'Bass',        osc: [['triangle', 1, 1], ['sine', .5, 2]], env: [.005, .9, 0, .3], octave: -1, pluck: true },
  violin:    { label: 'Violin',      osc: [['sawtooth', 1, 1]], filter: ['lowpass', 3200, .8], env: [.07, .2, .85, .25], vib: [6, 12, .2] },
  piano:     { label: 'Piano',       osc: [['triangle', 1, 1], ['sine', .5, 2], ['sine', .15, 3]], env: [.003, 1.6, 0, .4], pluck: true },
  marimba:   { label: 'Marimba',     osc: [['sine', 1, 1], ['sine', .25, 3.9]], env: [.002, .5, 0, .3], pluck: true },
};

let ac, out;
function context() {
  if (ac) { if (ac.state !== 'running') ac.resume().catch(() => {}); return ac; }
  unlockAudio();
  ac = new (window.AudioContext || window.webkitAudioContext)();
  const limiter = ac.createDynamicsCompressor();
  limiter.threshold.value = -14; limiter.ratio.value = 6;
  limiter.connect(ac.destination);
  const len = Math.floor(ac.sampleRate * 1.2);
  const ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  const room = ac.createConvolver(); room.buffer = ir;
  const wet = ac.createGain(); wet.gain.value = 0.22;
  out = ac.createGain(); out.gain.value = 0.8;
  out.connect(limiter); out.connect(room); room.connect(wet); wet.connect(limiter);
  return ac;
}

const waves = new Map();
function periodic(a, amps) {
  const key = amps.join();
  if (!waves.has(key)) {
    const real = new Float32Array(amps.length + 1), imag = new Float32Array(amps.length + 1);
    amps.forEach((v, i) => { imag[i + 1] = v; });
    waves.set(key, a.createPeriodicWave(real, imag));
  }
  return waves.get(key);
}

let noiseBuf;
const live = new Set();

// Start a note now (or `when` seconds from now). Returns { release(after) }.
// sustain: how long the sound rings after release (the pedal).
export function start(instrument, midi, { when = 0, sustain = 0 } = {}) {
  const a = context();
  const r = INSTRUMENTS[instrument] || INSTRUMENTS.piano;
  const t = a.currentTime + 0.01 + when;
  const f = frequency(midi + 12 * (r.octave || 0));
  const [att, dec, sus, rel] = r.env;
  const peak = 0.26;

  const env = a.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + att);
  if (r.pluck) env.gain.setTargetAtTime(0.0001, t + att, dec / 3);
  else env.gain.setTargetAtTime(peak * sus, t + att, dec / 3);

  let head = env;
  if (r.filter) {
    const flt = a.createBiquadFilter();
    [flt.type, flt.frequency.value, flt.Q.value] = r.filter;
    flt.connect(env); head = flt;
  }
  if (r.trem) {
    const trem = a.createGain(); trem.gain.value = 1 - r.trem[1];
    const lfo = a.createOscillator(); lfo.frequency.value = r.trem[0];
    const g = a.createGain(); g.gain.value = r.trem[1];
    lfo.connect(g); g.connect(trem.gain); trem.connect(head); head = trem;
    lfo.start(t); nodes(lfo);
  }
  env.connect(out);

  const oscs = [];
  for (const [type, gain, mult, detune = 0] of r.osc) {
    const o = a.createOscillator();
    if (Array.isArray(type)) o.setPeriodicWave(periodic(a, type)); else o.type = type;
    o.frequency.value = f * mult;
    o.detune.value = detune;
    if (r.bend) { o.frequency.setValueAtTime(f * mult * (1 - r.bend), t); o.frequency.exponentialRampToValueAtTime(f * mult, t + 0.08); }
    const g = a.createGain(); g.gain.value = gain / r.osc.length ** 0.5;
    o.connect(g); g.connect(head);
    oscs.push(o);
  }
  if (r.vib) {
    const [rate, cents, delay] = r.vib;
    const lfo = a.createOscillator(); lfo.frequency.value = rate;
    const depth = a.createGain();
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(cents, t + delay + 0.2);
    lfo.connect(depth);
    for (const o of oscs) depth.connect(o.detune);
    oscs.push(lfo);
  }
  if (r.noise) {
    noiseBuf ||= (() => {
      const b = a.createBuffer(1, a.sampleRate, a.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return b;
    })();
    const n = a.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    const band = a.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = f * 2; band.Q.value = 2;
    const g = a.createGain();
    g.gain.setValueAtTime(r.noise * 2.5, t);
    g.gain.setTargetAtTime(r.noise * 0.5, t + 0.04, 0.05);
    n.connect(band); band.connect(g); g.connect(env);
    oscs.push(n);
  }
  oscs.forEach((o) => o.start(t));
  nodes(...oscs);

  let released = false;
  return {
    // let go `after` seconds from now; the tone fades over its release time,
    // longer with the pedal
    release(after = 0) {
      if (released) return; released = true;
      const at = Math.max(a.currentTime, t + att) + after;
      const tail = rel + sustain;
      if (env.gain.cancelAndHoldAtTime) env.gain.cancelAndHoldAtTime(at);
      else env.gain.cancelScheduledValues(at);
      env.gain.setTargetAtTime(0, at, tail / 4);
      oscs.forEach((o) => { try { o.stop(at + tail + 0.1); } catch { /* already stopped */ } });
    },
  };
}

function nodes(...ns) { for (const n of ns) { live.add(n); n.addEventListener?.('ended', () => live.delete(n)); } }

// A note of fixed length — what a song plays.
export function play(instrument, midi, when, dur) {
  const v = start(instrument, midi, { when });
  v.release(dur);
  return v;
}

export function stopAll() {
  for (const n of live) { try { n.stop(); } catch { /* already stopped */ } }
  live.clear();
}
