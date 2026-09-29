import { NOTES, note, parse, cap, isNote } from '../dictionary/notes.js';
import { meaningOf, allWords, getIndex } from '../dictionary/dictionary.js';
import { SEMANTIC_KEYS } from '../dictionary/grammar.js';
import { on, emit } from '../live/bus.js';
import { playWord } from '../voices/index.js';
import { mirrorOf } from './mirror.model.js';

// The haunting — learning that is discovered, not administered.
// Every mechanic here is built only on the kernel: a live Word, the
// Voices, the Dictionary rules, and Memory.

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
  const top = strip(); const line = document.createElement('div'); line.className = 'mirror-line';
  const bot = strip();
  host.append(top.el, line, bot.el);

  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Play a word: its opposite is the same word backwards.';
  host.appendChild(hint);

  const unwatch = word.watch((notes) => {
    const m = mirrorOf(getIndex(), notes);
    top.render(m.word.notes, m.word.gloss);
    bot.render(m.shadow.notes, m.shadow.gloss);
    hint.hidden = notes.length > 0;
    line.hidden = notes.length === 0;
  });

  return { destroy() { unwatch(); host.textContent = ''; } };

  function strip() {
    const el = document.createElement('div'); el.className = 'mirror-strip';
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
          row.children[i].style.background = note(n).color;
          row.children[i].textContent = cap(n);
        });
        gloss.textContent = notes.length ? (meaning || '—') : '';
      },
    };
  }
}

// ── Discovery ── meet examples; induce the rule. Here: the semantic key.
export function mountDiscovery(host) {
  host.classList.add('discovery');
  render();
  return { destroy() { host.textContent = ''; } };

  function render() {
    host.textContent = '';
    const key = NOTES[Math.floor(familyTick() % 7)].name;             // rotate families
    const family = allWords()
      .filter((w) => parse(w.solresol)[0] === key && parse(w.solresol).length >= 3)
      .slice(0, 24);
    const picks = sample(family, 3);
    const q = document.createElement('p'); q.className = 'disc-q';
    q.textContent = 'Play these three. What do they share?';
    const row = document.createElement('div'); row.className = 'disc-row';
    for (const w of picks) {
      const b = document.createElement('button'); b.className = 'disc-word';
      b.innerHTML = `<b>${w.solresol}</b><i>${w.definition}</i>`;
      b.addEventListener('click', () => { playWord({ notes: parse(w.solresol) }); });
      row.appendChild(b);
    }
    const reveal = document.createElement('button'); reveal.className = 'btn btn--ghost';
    reveal.textContent = 'reveal';
    const ans = document.createElement('div'); ans.className = 'disc-answer';
    reveal.addEventListener('click', () => {
      ans.textContent = `All begin with ${cap(key)} — the family of “${SEMANTIC_KEYS[key]}”.`;
    });
    const again = document.createElement('button'); again.className = 'btn btn--ghost';
    again.textContent = 'another'; again.addEventListener('click', render);
    host.append(q, row, reveal, ans, again);
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
    const ghosts = memory.fading().slice(0, 8);
    title.style.display = ghosts.length ? '' : 'none';
    hint.hidden = ghosts.length > 0;
    // reconcile in place — add/remove ghosts at the tail, never rebuild
    while (row.children.length > ghosts.length) row.removeChild(row.lastChild);
    while (row.children.length < ghosts.length) {
      const g = document.createElement('button'); g.className = 'ghost'; row.appendChild(g);
    }
    ghosts.forEach((key, i) => {
      const g = row.children[i];
      g.textContent = cap(key);
      g.style.opacity = 0.25 + memory.strengthOf(key);
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
const familyTick = () => Math.floor(Date.now() / 9000);
