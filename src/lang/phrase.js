import { sequence } from '../live/sequence.js';

// A Phrase — a live sequence of Words.
//
// The same behavior as a Word, one size up. Its reading is its words'
// meanings in order. (Grammar-aware translation can layer on later
// without a new architecture — a Phrase is just a bigger Word.)

export function Phrase(words = []) {
  const seq = sequence(words);

  const self = {
    watch: seq.watch,
    get words()  { return seq.items; },
    get length() { return seq.length; },
    get text()   { return seq.items.map(w => w.text).join(' '); },
    get gloss()  { return seq.items.map(w => w.meaning || '·').join(' '); },

    add:        (w)  => (seq.add(w), self),
    removeLast: ()   => (seq.removeLast(), self),
    set:        (ws) => (seq.set(ws), self),
    clear:      ()   => (seq.clear(), self),
  };
  return self;
}
