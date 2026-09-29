// The pure core of Compose — no DOM.
//
// A sentence is a melody: `schedule` gives each word's start time; `gloss`
// reads the sentence's meaning through an index. Both are pure, so both
// are tested.

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
