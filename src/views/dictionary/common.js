import { note, cap } from '../../dictionary/notes.js?v=8aaee6f447';
import { allWords } from '../../dictionary/dictionary.js?v=8aaee6f447';
import { prepare } from './lexicon.model.js?v=8aaee6f447';
import { numbersHTML } from '../../graphics/graphics.js?v=8aaee6f447';

// Small shared pieces of the Dictionary chapter: the prepared lexicon
// (built once per loaded word list) and the markup every tab writes.
// Any element with data-open="key" opens that word's page; data-play="key"
// sounds it; data-play2="a b" sounds two words in turn. dictionary.view.js
// listens for those once, for every tab.

let cache = { src: null, lex: null };
export function lexicon() {
  const src = allWords();
  if (cache.src !== src) {
    const entries = prepare(src);
    cache = { src, lex: { entries, byKey: new Map(entries.map((e) => [e.key, e])) } };
  }
  return cache.lex;
}

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const fmt = (n) => Number(n).toLocaleString('en-US');

export const swatches = (notes, cls = '') =>
  `<span class="swatches ${cls}" aria-hidden="true">${notes.map((n) => `<i style="background:${note(n).color}"></i>`).join('')}</span>`;

// a word's figures, each in its note's colour (HTML)
export const digits = (notes) => numbersHTML(notes);

export const playBtn = (key, label = cap(key)) =>
  `<button class="dx-play" data-play="${key}" aria-label="Hear ${label}" title="Hear ${label}">▶</button>`;

// One dictionary entry, as a row: headword over its colours and figures,
// then the gloss, then play.
export function entryRow(e, { gloss = true } = {}) {
  return `<li class="dx-entry">
    <button class="dx-entry-open" data-open="${e.key}">
      <span class="dx-head"><b>${e.text}</b><span class="dx-sig">${swatches(e.notes)}<small>${digits(e.notes)}</small></span></span>
      ${gloss ? `<span class="dx-gloss">${e.definition ? esc(e.definition) : '<em class="dx-nogloss">no gloss given</em>'}</span>` : ''}
    </button>${playBtn(e.key, e.text)}</li>`;
}
