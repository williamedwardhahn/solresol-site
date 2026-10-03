import { glyphSVG } from '../graphics/graphics.js?v=ea2512429f';

// The Script voice — a note as its stroke in Sudre's own writing.
export const script = {
  name: 'script',
  label: 'Script',
  mount() {
    const el = document.createElement('div');
    el.className = 'cell cell--script';
    return el;
  },
  update(el, n) {
    el.innerHTML = glyphSVG(n);                         // the stroke in its note's colour
  },
};
