import { note, cap, parse } from '../../dictionary/notes.js';
import { playNote } from '../../voices/index.js';

// Small shared pieces for the School's pages: escaping, a word written
// as a link into its panel, a word's colours, and speech with a tonic
// accent (a rinforzando: the stressed note is held and doubled).

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// A word as a clickable link to its own page. `shown` is the written form
// (with marks) when it differs from the dictionary key.
export function wordLink(key, { shown = null, cls = '' } = {}) {
  const k = parse(key).join('');
  return `<button type="button" class="ln-w ${cls}" data-word="${k}" title="Open ${cap(k)}">${esc(cap(shown || k))}</button>`;
}

export const swatches = (notes) =>
  `<span class="swatches" aria-hidden="true">${notes.map((n) => `<i style="background:${note(n).color}"></i>`).join('')}</span>`;

// Play a word as it is spoken with its marks: the accented syllable is
// longer and doubled (louder); the feminine / plural lengthen the last.
export function sayWord(notes, { accent = -1, feminine = false, plural = false } = {}, when = 0) {
  let t = when;
  notes.forEach((n, i) => {
    const last = i === notes.length - 1;
    const stressed = i === accent;
    const dur = stressed ? 0.62 : (last && (feminine || plural)) ? 0.75 : 0.36;
    playNote(n, t, dur);
    if (stressed) playNote(n, t, dur);
    t += dur - 0.04;
  });
  return t - when;
}

// Play a list of words with a breath between them.
export function saySentence(words, gap = 0.28) {
  let t = 0;
  for (const w of words) { t += sayWord(Array.isArray(w) ? w : w.notes, w.marks || {}, t) + gap; }
  return t;
}

// A tiny delegated handler: clicks on [data-word] open that word's panel.
export function bindWordLinks(host, ctx) {
  const onClick = (e) => {
    const t = e.target.closest('[data-word]');
    if (!t || !host.contains(t)) return;
    e.preventDefault();
    ctx.openWord(t.dataset.word);
  };
  host.addEventListener('click', onClick);
  return () => host.removeEventListener('click', onClick);
}

export const today = () => new Date().toISOString().slice(0, 10);

export function loadJSON(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode or quota */ }
}
