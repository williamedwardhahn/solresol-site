import { parse, NOTE_NAMES } from '../../dictionary/notes.js';
import { fold } from '../../dictionary/index.js';

// The lexicon — the dictionary as a book you can leaf through. Pure: given
// the word list it builds entries in the order of the scale, filters them,
// groups them into families, and pairs each word with its mirror. No DOM.

const RANK = Object.fromEntries(NOTE_NAMES.map((n, i) => [n, i]));

// Solresol's own alphabetical order: note by note, do < re < … < si,
// and a word before every longer word it begins (Do, Dodo, Dodore…).
export function collate(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return RANK[a[i]] - RANK[b[i]];
  return a.length - b.length;
}

// words → entries: { notes, key, text, definition, lang, fKey, fDef }, collated.
export function prepare(words) {
  const out = [];
  for (const w of words) {
    const notes = parse(w.solresol);
    if (!notes.length) continue;
    const key = notes.join('');
    out.push({
      notes, key,
      text: key[0].toUpperCase() + key.slice(1),
      definition: w.definition || '',
      lang: w.lang || 'en',
      fKey: key,
      fDef: fold(w.definition || ''),
    });
  }
  return out.sort((a, b) => collate(a.notes, b.notes));
}

// A query can be written in notes ("domisol", "do mi sol"), in digits
// ("135" — do=1 … si=7), or in English. Returns the notes it spells, if any.
export function queryNotes(q) {
  const s = fold(q).replace(/[\s·.\-]+/g, '');
  if (!s) return null;
  if (/^[1-7]+$/.test(s)) return [...s].map((d) => NOTE_NAMES[d - 1]);
  const notes = parse(s);
  return notes.join('') === s ? notes : null;
}

// Every entry that matches — no limit — best first:
//   0 the word itself · 1 words it begins · 2 glosses that open with the
//   query · 3 an English word that starts with it · 4 anywhere in the gloss.
// Then the syllable-count and first-note filters. Ties keep scale order.
export function filterEntries(entries, { q = '', syllables = 0, start = null } = {}) {
  const fq = fold(q);
  const spelled = queryNotes(q);
  const sKey = spelled ? spelled.join('') : null;
  const wordStart = fq ? new RegExp('(^|[^a-z])' + fq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) : null;
  const buckets = [[], [], [], [], []];
  for (const e of entries) {
    if (syllables && (syllables >= 5 ? e.notes.length < 5 : e.notes.length !== syllables)) continue;
    if (start && e.notes[0] !== start) continue;
    if (!fq) { buckets[4].push(e); continue; }
    if (sKey && e.key === sKey) buckets[0].push(e);
    else if (sKey && e.key.startsWith(sKey)) buckets[1].push(e);
    else if (e.fDef.startsWith(fq)) buckets[2].push(e);
    else if (wordStart.test(e.fDef)) buckets[3].push(e);
    else if (e.fDef.includes(fq)) buckets[4].push(e);
  }
  return buckets.flat();
}

// ── families ──────────────────────────────────────────────────────────
// The seven keys, each split by its second note into seven sub-families.
// A sub-family is named honestly: by its two notes, the two-note word that
// heads it (Dore, "I, me"), and a few of its members' own first meanings.
export function familyTree(entries) {
  const byKey = new Map(entries.map((e) => [e.key, e]));
  return NOTE_NAMES.map((first) => {
    const head = byKey.get(first) || null;
    const subs = NOTE_NAMES.map((second) => {
      const prefix = first + second;
      const words = entries.filter((e) => e.notes.length > 2 && e.notes[0] === first && e.notes[1] === second);
      return { notes: [first, second], key: prefix, head: byKey.get(prefix) || null, words, samples: samples(words, 4) };
    });
    const count = subs.reduce((s, x) => s + x.words.length + (x.head ? 1 : 0), 0) + (head ? 1 : 0);
    return { note: first, head, subs, count };
  });
}

// The first sense of a gloss: "Body, the human body" → "body".
export const firstSense = (def) => {
  const s = String(def).split(/[,;(]/)[0].trim();
  return s ? s[0].toLowerCase() + s.slice(1) : '';
};

// A handful of distinct first senses, spread across the list, shortest words first.
export function samples(words, n = 4) {
  const seen = new Set(), out = [];
  const pool = words.filter((w) => w.notes.length === 4).concat(words.filter((w) => w.notes.length !== 4));
  const step = Math.max(1, Math.floor(pool.length / (n * 2)));
  for (let i = 0; i < pool.length && out.length < n; i += step) {
    const s = firstSense(pool[i].definition);
    if (s && s.length <= 22 && !seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out;
}

// ── mirrors ───────────────────────────────────────────────────────────
// A word and its reversal. `status` says what the reversal is:
//   'palindrome' (its own mirror) · 'pair' (both in the dictionary) ·
//   'empty' (the reversed word is not in the dictionary) · 'unknown'.
export function mirrorOf(byKey, notes) {
  const rev = notes.slice().reverse();
  const key = notes.join(''), rkey = rev.join('');
  const word = byKey.get(key) || null, shadow = byKey.get(rkey) || null;
  const status = notes.length < 2 ? 'single'
    : key === rkey ? 'palindrome'
    : word && shadow ? 'pair'
    : word ? 'empty' : shadow ? 'unknown' : 'neither';
  return { notes, rev, word, shadow, status };
}

// Every pair where a word and its reversal are both words, once each
// (the earlier word in scale order first), palindromes left out.
export function mirrorPairs(entries) {
  const byKey = new Map(entries.map((e) => [e.key, e]));
  const out = [];
  for (const e of entries) {
    if (e.notes.length < 2) continue;
    const rkey = e.notes.slice().reverse().join('');
    if (rkey === e.key) continue;
    const r = byKey.get(rkey);
    if (r && collate(e.notes, r.notes) < 0) out.push([e, r]);
  }
  return out;
}

// The pairs Sudre himself gave as examples of meaning reversed
// (docs/SOLRESOL_MASTER.md §7), and two Eco noted do not hold.
export const SUDRE_PAIRS = [
  ['domisol', 'solmido'], ['misol', 'solmi'], ['fala', 'lafa'],
  ['silasol', 'sollasi'], ['solla', 'lasol'], ['mifamifa', 'famifami'],
];
export const ECO_EXCEPTIONS = [['sidosido', 'dosidosi'], ['dorefare', 'refaredo']];
