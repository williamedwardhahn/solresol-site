// Numbers in Solresol — pure, no DOM.
//
// The base words are not invented here: every one is a headword in the
// dictionary (src/dictionary/words.json), glossed with its number
// ("Remimi — Two, second…"). tests/dictionary-numbers.test.js checks that
// against the file. What the dictionary does NOT give is:
//   · a word for zero (the archive's "Dodore" means earth, world);
//   · words for 70 and 90;
//   · the rule for joining words into a larger number.
// Those gaps are filled by the French model Sudre wrote in — 70 = 60 + 10
// (soixante-dix), 90 = 80 + 10 (quatre-vingt-dix), 21 = 20 + 1, 300 = 3 × 100,
// "cent" and "mille" bare, "un million" counted — and every result says
// which of its parts are the dictionary's and which are composed.

export const BASE = [
  [1, 'redodo'], [2, 'remimi'], [3, 'refafa'], [4, 'resolsol'], [5, 'relala'], [6, 'resisi'],
  [7, 'mimido'], [8, 'mimire'], [9, 'mimifa'], [10, 'mimisol'], [11, 'mimila'], [12, 'mimisi'],
  [13, 'midodo'], [14, 'mirere'], [15, 'mifafa'], [16, 'misolsol'], [17, 'milala'], [18, 'misisi'],
  [19, 'fafado'], [20, 'fafare'], [30, 'fafami'], [40, 'fafasol'], [50, 'fafala'], [60, 'fafasi'],
  [80, 'fadodo'], [100, 'farere'], [1e3, 'famimi'], [1e6, 'fasolsol'], [1e9, 'falala'], [1e12, 'fasisi'],
];
const WORD = new Map(BASE);
export const MAX = 1e15 - 1;            // beyond "a thousand trillion" there is no word to count with

// n → { ok, words: [{ key, value, role }], kind, note }
//   role: 'word' (a base word) · 'times' (a multiplier: the 3 of 3 × 100)
//   kind: 'word' — one dictionary word; 'composed' — built by the rules
//         above; 'french' — also uses the 70/90 reading, which has no word.
export function toSolresol(input) {
  const n = typeof input === 'number' ? input : Number(String(input).replace(/[\s,_']/g, ''));
  if (!Number.isFinite(n)) return fail('Not a number.');
  if (!Number.isInteger(n)) return fail('Only whole numbers: the dictionary has no fractions.');
  if (n < 0) return fail('The dictionary has no minus. “Do” before a word means “not”, not “less than zero”.');
  if (n === 0) return fail('The dictionary has no word for zero. (Dodore, which an earlier version of this site gave, means “earth, world”.)');
  if (n > MAX) return fail('Past a thousand trillion the dictionary has no larger word to count with.');

  const words = [];
  let french = false;
  const push = (key, value, role = 'word') => words.push({ key, value, role });

  // 1 … 999
  function under1000(x) {
    const h = Math.floor(x / 100), r = x % 100;
    if (h) { if (h > 1) push(WORD.get(h), h, 'times'); push('farere', 100); }
    if (r) under100(r);
  }
  function under100(x) {
    if (WORD.has(x)) return push(WORD.get(x), x);
    if (x >= 70 && x < 80 || x >= 90) {             // soixante-dix, quatre-vingt-dix
      french = true;
      const base = x < 80 ? 60 : 80;
      push(WORD.get(base), base);
      return push(WORD.get(x - base), x - base);
    }
    const tens = Math.floor(x / 10) * 10;
    push(WORD.get(tens), tens);
    push(WORD.get(x - tens), x - tens);
  }

  const groups = [[1e12, 'fasisi'], [1e9, 'falala'], [1e6, 'fasolsol'], [1e3, 'famimi']];
  let rest = n;
  for (const [size, key] of groups) {
    const g = Math.floor(rest / size);
    rest -= g * size;
    if (!g) continue;
    if (g > 1 || size > 1e3) {                       // "mille", but "un million"
      const start = words.length;
      under1000(g);
      for (let i = start; i < words.length; i++) words[i].role = 'times';
    }
    push(key, size);
  }
  if (rest) under1000(rest);

  const kind = words.length === 1 ? 'word' : french ? 'french' : 'composed';
  return { ok: true, n, words, kind, note: NOTES[kind] };
}

const NOTES = {
  word: 'A single word, as the dictionary gives it. It is also the ordinal: “two” and “second” are one word.',
  composed: 'Built from dictionary words by adding and multiplying, largest first, as French does. The joining rule is inferred; the dictionary gives only the parts.',
  french: 'The dictionary has no word for 70 or 90. Read here as 60 + 10 and 80 + 10, after French (soixante-dix, quatre-vingt-dix); treat this as a reading, not canon.',
};

const fail = (why) => ({ ok: false, words: [], kind: 'none', note: why });

// The base words laid out in the rows their shapes fall into.
export const TABLE = [
  { title: 'One to six', rule: 're + a doubled note', values: [1, 2, 3, 4, 5, 6] },
  { title: 'Seven to twelve', rule: 'mimi + a note', values: [7, 8, 9, 10, 11, 12] },
  { title: 'Thirteen to eighteen', rule: 'mi + a doubled note', values: [13, 14, 15, 16, 17, 18] },
  { title: 'Nineteen and the tens', rule: 'fafa + a note', values: [19, 20, 30, 40, 50, 60] },
  { title: 'Eighty and the powers', rule: 'fa + a doubled note', values: [80, 100, 1e3, 1e6, 1e9, 1e12] },
].map((row) => ({ ...row, cells: row.values.map((v) => ({ value: v, key: WORD.get(v) })) }));
