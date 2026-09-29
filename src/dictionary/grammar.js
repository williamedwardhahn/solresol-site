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

// The five forms one root takes by its tonic accent, in Gajewski's order.
// `accent` is the syllable index passed to partOfSpeech (-1 = unmarked).
export function accentForms(notes) {
  const n = notes.length;
  if (n < 2) return [];
  const forms = [
    { accent: -1,    role: 'verb' },
    { accent: 0,     role: 'noun (thing)' },
    { accent: 1,     role: 'noun (person)' },
    { accent: n - 2, role: 'adjective' },
    { accent: n - 1, role: 'adverb' },
  ];
  // On short words positions collide; keep the first form that owns each slot,
  // except that the modifiers win (as partOfSpeech decides).
  return forms.filter((f) => partOfSpeech(notes, f.accent) === f.role);
}

// Write a word with its marks, as Gajewski does: a circumflex on the
// accented syllable (midôfa), a macron on the last vowel for the feminine
// (dofā), an acute on the last vowel for the plural (doré).
const MARK = { accent: '̂', feminine: '̄', plural: '́' };
export function markWord(notes, { accent = -1, feminine = false, plural = false } = {}) {
  return notes.map((n, i) => {
    const marks = [];
    if (i === accent) marks.push(MARK.accent);
    if (i === notes.length - 1 && feminine) marks.push(MARK.feminine);
    if (i === notes.length - 1 && plural) marks.push(MARK.plural);
    if (!marks.length) return n;
    // the mark sits on the syllable's vowel (the last letter: do, re, mi, fa, la, si; sol → o)
    const v = n === 'sol' ? 1 : n.length - 1;
    return (n.slice(0, v + 1) + marks.join('') + n.slice(v + 1)).normalize('NFC');
  }).join('');
}
