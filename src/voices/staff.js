import { staffSVG } from '../graphics/graphics.js?v=ea2512429f';

// The Staff voice — a note as a coloured head on a real treble staff.
export const staff = {
  name: 'staff',
  label: 'Staff',
  mount() {
    const el = document.createElement('div');
    el.className = 'cell cell--staff';
    return el;
  },
  update(el, n) {
    el.innerHTML = staffSVG([n], { cls: 'staff-cell', compact: true });
  },
};
