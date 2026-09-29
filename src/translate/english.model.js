import { fold } from '../dictionary/index.js';
import { TENSE_MARKERS } from '../dictionary/grammar.js';
import { candidates, readNotes, shortGloss } from './lookup.js';

// An English sentence, carried into Solresol by the canonical grammar
// (Gajewski, docs/SOLRESOL_MASTER.md §6) — word by word, but not blindly:
//
//   · the verb stays a bare infinitive; tense is a doubled particle before it
//     (did / -ed → dodo, will → mimi, would → fafa, had + participle → rere)
//   · negation is "do", once, immediately before the negated word
//   · a question inverts subject and verb ("do you understand?" → falafa domi?)
//   · English helpers Solresol does without are dropped, and said so:
//     the auxiliary "do", "a / an" (no indefinite article), "to" before a verb
//   · pronouns come from the canon table (dore, domi, dofa, dofā, doré …)
//
// Pure: the dictionary index is passed in. Unknown words are kept, marked.

const P = (notes, gloss, form = {}) => ({ notes, gloss, form });
export const PRONOUNS = {
  i: P(['do', 're'], 'I'), me: P(['do', 're'], 'me'), myself: P(['do', 're'], 'myself'),
  we: P(['do', 're'], 'we', { plural: true }), us: P(['do', 're'], 'us', { plural: true }),
  you: P(['do', 'mi'], 'you'), yourself: P(['do', 'mi'], 'yourself'),
  he: P(['do', 'fa'], 'he'), him: P(['do', 'fa'], 'him'), it: P(['do', 'fa'], 'it'),
  she: P(['do', 'fa'], 'she', { feminine: true }), her: P(['do', 'fa'], 'her', { feminine: true }),
  they: P(['do', 'fa'], 'they', { plural: true }), them: P(['do', 'fa'], 'them', { plural: true }),
  one: P(['do', 'la'], 'one'), someone: P(['do', 'la'], 'someone'),
  my: P(['re', 'do'], 'my'), mine: P(['re', 'do'], 'mine'), your: P(['re', 'mi'], 'your'), yours: P(['re', 'mi'], 'yours'),
  his: P(['re', 'fa'], 'his'), its: P(['re', 'fa'], 'its'), our: P(['re', 'sol'], 'our'), ours: P(['re', 'sol'], 'ours'),
  their: P(['re', 'si'], 'their'), theirs: P(['re', 'si'], 'theirs'),
};
const SUBJECTS = new Set(['i', 'we', 'you', 'he', 'she', 'it', 'they', 'one', 'someone']);

// Small words the dictionary would find, fixed to the canonical ones.
const FIXED = {
  the: ['la'], and: ['re'], or: ['mi'], if: ['sol'], yes: ['si'], no: ['do'], of: ['la', 'si'],
  at: ['fa'], this: ['fa', 'mi'], these: ['fa', 'mi'], that: ['fa', 're'], those: ['fa', 're'],
  what: ['fa', 'do'], why: ['sol', 're'], how: ['si', 'do'], where: ['mi', 'mi', 'sol', 'do'],
  when: ['mi', 'la', 'la', 'mi'], who: ['mi', 're'], which: ['mi', 're'], nothing: ['sol', 'do'],
  here: ['fa', 'sol'], today: ['la', 're'], yesterday: ['la', 'do'], tomorrow: ['la', 'mi'],
  very: ['fa', 'si'], always: ['sol', 'la'], never: ['la', 'sol'], please: ['mi', 'fa', 're'],
  have: ['fa', 'mi', 'sol'], thanks: ['sol', 'si'], thank: ['sol', 'si'], hello: ['si', 'mi'], good: ['fa', 'la'],
};

const TENSE_BY_NAME = Object.fromEntries(Object.entries(TENSE_MARKERS).map(([k, v]) => [v, k]));
const particle = (name) => TENSE_BY_NAME[name].match(/do|re|mi|fa|sol|la|si/g);

// English past forms that do not end in -ed.
const IRREGULAR = {
  was: 'be', were: 'be', been: 'be', ate: 'eat', eaten: 'eat', went: 'go', gone: 'go', saw: 'see', seen: 'see',
  said: 'say', spoke: 'speak', spoken: 'speak', came: 'come', knew: 'know', known: 'know', wrote: 'write',
  written: 'write', understood: 'understand', sang: 'sing', sung: 'sing', drank: 'drink', drunk: 'drink',
  gave: 'give', given: 'give', took: 'take', taken: 'take', made: 'make', found: 'find', thought: 'think',
  felt: 'feel', heard: 'hear', left: 'leave', lost: 'lose', met: 'meet', slept: 'sleep', told: 'tell',
  sat: 'sit', stood: 'stand', ran: 'run', began: 'begin', begun: 'begin', forgot: 'forget', forgiven: 'forgive',
  forgave: 'forgive', got: 'get', brought: 'bring', bought: 'buy', taught: 'teach', loved: 'love', had: 'have',
};
// present forms the stems would not find
const PRESENT = { has: 'have', does: 'do', goes: 'go', is: 'be', am: 'be', are: 'be' };
const BE = new Set(['am', 'is', 'are', 'be', 'was', 'were', 'been', 'being']);

