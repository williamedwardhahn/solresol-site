import { sequence } from '../live/sequence.js?v=c115d42191';
import { parse, cap } from '../dictionary/notes.js?v=c115d42191';
import { meaningOf } from '../dictionary/dictionary.js?v=c115d42191';
import { semanticKey, reverse } from '../dictionary/grammar.js?v=c115d42191';

// A Word — a live sequence of notes.
//
// It knows how to name itself, find its meaning, and answer a few
// questions from the Dictionary's rules. It holds no display logic:
// the Voices show it, the views watch it.

export function Word(notes = []) {
  const seq = sequence(notes);

  const self = {
    watch: seq.watch,                                   // live: watch(fn) → unwatch
    get notes()    { return seq.items; },
    get length()   { return seq.length; },
    get key()      { return seq.items.join(''); },       // "domisol"
    get text()     { return cap(self.key); },            // "Domisol"
    get meaning()  { return meaningOf(self.key); },
    get family()   { return semanticKey(seq.items); },
    get opposite() { return reverse(seq.items); },       // notes, reversed

    add:        (n)  => (seq.add(n), self),
    removeLast: ()   => (seq.removeLast(), self),
    set:        (ns) => (seq.set(ns), self),
    clear:      ()   => (seq.clear(), self),
  };
  return self;
}

// Build a Word from written text: Word.from("Domisol").
Word.from = (text) => Word(parse(text));
