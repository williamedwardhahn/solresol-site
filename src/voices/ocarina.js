import { note } from '../dictionary/notes.js?v=c5b00be221';

// The Ocarina voice — a note as an ocarina tab: the fingering of a 12-hole
// alto C ocarina, a filled hole covered, an empty hole open.
//
// The drawing and the fingering table are taken from panzi's Open 12 Hole
// Ocarina tabs (github.com/panzi/ocarina_tabs, Open Font License 1.1): the
// instrument's outline and the twelve holes exactly as in its source SVG,
// and its chromatic fingering table, A below do to the high F. We only add
// colour: covered holes are filled with the note's colour.
//
// The holes, numbered as panzi numbers them:
//   1 2 3 4  right hand, pinky → index      5 6 7  left ring, middle, index
//   10       left pinky                      8 9    left thumb, right thumb
//   11 12    the two small sub-holes (they reach below do, and make sharps)
// It is the common ("Asian") 12-hole system: every hole covered is do (C);
// the right hand lifts pinky-first for re mi fa sol; the left lifts
// ring-first for la si and the high do; then the left thumb (high re), the
// right thumb (high mi), and the left pinky last (high fa) — each step up
// the scale uncovers one more hole.

// Covered holes for each chromatic step, lowest (A3) to highest (F5) —
// panzi's GLYPH_MAP, letters A … U.
const TABLE = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],   // A3   la (low)
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],       // A♯3
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12],       // B3   si (low)
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],           // C4   do
  [2, 3, 4, 5, 6, 7, 8, 9, 10, 12],          // C♯4
  [2, 3, 4, 5, 6, 7, 8, 9, 10],              // D4   re
  [3, 4, 5, 6, 7, 8, 9, 10, 12],             // D♯4
  [3, 4, 5, 6, 7, 8, 9, 10],                 // E4   mi
  [4, 5, 6, 7, 8, 9, 10],                    // F4   fa
  [2, 5, 6, 7, 8, 9, 10],                    // F♯4
  [5, 6, 7, 8, 9, 10],                       // G4   sol
  [2, 6, 7, 8, 9, 10],                       // G♯4
  [6, 7, 8, 9, 10],                          // A4   la
  [2, 7, 8, 9, 10],                          // A♯4
  [7, 8, 9, 10],                             // B4   si
  [8, 9, 10],                                // C5   do (high)
  [2, 9, 10],                                // C♯5
  [9, 10],                                   // D5   re (high)
  [2, 10],                                   // D♯5
  [10],                                      // E5   mi (high)
  [],                                        // F5   fa (high)
];
const LOWEST = 57;                            // MIDI A3
export const OCARINA_LOW = LOWEST, OCARINA_HIGH = LOWEST + TABLE.length - 1;
export const HOLE_COUNT = 12;

// The covered holes for a MIDI note, or null if the ocarina cannot play it.
export const fingeringForMidi = (midi) => TABLE[midi - LOWEST] ?? null;

// …and for a syllable token: 'do' … 'si', ' for the octave above (re' = the
// high re), ',' for the octave below (la, = the low la). Fixed do = C4.
const SEMI = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 };
export function midiOf(token) {
  const name = token.replace(/[',]/g, '');
  if (!(name in SEMI)) return null;
  const up = (token.match(/'/g) || []).length, down = (token.match(/,/g) || []).length;
  return 60 + SEMI[name] + 12 * (up - down);
}
export const fingeringOf = (token) => { const m = midiOf(token); return m == null ? null : fingeringForMidi(m); };

// panzi's drawing: the holes (cx, cy, r) and the outline, in its own units.
const HOLE = {
  1: [483.96, 341.73, 35.0],
  2: [422.29, 409.83, 35.0],
  3: [368.82, 480.86, 35.0],
  4: [322.07, 557.62, 35.0],
  5: [191.38, 492.23, 35.0],
  6: [114.08, 544.83, 35.0],
  7: [24.0, 573.78, 36.0],
  8: [75.2, 758.08, 36.0],
  9: [369.48, 758.08, 36.0],
  10: [253.08, 423.19, 35.0],
  11: [155.32, 596.23, 20.0],
  12: [317.48, 441.23, 20.0],
};
const BODY = "m 161.07364,839.29189 c 4.60775,-25.31839 14.70687,-48.88362 14.29735,-74.70252 -0.42966,-27.08884 -8.95859,-56.2201 -28.08294,-74.61568 C 111.57972,655.62607 32.856251,644.00424 -7.079348,633.96903 -20.084354,630.70107 -46.014437,621.95402 -51.195849,609.75358 -60.378035,588.1327 -23.531814,543.72104 2.6650519,521.19353 83.988076,451.26134 177.85986,407.35826 272.95089,365.17361 370.62933,321.84114 537.47118,263.31602 571.95578,258.70058 c 9.66603,-1.29371 17.39465,10.80039 13.54155,18.10347 -12.73857,24.14441 -56.29397,85.36775 -87.54777,126.93992 -53.44438,71.08892 -108.13827,140.6073 -153.98541,216.31622 -30.34074,50.10267 -57.08087,102.58176 -79.63992,156.63663 -10.89346,26.10234 -16.12816,54.3311 -26.71987,80.53601 -3.22286,7.97363 -11.48018,12.93522 -18.06556,12.94322 -14.41456,0.0181 -34.097,-4.2477 -48.78846,-11.36519 -6.64334,-3.21848 -11.08417,-11.78524 -9.6767,-19.51897 z";

// An ocarina tab as SVG — for a syllable token ('sol', "re'") or a MIDI
// number. `color`: covered holes in the note's colour (default), or a
// colour of your choosing (`fill`); null for a note out of range.
export function ocarinaTabSVG(what, { color = true, fill = null, title = '' } = {}) {
  const midi = typeof what === 'number' ? what : midiOf(what);
  const covered = midi == null ? null : fingeringForMidi(midi);
  if (!covered) return '';
  const name = typeof what === 'string' ? what.replace(/[',]/g, '') : null;
  const ink = fill || (color && name && note(name) ? note(name).color : '#221b14');
  const on = new Set(covered);
  const holes = Object.entries(HOLE).map(([k, [cx, cy, r]]) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${on.has(Number(k)) ? ink : '#fffaf0'}" stroke="#221b14" stroke-width="8"/>`).join('');
  const label = title || `${name || 'a note'} on the ocarina: ${covered.length ? covered.length + ' holes covered' : 'all holes open'}`;
  return `<svg class="oc-tab" viewBox="0 0 667.2 639.6" role="img" aria-label="${label}">` +
    `<g transform="translate(66.65,-244.6)">` +
    `<path d="${BODY}" fill="#f4ecd6" stroke="#221b14" stroke-width="8" stroke-linejoin="round"/>` +
    holes + `</g></svg>`;
}

// The voice, for the word display (one octave: do … si).
export const ocarina = {
  name: 'ocarina',
  label: 'Ocarina',
  mount() {
    const el = document.createElement('div');
    el.className = 'cell cell--ocarina';
    return el;
  },
  update(el, n) {
    if (el.dataset.n === n) return;
    el.dataset.n = n;
    el.innerHTML = ocarinaTabSVG(n);
  },
};
