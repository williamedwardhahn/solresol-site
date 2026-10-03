import { readNotes } from '../translate/lookup.js?v=d5188c5e91';

// Writing practice, pure: a phrase's target words, and how what was typed
// measures up — word by word, as each is finished.

// 'Dore do falafa' → [['do','re'], ['do'], ['fa','la','fa']]
export const targetWords = (sol) =>
  String(sol).split(/[\s,.;!?]+/).filter(Boolean).map((w) => readNotes(w)).filter(Boolean);

// typed: the words finished so far (note arrays). Returns each one's verdict
// against the target in the same place, and whether the sentence is written.
export function checkWriting(target, typed) {
  const verdicts = typed.map((w, i) => {
    const t = target[i];
    if (!t) return 'extra';
    return w.join(' ') === t.join(' ') ? 'right' : 'wrong';
  });
  const done = typed.length >= target.length && verdicts.slice(0, target.length).every((v) => v === 'right');
  return { verdicts, done, right: verdicts.filter((v) => v === 'right').length };
}
