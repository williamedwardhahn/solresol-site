import { VOICES } from '../voices/index.js';

// The Choir — a live Word shown by every Voice at once.
//
// One row per Voice, one column per note. When the Word changes, each
// Voice updates only its own cells: columns are added or removed at the
// end, surviving cells are updated in place. The grid persists, nothing
// is rebuilt, and the single watcher is released on destroy — so there
// is no flicker and no leak, by construction.

export function mountChoir(host, word) {
  host.classList.add('choir');
  host.textContent = '';

  const rows = VOICES.map((voice) => {
    const row = document.createElement('div');
    row.className = 'voice-row';

    const label = document.createElement('div');
    label.className = 'voice-label';
    label.textContent = voice.label;

    const cells = document.createElement('div');
    cells.className = 'voice-cells';

    row.append(label, cells);
    host.appendChild(row);
    return { voice, cells, mounted: [] };
  });

  const unwatch = word.watch((notes) => {
    for (const row of rows) reconcile(row, notes);
    host.classList.toggle('choir--empty', notes.length === 0);
  });

  return {
    destroy() {
      unwatch();
      host.textContent = '';
    },
  };
}

function reconcile({ voice, cells, mounted }, notes) {
  while (mounted.length < notes.length) {          // grow: add columns
    const el = voice.mount();
    cells.appendChild(el);
    mounted.push(el);
  }
  while (mounted.length > notes.length) {          // shrink: drop columns
    cells.removeChild(mounted.pop());
  }
  notes.forEach((n, i) => voice.update(mounted[i], n));   // update in place
}
