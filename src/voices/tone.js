import { note } from '../dictionary/notes.js';
import { schedule } from '../compose/sentence.model.js';

// The Tone voice — a note as a sound.
//
// The only voice you hear rather than see. One shared audio context,
// one gentle envelope. A word plays as its notes in sequence.

let audioCtx;
const audio = () => (audioCtx ||= new (window.AudioContext || window.webkitAudioContext)());

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
