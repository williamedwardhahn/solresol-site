import { reverse } from '../dictionary/grammar.js';

// The pure core of The Mirror — a word and its reversed shadow, each with
// its meaning. Opposition by reversal is a principle with exceptions, so
// the shadow's gloss may be an unrelated word (or none) — that's honest,
// and the card shows it as-is.

export function mirrorOf(index, notes) {
  const rev = reverse(notes);
  return {
    word:   { notes, gloss: index.meaningOf(notes.join('')) },
    shadow: { notes: rev, gloss: index.meaningOf(rev.join('')) },
  };
}
