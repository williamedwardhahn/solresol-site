import { emit } from '../../live/bus.js';
import { playWord, playSentence } from '../../voices/index.js';
import { schedule } from '../../compose/sentence.model.js';
import { decSentence } from './parts.js';
import { mountWordsLeaf } from './words.leaf.js';
import { mountSentenceLeaf } from './sentence.leaf.js';
import { mountPhrasebookLeaf } from './phrasebook.leaf.js';
import { mountComposerLeaf } from './composer.leaf.js';

// Chapter III · Translation — four leaves, each its own address:
//   #/translate             words, both ways
//   #/translate/sentence    a sentence, both ways
//   #/translate/phrasebook  phrases that hold to the canon
//   #/translate/compose     a sentence built by the grammar
//
// Every word on these pages opens its own page (ctx.openWord); ▶ sounds it,
// ＋ sends it to the sentence being said (bus: sentence:add).

const LEAVES = [
  { id: 'words',      href: 'translate',            label: 'Words',      mount: mountWordsLeaf },
  { id: 'sentence',   href: 'translate/sentence',   label: 'Sentences',  mount: mountSentenceLeaf },
  { id: 'phrasebook', href: 'translate/phrasebook', label: 'Phrasebook', mount: mountPhrasebookLeaf },
  { id: 'compose',    href: 'translate/compose',    label: 'Composer',   mount: mountComposerLeaf },
];

export function mountTranslateView(host, ctx, route) {
  host.classList.add('tr');
  host.innerHTML = `
    <p class="lede tr-lede">Seven notes are enough to say anything. Carry a word across,
      then a sentence; keep the phrases a traveller needs; or set the parts of speech
      in their places and let the grammar order them.</p>
    <nav class="tabs tr-tabs" aria-label="Translation">
      ${LEAVES.map((l) => `<a class="tab" href="#/${l.href}" data-leaf="${l.id}">${l.label}</a>`).join('')}
    </nav>
    <div class="tr-leaves"></div>`;
  const leavesEl = host.querySelector('.tr-leaves');
  const mounted = new Map();          // id → { el, handle }
  const timers = new Set();

  function show(r) {
    const id = LEAVES.some((l) => l.id === r?.sub) ? r.sub : 'words';
    host.querySelectorAll('[data-leaf]').forEach((a) => {
      const on = a.dataset.leaf === id;
      a.classList.toggle('is-on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (!mounted.has(id)) {
      const el = document.createElement('section');
      el.className = `tr-leaf tr-leaf--${id}`;
      leavesEl.append(el);
      mounted.set(id, { el, handle: LEAVES.find((l) => l.id === id).mount(el, ctx) });
    }
    for (const [k, m] of mounted) m.el.hidden = k !== id;
    mounted.get(id).handle?.shown?.();
  }

  // One listener for the whole chapter: open, play, add.
  function onClick(e) {
    const t = e.target.closest('[data-open],[data-play],[data-add]');
    if (!t || !host.contains(t)) return;
    if (t.dataset.open !== undefined) { ctx.openWord(t.dataset.open.split('-')); return; }
    if (t.dataset.play !== undefined) { play(t, decSentence(t.dataset.play)); return; }
    if (t.dataset.add !== undefined) {
      const words = decSentence(t.dataset.add);
      words.forEach((notes) => emit('sentence:add', notes));
      flash(t);
    }
  }

  function play(btn, words) {
    if (!words.length) return;
    words.forEach((notes) => emit('word:used', { key: notes.join(''), channel: 'translate' }));
    // light each word of the score as it sounds
    const score = btn.closest('[data-score]');
    const cells = score ? [...score.querySelectorAll('[data-wi]')] : [];
    let offsets = [0], total;
    if (words.length === 1) { playWord({ notes: words[0] }); total = words[0].length * 0.32; }
    else { total = playSentence(words.map((notes) => ({ notes }))); offsets = schedule(words.map((w) => w.length)); }
    btn.classList.add('is-sounding');
    later(() => btn.classList.remove('is-sounding'), (total + 0.2) * 1000);
    cells.forEach((c) => {
      const i = Number(c.dataset.wi), at = offsets[i];
      if (at === undefined) return;
      later(() => c.classList.add('is-sounding'), at * 1000);
      later(() => c.classList.remove('is-sounding'), (at + words[i].length * (words.length === 1 ? 0.32 : 0.28)) * 1000);
    });
  }
  function later(fn, ms) { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); }
  function flash(btn) {
    btn.classList.add('is-done');
    later(() => btn.classList.remove('is-done'), 1300);
  }

  host.addEventListener('click', onClick);
  show(route);

  return {
    update: show,
    destroy() {
      host.removeEventListener('click', onClick);
      timers.forEach(clearTimeout);
      for (const m of mounted.values()) m.handle?.destroy?.();
      host.classList.remove('tr');
      host.textContent = '';
    },
  };
}
