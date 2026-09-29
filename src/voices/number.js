import { note, noteByNumber } from '../dictionary/notes.js';

// The Number voice — a note as 1–7.
export const number = {
  name: 'number',
  label: 'Number',
  mount() {
    const el = document.createElement('div');
    el.className = 'cell cell--text';
    return el;
  },
  update(el, n) {
    el.textContent = note(n).num;
  },
  // the ear: a digit 1–7 → a note
  read(value) {
    return (noteByNumber(value) || {}).name || null;
  },
};
