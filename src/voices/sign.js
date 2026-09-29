import { note } from '../dictionary/notes.js';

// The Sign voice — a note as a hand.
//
// A placeholder: an abstract angle that turns with the note, evoking the
// changing hand of Curwen tonic sol-fa. Swap in real artwork later — it's
// one file, and nothing else in the app changes. That is the whole point.
export const sign = {
  name: 'sign',
  label: 'Sign',
  mount() {
    const el = document.createElement('div');
    el.className = 'cell cell--sign';
    const hand = document.createElement('span');
    hand.className = 'sign-hand';
    el.appendChild(hand);
    return el;
  },
  update(el, n) {
    const angle = -75 + (150 * note(n).step) / 6;   // -75°…+75°
    el.firstChild.style.setProperty('--angle', angle + 'deg');
  },
};
