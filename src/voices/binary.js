import { note } from '../dictionary/notes.js';

// The Binary voice — a note as three bits (do = 001 … si = 111).
export const binary = {
  name: 'binary',
  label: 'Binary',
  mount() {
    const el = document.createElement('div');
    el.className = 'cell cell--text cell--binary';
    return el;
  },
  update(el, n) {
    el.textContent = note(n).num.toString(2).padStart(3, '0');
  },
};
