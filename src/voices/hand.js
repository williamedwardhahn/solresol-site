import { note } from '../dictionary/notes.js';
import { HAND_ART } from '../assets/assets.js';

// The Hand voice — a note as Curwen's hand sign, from the original
// engraved plates (do: the strong or firm tone … si: the piercing tone).
export const hand = {
  name: 'hand',
  label: 'Hand',
  mount() {
    const el = document.createElement('div');
    el.className = 'cell cell--hand';
    const img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    el.appendChild(img);
    return el;
  },
  update(el, n) {
    el.firstChild.src = HAND_ART[n];
    el.firstChild.alt = `hand sign for ${note(n).name}`;
  },
};
