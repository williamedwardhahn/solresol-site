import { note } from '../dictionary/notes.js?v=c115d42191';

// The connected script — a whole Solresol word written as one line.
//
// Gajewski's stenography gives each note a stroke, and a word is written
// by starting each stroke where the last one ended (see docs/NOTES_DECK.md,
// slides 21 and 37–51). The strokes, with L the length of a line:
//
//   re  ↓ a vertical line             sol → a horizontal line
//   fa  ↘ a diagonal                  si  ↗ a diagonal
//   mi  ∩ an arch, left foot → right foot, L wide
//   la  ⊂ an arc open to the right, top → bottom, L tall
//   do  ○ a circle, L across
//
// How a stroke meets the circle of do (read from the renders):
//   leaving a circle:  a diagonal leaves it radially (dofa, dosi); a straight
//     stroke leaves it as a tangent, the circle sitting up and to the left of
//     it (dore, dosol, domi, dola).
//   arriving at one:   a diagonal or la arrives radially (fado, sido, lado);
//     a straight stroke arrives as a tangent, the circle down and to the
//     right of it (redo, soldo, mido).
//   la after the rising si is joined at its leftmost point (sila) — the
//     "alternate start" of slide 21.
// Pure geometry: cursiveStrokes() returns the path of each note's stroke, so
// it can be drawn in ink or in each note's colour, and tested without a DOM.

const L = 20, R = L / 2, D = L / Math.SQRT2;

// The straight strokes and the arch/arc: start direction, end direction, and
// an SVG path drawn from a pen at (x, y).
const SHAPES = {
  re:  { start: [0, 1],  end: [0, 1],  draw: (x, y) => ({ d: `M${f(x)} ${f(y)}l0 ${L}`, to: [x, y + L] }) },
  sol: { start: [1, 0],  end: [1, 0],  draw: (x, y) => ({ d: `M${f(x)} ${f(y)}l${L} 0`, to: [x + L, y] }) },
  fa:  { start: [1, 1],  end: [1, 1],  draw: (x, y) => ({ d: `M${f(x)} ${f(y)}l${f(D)} ${f(D)}`, to: [x + D, y + D] }) },
  si:  { start: [1, -1], end: [1, -1], draw: (x, y) => ({ d: `M${f(x)} ${f(y)}l${f(D)} ${f(-D)}`, to: [x + D, y - D] }) },
  mi:  { start: [0, -1], end: [0, 1],  draw: (x, y) => ({ d: `M${f(x)} ${f(y)}a${R} ${R} 0 0 1 ${L} 0`, to: [x + L, y] }) },
  la:  { start: [-1, 0], end: [1, 0],  draw: (x, y) => ({ d: `M${f(x)} ${f(y)}a${R} ${R} 0 0 0 0 ${L}`, to: [x, y + L] }) },
};
const f = (v) => +v.toFixed(2);
const isDiagonal = (dir) => dir[0] !== 0 && dir[1] !== 0;
const unit = ([x, y]) => { const n = Math.hypot(x, y) || 1; return [x / n, y / n]; };

// Where a circle's centre sits, from the joint, when a stroke LEAVES it.
function leaveOffset(nextNote) {
  const d = unit(SHAPES[nextNote].start);
  if (isDiagonal(d)) return [-d[0], -d[1]];                     // radial: the line runs out of the circle
  return d[0] === 0 ? [-1, 0] : [0, -1];                        // tangent: circle up and to the left
}
// …and when a stroke ARRIVES at it.
function arriveOffset(prevNote) {
  const d = unit(SHAPES[prevNote].end);
  if (isDiagonal(d) || prevNote === 'la') return d;            // radial: the line runs into the circle
  return d[0] === 0 ? [1, 0] : [0, 1];                          // tangent: circle down and to the right
}
const circlePath = ([cx, cy], [px, py]) => {
  // a full circle drawn from (px, py), the joint, round and back to it
  const ox = 2 * cx - px, oy = 2 * cy - py;                     // the opposite point
  return `M${f(px)} ${f(py)}A${R} ${R} 0 1 1 ${f(ox)} ${f(oy)}A${R} ${R} 0 1 1 ${f(px)} ${f(py)}`;
};

