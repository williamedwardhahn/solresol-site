import { PHRASEBOOK, phraseWords } from '../../translate/phrases.js';
import { readNotes } from '../../translate/lookup.js';
import { esc, swatches, playBtn, addBtn } from './parts.js';

// The phrasebook — a traveller's pages, each phrase checked against the
// dictionary and the canonical grammar (see src/translate/phrases.js).

export function mountPhrasebookLeaf(el) {
  const row = (p, k) => {
    const ws = phraseWords(p.sol);
    const notes = ws.map((w) => readNotes(w));
    // keep the written phrase (marks, commas, the question mark), each word a link to its page
    let i = 0;
    const solHtml = esc(p.sol).replace(/[^\s,.!?]+/g, (w) => {
      const n = notes[i], lit = p.lit[i]; i++;
      return `<button type="button" class="pb-w" data-open="${n.join('-')}" title="${esc(lit)}">${w}</button>`;
    });
    return `<li class="pb-row" data-score style="--i:${k}">
      <p class="pb-en">${esc(p.en)}</p>
      <div class="pb-sol-wrap">
        <p class="pb-sol">${solHtml}</p>
        <p class="pb-lit">${p.lit.map((l, j) => `<span data-wi="${j}">${esc(l)}</span>`).join('<i aria-hidden="true">·</i>')}</p>
      </div>
      <span class="pb-sw">${notes.map((n) => swatches(n)).join('')}</span>
      <span class="pb-acts">${playBtn(notes, `Hear “${p.en}”`)}${addBtn(notes, `Add “${p.en}” to the sentence`)}</span>
    </li>`;
  };

  el.innerHTML = `
    <nav class="pb-index" aria-label="Phrasebook sections">
      ${PHRASEBOOK.map((c, i) => `<button type="button" class="pb-index-btn" data-goto="${c.id}"><span class="pb-num">${['i', 'ii', 'iii', 'iv', 'v'][i]}</span>${c.label}</button>`).join('')}
    </nav>
    ${PHRASEBOOK.map((c, i) => `
      <section class="pb-cat" id="pb-${c.id}">
        <header class="pb-head">
          <span class="pb-head-num">${['I', 'II', 'III', 'IV', 'V'][i]}</span>
          <h2 class="section-title">${c.label}</h2>
          <p class="hint">${esc(c.note)}</p>
        </header>
        <ol class="pb-list">${c.phrases.map(row).join('')}</ol>
      </section>`).join('')}
    <p class="tr-colophon">Every word above is in Sudre’s dictionary as this site keeps it; the order of words follows
      Gajewski’s grammar of 1902. Tap any word to open its own page.</p>`;

  el.addEventListener('click', (e) => {
    const g = e.target.closest('[data-goto]');
    if (g) el.querySelector(`#pb-${g.dataset.goto}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  return { destroy() {} };
}
