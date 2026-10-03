import { note } from '../dictionary/notes.js?v=d5188c5e91';

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
    el.style.color = note(n).color; el.classList.add('nt');
  },
};
