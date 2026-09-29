import { NOTES, parse, cap } from '../dictionary/notes.js';
import { SEMANTIC_KEYS, accentForms, partOfSpeech, markWord, reverse, TENSE_MARKERS } from '../dictionary/grammar.js';
import { wordHTML } from '../graphics/graphics.js';

// The pure core of the School's examinations — no DOM, no storage, no
// clock. Progress is a plain object passed in and handed back new;
// randomness is a function passed in, so every question is testable.
//
// Five levels, each unlocked by ten right answers in the one before:
//   I   the ear         a note sounds — name it
//   II  the families    three words share a key — which?
//   III the mirror      reverse the word, reverse the thought
//   IV  the grammar     read the accent, the particle, the mark (Gajewski)
//   V   composition     build the word from its meaning

export const QUIZ_KEY = 'solresol:quiz';
export const UNLOCK_AT = 10;

export const LEVELS = [
  { id: 'ear',     numeral: 'I',   title: 'The Ear',       task: 'A note sounds. Name it.' },
  { id: 'family',  numeral: 'II',  title: 'The Families',  task: 'Three words share a key. Which family?' },
  { id: 'mirror',  numeral: 'III', title: 'The Mirror',    task: 'Reverse the word, reverse the thought.' },
  { id: 'grammar', numeral: 'IV',  title: 'The Grammar',   task: 'Read the accent, the particle, the mark.' },
  { id: 'compose', numeral: 'V',   title: 'Composition',   task: 'Build the word from its meaning.' },
];

// Opposites by reversal that the dictionary itself bears out. Reversal is
// a principle with exceptions (SOLRESOL_MASTER §7), so the Mirror level
// only examines pairs whose two glosses really are opposed.
export const OPPOSITES = [
  ['fala', 'lafa'], ['misol', 'solmi'], ['solla', 'lasol'], ['fasi', 'sifa'],
  ['domisol', 'solmido'], ['silasol', 'sollasi'], ['mifamifa', 'famifami'],
  ['solsire', 'resisol'], ['simila', 'lamisi'], ['misisol', 'solsimi'],
  ['solsifa', 'fasisol'], ['misolfa', 'fasolmi'], ['domila', 'lamido'],
  ['milasi', 'silami'], ['sisila', 'lasisi'],
];
// …and pairs where the rule visibly fails (Eco's examples, and one more).
export const EXCEPTIONS = [['sidosido', 'dosidosi'], ['dorefare', 'refaredo'], ['mila', 'lami']];

// ── progress ─────────────────────────────────────────────────────────
export function freshProgress() {
  return { v: 1, levels: [0, 0, 0, 0, 0], score: 0, streak: 0, best: 0, asked: 0, right: 0, days: [], concepts: {} };
}

// Accept whatever was stored (possibly old, partial or corrupt) and return a sound object.
export function normalize(raw) {
  const p = freshProgress();
  if (!raw || typeof raw !== 'object') return p;
  const num = (x) => (Number.isFinite(x) && x >= 0 ? x : 0);
  if (Array.isArray(raw.levels)) p.levels = p.levels.map((_, i) => num(raw.levels[i]));
  for (const k of ['score', 'streak', 'best', 'asked', 'right']) p[k] = num(raw[k]);
  if (Array.isArray(raw.days)) p.days = raw.days.filter((d) => typeof d === 'string').slice(-400);
  if (raw.concepts && typeof raw.concepts === 'object') {
    for (const [id, c] of Object.entries(raw.concepts)) {
      if (c && typeof c === 'object') p.concepts[id] = { right: num(c.right), wrong: num(c.wrong) };
    }
  }
  return p;
}

export const isUnlocked = (p, level) => level <= 0 || (p.levels[level - 1] || 0) >= UNLOCK_AT;
export const highestUnlocked = (p) => { let i = 0; while (i < LEVELS.length - 1 && isUnlocked(p, i + 1)) i++; return i; };

// One answer, recorded. `today` is 'YYYY-MM-DD' (passed in: no clock here).
export function record(p, level, concept, correct, today = null) {
  const n = normalize(p);
  const c = { ...(n.concepts[concept] || { right: 0, wrong: 0 }) };
  if (correct) c.right++; else c.wrong++;
  n.concepts = { ...n.concepts, [concept]: c };
  n.asked++;
  if (correct) {
    n.right++; n.score++; n.streak++;
    n.best = Math.max(n.best, n.streak);
    n.levels = n.levels.map((x, i) => (i === level ? x + 1 : x));
  } else {
    n.streak = 0;
  }
  if (today && !n.days.includes(today)) n.days = [...n.days, today].slice(-400);
  return n;
}

