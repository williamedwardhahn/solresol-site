import { TENSE_MARKERS } from '../dictionary/grammar.js';

// The pure core of Compose — no DOM.
//
// A sentence is a melody: `schedule` gives each word's start time; `gloss`
// reads the sentence's meaning through an index; `guessRoles` makes a
// modest guess at each word's part in the sentence. All pure, all tested.

export function schedule(lengths, wordGap = 0.28, breath = 0.35) {
  const offsets = [];
  let t = 0;
  for (const len of lengths) { offsets.push(t); t += len * wordGap + breath; }
  return offsets;
}

export function sentenceGloss(index, words) {
  // words: array of note-arrays
  return words.map((notes) => index.meaningOf(notes.join('')) || '·').join(' ');
}

// The seven one-note words are the little words of the language.
export const PARTICLES = { do: 'no, not', re: 'and', mi: 'or', fa: 'at, to', sol: 'if', la: 'the', si: 'yes' };

// Sudre's personal pronouns: do + a note.
export const PRONOUNS = { dore: 'I', domi: 'you', dofa: 'he, she', dola: 'one' };

// guessRoles(words, meaningOf?) → [{ role, detail }], one per word.
//
// A guess, and labelled as one: a spoken sentence carries no written
// accents, so the part of speech can't be read off the word itself
// (canonically an unaccented word is a verb). What we can read:
//   · a one-note word is a particle — and `do` before a word negates it;
//   · a doubled particle (dodo, mimi …) marks the tense of the verb after it;
//   · do+re / do+mi / do+fa / do+la are pronouns;
//   · otherwise Solresol keeps subject · verb · object order, so the first
//     content word is taken as the subject, the next as the verb (or any
//     word glossed "to …"), and what follows as the object.
export function guessRoles(words, meaningOf = () => null) {
  let seenSubject = false, seenVerb = false, verbNext = false;
  return words.map((notes, i) => {
    const key = notes.join('');
    if (notes.length === 1) {
      if (key === 'do' && i < words.length - 1) return { role: 'negation', detail: 'not' };
      return { role: 'particle', detail: PARTICLES[key] || '' };
    }
    if (TENSE_MARKERS[key]) { verbNext = true; return { role: 'tense', detail: TENSE_MARKERS[key] }; }
    if (PRONOUNS[key]) {
      if (!seenSubject && !seenVerb) { seenSubject = true; return { role: 'subject', detail: 'pronoun' }; }
      return { role: seenVerb ? 'object' : 'pronoun', detail: 'pronoun' };
    }
    const m = String(meaningOf(key) || '');
    if (verbNext || (!seenVerb && /^to\s/i.test(m))) {
      verbNext = false; seenVerb = true;
      return { role: 'verb', detail: '' };
    }
    if (!seenSubject && !seenVerb) { seenSubject = true; return { role: 'subject', detail: '' }; }
    if (!seenVerb) { seenVerb = true; return { role: 'verb', detail: '' }; }
    return { role: 'object', detail: '' };
  });
}
