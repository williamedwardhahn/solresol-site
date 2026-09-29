import { note } from '../dictionary/notes.js';
import { schedule } from '../compose/sentence.model.js';

// The Tone voice — a note as a sound.
//
// The only voice you hear rather than see. One shared audio context,
// one gentle envelope. A word plays as its notes in sequence.

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

// The instrument's colour of sound — sine, triangle, sawtooth or square.
let timbre = 'triangle';
export const TIMBRES = ['sine', 'triangle', 'sawtooth', 'square'];
export function setTimbre(t) { if (TIMBRES.includes(t)) timbre = t; }

export function playNote(name, when = 0, dur = 0.5) {
  const ac = audio();
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = timbre;
  osc.frequency.value = note(name).freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(timbre === 'sine' ? 0.28 : timbre === 'triangle' ? 0.24 : 0.09, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
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
