import { cap } from '../../dictionary/notes.js';
import { getIndex } from '../../dictionary/dictionary.js';
import { staffSVG, colorStripSVG } from '../../graphics/graphics.js';
import { translateEnglish, glossSolresol } from '../../translate/english.model.js';
import { esc, swatches, written, encSentence } from './parts.js';
import { wordHTML } from '../../graphics/graphics.js';

// A sentence, both ways, laid out as an interlinear gloss: the English
// word, the Solresol word under it, its colours, its sense. Particles are
// named for what they do; words with no Solresol are marked, not guessed.

const TRY_EN = ["I don't understand.", 'Do you speak Solresol?', 'Yesterday I was happy.', 'We will sing tomorrow.', 'I love you'];
const TRY_SOL = ['Dore do falafa', 'Falafa domi?', 'Doré mimi solremifa lami', 'Dofā dodo milasi la solmisolre'];

const ROLE = { tense: 'tense', neg: 'negation', pronoun: 'pronoun', particle: 'particle', unknown: 'no word' };

export function mountSentenceLeaf(el) {
  let dir = 'en';
  const text = { en: "Don't you understand?", sol: 'Dore dodo do falafa' };

  el.innerHTML = `
    <div class="tr-sent-head">
      <div class="seg" role="group" aria-label="Direction">
        <button type="button" class="seg-btn" data-dir="en">From English</button>
        <button type="button" class="seg-btn" data-dir="sol">From Solresol</button>
      </div>
    </div>
    <label class="tr-field tr-field--wide">
      <span class="visually-hidden">A sentence</span>
      <input class="search tr-sent-input" data-input autocomplete="off" spellcheck="false">
    </label>
    <p class="tr-try" data-try></p>
    <div data-out aria-live="polite"></div>`;

  const input = el.querySelector('[data-input]'), out = el.querySelector('[data-out]'), tryEl = el.querySelector('[data-try]');

  function setDir(d) {
    dir = d;
    el.querySelectorAll('[data-dir]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dir === d)));
    input.value = text[d];
    input.placeholder = d === 'en' ? 'an English sentence…' : 'a Solresol sentence — dore do falafa';
    input.classList.toggle('is-sol', d === 'sol');
    tryEl.innerHTML = 'Try ' + (d === 'en' ? TRY_EN : TRY_SOL).map((s) => `<button type="button" class="tr-try-btn" data-try="${esc(s)}">${wordHTML(esc(s))}</button>`).join('');
    render();
  }

  function render() {
    text[dir] = input.value;
    const q = input.value.trim();
    if (!q) { out.innerHTML = `<p class="tr-empty">${dir === 'en' ? 'Write a sentence in English.' : 'Write a sentence in Solresol.'}</p>`; return; }
    const r = dir === 'en' ? translateEnglish(getIndex(), q) : glossSolresol(getIndex(), q);
    if (!r.items.length) { out.innerHTML = '<p class="tr-empty">Nothing to carry across yet.</p>'; return; }
    const known = r.items.filter((i) => i.notes);
    const words = known.map((i) => i.notes);
    const missing = r.items.filter((i) => !i.notes);
    let wi = 0;
    const firstKnown = r.items.findIndex((i) => i.notes);

    const cols = r.items.map((it, k) => {
      const role = ROLE[it.role];
      if (!it.notes) {
        return `<li class="gl gl--unknown">
          <span class="gl-src">${esc(it.from)}</span>
          <span class="gl-sol" title="No Solresol word for this">?</span>
          <span class="gl-sw"></span>
          <span class="gl-sense">no word</span>
        </li>`;
      }
      const idx = wi++;
      const t = written(it.notes, it.form, { capital: k === firstKnown });
      const src = dir === 'en' ? (it.from ? esc(it.from) : '<i aria-hidden="true">·</i>') : '';
      return `<li class="gl gl--${it.role}" data-wi="${idx}" style="--i:${k}">
        ${dir === 'en' ? `<span class="gl-src">${src}</span>` : ''}
        <button type="button" class="gl-sol" data-open="${it.notes.join('-')}" title="${esc(it.definition || it.gloss)}">${wordHTML(esc(t))}</button>
        <span class="gl-sw">${swatches(it.notes)}</span>
        <span class="gl-sense">${esc(it.gloss)}</span>
        ${role ? `<span class="gl-role">${role}</span>` : ''}
      </li>`;
    }).join('');

    const line = known.map((it, k) => written(it.notes, it.form, { capital: k === 0 })).join(' ') + (r.question ? '?' : '.');
    const english = r.items.map((i) => (i.notes ? (i.role === 'tense' ? `(${i.gloss})` : i.gloss) : `[${i.from}]`)).join(' ');
    const notes = r.notes.map(esc);
    if (missing.length) notes.push(`${missing.length === 1 ? 'One word has' : `${missing.length} words have`} no Solresol in Sudre’s dictionary (${missing.map((m) => `“${esc(m.from)}”`).join(', ')}) — left out of the sound, never guessed.`);

    out.innerHTML = `
      <div class="tr-sent" data-score>
        <ol class="gloss" aria-label="Word by word">${cols}</ol>
        ${words.length ? `
        <figure class="plate tr-score">
          <p class="tr-read"><span class="tr-read-sol">${wordHTML(esc(line))}</span>
            <span class="tr-read-en">${dir === 'en' ? `“${esc(q)}”` : esc(english)}</span></p>
          <div class="tr-staff">${staffSVG(words, { labels: false })}</div>
          ${colorStripSVG(words, { height: 16 })}
          <div class="controls tr-score-acts">
            <button type="button" class="btn btn--ink" data-play="${encSentence(words)}">▶ Hear the sentence</button>
            <button type="button" class="btn" data-add="${encSentence(words)}">＋ Use this sentence</button>
          </div>
          <figcaption class="plate-caption">${words.length} word${words.length === 1 ? '' : 's'} · ${words.flat().length} notes</figcaption>
        </figure>` : ''}
        ${notes.length ? `<ul class="tr-notes">${notes.map((n) => `<li>${n}</li>`).join('')}</ul>` : ''}
      </div>`;
  }

  const onInput = () => render();
  input.addEventListener('input', onInput);
  el.addEventListener('click', (e) => {
    const d = e.target.closest('[data-dir]');
    if (d) { setDir(d.dataset.dir); return; }
    const t = e.target.closest('[data-try]');
    if (t && t.dataset.try) { input.value = t.dataset.try; render(); }
  });
  setDir('en');
  return { destroy() { input.removeEventListener('input', onInput); } };
}
