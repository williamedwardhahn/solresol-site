import { isNote, note } from '../dictionary/notes.js?v=c5b00be221';

// The Solfège voice — a note as its written syllable.
export const solfege = {
  name: 'solfege',
  label: 'Solfège',
  mount() {
    const el = document.createElement('div');
    el.className = 'cell cell--text';
    return el;
  },
  update(el, n) {
    el.textContent = n[0].toUpperCase() + n.slice(1);
    el.style.color = note(n).color; el.classList.add('nt');                       // the syllable in its note's colour
  },
  // the ear: a written syllable → a note
  read(value) {
    const v = String(value).toLowerCase();
    return isNote(v) ? v : null;
  },
};
