import { NOTES, note } from '../dictionary/notes.js';

// The original graphics, redrawn as SVG in the canonical colours:
// the half-fan of the seven notes (the project's mark), the staff with
// coloured note heads, and Sudre's own written script — one stroke per
// note. Pure string builders, so any view can drop them into markup.

// ── the fan ──────────────────────────────────────────────────────────
// Seven wedges across a half disc, do (left) to si (right).
export function fanSVG({ labels = true, title = 'The seven notes of Solresol' } = {}) {
  const cx = 100, cy = 100, r = 96, parts = [];
  NOTES.forEach((n, i) => {
    const a0 = Math.PI - (i / 7) * Math.PI, a1 = Math.PI - ((i + 1) / 7) * Math.PI;
    const p = (a, rad) => `${(cx + Math.cos(a) * rad).toFixed(2)},${(cy - Math.sin(a) * rad).toFixed(2)}`;
    parts.push(`<path d="M${cx},${cy} L${p(a0, r)} A${r},${r} 0 0 1 ${p(a1, r)} Z" fill="${n.color}"/>`);
    if (labels) {
      const am = (a0 + a1) / 2, [x, y] = p(am, r * 0.68).split(',');
      parts.push(`<text x="${x}" y="${y}" class="fan-label" text-anchor="middle" dominant-baseline="middle">${n.name.toUpperCase()}</text>`);
    }
  });
  return `<svg class="fan" viewBox="0 0 200 104" role="img" aria-label="${title}">${parts.join('')}</svg>`;
}

// ── the staff ────────────────────────────────────────────────────────
// Treble staff, do = middle C on a ledger line below, si = B on the middle
// line. `words` is an array of note arrays; a gap separates words.
export function staffSVG(words, { labels = false, height = 84, cls = 'staff-svg', compact = false } = {}) {
  const list = Array.isArray(words[0]) ? words : [words];
  const line = 8, top = 16, bottom = top + line * 4;             // five lines
  const yOf = (n) => bottom + line - note(n).step * (line / 2);  // do sits one space below
  const stepX = 22, gapX = 18;
  let x = 18;
  const heads = [];
  list.forEach((notes, wi) => {
    if (wi) x += gapX;
    for (const n of notes) {
      const nt = note(n); if (!nt) continue;
      const y = yOf(n);
      if (n === 'do') heads.push(`<line x1="${x - 10}" x2="${x + 10}" y1="${y}" y2="${y}" class="staff-ledger"/>`);
      heads.push(`<ellipse cx="${x}" cy="${y}" rx="6.6" ry="4.9" transform="rotate(-18 ${x} ${y})" fill="${nt.color}" class="staff-head"/>`);
      if (labels) heads.push(`<text x="${x}" y="${bottom + 26}" class="staff-label" text-anchor="middle">${nt.name}</text>`);
      x += stepX;
    }
  });
  if (compact) {   // one note in a small square: crop tight around the staff
    return `<svg class="${cls}" viewBox="4 10 36 52" role="img" aria-label="${list[0].join(' ')} on the staff">${[0,1,2,3,4].map((i) =>
      `<line x1="4" x2="40" y1="${top + i * line}" y2="${top + i * line}" class="staff-line"/>`).join('')}${heads.join('')}</svg>`;
  }
  const w = Math.max(x + 4, 60);
  const lines = [0, 1, 2, 3, 4].map((i) =>
    `<line x1="4" x2="${w - 4}" y1="${top + i * line}" y2="${top + i * line}" class="staff-line"/>`).join('');
  const h = labels ? height + 10 : height;
  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="staff: ${list.map((ns) => ns.join(' ')).join(', ')}">${lines}${heads.join('')}</svg>`;
}

// ── Sudre's script ───────────────────────────────────────────────────
// One stroke per note, drawn in a 20×20 box: do ○, re |, mi ∩, fa ╲,
// sol —, la ⊂, si ╱. (After the plates in Sudre's Langue musicale universelle.)
export const GLYPH_PATHS = {
  do:  'M10,2.5 a7.5,7.5 0 1,0 0.01,0 Z',
  re:  'M10,2 L10,18',
  mi:  'M3,16 A7,7 0 0,1 17,16',
  fa:  'M3.5,3.5 L16.5,16.5',
  sol: 'M2.5,10 L17.5,10',
  la:  'M16,3.5 A7.5,7.5 0 0,0 16,16.5',
  si:  'M3.5,16.5 L16.5,3.5',
};

export function glyphSVG(n, { color = true, cls = 'glyph' } = {}) {
  const nt = note(n); if (!nt) return '';
  return `<svg class="${cls}" viewBox="0 0 20 20" role="img" aria-label="${nt.name} in Sudre's script"><path d="${GLYPH_PATHS[nt.name]}" fill="none" stroke="${color ? nt.color : 'currentColor'}" stroke-width="2.2" stroke-linecap="round"/></svg>`;
}

// A word written in the script: its strokes side by side.
export function scriptSVG(notes, opts = {}) {
  return `<span class="script-word">${notes.map((n) => glyphSVG(n, opts)).join('')}</span>`;
}

// A sentence as a strip of light: one band per note, a gap per word.
export function colorStripSVG(words, { height = 28 } = {}) {
  const list = Array.isArray(words[0]) ? words : [words];
  let x = 0; const rects = [];
  list.forEach((notes, wi) => {
    if (wi) x += 6;
    for (const n of notes) { rects.push(`<rect x="${x}" y="0" width="14" height="${height}" fill="${note(n).color}"/>`); x += 14; }
  });
  return `<svg class="strip" viewBox="0 0 ${Math.max(x, 1)} ${height}" preserveAspectRatio="none" role="img" aria-label="the sentence as colour">${rects.join('')}</svg>`;
}
