import { NOTES, note, parse } from '../dictionary/notes.js';
import { allWords, meaningOf } from '../dictionary/dictionary.js';
import { emit } from '../live/bus.js';

// The map — the whole language, seen. Two projections of one trie:
// the Predictor (the branching narrowing of meaning as you add a note)
// and the Constellation (all ~3,000 words as a sky you light by learning).

// ---- the trie (pure: pass the word list, or default to the Dictionary) ----
export function buildTrie(words = allWords()) {
  const root = { count: 0, terminal: false, children: {} };
  for (const w of words) {
    let node = root;
    node.count++;
    for (const n of parse(w.solresol)) {
      node = node.children[n] || (node.children[n] = { count: 0, terminal: false, children: {} });
      node.count++;
    }
    node.terminal = true;
  }
  return root;
}

export function descend(root, notes) {
  let node = root;
  for (const n of notes) { node = node.children[n]; if (!node) return null; }
  return node;
}

// ---- Predictor: what can this word still become? ----
export function mountPredictor(host, word) {
  const root = buildTrie();
  host.classList.add('predictor');
  host.textContent = '';
  const status = document.createElement('div'); status.className = 'pred-status';
  const branches = document.createElement('div'); branches.className = 'pred-branches';
  host.append(status, branches);

  const unwatch = word.watch((notes) => {
    branches.textContent = '';
    const node = descend(root, notes);
    if (!node) { status.textContent = 'no word travels this path'; return; }
    const here = meaningOf(notes.join(''));
    status.textContent = here
      ? `“${here}” — and ${node.count - (node.terminal ? 1 : 0)} words continue`
      : `${node.count} words continue`;
    for (const n of NOTES) {
      const child = node.children[n.name];
      if (!child) continue;
      const pip = document.createElement('button');
      pip.className = 'pip';
      pip.style.setProperty('--c', n.color);
      pip.innerHTML = `<span>${child.count}</span>`;
      pip.title = `${n.name} → ${child.count} words`;
      pip.addEventListener('click', () => word.add(n.name));
      branches.appendChild(pip);
    }
  });
  return { destroy() { unwatch(); host.textContent = ''; } };
}

// ---- Constellation: the lexicon as a sky, brightened by memory ----
export function mountConstellation(host, word, memory) {
  host.classList.add('sky');
  host.textContent = '';
  const canvas = document.createElement('canvas');
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const stars = allWords().map((w) => {
    const notes = parse(w.solresol);
    const first = notes[0] || 'do';
    const sector = NOTES.findIndex((x) => x.name === first);
    const h = hash(w.solresol);
    const angle = (sector + (h % 1000) / 1000) / 7 * Math.PI * 2;
    const radius = 0.16 + (notes.length / 6) * 0.34 + ((h >> 10) % 1000) / 1000 * 0.12;
    return { key: w.solresol.toLowerCase(), color: note(first).color, angle, radius };
  });

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = host.clientWidth || 320, hgt = Math.max(260, host.clientHeight || 320);
    canvas.width = w * dpr; canvas.height = hgt * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = hgt + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 8;
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const strength = memory ? memory.strengthOf(s.key) : 0;
      const x = cx + Math.cos(s.angle) * s.radius * R * 1.5;
      const y = cy + Math.sin(s.angle) * s.radius * R * 1.5;
      s._x = x; s._y = y;
      const a = 0.10 + strength * 0.9;
      const r = 0.7 + strength * 2.3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.min(1, a);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let best = null, bd = 14 * 14;
    for (const s of stars) {
      const dx = s._x - mx, dy = s._y - my, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = s; }
    }
    if (best) { word.set(parse(best.key)); emit('word:used', { key: best.key, channel: 'sky' }); }
  });

  const unwatch = memory ? memory.watch(draw) : () => {};
  window.addEventListener('resize', resize);
  resize();
  return {
    destroy() {
      unwatch();
      window.removeEventListener('resize', resize);
      host.textContent = '';
    },
  };
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
