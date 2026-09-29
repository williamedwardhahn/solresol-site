import { VOICES } from '../voices/index.js';
import { playNote } from '../voices/index.js';

// The Choir — a live Word shown by every Voice at once.
//
// One row per Voice, one column per note. When the Word changes, each
// Voice updates only its own cells: columns are added or removed at the
// end, surviving cells are updated in place. The grid persists, nothing
// is rebuilt, and every watcher is released on destroy — so there is no
// flicker and no leak, by construction.
//
// Options: `prefs` (a live value with a `voices` list) hides the rows a
// person switched off; clicking any cell sounds that column's note.

export function mountChoir(host, word, { prefs = null } = {}) {
  host.classList.add('choir');
  host.textContent = '';

  const rows = VOICES.map((voice) => {
    const row = document.createElement('div');
    row.className = 'voice-row';
    row.dataset.voice = voice.name;

    const label = document.createElement('div');
    label.className = 'voice-label';
    label.textContent = voice.label;

    const cells = document.createElement('div');
    cells.className = 'voice-cells';

    row.append(label, cells);
    host.appendChild(row);
    return { voice, row, cells, mounted: [] };
  });

  // One listener for every cell: find the column, sound its note.
  function onClick(e) {
    const cell = e.target.closest('[data-col]');
    if (!cell) return;
    const n = word.notes[Number(cell.dataset.col)];
    if (n) playNote(n);
    host.querySelectorAll(`[data-col="${cell.dataset.col}"]`).forEach((el) => {
      el.classList.remove('cell--ring'); void el.offsetWidth; el.classList.add('cell--ring');
    });
  }
  host.addEventListener('click', onClick);

  const unwatch = word.watch((notes) => {
    for (const row of rows) reconcile(row, notes);
    host.classList.toggle('choir--empty', notes.length === 0);
  });

  const unprefs = prefs
    ? prefs.watch((p) => {
        const on = new Set(p.voices || []);
        for (const r of rows) r.row.hidden = !on.has(r.voice.name);
      })
    : () => {};

  return {
    destroy() {
      unwatch();
      unprefs();
      host.removeEventListener('click', onClick);
      host.textContent = '';
    },
  };
}

function reconcile({ voice, cells, mounted }, notes) {
  while (mounted.length < notes.length) {          // grow: add columns
    const el = voice.mount();
    el.dataset.col = mounted.length;
    cells.appendChild(el);
    mounted.push(el);
  }
  while (mounted.length > notes.length) {          // shrink: drop columns
    cells.removeChild(mounted.pop());
  }
  notes.forEach((n, i) => voice.update(mounted[i], n));   // update in place
}
