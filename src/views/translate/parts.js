import { note, cap } from '../../dictionary/notes.js';
import { markWord } from '../../dictionary/grammar.js';

// Small markup helpers shared by the Translation chapter's four leaves.
// A word travels in attributes as hyphenated notes ("do-mi-sol"); a
// sentence as words separated by spaces ("do-re do fa-la-fa").

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const enc = (notes) => notes.join('-');
export const encSentence = (words) => words.map(enc).join(' ');
export const decSentence = (s) => String(s || '').split(' ').filter(Boolean).map((w) => w.split('-'));

export const swatches = (notes, cls = '') =>
  `<span class="swatches ${cls}" aria-hidden="true">${notes.map((n) => `<i style="background:${note(n).color}"></i>`).join('')}</span>`;

// A word as written: capitalised when it opens, with its marks.
export const written = (notes, form = {}, { capital = true } = {}) => {
  const t = markWord(notes, form);
  return capital ? cap(t) : t;
};

export const playBtn = (words, label = 'Hear it', cls = 'tr-icon') =>
  `<button class="${cls}" type="button" data-play="${encSentence(words)}" aria-label="${esc(label)}" title="${esc(label)}">▶</button>`;
export const addBtn = (words, label = 'Add to the sentence', cls = 'tr-icon') =>
  `<button class="${cls}" type="button" data-add="${encSentence(words)}" aria-label="${esc(label)}" title="${esc(label)}">＋</button>`;

// Underline where the English word sits inside a definition.
export function markMatch(definition, q) {
  const text = esc(definition);
  const w = String(q || '').trim().replace(/[^a-z']/gi, '');
  if (w.length < 2) return text;
  return text.replace(new RegExp(`\\b(${w}\\w*)`, 'i'), '<mark>$1</mark>');
}

export const numbersOf = (notes) => notes.map((n) => note(n).num).join(' ');
