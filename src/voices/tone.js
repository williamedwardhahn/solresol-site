import { note } from '../dictionary/notes.js';
import { schedule } from '../compose/sentence.model.js';
import { INSTRUMENT_IDS, DEFAULT_INSTRUMENT, instrumentFor, noteShape } from './instruments.model.js';

// The Tone voice — a note as a sound.
//
// The only voice you hear rather than see. One shared audio context; each
// note is built from its instrument's recipe (instruments.model.js) and
// played into a small room and a gentle limiter, so words sound like an
// instrument in a hall rather than a test tone. A word plays as its notes
// in sequence.

let audioCtx;
const audio = () => {
  audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state !== 'running') audioCtx.resume().catch(() => {});
  return audioCtx;
};

// Phones only let a page make sound once a person has touched it, and
// iPhones also mute web audio when the ring/silent switch is on unless the
// page says it is playing media. So on every touch or key we (1) mark the
// audio as playback, which plays through the silent switch on iOS 17+, or
// on older iOS start a looping silent <audio> that does the same;
// (2) create and resume the context inside the gesture; (3) play one silent
// frame, which is what actually unlocks older Safari. It repeats on every
// gesture because iOS suspends audio again after a call or a trip away.
const SILENT_WAV = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
let silentTag = null;
export function unlockAudio() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* not every Safari */ }
  if (!navigator.audioSession && !silentTag && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
    silentTag = new Audio(SILENT_WAV);
    silentTag.loop = true;
    silentTag.setAttribute('playsinline', '');
    silentTag.volume = 0.01;
  }
  silentTag?.play().catch(() => {});
  const ac = audio();
  if (!unlockAudio.primed) {
    const src = ac.createBufferSource();
    src.buffer = ac.createBuffer(1, 1, 22050);
    src.connect(ac.destination);
    src.start(0);
    unlockAudio.primed = true;
  }
}
if (typeof window !== 'undefined') {
  for (const ev of ['pointerdown', 'touchend', 'keydown']) window.addEventListener(ev, unlockAudio, { capture: true, passive: true });
  // coming back to the page: wake the context (it may have been interrupted)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && audioCtx && audioCtx.state !== 'running') audioCtx.resume().catch(() => {});
    if (document.visibilityState === 'hidden') silentTag?.pause();
  });
}

// The instrument being played (celesta, flute, reed, bowed, organ).
let timbre = DEFAULT_INSTRUMENT;
export const TIMBRES = INSTRUMENT_IDS;
export function setTimbre(t) { if (TIMBRES.includes(t)) timbre = t; }

// The hall every note is played into: a dry path and a short generated
// reverb, both through a soft limiter so chords and fast words never clip.
let bus = null;
function hall(ac) {
  if (bus) return bus;
  const input = ac.createGain();
  const limiter = ac.createDynamicsCompressor();
  limiter.threshold.value = -16; limiter.knee.value = 12; limiter.ratio.value = 4;
  limiter.attack.value = 0.004; limiter.release.value = 0.22;
  const out = ac.createGain(); out.gain.value = 0.9;
  const room = ac.createConvolver(); room.buffer = roomImpulse(ac, 1.9, 3.2);
  const wet = ac.createGain(); wet.gain.value = 0.22;
  input.connect(limiter); input.connect(room); room.connect(wet).connect(limiter);
  limiter.connect(out).connect(ac.destination);
  bus = { input, noise: noiseBuffer(ac) };
  return bus;
}

// A room, as decaying noise: a little early bloom, then a smooth tail.
function roomImpulse(ac, seconds, decay) {
  const len = Math.floor(ac.sampleRate * seconds), buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const x = i / len;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - x, decay) * Math.min(1, i / (ac.sampleRate * 0.012));
    }
  }
  return buf;
}
function noiseBuffer(ac) {
  const len = Math.floor(ac.sampleRate * 0.3), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// `octave` shifts the note (−1 = an octave down), so a lesson can sing in the learner's own range.
export function playNote(name, when = 0, dur = 0.5, { octave = 0 } = {}) {
  const ac = audio(), nt = note(name);
  if (!nt) return;
  const { input, noise } = hall(ac);
  const inst = instrumentFor(timbre);
  const shape = noteShape(inst, nt.step, dur);
  const t = ac.currentTime + 0.01 + when, f = nt.freq * Math.pow(2, octave);

  // the envelope
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(shape.gain, t + shape.attack);
  if (inst.struck) {
    amp.gain.exponentialRampToValueAtTime(0.0001, t + shape.end);
  } else {
    amp.gain.setTargetAtTime(shape.gain * inst.sustain, t + shape.attack, 0.08);
    amp.gain.setValueAtTime(shape.gain * inst.sustain, t + shape.hold);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + shape.end);
  }

  // the tone colour
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = inst.q || 0.5;
  lp.frequency.value = Math.min(16000, inst.filter + f * (inst.filterTrack || 0));
  lp.connect(amp).connect(input);

  // a vibrato that arrives once the note has settled
  let lfo = null, depth = null;
  if (inst.vibrato) {
    lfo = ac.createOscillator(); lfo.frequency.value = inst.vibrato.rate;
    depth = ac.createGain();
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(inst.vibrato.cents, t + inst.vibrato.delay + 0.25);
    lfo.connect(depth);
    lfo.start(t); lfo.stop(t + shape.end + 0.05);
  }

  // the partials; a struck partial dies away at its own pace
  for (const pt of inst.partials) {
    const osc = ac.createOscillator();
    osc.type = pt.type;
    osc.frequency.value = f * pt.ratio;
    if (pt.detune) osc.detune.value = pt.detune;
    if (depth) depth.connect(osc.detune);
    const g = ac.createGain();
    g.gain.setValueAtTime(pt.gain, t);
    if (pt.decay) g.gain.exponentialRampToValueAtTime(Math.max(0.0001, pt.gain * 0.001), t + pt.decay);
    osc.connect(g).connect(lp);
    osc.start(t); osc.stop(t + shape.end + 0.05);
  }

  // a breath of air at the start of a blown note
  if (inst.breath) {
    const src = ac.createBufferSource(); src.buffer = noise;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2.5; bp.Q.value = 1.4;
    const bg = ac.createGain();
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.exponentialRampToValueAtTime(inst.breath, t + 0.02);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    src.connect(bp).connect(bg).connect(input);
    src.start(t); src.stop(t + 0.2);
  }
}

export function playWord(word, gap = 0.32, when = 0) {
  word.notes.forEach((n, i) => playNote(n, when + i * gap));
}

// A sentence is a melody: each word, in turn, with a breath between.
// The timing comes from the pure, tested `schedule`.
export function playSentence(words, wordGap = 0.28, breath = 0.35) {
  const offsets = schedule(words.map((w) => w.notes.length), wordGap, breath);
  words.forEach((w, i) => playWord(w, wordGap, offsets[i]));
  return offsets.length
    ? offsets[offsets.length - 1] + words[words.length - 1].notes.length * wordGap
    : 0;
}

export const tone = { name: 'tone', label: 'Tone', playNote, playWord, playSentence };
