// The seven notes — the atoms of Solresol.
//
// This is the one place their facts live: name, number, colour, pitch,
// braille dots, and staff step. Colours follow the canonical rainbow
// (do = red … si = violet). See docs/SOLRESOL_MASTER.md.

export const NOTES = [
  { name: 'do',  num: 1, color: '#e63946', freq: 261.63, braille: '⠁', step: 0 },
  { name: 're',  num: 2, color: '#f3722c', freq: 293.66, braille: '⠂', step: 1 },
  { name: 'mi',  num: 3, color: '#f9c74f', freq: 329.63, braille: '⠃', step: 2 },
  { name: 'fa',  num: 4, color: '#43aa8b', freq: 349.23, braille: '⠄', step: 3 },
  { name: 'sol', num: 5, color: '#277da1', freq: 392.00, braille: '⠅', step: 4 },
  { name: 'la',  num: 6, color: '#4d5198', freq: 440.00, braille: '⠆', step: 5 },
  { name: 'si',  num: 7, color: '#7b2cbf', freq: 493.88, braille: '⠇', step: 6 },
];

const BY_NAME = new Map(NOTES.map(n => [n.name, n]));
const BY_NUM  = new Map(NOTES.map(n => [n.num, n]));

export const NOTE_NAMES = NOTES.map(n => n.name);

export const note         = (name) => BY_NAME.get(String(name).toLowerCase()) || null;
export const noteByNumber = (num)  => BY_NUM.get(Number(num)) || null;
export const isNote       = (name) => BY_NAME.has(String(name).toLowerCase());

// Read a written word back into its notes: "Domisol" → ['do','mi','sol'].
export const parse = (text) =>
  String(text).toLowerCase().match(/do|re|mi|fa|sol|la|si/g) || [];

// Capitalize the first letter — the canonical way to show a syllable.
export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// The ear, part one: a heard pitch → the nearest note. Used by tone-in.
export function nearestByFrequency(freq) {
  if (!freq || freq <= 0) return null;
  let best = NOTES[0], bestDist = Infinity;
  for (const n of NOTES) {
    const dist = Math.abs(Math.log2(freq / n.freq));   // distance in octaves
    if (dist < bestDist) { bestDist = dist; best = n; }
  }
  return best.name;
}

// The ear, part two: a MIDI key → a note. White keys map straight through
// (C→do … B→si); black keys snap down to the nearest white key.
const WHITE = [0, 2, 4, 5, 7, 9, 11];               // semitone of do..si within an octave
export function noteFromMidi(midi) {
  const pc = ((midi % 12) + 12) % 12;
  let idx = WHITE.indexOf(pc);
  if (idx === -1) idx = WHITE.indexOf(pc - 1);       // snap a black key down
  return idx === -1 ? null : NOTES[idx].name;
}
