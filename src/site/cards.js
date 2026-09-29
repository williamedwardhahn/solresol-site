import { parse } from '../dictionary/notes.js';
import { search } from '../dictionary/dictionary.js';
import { emit } from '../live/bus.js';
import { playWord } from '../voices/index.js';
import { mountKeyboard } from '../ui/keyboard.js';
import { mountChoir } from '../ui/choir.js';
import { mountPredictor, mountConstellation } from '../map/map.js';
import { mountSentenceBar } from '../compose/compose.js';
import { mountColorIn, mountNumberIn, mountToneIn, mountMidiIn } from '../sense/inputs.js';
import { mountTranslate } from '../translate/translate.js';
import { mountArrival, mountMirror, mountDiscovery, mountFading } from '../learn/learn.js';
import { mountBook, mountGame } from '../outputs/outputs.js';

// The cards — the main site is a registry of these. Each card is a small,
// self-contained view that plugs into the SHARED kernel (ctx). Cards never
// call each other; they meet only at ctx, which is what keeps them both
// modular AND connected. Add a feature = write a mount + add one line here.

// ── the instrument: build a word, see every voice, commit it ──
function mountPlay(host, ctx) {
  const { word } = ctx;
  host.innerHTML = `
    <div data-arrival class="arrival"></div>
    <div class="readout">
      <div data-name class="word-name">—</div>
      <div data-meaning class="word-meaning"></div>
      <div data-family class="word-family"></div>
    </div>
    <div data-choir></div>
    <div data-predictor></div>
    <div class="controls">
      <button data-play class="btn">▶ Play</button>
      <button data-commit class="btn">＋ Commit</button>
      <button data-clear class="btn btn--ghost">Clear</button>
    </div>
    <div data-keyboard></div>`;
  const q = (s) => host.querySelector(s);
  const kids = [
    mountArrival(q('[data-arrival]')),
    mountChoir(q('[data-choir]'), word),
    mountPredictor(q('[data-predictor]'), word),
    mountKeyboard(q('[data-keyboard]'), word, { onCommit: ctx.commit }),
  ];

  const name = q('[data-name]'), meaning = q('[data-meaning]'), family = q('[data-family]');
  const unwatch = word.watch(() => {
    name.textContent = word.text || '—';
    meaning.textContent = word.meaning ||
      (word.length ? 'not in the dictionary yet' : 'play the home row  A S D F  J K L  —  space or ;  finishes a word');
    family.textContent = word.family ? `family · ${word.family}` : '';
  });
  q('[data-play]').addEventListener('click', () => playWord(word));
  q('[data-commit]').addEventListener('click', ctx.commit);
  q('[data-clear]').addEventListener('click', () => word.clear());

  return { destroy() { unwatch(); destroyAll(kids); host.textContent = ''; } };
}

// ── the ears ──
function mountListen(host, ctx) {
  host.innerHTML = `
    <p class="hint">A word can enter by any sense. Each of these writes to the same living word above.</p>
    <div class="ear"><span class="ear-label">Paint</span><div data-c></div></div>
    <div class="ear"><span class="ear-label">Type</span><div data-n></div></div>
    <div class="ear"><span class="ear-label">Sing</span><div data-t></div></div>
    <div class="ear"><span class="ear-label">Play</span><div data-m></div></div>`;
  const kids = [
    mountColorIn(host.querySelector('[data-c]'), ctx.word),
    mountNumberIn(host.querySelector('[data-n]'), ctx.word),
    mountToneIn(host.querySelector('[data-t]'), ctx.word),
    mountMidiIn(host.querySelector('[data-m]'), ctx.word),
  ];
  return { destroy() { destroyAll(kids); host.textContent = ''; } };
}

// Call destroy() on any children that returned one.
function destroyAll(kids) {
  for (const k of kids) if (k && typeof k.destroy === 'function') k.destroy();
}

// ── the dictionary ──
function mountDictionaryCard(host, ctx) {
  host.innerHTML = `<input data-s class="search" placeholder="Search 3,000+ words…" autocomplete="off" spellcheck="false"><p data-h class="hint">Search by meaning (“water”) or by word (“Solresol”). Click a result to hear it.</p><div data-r class="results"></div>`;
  const s = host.querySelector('[data-s]'), r = host.querySelector('[data-r]'), h = host.querySelector('[data-h]');
  s.addEventListener('input', () => {
    r.textContent = '';
    const hits = search(s.value, 12);
    h.hidden = !!s.value.trim();
    if (s.value.trim() && !hits.length) {
      h.hidden = false;
      h.textContent = `No word for “${s.value.trim()}” yet.`;
    } else if (!s.value.trim()) {
      h.textContent = 'Search by meaning (“water”) or by word (“Solresol”). Click a result to hear it.';
    }
    for (const w of hits) {
      const b = document.createElement('button');
      b.className = 'result';
      b.innerHTML = `<b>${w.solresol}</b><span>${w.definition}</span>`;
      b.addEventListener('click', () => {
        ctx.word.set(parse(w.solresol));
        emit('word:used', { key: w.solresol.toLowerCase(), channel: 'dictionary' });
        playWord(ctx.word);
      });
      r.appendChild(b);
    }
  });
  return { destroy() { host.textContent = ''; } };
}

export const CARDS = [
  { id: 'play',       title: 'Build a word',                       wide: true,  mount: mountPlay },
  { id: 'sentence',   title: 'Say something',                                   mount: (h) => mountSentenceBar(h) },
  { id: 'listen',     title: 'Listen — the language comes in',                  mount: mountListen },
  { id: 'translate',  title: 'Translate',                                       mount: (h) => mountTranslate(h) },
  { id: 'mirror',     title: 'The mirror — opposition by reversal',             mount: (h, c) => mountMirror(h, c.word) },
  { id: 'sky',        title: 'The sky — light it by learning',      wide: true,  mount: (h, c) => mountConstellation(h, c.word, c.memory) },
  { id: 'discovery',  title: 'Discover',                                        mount: (h) => mountDiscovery(h) },
  { id: 'fading',     title: 'Fading — sing them back',                         mount: (h, c) => mountFading(h, c.word, c.memory) },
  { id: 'book',       title: 'The plate — a page of the book',                  mount: (h, c) => mountBook(h, c.word) },
  { id: 'game',       title: 'Play — hear the colour',                          mount: (h, c) => mountGame(h, c.memory) },
  { id: 'dictionary', title: 'The dictionary',                                  mount: mountDictionaryCard },
];
