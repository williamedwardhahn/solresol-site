import { NOTES, note, parse, cap } from '../dictionary/notes.js';
import { semanticKey } from '../dictionary/grammar.js';
import { allWords, meaningOf } from '../dictionary/dictionary.js';
import { emit } from '../live/bus.js';

// The map — the whole language, seen. Two projections of one trie:
// the Predictor (the branching narrowing of meaning as you add a note)
// and the Constellation (all ~3,000 words as a sky you light by learning).

// ---- the trie (pure: pass the word list, or default to the Dictionary) ----
export function buildTrie(words = allWords()) {
  const root = { count: 0, terminal: false, key: null, children: {} };
  for (const w of words) {
    let node = root;
    node.count++;
    for (const n of parse(w.solresol)) {
      node = node.children[n] || (node.children[n] = { count: 0, terminal: false, key: null, children: {} });
      node.count++;
    }
    node.terminal = true;
    node.key = w.solresol.toLowerCase();
  }
  return root;
}

export function descend(root, notes) {
  let node = root;
  for (const n of notes) { node = node.children[n]; if (!node) return null; }
  return node;
}

// A few whole words still reachable below a node, nearest first
// (breadth-first, in note order), not counting the node itself.
export function sampleWords(node, limit = 5) {
  const out = [], queue = node ? NOTES.map((n) => node.children[n.name]).filter(Boolean) : [];
  while (queue.length && out.length < limit) {
    const cur = queue.shift();
    if (cur.terminal) out.push(cur.key);
    for (const n of NOTES) if (cur.children[n.name]) queue.push(cur.children[n.name]);
  }
  return out;
}

// ---- Predictor: what can this word still become? ----
//
// Seven pips — how many words each next note still leads to — then a few
// of those words to open, and at a dead end the analysis: what family the
// word would belong to, whether its reversal (its antonym) exists, and an
// invitation to give it a meaning.
// Options: openWord(notes) opens a word's page; meanings is a live map of
// a person's own meanings.
export function mountPredictor(host, word, { openWord = null, meanings = null } = {}) {
  const root = buildTrie();
  host.classList.add('predictor');
  host.textContent = '';
  host.setAttribute('aria-live', 'polite');
  const status = document.createElement('div'); status.className = 'pred-status';
  const branches = document.createElement('div'); branches.className = 'pred-branches';
  const samples = document.createElement('div'); samples.className = 'pred-samples';
  host.append(branches, status, samples);

  const own = (key) => (meanings ? meanings.get()[key] : null) || null;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const first = (m) => String(m).split(/[,;]/)[0];

  function render(notes) {
    branches.textContent = '';
    samples.textContent = '';
    host.classList.toggle('predictor--dead', false);
    if (!notes.length) {
      status.innerHTML = `Seven notes to begin — <b>${root.count.toLocaleString()}</b> words lie ahead`;
    }
    const node = descend(root, notes);
    if (notes.length && !node) { renderDead(notes); return; }
    if (notes.length) {
      const here = meaningOf(notes.join(''));
      const onward = node.count - (node.terminal ? 1 : 0);
      status.innerHTML = onward
        ? `<b>${onward.toLocaleString()}</b> word${onward === 1 ? '' : 's'} go on from here`
        : (here ? 'a whole word, and the end of this path' : 'no word goes further');
    }
    for (const n of NOTES) {
      const child = node.children[n.name];
      const pip = document.createElement('button');
      pip.className = 'pip' + (child ? '' : ' pip--none');
      pip.style.setProperty('--c', n.color);
      pip.dataset.note = n.name;
      pip.innerHTML = `<span class="pip-name">${n.name}</span><span class="pip-count">${child ? child.count : '·'}</span>`;
      pip.title = child ? `${n.name} → ${child.count} word${child.count === 1 ? '' : 's'}` : `${n.name} → no word`;
      pip.setAttribute('aria-label', pip.title);
      pip.addEventListener('click', () => word.add(n.name));
      branches.appendChild(pip);
    }
    if (!notes.length) return;
    const keys = sampleWords(node, 5);
    if (keys.length) {
      samples.innerHTML = `<span class="pred-label">for instance</span>` + keys.map((k) =>
        `<button class="pred-word" data-open="${k}"><b>${cap(k)}</b><i>${esc(first(own(k) || meaningOf(k) || ''))}</i></button>`).join('');
    }
  }

  function renderDead(notes) {
    host.classList.add('predictor--dead');
    const key = notes.join(''), opp = notes.slice().reverse(), oppKey = opp.join('');
    const oppMeaning = own(oppKey) || meaningOf(oppKey);
    const fam = semanticKey(notes);
    const mine = own(key);
    status.innerHTML = `<b>${cap(key)}</b> is not in Sudre’s dictionary`;
    samples.innerHTML = `
      <p class="pred-dead-line">${fam ? `A ${notes.length}-note word beginning on <i>${notes[0]}</i> would belong to the family <b>${esc(fam)}</b>.` : ''}</p>
      <p class="pred-dead-line">${oppMeaning && oppKey !== key
        ? `Its mirror <button class="pred-link" data-open="${oppKey}">${cap(oppKey)}</button> means “${esc(first(oppMeaning))}” — so this might mean its opposite.`
        : oppKey === key ? 'It reads the same backwards: it is its own mirror.' : `Its mirror, ${cap(oppKey)}, is empty too.`}</p>
      <p class="pred-dead-line">${mine
        ? `You gave it a meaning: “${esc(mine)}”. <button class="pred-link" data-propose>change it</button>`
        : `<button class="pred-link pred-link--strong" data-propose>Propose a meaning for ${cap(key)} →</button>`}</p>`;
  }

  samples.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !openWord) return;
    if (b.dataset.open) openWord(parse(b.dataset.open));
    else if (b.dataset.propose !== undefined) openWord(word.notes);
  });

  const unwatch = word.watch(render);
  const unmeanings = meanings ? meanings.watch(() => render(word.notes)) : () => {};
  return { destroy() { unwatch(); unmeanings(); host.textContent = ''; } };
}

// ---- Constellation: the lexicon as a sky, brightened by memory ----
export function mountConstellation(host, word, memory) {
  host.classList.add('sky');
  host.textContent = '';
  const canvas = document.createElement('canvas');
  const hint = document.createElement('p');
  hint.className = 'sky-hint';
  hint.textContent = 'Every dot is a word, coloured by its first note. Tap one to hear it; the words you use shine brighter.';
  host.append(canvas, hint);
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
    // Height follows width, not the host: the host also holds the hint, so
    // sizing from it would grow the canvas on every resize.
    const w = host.clientWidth || 320, hgt = Math.round(Math.min(420, Math.max(260, w * 0.62)));
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
      // Unlearned words stay dim but visible, so a first visit is not a black box.
      const a = 0.35 + strength * 0.65;
      const r = 1.1 + strength * 2.2;
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
