import { note, NOTES } from '../dictionary/notes.js';

// The Colour voice — a note as its place in the rainbow.
export const color = {
  name: 'color',
  label: 'Colour',
  mount() {
    const el = document.createElement('div');
    el.className = 'cell cell--color';
    return el;
  },
  update(el, n) {
    el.style.background = note(n).color;
    el.title = n;
  },
  // the ear: a colour (hex or name) → a note
  read(value) {
    const v = String(value).toLowerCase();
    if (note(v)) return v;
    return (NOTES.find((x) => x.color.toLowerCase() === v) || {}).name || null;
  },
};
