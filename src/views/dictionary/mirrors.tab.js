import { NOTES, parse, cap } from '../../dictionary/notes.js';
import { playNote } from '../../voices/index.js';
import { fold } from '../../dictionary/index.js';
import { mirrorOf, mirrorPairs, SUDRE_PAIRS, ECO_EXCEPTIONS } from './lexicon.model.js';
import { lexicon, esc, fmt, swatches, digits } from './common.js';

// Mirrors — Sudre's "inverse of the thought by the inverse of the sign":
// read a word backwards and, often, its meaning turns over. A looking-glass
// to try any word in, his own examples, and every pair the dictionary holds.

const STEP = 40;
let pairCache = { entries: null, pairs: null };

export function mountMirrors(host, ctx, route, memo) {
  const { entries, byKey } = lexicon();
  if (pairCache.entries !== entries) pairCache = { entries, pairs: mirrorPairs(entries) };
  const pairs = pairCache.pairs;
  const st = memo.mirrors ||= { notes: ['fa', 'la'], q: '', syl: 0, shown: STEP };
  if (ctx.word.notes.length > 1) st.notes = ctx.word.notes.slice();   // a word built on the instrument comes here to be reversed

  host.innerHTML = `
    <p class="lede dx-lede">Reverse a word and you often reverse its sense: <i>Fala</i>, good; <i>Lafa</i>, bad.
      It is a principle, not a law — Sudre used it most in short words, and it fails often enough
      that the dictionary is the only judge. Try any word.</p>

    <figure class="plate dx-glass">
      <div class="dx-glass-in">
        <input class="search dx-glass-q" aria-label="A word to reverse" placeholder="Write a word — Fala, Misol, 5 6 4…"
          autocomplete="off" autocapitalize="off" spellcheck="false">
        <div class="dx-keys" role="group" aria-label="Play notes into the word">
          ${NOTES.map((n) => `<button class="dx-key" data-key="${n.name}" style="--c:${n.color}" aria-label="${n.name}">${n.name}</button>`).join('')}
          <button class="dx-key dx-key--edit" data-edit="back" aria-label="Remove the last note">⌫</button>
          <button class="dx-key dx-key--edit" data-edit="clear" aria-label="Clear">×</button>
        </div>
      </div>
      <div class="dx-facing" aria-live="polite"></div>
    </figure>

    <section class="leaf">
      <h2 class="rubric">Sudre's own examples</h2>
      <ul class="dx-pairs">${SUDRE_PAIRS.map(([a, b]) => pairRow(byKey.get(a), byKey.get(b))).join('')}</ul>
      <h2 class="rubric dx-gap">Where it fails <span class="rubric-note">Umberto Eco's counter-examples</span></h2>
      <ul class="dx-pairs dx-pairs--fail">${ECO_EXCEPTIONS.map(([a, b]) => pairRow(byKey.get(a), byKey.get(b))).join('')}</ul>
    </section>

    <section class="leaf">
      <h2 class="rubric">Every mirrored pair <span class="rubric-note">both a word and its reversal are in the dictionary; palindromes left out</span></h2>
      <div class="dx-find dx-find--pairs">
        <input class="search dx-pairs-q" type="search" placeholder="Find a pair…" aria-label="Find a pair" autocomplete="off" value="${esc(st.q)}">
        <div class="seg" role="group" aria-label="Syllables">
          ${[0, 2, 3, 4, 5].map((n) => `<button class="seg-btn" data-psyl="${n}" aria-pressed="${st.syl === n}">${n || 'All'}</button>`).join('')}
        </div>
      </div>
      <p class="dx-count dx-pairs-count"></p>
      <ul class="dx-pairs dx-pairs-all"></ul>
      <div class="controls"><button class="btn btn--ghost dx-more">Show more</button></div>
    </section>`;

  const input = host.querySelector('.dx-glass-q');
  const facing = host.querySelector('.dx-facing');
  const pq = host.querySelector('.dx-pairs-q');
  const listEl = host.querySelector('.dx-pairs-all');
  const countEl = host.querySelector('.dx-pairs-count');
  const more = host.querySelector('.dx-more');

  function paintGlass(fromInput = false) {
    if (!fromInput) input.value = st.notes.length ? cap(st.notes.join('')) : '';
    const m = mirrorOf(byKey, st.notes);
    if (!st.notes.length) { facing.innerHTML = '<p class="dx-glass-empty">Write or play a word to see it in the glass.</p>'; return; }
    const side = (notes, e, cls) => `
      <button class="dx-face ${cls}" data-open="${notes.join('')}">
        <span class="dx-face-word">${cap(notes.join(''))}</span>
        ${swatches(notes, 'dx-face-sw')}
        <span class="dx-face-num">${digits(notes)}</span>
        <span class="dx-face-gloss">${e ? esc(e.definition) : '<em>not in the dictionary</em>'}</span>
      </button>`;
    const verdict = {
      single: 'One note has no reverse: it is its own mirror.',
      palindrome: 'A palindrome — the word is its own mirror.',
      pair: 'Both are words. Read them together: is the second the first turned over?',
      empty: 'The mirror is empty: the reversal is not a word in the dictionary.',
      unknown: 'Only the reversal is a word.',
      neither: 'Neither way round is in the dictionary.',
    }[m.status];
    facing.innerHTML = `
      ${side(m.notes, m.word, 'dx-face--l')}
      <button class="dx-swap" data-play2="${m.notes.join('')} ${m.rev.join('')}" aria-label="Hear both" title="Hear both">⇄</button>
      ${side(m.rev, m.shadow, 'dx-face--r')}
      <p class="dx-verdict">${verdict}</p>`;
  }

  function paintPairs(reset = true) {
    if (reset) st.shown = STEP;
    const q = fold(st.q);
    const hit = pairs.filter(([a, b]) =>
      (!st.syl || (st.syl >= 5 ? a.notes.length >= 5 : a.notes.length === st.syl)) &&
      (!q || a.key.includes(q) || b.key.includes(q) || a.fDef.includes(q) || b.fDef.includes(q)));
    countEl.textContent = `${fmt(hit.length)} ${hit.length === 1 ? 'pair' : 'pairs'}${hit.length < pairs.length ? ` of ${fmt(pairs.length)}` : ''}`;
    listEl.innerHTML = hit.length ? hit.slice(0, st.shown).map(([a, b]) => pairRow(a, b)).join('')
      : '<li class="dx-empty">No pair matches.</li>';
    more.hidden = hit.length <= st.shown;
    more.textContent = `Show more (${fmt(hit.length - st.shown)} left)`;
    more.onclick = () => { st.shown += STEP * 2; paintPairs(false); };
  }

  const onInput = (e) => {
    if (e.target === input) {
      const s = input.value.trim();
      st.notes = /^[1-7\s]+$/.test(s) ? [...s.replace(/\s/g, '')].map((d) => NOTES[d - 1].name) : parse(s);
      paintGlass(true);
    } else if (e.target === pq) { st.q = pq.value; paintPairs(); }
  };
  const onClick = (e) => {
    const t = e.target.closest('button');
    if (!t || !host.contains(t)) return;
    if (t.dataset.key) { st.notes.push(t.dataset.key); playNote(t.dataset.key); paintGlass(); }
    else if (t.dataset.edit === 'back') { st.notes.pop(); paintGlass(); }
    else if (t.dataset.edit === 'clear') { st.notes = []; paintGlass(); }
    else if (t.dataset.psyl !== undefined) {
      st.syl = Number(t.dataset.psyl);
      host.querySelectorAll('[data-psyl]').forEach((b) => b.setAttribute('aria-pressed', String(b === t)));
      paintPairs();
    }
  };
  host.addEventListener('input', onInput);
  host.addEventListener('click', onClick);
  paintGlass();
  paintPairs(false);

  return {
    update() {},
    destroy() { host.removeEventListener('input', onInput); host.removeEventListener('click', onClick); },
  };
}

function pairRow(a, b) {
  if (!a || !b) return '';
  const w = (e) => `<button class="dx-pw" data-open="${e.key}">${swatches(e.notes)}<b>${e.text}</b><span>${esc(e.definition)}</span></button>`;
  return `<li class="dx-pair">${w(a)}<button class="dx-swap dx-swap--small" data-play2="${a.key} ${b.key}" aria-label="Hear ${a.text} then ${b.text}">⇄</button>${w(b)}</li>`;
}

