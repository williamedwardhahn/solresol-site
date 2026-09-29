import { parse } from './notes.js';

// The rules of the language — kept in one place, as data and pure
// functions. Canonical Sudre / Gajewski; see docs/SOLRESOL_MASTER.md.

// Meaning-family by first note (Gajewski's "keys"), for longer words.
export const SEMANTIC_KEYS = {
  do:  'Man, mind, food',
  re:  'House, clothing, family',
  mi:  'Actions & faults',
  fa:  'Country, travel, war, sea',
  sol: 'Arts & sciences',
  la:  'Industry & commerce',
  si:  'City, government, politics',
};

export const semanticKey = (notes) =>
  notes.length ? (SEMANTIC_KEYS[notes[0]] || null) : null;

// Part of speech by tonic accent (which note is stressed). Canonical:
// verb = unaccented; noun-thing = 1st; noun-person = 2nd;
// adjective = penultimate; adverb = last.
export function partOfSpeech(notes, accent = -1) {
  if (notes.length < 2) return 'particle';
  if (accent < 0) return 'verb';                          // unmarked
  if (accent === 0) return 'noun (thing)';                // first
  if (accent === notes.length - 1) return 'adverb';       // last
  if (accent === notes.length - 2) return 'adjective';    // penultimate
  if (accent === 1) return 'noun (person)';               // second
  return 'verb';
  // Order matters: the five forms only separate cleanly on 4+ syllables.
  // On shorter words positions collide; the modifier forms (last=adverb,
  // penultimate=adjective) take precedence so both stay reachable.
}

// Opposition by reversal — a principle, not an absolute rule.
export const reverse = (notes) => notes.slice().reverse();

// Tense / mood by a doubled note placed before the verb.
export const TENSE_MARKERS = {
  dodo: 'past', rere: 'pluperfect', mimi: 'future', fafa: 'conditional',
  solsol: 'imperative', lala: 'present participle', sisi: 'past participle',
};

export const tenseOf = (text) => TENSE_MARKERS[String(text).toLowerCase()] || null;

// Negation: the note "do" placed once before the negated word.
export const negate = (notes) => ['do', ...notes];
