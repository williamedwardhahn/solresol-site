import { note, noteByNumber } from '../dictionary/notes.js?v=c115d42191';

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
    el.style.color = note(n).color; el.classList.add('nt');                       // the figure in its note's colour
  },
  // the ear: a digit 1–7 → a note
  read(value) {
    return (noteByNumber(value) || {}).name || null;
  },
};
