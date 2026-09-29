import { note } from '../dictionary/notes.js';

// The Staff voice — a note as its height on a staff.
// The dot is placed once and simply moved when the note changes.
export const staff = {
  name: 'staff',
  label: 'Staff',
  mount() {
    const el = document.createElement('div');
    el.className = 'cell cell--staff';
    const dot = document.createElement('span');
    dot.className = 'staff-dot';
    el.appendChild(dot);
    return el;
  },
  update(el, n) {
    el.firstChild.style.setProperty('--step', note(n).step);
  },
};
