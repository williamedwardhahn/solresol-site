import { live } from './live.js';

// A live, ordered list.
//
// A Word is a sequence of notes; a Phrase is a sequence of words. Same
// behavior at every size — one piece, reused, so there is never a second
// engine for sentences.

export function sequence(initial = []) {
  const items = live(initial.slice());
  const self = {
    watch: items.watch,
    get items() { return items.get().slice(); },   // defensive copy — callers can't corrupt state
    get length() { return items.get().length; },
    at(i) { return items.get()[i]; },
    add(x) { items.set([...items.get(), x]); return self; },
    removeLast() { items.set(items.get().slice(0, -1)); return self; },
    set(xs) { items.set(xs.slice()); return self; },
    clear() { items.set([]); return self; },
  };
  return self;
}
