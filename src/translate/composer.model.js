import { TENSE_MARKERS, partOfSpeech, markWord } from '../dictionary/grammar.js';

// The composer — a sentence built from slots, ordered by the canonical
// grammar (Gajewski; docs/SOLRESOL_MASTER.md §6). Pure: no DOM.
//
//   statement   Subject [tense] [do] Verb Adverb Object Adjective
//   question    [tense] [do] Verb Subject Adverb Object Adjective      (inversion, no particle)
//
//   · the tense is a doubled particle standing before the verb (dodo, mimi …)
//   · negation is "do", once, immediately before the word it negates
//   · adjectives follow their noun — the object's, or the subject's if alone
//   · the tonic accent marks what a root is doing: a noun is stressed on its
//     first syllable, an adjective on its penultimate, an adverb on its last;
//     the verb is written plain (§6.2)
//
// A slot is { notes, form?: { plural, feminine }, pronoun?: true } or null.

export const SLOTS = ['subject', 'verb', 'object', 'adjective', 'adverb'];

// The personal pronouns of the canon (§6.6): plural = acute, feminine = macron.
export const PRONOUN_CHOICES = [
  { en: 'I',         notes: ['do', 're'], form: {} },
  { en: 'we',        notes: ['do', 're'], form: { plural: true } },
  { en: 'you',       notes: ['do', 'mi'], form: {} },
  { en: 'you (all)', notes: ['do', 'mi'], form: { plural: true } },
  { en: 'he',        notes: ['do', 'fa'], form: {} },
  { en: 'she',       notes: ['do', 'fa'], form: { feminine: true } },
  { en: 'they',      notes: ['do', 'fa'], form: { plural: true } },
  { en: 'oneself',   notes: ['do', 'sol'], form: {} },
];

// TENSE_MARKERS, as a menu: [{ key: 'dodo', notes: ['do','do'], name: 'past' }, …]
export const TENSES = Object.entries(TENSE_MARKERS).map(([key, name]) => ({
  key, name, notes: key.match(/do|re|mi|fa|sol|la|si/g),
}));

// Which syllable to stress so a root plays its role, if the word is long
// enough for that accent to be unambiguous; -1 = written plain.
export function accentFor(role, notes, pronoun = false) {
  if (pronoun || !notes || notes.length < 2) return -1;
  const want = { subject: ['noun (thing)', 0], object: ['noun (thing)', 0],
    adjective: ['adjective', notes.length - 2], adverb: ['adverb', notes.length - 1] }[role];
  if (!want) return -1;
  return partOfSpeech(notes, want[1]) === want[0] ? want[1] : -1;
}

// → [{ role, notes, text, form, accent }]  role ∈ subject|verb|object|adjective|adverb|tense|negation
export function compose(parts = {}) {
  const { tense = null, negate = null, question = false } = parts;
  const out = [];
  const word = (role) => {
    const s = parts[role];
    if (!s || !s.notes || !s.notes.length) return;
    if (negate === role) out.push({ role: 'negation', notes: ['do'], text: 'do', form: {}, accent: -1 });
    const accent = accentFor(role, s.notes, !!s.pronoun);
    const form = s.form || {};
    out.push({ role, notes: s.notes.slice(), form, accent, pronoun: !!s.pronoun, text: markWord(s.notes, { ...form, accent }) });
  };
  const verbPhrase = () => {
    const t = TENSES.find((x) => x.key === tense || x.name === tense);
    if (t && parts.verb) out.push({ role: 'tense', notes: t.notes.slice(), text: t.key, name: t.name, form: {}, accent: -1 });
    word('verb');
  };

  const hasObject = !!(parts.object && parts.object.notes && parts.object.notes.length);
  if (question && parts.verb) {
    verbPhrase();
    word('subject');
    if (!hasObject) word('adjective');
  } else {
    word('subject');
    if (!hasObject) word('adjective');
    verbPhrase();
  }
  word('adverb');
  if (hasObject) { word('object'); word('adjective'); }
  return out;
}

// The sentence written out: words joined, capitalised, with its stop.
export function writeOut(words, question = false) {
  if (!words.length) return '';
  const s = words.map((w) => w.text).join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1) + (question ? '?' : '.');
}

// The canonical rules a composition is using — shown beside the result.
export function rulesInPlay(parts = {}) {
  const r = [];
  if (parts.verb && parts.subject) r.push(parts.question ? 'question' : 'order');
  if (parts.tense && parts.verb) r.push('tense');
  if (parts.negate && parts[parts.negate]) r.push('negation');
  if (parts.adjective) r.push('adjective');
  return r;
}
