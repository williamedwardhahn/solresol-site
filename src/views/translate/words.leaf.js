import { note, cap } from '../../dictionary/notes.js';
import { getIndex } from '../../dictionary/dictionary.js';
import { semanticKey } from '../../dictionary/grammar.js';
import { scriptSVG, staffSVG, colorStripSVG } from '../../graphics/graphics.js';
import { candidates, readNotes } from '../../translate/lookup.js';
import { esc, swatches, playBtn, addBtn, markMatch, numbersOf } from './parts.js';

// Words, both ways: English → the Solresol words that answer it (several,
// best first); Solresol — typed as syllables or as numbers — → its meaning,
// drawn large in colour, script and staff.

const TRY_EN = ['water', 'love', 'music', 'star', 'friend', 'sing'];
const TRY_SOL = ['domisol', 'do mi sol', '1 3 5', 'solresol', 'misol', 'solmi'];

export function mountWordsLeaf(el) {
  el.innerHTML = `
    <div class="two-col tr-words">
      <section class="tr-way">
        <h2 class="rubric">English <span class="tr-arrow">→</span> Solresol
          <span class="rubric-note">several words may answer</span></h2>
        <label class="tr-field">
          <span class="visually-hidden">An English word</span>
          <input class="search" data-en type="search" placeholder="an English word…" autocomplete="off" spellcheck="false" value="love">
        </label>
        <p class="tr-try">Try ${TRY_EN.map((w) => `<button type="button" class="tr-try-btn" data-try-en="${w}">${w}</button>`).join('')}</p>
        <div class="tr-cands" data-cands aria-live="polite"></div>
      </section>
      <section class="tr-way">
        <h2 class="rubric">Solresol <span class="tr-arrow">→</span> English
          <span class="rubric-note">syllables or numbers</span></h2>
        <label class="tr-field">
          <span class="visually-hidden">A Solresol word</span>
          <input class="search tr-sol-input" data-sol type="search" placeholder="domisol · do mi sol · 1 3 5" autocomplete="off" spellcheck="false" value="solresol">
        </label>
        <p class="tr-try">Try ${TRY_SOL.map((w) => `<button type="button" class="tr-try-btn" data-try-sol="${w}">${w}</button>`).join('')}</p>
        <div data-card aria-live="polite"></div>
      </section>
    </div>`;

  const en = el.querySelector('[data-en]'), sol = el.querySelector('[data-sol]');
  const candsEl = el.querySelector('[data-cands]'), cardEl = el.querySelector('[data-card]');

  function renderEn() {
    const q = en.value.trim();
    if (!q) { candsEl.innerHTML = '<p class="tr-empty">Type an English word, and the Solresol words that carry it will gather here.</p>'; return; }
    const list = candidates(getIndex(), q, 10);
    if (!list.length) {
      candsEl.innerHTML = `<p class="tr-empty">No Solresol word carries “${esc(q)}”. Sudre’s dictionary is of 1827: try a plainer word, or its root.</p>`;
      return;
    }
    const via = list[0].via ? `<p class="tr-via">Nothing for “${esc(q)}” itself; these answer “${esc(list[0].via)}”.</p>` : '';
    candsEl.innerHTML = via + `<ol class="tr-cand-list">${list.map((c, i) => `
      <li class="tr-cand ${i === 0 ? 'is-first' : ''}" style="--i:${i}">
        <button type="button" class="tr-cand-word" data-open="${c.notes.join('-')}" title="Open ${esc(cap(c.solresol))}">
          <b>${esc(cap(c.solresol))}</b>${swatches(c.notes)}
        </button>
        <span class="tr-cand-mean">${markMatch(c.definition, c.via || q)}</span>
        <span class="tr-cand-acts">${playBtn([c.notes], `Hear ${cap(c.solresol)}`)}${addBtn([c.notes], `Add ${cap(c.solresol)} to the sentence`)}</span>
      </li>`).join('')}</ol>`;
  }

  function renderSol() {
    const raw = sol.value.trim();
    if (!raw) { cardEl.innerHTML = '<p class="tr-empty">Type a word in syllables — <i>domisol</i>, <i>do mi sol</i> — or in numbers, <i>1 3 5</i>.</p>'; return; }
    const notes = readNotes(raw);
    if (!notes) {
      cardEl.innerHTML = `<p class="tr-empty">“${esc(raw)}” is not written in the seven syllables. Use <i>do re mi fa sol la si</i>, or the numbers 1 to 7.</p>`;
      return;
    }
    const key = notes.join(''), meaning = getIndex().meaningOf(key), family = semanticKey(notes);
    cardEl.innerHTML = `
      <figure class="plate tr-card" data-score>
        <p class="tr-card-family">${notes.length > 1 && family ? `${cap(notes[0])} · ${esc(family)}` : notes.length === 1 ? 'A particle · one note' : ''}</p>
        <button type="button" class="tr-card-word" data-open="${notes.join('-')}" data-wi="0" title="Open its page">${cap(key)}</button>
        <div class="tr-card-script" aria-label="in Sudre's script">${scriptSVG(notes)}</div>
        <div class="tr-card-band">${colorStripSVG([notes], { height: 18 })}</div>
        <p class="tr-card-notes">${notes.map((n) => `<span><b style="--c:${note(n).color}">${note(n).num}</b>${n}</span>`).join('')}</p>
        <p class="tr-card-meaning">${meaning ? esc(meaning) : '<em>Not in the dictionary.</em> A word waiting for a meaning.'}</p>
        <div class="tr-card-staff">${staffSVG([notes], { labels: true })}</div>
        <div class="controls">
          <button type="button" class="btn btn--ink" data-play="${notes.join('-')}">▶ Hear it</button>
          <button type="button" class="btn" data-add="${notes.join('-')}">＋ To sentence</button>
          <button type="button" class="btn btn--ghost" data-open="${notes.join('-')}">Its page →</button>
        </div>
        <figcaption class="plate-caption">${esc(cap(key))} · ${numbersOf(notes)}</figcaption>
      </figure>`;
  }

  const onEn = () => renderEn(), onSol = () => renderSol();
  en.addEventListener('input', onEn);
  sol.addEventListener('input', onSol);
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-try-en],[data-try-sol]');
    if (!t) return;
    if (t.dataset.tryEn) { en.value = t.dataset.tryEn; renderEn(); en.focus({ preventScroll: true }); }
    else { sol.value = t.dataset.trySol; renderSol(); sol.focus({ preventScroll: true }); }
  });

  renderEn();
  renderSol();
  return { destroy() { en.removeEventListener('input', onEn); sol.removeEventListener('input', onSol); } };
}