export const accuracy = (p) => (p.asked ? p.right / p.asked : 0);

// Consecutive days practised, ending today (or yesterday: a streak survives until a day is missed).
export function dayStreak(days, today) {
  const set = new Set(days);
  const back = (d) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() - 1); return t.toISOString().slice(0, 10); };
  let d = set.has(today) ? today : back(today);
  let n = 0;
  while (set.has(d)) { n++; d = back(d); }
  return n;
}

// ── weighting toward weak spots ──────────────────────────────────────
// Unseen concepts are curious (2); each miss raises the weight; each
// success lowers it, never below a small floor so nothing disappears.
export function weightOf(p, concept) {
  const c = p.concepts[concept];
  if (!c) return 2;
  return Math.max(0.35, Math.min(8, (1 + 2 * c.wrong) / (1 + 0.6 * c.right)));
}

export function weightedPick(items, conceptOf, p, rand = Math.random) {
  if (!items.length) return null;
  const w = items.map((it) => weightOf(p, conceptOf(it)));
  let r = rand() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { r -= w[i]; if (r < 0) return items[i]; }
  return items[items.length - 1];
}

export function shuffle(arr, rand = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const pick = (arr, rand) => arr[Math.floor(rand() * arr.length)];

// "Good, tasty, delectable, exquisite, delicious" → "good, tasty, delectable"
export function shortGloss(def, parts = 3) {
  if (!def) return '';
  const s = String(def).split(/,\s*/).slice(0, parts).join(', ');
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// A dictionary list → entries with their notes, once.
export function prepare(words) {
  return words.map((w) => ({ key: w.solresol.toLowerCase(), notes: parse(w.solresol), def: w.definition }));
}

const hasRepeat = (notes) => new Set(notes).size !== notes.length;
// Gajewski's keys govern four-syllable words without a repeated syllable.
export const isKeyed = (e) => e.notes.length === 4 && !hasRepeat(e.notes) && !!e.def;

// Options are { label, value, correct }. A question always has exactly one correct option.
const opts = (right, wrongs, rand) => shuffle([
  { ...right, correct: true },
  ...wrongs.map((w) => ({ ...w, correct: false })),
], rand);

// ── I · the ear ──────────────────────────────────────────────────────
export function earQuestion(p, rand = Math.random) {
  const target = weightedPick(NOTES.map((n) => n.name), (n) => 'note:' + n, p, rand);
  return {
    level: 0, kind: 'ear', concept: 'note:' + target, target,
    options: NOTES.map((n) => ({ label: cap(n.name), value: n.name, correct: n.name === target })),
  };
}

// ── II · the families ────────────────────────────────────────────────
export function familyQuestion(entries, p, rand = Math.random) {
  const keyed = entries.filter(isKeyed);
  const keys = NOTES.map((n) => n.name).filter((n) => keyed.filter((e) => e.notes[0] === n).length >= 3);
  const key = weightedPick(keys, (n) => 'family:' + n, p, rand);
  const trio = shuffle(keyed.filter((e) => e.notes[0] === key), rand).slice(0, 3);
  const others = shuffle(NOTES.map((n) => n.name).filter((n) => n !== key), rand).slice(0, 3);
  return {
    level: 1, kind: 'family', concept: 'family:' + key, key, words: trio,
    options: opts({ label: SEMANTIC_KEYS[key], value: key }, others.map((n) => ({ label: SEMANTIC_KEYS[n], value: n })), rand),
  };
}

// ── III · the mirror ─────────────────────────────────────────────────
// Two shapes: "what does the mirror mean?" and "which word is the opposite?"
export function mirrorQuestion(entries, p, rand = Math.random) {
  const byKey = new Map(entries.map((e) => [e.key, e]));
  const pairs = OPPOSITES.filter(([a, b]) => byKey.has(a) && byKey.has(b))
    .flatMap(([a, b]) => [[a, b], [b, a]]);
  const [a, b] = weightedPick(pairs, ([x]) => 'mirror:' + x, p, rand);
  const word = byKey.get(a), mirror = byKey.get(b);
  const concept = 'mirror:' + a;

  if (rand() < 0.5) {
    // the meaning of the reversed word; the word's own meaning is the tempting wrong answer
    const pool = shuffle(pairs.map(([x]) => x).filter((x) => x !== a && x !== b), rand).slice(0, 2);
    return {
      level: 2, kind: 'mirror-meaning', concept, word, mirror,
      options: opts({ label: shortGloss(mirror.def), value: b },
        [{ label: shortGloss(word.def), value: a }, ...pool.map((x) => ({ label: shortGloss(byKey.get(x).def), value: x }))], rand),
    };
  }
  // which arrangement of the same notes is the opposite? (only reversal is)
  const wrongs = otherArrangements(word.notes, rand).slice(0, 3);
  return {
    level: 2, kind: 'mirror-form', concept, word, mirror,
    options: opts({ label: cap(b), value: b }, wrongs.map((ns) => ({ label: cap(ns.join('')), value: ns.join('') })), rand),
  };
}

// Distinct rearrangements of the notes other than the word and its reverse.
export function otherArrangements(notes, rand = Math.random) {
  const self = notes.join(''), rev = reverse(notes).join('');
  const seen = new Set([self, rev]), out = [];
  const tries = [
    notes.slice(1).concat(notes[0]),                  // rotate left
    [notes[notes.length - 1], ...notes.slice(0, -1)],  // rotate right
    swap(notes, 0, 1), swap(notes, notes.length - 2, notes.length - 1),
  ];
  for (let i = 0; i < 24; i++) tries.push(shuffle(notes, rand));
  for (const t of tries) {
    const k = t.join('');
    if (!seen.has(k)) { seen.add(k); out.push(t); }
  }
  return out;
}
const swap = (a, i, j) => { const b = a.slice(); [b[i], b[j]] = [b[j], b[i]]; return b; };

// ── IV · the grammar (canonical Gajewski) ────────────────────────────
// Three kinds: the tonic accent (part of speech), the tense particle,
// and the marks of gender and number.
export const ROLE_LABEL = {
  'verb': 'a verb', 'noun (thing)': 'a noun — a thing', 'noun (person)': 'a noun — a person',
  'adjective': 'an adjective', 'adverb': 'an adverb',
};

export function grammarQuestion(entries, p, rand = Math.random) {
  const r = rand();
  if (r < 0.6) return accentQuestion(entries, p, rand);
  if (r < 0.82) return tenseQuestion(entries, p, rand);
  return markQuestion(entries, p, rand);
}

export function accentQuestion(entries, p, rand = Math.random) {
  const pool = entries.filter((e) => (e.notes.length === 4 || e.notes.length === 3) && e.def);
  const e = pick(pool, rand);
  const forms = accentForms(e.notes);
  const f = weightedPick(forms, (x) => 'accent:' + x.role, p, rand);
  const role = partOfSpeech(e.notes, f.accent);
  return {
    level: 3, kind: 'accent', concept: 'accent:' + role, word: e, accent: f.accent,
    written: markWord(e.notes, { accent: f.accent }), role,
    options: opts({ label: ROLE_LABEL[role], value: role },
      shuffle(forms.filter((x) => x.role !== role), rand).slice(0, 3).map((x) => ({ label: ROLE_LABEL[x.role], value: x.role })), rand),
  };
}

// "Dore mimi milasi" — I shall love. The particle stands before the verb.
export const TENSE_EN = {
  dodo: 'the past (imperfect, simple past)', rere: 'the pluperfect', mimi: 'the future', fafa: 'the conditional',
  solsol: 'the imperative', lala: 'the present participle', sisi: 'the past participle',
};
const SUBJECTS = [['dore', 'I'], ['domi', 'you'], ['dofa', 'he']];
const VERBS = ['milasi', 'mifala', 'fasido', 'solsifa', 'simila'];

export function tenseQuestion(entries, p, rand = Math.random) {
  const byKey = new Map(entries.map((e) => [e.key, e]));
  const markers = Object.keys(TENSE_MARKERS).filter((m) => m !== 'sisi' && m !== 'lala');
  const particle = weightedPick(markers, (m) => 'tense:' + m, p, rand);
  const [subj, subjEn] = pick(SUBJECTS, rand);
  const verbs = VERBS.filter((v) => byKey.has(v));
  const verb = pick(verbs.length ? verbs : ['milasi'], rand);
  const wrongs = shuffle(markers.filter((m) => m !== particle), rand).slice(0, 3);
  return {
    level: 3, kind: 'tense', concept: 'tense:' + particle, particle,
    sentence: [subj, particle, verb], subjEn, verbDef: byKey.get(verb)?.def || '',
    options: opts({ label: TENSE_EN[particle], value: particle }, wrongs.map((m) => ({ label: TENSE_EN[m], value: m })), rand),
  };
}

export const MARK_FORMS = [
  { id: 'plain',     marks: {},                                label: 'masculine, singular' },
  { id: 'feminine',  marks: { feminine: true },                label: 'feminine, singular' },
  { id: 'plural',    marks: { plural: true },                  label: 'masculine, plural' },
  { id: 'fem-plural', marks: { feminine: true, plural: true }, label: 'feminine, plural' },
];

export function markQuestion(entries, p, rand = Math.random) {
  const pool = entries.filter((e) => e.notes.length >= 2 && e.notes.length <= 4 && e.def);
  const e = pick(pool, rand);
  const f = weightedPick(MARK_FORMS, (x) => 'mark:' + x.id, p, rand);
  return {
    level: 3, kind: 'mark', concept: 'mark:' + f.id, word: e, form: f,
    written: markWord(e.notes, { accent: 0, ...f.marks }),
    options: opts({ label: f.label, value: f.id },
      MARK_FORMS.filter((x) => x.id !== f.id).map((x) => ({ label: x.label, value: x.id })), rand),
  };
}

// ── V · composition ──────────────────────────────────────────────────
// Short, common words: two or three syllables, with a meaning that reads.
export function composePool(entries) {
  return entries.filter((e) => e.notes.length >= 2 && e.notes.length <= 3 && e.def && e.def.length <= 60);
}

export function composeQuestion(entries, p, rand = Math.random) {
  const pool = composePool(entries);
  const e = weightedPick(pool, (x) => 'word:' + x.key, p, rand);
  return { level: 4, kind: 'compose', concept: 'word:' + e.key, word: e, target: e.notes };
}

export const checkComposition = (built, target) =>
  built.length === target.length && built.every((n, i) => n === target[i]);

export function question(level, entries, p, rand = Math.random) {
  switch (level) {
    case 0: return earQuestion(p, rand);
    case 1: return familyQuestion(entries, p, rand);
    case 2: return mirrorQuestion(entries, p, rand);
    case 3: return grammarQuestion(entries, p, rand);
    default: return composeQuestion(entries, p, rand);
  }
}

// ── the micro-quiz: one small question about a word you just used ────
// Returns every question the word can bear; the scheduler chooses one.
// (The archive asked "if X is stressed as a noun, what is it?" — a
// tautology. Here the written accent is shown and the role is asked.)
export function microQuestions(notes, entries, rand = Math.random) {
  const key = notes.join('');
  const byKey = new Map(entries.map((e) => [e.key, e]));
  const out = [];
  const W = cap(key);

  const rev = reverse(notes).join('');
  if (notes.length >= 2 && rev !== key && byKey.has(rev)) {
    const wrongs = shuffle(entries.filter((e) => e.def && e.key !== rev && e.key !== key && e.notes.length === notes.length), rand)
      .slice(0, 2).map((e) => ({ label: shortGloss(e.def, 2), value: e.key }));
    out.push({
      id: 'mirror:' + key, title: 'Its mirror', word: key,
      prompt: `Reversed, <b>${W}</b> becomes <b>${cap(rev)}</b>. What does ${cap(rev)} mean?`,
      options: opts({ label: shortGloss(byKey.get(rev).def, 2), value: rev }, wrongs, rand),
      answerWord: rev,
    });
  }

  if (notes.length === 4 && !hasRepeat(notes)) {
    const others = shuffle(NOTES.map((n) => n.name).filter((n) => n !== notes[0]), rand).slice(0, 2);
    out.push({
      id: 'family:' + key, title: 'Its family', word: key,
      prompt: `<b>${W}</b> begins with ${cap(notes[0])}. Which family is that?`,
      options: opts({ label: SEMANTIC_KEYS[notes[0]], value: notes[0] }, others.map((n) => ({ label: SEMANTIC_KEYS[n], value: n })), rand),
      answerWord: key,
    });
  }

  if (notes.length >= 3) {
    const forms = accentForms(notes).filter((f) => f.accent >= 0);
    const f = pick(forms, rand);
    const role = partOfSpeech(notes, f.accent);
    const wrongs = shuffle(accentForms(notes).filter((x) => x.role !== role), rand).slice(0, 2);
    out.push({
      id: 'accent:' + key, title: 'Its accent', word: key,
      prompt: `Written <b>${wordHTML(cap(markWord(notes, { accent: f.accent })))}</b>, with the accent on the ${ORDINAL[f.accent]} syllable, it is…`,
      options: opts({ label: ROLE_LABEL[role], value: role }, wrongs.map((x) => ({ label: ROLE_LABEL[x.role], value: x.role })), rand),
      answerWord: key,
    });
  }
  return out;
}
const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth'];
