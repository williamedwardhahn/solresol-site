import { isNote } from '../dictionary/notes.js';

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
  },
  // the ear: a written syllable → a note
  read(value) {
    const v = String(value).toLowerCase();
    return isNote(v) ? v : null;
  },
};
