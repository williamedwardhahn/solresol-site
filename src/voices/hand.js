import { note } from '../dictionary/notes.js?v=ea2512429f';
import { HAND_LINES, PLATE_LINES } from '../assets/assets.js?v=ea2512429f';

// The Hand voice — a note as Curwen's hand sign, from the original
// engraved plates (do: the strong or firm tone … si: the piercing tone),
// drawn in the note's own colour: the engraving is line art used as a
// mask, so the same plate can be inked in any colour.

// A hand sign as markup: the hand alone, or the whole captioned plate.
export function handMark(n, { plate = false, color = true } = {}) {
  const nt = note(n);
  if (!nt) return '';
  const src = (plate ? PLATE_LINES : HAND_LINES)[n];
  const hc = color ? nt.color : 'var(--ink)';
  return `<span class="hand-ink${plate ? ' hand-ink--plate' : ''}${color ? ' hand-ink--colour' : ''}" role="img" aria-label="Curwen's hand sign for ${n}" style="--m:url('${src}');--hc:${hc}"></span>`;
}

export const hand = {
  name: 'hand',
  label: 'Hand',
  mount() {
    const el = document.createElement('div');
    el.className = 'cell cell--hand';
    return el;
  },
  update(el, n) {
    if (el.dataset.n === n) return;
    el.dataset.n = n;
    el.innerHTML = handMark(n);
    el.style.setProperty('--nc', note(n).color);
  },
};
