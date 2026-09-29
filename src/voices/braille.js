import { note } from '../dictionary/notes.js';

// The Braille voice — a note as its dot pattern.
export const braille = {
  name: 'braille',
  label: 'Braille',
  mount() {
    const el = document.createElement('div');
    el.className = 'cell cell--text cell--braille';
    return el;
  },
  update(el, n) {
    el.textContent = note(n).braille;
  },
};
