import { NOTE_NAMES } from '../../dictionary/notes.js';

// The map of the dictionary as a tree of prefixes, laid out as a sunburst.
// Pure, no DOM. Ring d is the d-th note of the words under it, so every
// arc's colour is a note: first note inside, second next, and so on.
//
// A node is a prefix (Do, Dore, Doremi): { key, notes, depth, word, children,
// value, x0, x1 } where `word` is the dictionary entry the prefix itself
// spells, if any. Prefixes go two notes deep for everyone; a sub-family
// too big to read around one circle (> split words) is split once more
// by its third note, so no ring ever has to hold more than ~split labels.

export function buildTree(entries, { split = 72 } = {}) {
  const byKey = new Map(entries.map((e) => [e.key, e]));
  const root = node([], null);
  root.depth = 0;
  for (const first of NOTE_NAMES) {
    const a = node([first], byKey.get(first));
    root.children.push(a);
    for (const second of NOTE_NAMES) {
      const b = node([first, second], byKey.get(first + second));
      a.children.push(b);
      const under = entries.filter((e) => e.notes.length > 2 && e.notes[0] === first && e.notes[1] === second);
      if (under.length > split) {
        for (const third of NOTE_NAMES) {
          const c = node([first, second, third], byKey.get(first + second + third));
          c.children = under.filter((e) => e.notes.length > 3 && e.notes[2] === third).map((e) => node(e.notes, e));
          if (c.children.length || c.word) b.children.push(c);
        }
      } else {
        b.children = under.map((e) => node(e.notes, e));
      }
    }
  }
  weigh(root);
  partition(root, 0, 1);
  return root;
}

function node(notes, word) {
  return { key: notes.join(''), notes, depth: notes.length, word: word || null, children: [], parent: null, value: 0, count: 0, x0: 0, x1: 0 };
}

// Every arc gets at least one unit, so an empty prefix still shows as a hairline
// and a prefix that is itself a word keeps a place.
function weigh(n) {
  for (const c of n.children) { c.parent = n; c.depth = n.depth + 1; weigh(c); }
  n.value = n.children.length ? n.children.reduce((s, c) => s + c.value, 0) : 1;
  n.count = n.children.reduce((s, c) => s + c.count + (c.word ? 1 : 0), 0);   // words beneath, itself excluded
  return n.value;
}

function partition(n, x0, x1) {
  n.x0 = x0; n.x1 = x1;
  let x = x0;
  for (const c of n.children) {
    const w = (x1 - x0) * (c.value / n.value);
    partition(c, x, x + w);
    x += w;
  }
}

export function* walk(n) { yield n; for (const c of n.children) yield* walk(c); }

export function find(root, key) {
  for (const n of walk(root)) if (n.key === key) return n;
  return null;
}

// The words a node holds (every entry in its subtree, itself included).
export function wordsUnder(n) {
  const out = [];
  for (const m of walk(n)) if (m.word) out.push(m.word);
  return out;
}

// The rings a focus shows: its children and grandchildren. When the
// children are all leaves, one wide ring; otherwise two, the outer wider
// (it carries the longer labels). Radii in viewBox units.
export function bands(focus, { inner = 64, outer = 298 } = {}) {
  const deep = focus.children.some((c) => c.children.length);
  const deeper = deep && focus.children.some((c) => c.children.some((g) => g.children.length));
  const out = {};
  for (let d = 0; d <= 6; d++) out[d] = d <= focus.depth ? [inner, inner] : [outer, outer];
  if (!deep) { out[focus.depth + 1] = [inner, outer]; return out; }
  const edge = deeper ? outer - 16 : outer;                   // leave a fringe for what lies deeper
  const mid = inner + (edge - inner) * 0.42;
  out[focus.depth + 1] = [inner, mid];
  out[focus.depth + 2] = [mid + 1.5, edge];
  if (deeper) out[focus.depth + 3] = [edge + 2, outer];
  return out;
}

// An annular sector: angles in radians, 0 at the top, clockwise.
export function arcPath(a0, a1, r0, r1) {
  if (a1 - a0 >= Math.PI * 2 - 1e-6) {        // a full ring: two half arcs
    const m = a0 + Math.PI;
    return arcPath(a0, m, r0, r1) + arcPath(m, a1 - 1e-6, r0, r1);
  }
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p = (a, r) => `${(r * Math.sin(a)).toFixed(2)},${(-r * Math.cos(a)).toFixed(2)}`;
  if (r0 <= 0.01) return `M0,0L${p(a0, r1)}A${r1},${r1} 0 ${large} 1 ${p(a1, r1)}Z`;
  return `M${p(a0, r1)}A${r1},${r1} 0 ${large} 1 ${p(a1, r1)}L${p(a1, r0)}A${r0},${r0} 0 ${large} 0 ${p(a0, r0)}Z`;
}

// Map a node's [x0, x1] through the zoomed domain [d0, d1] to angles.
export function angles(n, d0, d1) {
  const k = (Math.PI * 2) / (d1 - d0);
  const a0 = Math.max(0, Math.min(Math.PI * 2, (n.x0 - d0) * k));
  const a1 = Math.max(0, Math.min(Math.PI * 2, (n.x1 - d0) * k));
  return [a0, a1];
}

// Where to write a label: radial along the arc's middle when the arc is
// narrow (word rings), tangential when it is wide. Returns the transform
// and whether the text reads outward (flipped on the left half).
export function labelPlace(a0, a1, r0, r1) {
  const a = (a0 + a1) / 2, deg = (a * 180) / Math.PI;
  const r = (r0 + r1) / 2;
  const x = r * Math.sin(a), y = -r * Math.cos(a);
  const radial = (a1 - a0) * r < (r1 - r0) * 1.1;
  if (radial) {
    const flip = a > Math.PI;
    const rot = flip ? deg + 90 : deg - 90;
    return { x, y, rotate: rot, radial: true, flip };
  }
  const flip = a > Math.PI / 2 && a < (Math.PI * 3) / 2;
  return { x, y, rotate: flip ? deg - 180 : deg, radial: false, flip };
}
