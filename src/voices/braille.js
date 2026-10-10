import { note } from '../dictionary/notes.js?v=c115d42191';

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
    el.style.color = note(n).color; el.classList.add('nt');      // the dots in their note's colour
  },
};
