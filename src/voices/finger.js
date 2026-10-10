import { note, NOTES } from '../dictionary/notes.js?v=8aaee6f447';

// The Finger voice — a note as a place on the hand.
//
// From the finger chart in the research-notes deck (slide 17, after
// Bergziege-OWL and an older engraving): do on the outer edge of the palm,
// then each finger carries two notes, base then tip — re/mi on the little
// finger, fa/sol on the ring finger, la/si on the middle finger. A word is
// tapped on your own hand or into a partner's palm, a touch channel like
// the Lorm alphabet, for someone who cannot see a screen or hear a tone.
// See docs/NOTES_DECK.md §4.

// Where each note sits on the drawing (viewBox 0 0 100 100, fingers up).
export const FINGER_SPOTS = {
  do:  [21, 82],    // outer edge of the palm, by the wrist
  re:  [29, 55],    // little finger, base
  mi:  [29, 33],    // little finger, tip
  fa:  [42, 53],    // ring finger, base
  sol: [42, 20],    // ring finger, tip
  la:  [55, 52],    // middle finger, base
  si:  [55, 14],    // middle finger, tip
};

const HAND =
  '<rect x="23.5" y="27" width="11" height="34" rx="5.5"/>' +       // little
  '<rect x="36.5" y="14" width="11" height="46" rx="5.5"/>' +       // ring
  '<rect x="49.5" y="8" width="11" height="52" rx="5.5"/>' +        // middle
  '<rect x="62.5" y="14" width="11" height="46" rx="5.5"/>' +       // index
  '<rect x="74" y="46" width="11" height="32" rx="5.5" transform="rotate(32 79.5 62)"/>' +   // thumb
  '<rect x="21" y="50" width="57" height="44" rx="14"/>';          // palm, over the finger roots

// A note on the hand: every place shown faintly, this note's place lit.
export function fingerMark(n) {
  const nt = note(n);
  if (!nt) return '';
  const spots = NOTES.map(({ name }) => {
    const [x, y] = FINGER_SPOTS[name];
    return name === n
      ? `<circle class="finger-on" cx="${x}" cy="${y}" r="7.5" fill="${nt.color}"/>`
      : `<circle class="finger-off" cx="${x}" cy="${y}" r="2.6"/>`;
  }).join('');
  return `<svg class="finger" viewBox="0 0 100 100" role="img" aria-label="${n}: ${placeOf(n)}"><g class="finger-hand">${HAND}</g>${spots}</svg>`;
}

const PLACES = {
  do: 'edge of the palm', re: 'base of the little finger', mi: 'tip of the little finger',
  fa: 'base of the ring finger', sol: 'tip of the ring finger', la: 'base of the middle finger', si: 'tip of the middle finger',
};
export const placeOf = (n) => PLACES[n] || '';

export const finger = {
  name: 'finger',
  label: 'Finger',
  mount() {
    const el = document.createElement('div');
    el.className = 'cell cell--finger';
    return el;
  },
  update(el, n) {
    if (el.dataset.n === n) return;
    el.dataset.n = n;
    el.innerHTML = fingerMark(n);
    el.title = `${n} — ${placeOf(n)}`;
  },
};