// "don't" → do not, "I'm" → I am, and so on; then words and a question mark.
export function tokenize(text) {
  let t = fold(text).replace(/[’‘]/g, "'");
  t = t.replace(/\bwon't\b/g, 'will not').replace(/\bcan't\b/g, 'can not').replace(/\bcannot\b/g, 'can not')
    .replace(/\bshan't\b/g, 'shall not').replace(/n't\b/g, ' not').replace(/'m\b/g, ' am').replace(/'re\b/g, ' are')
    .replace(/'ll\b/g, ' will').replace(/'ve\b/g, ' have').replace(/'d\b/g, ' would').replace(/\b(it|he|she|that|what|there|here|who|where|how)'s\b/g, '$1 is');
  const question = /\?\s*$/.test(String(text));
  const words = (t.match(/[a-z]+(?:'[a-z]+)?/g) || []).map((w) => w.replace(/'s$/, ''));
  return { words, question };
}

const isPastForm = (w) => IRREGULAR[w] !== undefined || (/[a-z]{2}ed$/.test(w) && !['need', 'feed', 'seed', 'speed', 'bleed', 'red', 'bed', 'bread', 'dead', 'head', 'indeed', 'hundred', 'sacred', 'naked', 'wicked'].includes(w));

// → { items, question, notes, words }
//   items: [{ from, notes, form, role, gloss, definition }]   role ∈ word|pronoun|tense|neg|particle|unknown
export function translateEnglish(index, text) {
  const { words, question } = tokenize(text);
  const items = [], notes = [];
  let pendingTense = null, invert = false;

  const next = (i) => words[i + 1];
  // the word after an auxiliary, skipping "not": is it the subject?
  const subjectFollows = (i) => SUBJECTS.has(words[i + 1] === 'not' ? words[i + 2] : words[i + 1]);
  const pushTense = (name, from) => { items.push({ from, notes: particle(name), role: 'tense', gloss: name, form: {} }); };

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const nx = next(i);

    // ── auxiliaries ──
    if ((w === 'do' || w === 'does' || w === 'did') && (nx === 'not' || SUBJECTS.has(nx) || question)) {
      if (w === 'did') pendingTense = 'past';
      if (question && subjectFollows(i)) invert = true;
      notes.push(`“${w}” is an English helper; Solresol needs none${w === 'did' ? ' — its past becomes the particle dodo' : ''}.`);
      continue;
    }
    if (w === 'will' || w === 'shall' || w === 'would') {
      pendingTense = w === 'would' ? 'conditional' : 'future';
      if (question && subjectFollows(i)) invert = true;
      continue;
    }
    if (w === 'had' && nx && isPastForm(nx)) { pendingTense = 'pluperfect'; if (question && subjectFollows(i)) invert = true; continue; }
    if (w === 'a' || w === 'an') { notes.push(`“${w}” is left out: Solresol has no indefinite article.`); continue; }
    if (w === 'to' && nx && !['the', 'a', 'an', 'me', 'you', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their'].includes(nx) && !FIXED[nx]) {
      notes.push('“to” before a verb is left out: the verb is already an infinitive.');
      continue;
    }

    // ── to be: folded into a verb that already means "to be …" ──
    if (BE.has(w)) {
      if (w === 'was' || w === 'were') pendingTense = pendingTense || 'past';
      const after = words.slice(i + 1).find((x) => x !== 'not' && !SUBJECTS.has(x) && x !== 'very');
      const c = after && candidates(index, after, 1)[0];
      if (c && /^to be /i.test(c.definition)) {
        if (question && subjectFollows(i)) invert = true;
        notes.push(`“${w}” folds into ${cap(c.solresol)}, which already means “${shortGloss(c.definition)}”.`);
        continue;
      }
      if (pendingTense) { pushTense(pendingTense, ''); pendingTense = null; }
      items.push({ from: w, notes: ['fa', 're', 'mi'], role: 'word', gloss: 'be', definition: 'Be, exist (auxiliary)', form: {} });
      continue;
    }

    // ── negation ──
    if (w === 'not' || w === 'no') {
      items.push({ from: w, notes: ['do'], role: 'neg', gloss: 'not', form: {} });
      continue;
    }

    // ── pronouns ──
    if (PRONOUNS[w]) {
      const p = PRONOUNS[w];
      items.push({ from: w, notes: p.notes, role: 'pronoun', gloss: p.gloss, form: p.form, subject: SUBJECTS.has(w) });
      continue;
    }

    // ── a Solresol word typed straight in ──
    const sol = readNotes(w);
    if (sol && sol.length > 1 && index.meaningOf(sol.join(''))) {
      const def = index.meaningOf(sol.join(''));
      items.push({ from: w, notes: sol, role: 'word', gloss: shortGloss(def), definition: def, form: {} });
      continue;
    }

    // ── a content word ──
    let base = w, past = false;
    if (IRREGULAR[w]) { base = IRREGULAR[w]; past = true; }
    else if (PRESENT[w]) base = PRESENT[w];
    let notesOf = FIXED[base] || null, def = null;
    if (!notesOf) {
      const found = candidates(index, base, 1)[0];
      if (found) {
        notesOf = found.notes; def = found.definition;
        if (found.via && isPastForm(w)) { past = true; base = found.via; }
      }
    } else def = index.meaningOf(notesOf.join(''));

    if (!notesOf) { items.push({ from: w, notes: null, role: 'unknown', gloss: '', form: {} }); continue; }
    const tense = pendingTense || (past ? 'past' : null);
    // the negation sits immediately before the verb: dore dodo do falafa
    if (tense) {
      const neg = items.length && items[items.length - 1].role === 'neg' ? items.pop() : null;
      pushTense(tense, pendingTense ? '' : w);
      if (neg) items.push(neg);
      pendingTense = null;
    }
    items.push({ from: w, notes: notesOf, role: notesOf.length === 1 ? 'particle' : 'word', gloss: shortGloss(def) || base, definition: def, form: {} });
  }

  // A question formed with an English helper ("do you…", "will you…", "are you…"):
  // put the verb, with its particles, before the subject.
  if (question && invert) {
    const s = items.findIndex((it) => it.role === 'pronoun' && it.subject);
    if (s >= 0) {
      let v = s + 1;
      while (v < items.length && (items[v].role === 'tense' || items[v].role === 'neg')) v++;
      if (v < items.length && items[v].role === 'word') {
        const [subj] = items.splice(s, 1);
        items.splice(v, 0, subj);          // v shifted down by one: lands just after the verb
        notes.push('A question: the verb comes before its subject (Gajewski) — no question particle.');
      }
    }
  }
  return { items, question, notes: [...new Set(notes)], words };
}

// Solresol → English: a gloss per word, particles read as grammar.
export function glossSolresol(index, text) {
  const question = /\?\s*$/.test(String(text));
  const parts = String(text).split(/[\s,.;!?]+/).filter(Boolean);
  const items = parts.map((p) => {
    const notes = readNotes(p);
    if (!notes) return { from: p, notes: null, role: 'unknown', gloss: '' };
    const key = notes.join('');
    const marks = markOf(p);
    if (TENSE_MARKERS[key]) return { from: p, notes, role: 'tense', gloss: TENSE_MARKERS[key], form: {} };
    if (key === 'do') return { from: p, notes, role: 'neg', gloss: 'not', form: {} };
    const pron = pronounGloss(key, marks);
    const def = index.meaningOf(key);
    if (pron) return { from: p, notes, role: 'pronoun', gloss: pron, definition: def, form: marks };
    if (!def) return { from: p, notes, role: 'unknown', gloss: '', form: marks };
    return { from: p, notes, role: notes.length === 1 ? 'particle' : 'word', gloss: shortGloss(def), definition: def, form: marks };
  });
  const notesOut = [];
  if (items.some((i) => i.role === 'tense')) notesOut.push('A doubled note is a tense particle: it tells the time of the verb after it.');
  if (question) {
    const s = items.findIndex((i) => i.role === 'pronoun');
    if (s > 0 && items[s - 1].role === 'word') notesOut.push('The pronoun follows its verb: that inversion is what makes it a question.');
  }
  return { items, question, notes: notesOut };
}

// Written marks: an acute on the last vowel = plural, a macron = feminine.
function markOf(text) {
  const d = String(text).normalize('NFD');
  return { plural: /́/.test(d), feminine: /̄/.test(d) };
}
function pronounGloss(key, { plural, feminine }) {
  switch (key) {
    case 'dore': return plural ? 'we' : 'I';
    case 'domi': return plural ? 'you (all)' : 'you';
    case 'dofa': return plural ? 'they' : feminine ? 'she' : 'he';
    default: return null;
  }
}

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
