import { NOTES, note, parse, cap } from '../dictionary/notes.js';
import { meaningOf, allWords, getIndex } from '../dictionary/dictionary.js';
import { SEMANTIC_KEYS } from '../dictionary/grammar.js';
import { on } from '../live/bus.js';
import { playWord } from '../voices/index.js';
import { mirrorOf } from './mirror.model.js';

// The haunting — learning that is discovered, not administered.
// Every mechanic here is built only on the kernel: a live Word, the
// Voices, the Dictionary rules, and Memory. A word shown with
// data-word="…" opens its own page wherever the host listens for it
// (the School does).

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const firstSenses = (d, n = 2) => (d ? d.split(/,\s*/).slice(0, n).join(', ') : '');

// ── The Arrival ── meaning comes out of the dark, from notes you played.
export function mountArrival(host) {
  host.classList.add('arrival');
  host.textContent = 'Play any three notes.';
  const off = on('word:commit', (notes) => {
    const m = meaningOf((notes || []).join(''));
    host.textContent = m
      ? `You just said “${m}”.`
      : `That has no meaning yet — but keep going.`;
    host.classList.add('arrival--revealed');
  });
  return { destroy: off };
}

// ── The Mirror ── a word and its reversed shadow (opposition by reversal).
export function mountMirror(host, word) {
  host.classList.add('mirror');
  host.textContent = '';
  const top = strip('word'); const line = document.createElement('div'); line.className = 'mirror-line';
  line.innerHTML = '<span>reversed</span>';
  const bot = strip('shadow');
  host.append(top.el, line, bot.el);

  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Play a word: its opposite is often the same word backwards.';
  host.appendChild(hint);

  const unwatch = word.watch((notes) => {
    const m = mirrorOf(getIndex(), notes);
    top.render(m.word.notes, m.word.gloss);
    bot.render(m.shadow.notes, m.shadow.gloss);
    hint.hidden = notes.length > 0;
    line.hidden = notes.length === 0;
  });

  return { destroy() { unwatch(); host.textContent = ''; } };

  function strip(kind) {
    const el = document.createElement('div'); el.className = `mirror-strip mirror-strip--${kind}`;
    const row = document.createElement('div'); row.className = 'mirror-blocks';
    const gloss = document.createElement('div'); gloss.className = 'mirror-gloss';
    el.append(row, gloss);
    return {
      el,
      render(notes, meaning) {
        // reconcile blocks in place
        while (row.children.length < notes.length) {
          const b = document.createElement('span'); b.className = 'mirror-block'; row.appendChild(b);
        }
        while (row.children.length > notes.length) row.removeChild(row.lastChild);
        notes.forEach((n, i) => {
          row.children[i].style.setProperty('--c', note(n).color);
          row.children[i].textContent = cap(n);
        });
        const key = notes.join('');
        gloss.innerHTML = !notes.length ? ''
          : `<b data-word="${key}" role="link" tabindex="0">${cap(key)}</b> <i>${meaning ? esc(firstSenses(meaning, 3)) : 'no word — the mirror is empty'}</i>`;
      },
    };
  }
}

// ── Discovery ── meet examples; induce the rule. Here: the semantic key,
// shown on four-note words without a repeated note (where Gajewski's keys hold).
export function mountDiscovery(host) {
  host.classList.add('discovery');
  let last = null;
  render();
  const onClick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.play) playWord({ notes: parse(t.dataset.play) });
    else if (t.dataset.reveal !== undefined) { host.querySelector('.disc-answer').hidden = false; t.hidden = true; }
    else if (t.dataset.again !== undefined) render();
  };
  host.addEventListener('click', onClick);
  return { destroy() { host.removeEventListener('click', onClick); host.textContent = ''; } };

  function render() {
    const keys = NOTES.map((n) => n.name).filter((k) => k !== last);
    const key = keys[Math.floor(Math.random() * keys.length)];
    last = key;
    const family = allWords().filter((w) => {
      const ns = parse(w.solresol);
      return ns[0] === key && ns.length === 4 && new Set(ns).size === 4;
    });
    const picks = sample(family, 3);
    host.innerHTML = `
      <p class="disc-q">Hear these three. What do they share?</p>
      <div class="disc-row">
        ${picks.map((w) => `<div class="disc-word">
          <button type="button" class="disc-play" data-play="${w.solresol}" aria-label="Hear ${esc(w.solresol)}">▶</button>
          <b data-word="${w.solresol.toLowerCase()}" role="link" tabindex="0">${esc(w.solresol)}</b>
          <i>${esc(firstSenses(w.definition))}</i>
        </div>`).join('')}
      </div>
      <p class="disc-answer" hidden>All begin with <b style="--c:${note(key).color}">${cap(key)}</b> — the key of <i>${esc(SEMANTIC_KEYS[key].toLowerCase())}</i>.</p>
      <div class="controls disc-controls">
        <button type="button" class="btn btn--small" data-reveal>Reveal</button>
        <button type="button" class="btn btn--ghost btn--small" data-again>Another three</button>
      </div>`;
  }
}

// ── The Fading ── words you are forgetting return, dim. Sing them back.
export function mountFading(host, word, memory) {
  host.classList.add('fading');
  const title = document.createElement('div'); title.className = 'fading-title';
  title.textContent = 'Fading — bring these back';
  const row = document.createElement('div'); row.className = 'fading-row';
  const hint = document.createElement('p'); hint.className = 'hint';
  hint.textContent = 'Words you have used dim as you forget them. Use some, and they will come back here to be sung again.';
  host.append(title, row, hint);

  function render() {
    const ghosts = memory.fading().filter((k) => parse(k).length).slice(0, 12);
    title.style.display = ghosts.length ? '' : 'none';
    hint.hidden = ghosts.length > 0;
    // reconcile in place — add/remove ghosts at the tail, never rebuild
    while (row.children.length > ghosts.length) row.removeChild(row.lastChild);
    while (row.children.length < ghosts.length) {
      const g = document.createElement('button'); g.className = 'ghost'; g.type = 'button'; row.appendChild(g);
    }
    ghosts.forEach((key, i) => {
      const g = row.children[i];
      g.textContent = cap(key);
      g.dataset.word = key;
      g.style.opacity = Math.min(1, 0.25 + memory.strengthOf(key));
      g.onclick = () => { word.set(parse(key)); playWord({ notes: parse(key) }); };
    });
  }
  const unwatch = memory.watch(render);
  render();
  return { destroy() { unwatch(); host.textContent = ''; } };
}

const sample = (arr, k) => {
  const a = [...arr]; const out = [];
  while (a.length && out.length < k) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
  return out;
};