// notes → [{ note, d }] in writing order, plus the bounding box.
export function cursiveStrokes(notes) {
  const out = [];
  let pen = [0, 0];
  let center = null;                              // the last circle's centre, while the pen is on it
  notes.forEach((n, i) => {
    const prev = notes[i - 1], next = notes[i + 1];
    if (n === 'do') {
      if (prev === 'do' && center) center = [center[0] + L, center[1]];          // dodo: circles side by side
      else if (prev) center = [pen[0] + R * arriveOffset(prev)[0], pen[1] + R * arriveOffset(prev)[1]];
      else if (next && next !== 'do') center = [pen[0] + R * leaveOffset(next)[0], pen[1] + R * leaveOffset(next)[1]];
      else center = [pen[0] + R, pen[1]];
      // the joint on this circle: where it was entered (or the leaving point, for the first)
      const joint = prev && prev !== 'do' ? pen
        : next && next !== 'do' ? [center[0] - R * leaveOffset(next)[0], center[1] - R * leaveOffset(next)[1]]
        : [center[0] - R, center[1]];
      out.push({ note: n, d: circlePath(center, joint) });
      if (next && next !== 'do') pen = [center[0] - R * leaveOffset(next)[0], center[1] - R * leaveOffset(next)[1]];
      else pen = [center[0] + R, center[1]];
      return;
    }
    center = null;
    let [x, y] = pen;
    if (n === 'la' && prev === 'si') { x += R; y -= R; }        // sila: joined at the arc's leftmost point
    const s = SHAPES[n].draw(x, y);
    out.push({ note: n, d: s.d });
    pen = s.to;
  });
  return { strokes: out, box: bbox(out) };
}

// The extent of the drawn paths (sampled from their commands).
function bbox(strokes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  for (const { d } of strokes) {
    let px = 0, py = 0;
    for (const [, cmd, args] of d.matchAll(/([MlaA])([^MlaA]*)/g)) {
      const v = args.trim().split(/[\s,]+/).map(Number);
      if (cmd === 'M') { px = v[0]; py = v[1]; add(px, py); }
      else if (cmd === 'l') { px += v[0]; py += v[1]; add(px, py); }
      else {
        // an arc: include its endpoints and, conservatively, the circle it lies on
        const nx = cmd === 'a' ? px + v[5] : v[5], ny = cmd === 'a' ? py + v[6] : v[6];
        const mx = (px + nx) / 2, my = (py + ny) / 2;
        add(px, py); add(nx, ny);
        if (Math.hypot(nx - px, ny - py) < 1e-6) { add(px - 2 * R, py - 2 * R); add(px + 2 * R, py + 2 * R); }
        else arcExtent(px, py, nx, ny, v[3], v[4], add, mx, my);
        px = nx; py = ny;
      }
    }
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
// Add the extremes of a radius-R arc between two points to the box.
function arcExtent(px, py, nx, ny, large, sweep, add) {
  const dx = nx - px, dy = ny - py, q = Math.hypot(dx, dy);
  const h = Math.sqrt(Math.max(0, R * R - (q / 2) ** 2));
  const sgn = (large === sweep ? -1 : 1);
  const cx = (px + nx) / 2 + sgn * h * (-dy / q), cy = (py + ny) / 2 + sgn * h * (dx / q);
  const a0 = Math.atan2(py - cy, px - cx), a1 = Math.atan2(ny - cy, nx - cx);
  let span = sweep ? a1 - a0 : a0 - a1;
  while (span < 0) span += 2 * Math.PI;
  for (let k = 0; k <= 32; k++) {
    const a = a0 + (sweep ? 1 : -1) * span * (k / 32);
    add(cx + R * Math.cos(a), cy + R * Math.sin(a));
  }
}

// A word in the connected script, as SVG. `color: true` draws each note's
// stroke in its own colour over a faint ink line, so even pale mi reads.
// `size` is the drawn length of one stroke in pixels, so every word is at
// the same scale and a flat word (sol) is not blown up to fill a box.
export function cursiveSVG(notes, { color = true, size = 24, weight = 2.2, title = '' } = {}) {
  const { strokes, box } = cursiveStrokes(notes);
  const pad = weight * 2, k = size / L;
  const vb = `${f(box.x - pad)} ${f(box.y - pad)} ${f(box.w + 2 * pad)} ${f(box.h + 2 * pad)}`;
  const w = Math.round((box.w + 2 * pad) * k), height = Math.round((box.h + 2 * pad) * k);
  const under = color ? strokes.map((s) => `<path d="${s.d}" stroke="rgba(34,27,20,.28)" stroke-width="${weight + 1.2}"/>`).join('') : '';
  const over = strokes.map((s) => `<path d="${s.d}" stroke="${color ? note(s.note).color : 'currentColor'}" stroke-width="${weight}"/>`).join('');
  return `<svg class="cursive" viewBox="${vb}" width="${w}" height="${height}" fill="none" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${title || notes.join('') + ' in the connected script'}">${under}${over}</svg>`;
}
