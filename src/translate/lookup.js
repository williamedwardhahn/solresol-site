import { NOTES, noteByNumber } from '../dictionary/notes.js';
import { fold } from '../dictionary/index.js';

// Looking a word up, both ways. Pure: the index is passed in.
//
//   readNotes('domisol' | 'do mi sol' | '1 3 5' | 'Doré')  → ['do','mi','sol'] or null
//   candidates(index, 'love')  → the Solresol words that answer, best first

const SYL = /^(?:do|re|mi|fa|sol|la|si)+$/;

// Read typed Solresol strictly — every letter must belong to a syllable, so
// "dog" or "hello" are not mistaken for words. Numbers 1–7 work too, with or
// without spaces ("135" or "1 3 5"). Accent marks (doré, dofā) are ignored.
export function readNotes(text) {
  const t = fold(text).replace(/[?!.,;:'’"«»()]/g, ' ').trim();
  if (!t) return null;
  if (/^[1-7][1-7\s·.-]*$/.test(t)) return t.replace(/[^1-7]/g, '').split('').map((d) => noteByNumber(d).name);
  const s = t.replace(/[\s·-]+/g, '');
  if (!SYL.test(s)) return null;
  return s.match(/do|re|mi|fa|sol|la|si/g);
}

export const isParticleWord = (notes) => notes.length === 1;
export const NOTE_ORDER = NOTES.map((n) => n.name);

// Each entry's definition, cut into its comma-separated senses, with the
// "to" / "to be" of an infinitive taken off so "To be happy" answers "happy".
const SENSES = new WeakMap();
function sensesOf(index) {
  let s = SENSES.get(index);
  if (s) return s;
  s = index.words
    .filter((w) => (w.lang || 'en') === 'en')
    .map((w) => ({
      w,
      notes: w.solresol.toLowerCase().match(/do|re|mi|fa|sol|la|si/g) || [],
      senses: fold(w.definition).split(/[,;]/).map((x) => x.trim().replace(/[?!.]+$/, '').replace(/^to be /, '').replace(/^to /, '')).filter(Boolean),
    }));
  SENSES.set(index, s);
  return s;
}

// Rank the dictionary for one English word:
//   0 · a sense that IS the word       ("Water, wet"          ← water)
//   1 · a sense that starts with it    ("Love (for things)"   ← love)
//   2 · a sense that merely contains it
// then by which sense it is (earlier = more central), then by length.
function rank(index, q) {
  const out = [];
  for (const e of sensesOf(index)) {
    let best = Infinity;
    e.senses.forEach((s, i) => {
      let cls = -1;
      if (s === q) cls = 0;
      else if (s.startsWith(q + ' ') || s.startsWith(q + '(')) cls = 1;
      else if ((s.match(/[a-z']+/g) || []).includes(q)) cls = 2;
      if (cls >= 0) best = Math.min(best, cls * 1000 + Math.min(i, 30) * 20 + e.notes.length);
    });
    if (best < Infinity) out.push({ score: best, exact: best < 1000, solresol: e.w.solresol, notes: e.notes, definition: e.w.definition });
  }
  return out.sort((a, b) => a.score - b.score);
}

// A few English endings, tried when the word itself is not found.
export function stems(word) {
  const w = fold(word), out = [];
  const add = (x) => { if (x && x.length > 1 && !out.includes(x) && x !== w) out.push(x); };
  if (w.endsWith('ies')) add(w.slice(0, -3) + 'y');
  if (w.endsWith('es')) add(w.slice(0, -2));
  if (w.endsWith('s') && !w.endsWith('ss')) add(w.slice(0, -1));
  if (w.endsWith('ied')) add(w.slice(0, -3) + 'y');
  if (w.endsWith('ed')) { add(w.slice(0, -2)); add(w.slice(0, -1)); if (w.at(-3) === w.at(-4)) add(w.slice(0, -3)); }
  if (w.endsWith('ing')) { add(w.slice(0, -3)); add(w.slice(0, -3) + 'e'); if (w.at(-4) === w.at(-5)) add(w.slice(0, -4)); }
  if (w.endsWith('ly')) add(w.slice(0, -2));
  return out;
}

// The Solresol words that answer an English word, best first. Falls back
// to simple stems ("loved" → love) only when the word itself finds nothing.
export function candidates(index, word, limit = 12) {
  const q = fold(word).replace(/[^a-z' -]/g, '').trim();
  if (!q) return [];
  let r = rank(index, q);
  // Nothing, or only passing mentions ("dearly loved" for "loved"): try the stem.
  if (!r.length || !r[0].exact) {
    for (const s of stems(q)) {
      const alt = rank(index, s);
      if (alt.length && (alt[0].exact || !r.length)) { r = alt.map((c) => ({ ...c, via: s })); break; }
    }
  }
  return r.slice(0, limit);
}

// The first sense of a definition — the short gloss shown under a word.
export function shortGloss(definition) {
  if (!definition) return '';
  const g = String(definition).split(/[,;]/)[0].replace(/\s*\(.*$/, '').replace(/^to be /i, 'be ').trim();
  return /^(I|God)\b/.test(g) || /^[A-Z]{2}/.test(g) ? g : g.charAt(0).toLowerCase() + g.slice(1);
}

// Search for a slot: Solresol if it reads as Solresol, English otherwise.
export function lookup(index, query, limit = 8) {
  const q = String(query || '').trim();
  if (!q) return [];
  const notes = readNotes(q);
  if (notes) {
    const key = notes.join('');
    return index.words
      .filter((w) => w.solresol.toLowerCase().startsWith(key))
      .sort((a, b) => a.solresol.length - b.solresol.length)
      .slice(0, limit)
      .map((w) => ({ solresol: w.solresol, notes: w.solresol.toLowerCase().match(/do|re|mi|fa|sol|la|si/g), definition: w.definition }));
  }
  return candidates(index, q, limit);
}
