import { note, cap } from '../../dictionary/notes.js';
import { SEMANTIC_KEYS } from '../../dictionary/grammar.js';
import { buildTree, find, bands, arcPath, angles, labelPlace, walk } from './sunburst.model.js';
import { lexicon, esc, fmt, swatches } from './common.js';

// The map — the whole dictionary as one wheel. Ring by ring outward, the
// first note, the second, the words. Click a ring to go in, the centre to
// come out, a word to open it. Beside it (below, on a phone) the same
// place as a list, which is the readable, tappable way in.

const NS = 'http://www.w3.org/2000/svg';
const INNER = 70, OUTER = 298;
const DARK_TEXT = new Set(['re', 'mi', 'fa']);   // pale notes take ink, the rest paper
let treeCache = { entries: null, root: null };

export function mountMap(host, ctx, route) {
  const { entries } = lexicon();
  if (treeCache.entries !== entries) treeCache = { entries, root: buildTree(entries) };
  const root = treeCache.root;

  host.innerHTML = `
    <p class="lede dx-lede">The whole dictionary on one wheel. From the centre out: the first note, the second,
      then the words — each ring coloured by the note it adds. Touch a ring to go in, the centre to come back.</p>
    <div class="dx-map">
      <figure class="dx-wheel-fig">
        <svg class="dx-wheel" viewBox="-300 -300 600 600" role="img" aria-label="The dictionary as a wheel of notes">
          <g class="dx-arcs"></g><g class="dx-labels" aria-hidden="true"></g>
          <g class="dx-centre" role="button" tabindex="0" aria-label="Back out">
            <circle r="${INNER - 2}" class="dx-centre-disc"/>
            <text class="dx-c1" y="-12" text-anchor="middle"></text>
            <text class="dx-c2" y="11" text-anchor="middle"></text>
            <text class="dx-c3" y="28" text-anchor="middle"></text>
            <text class="dx-c4" y="47" text-anchor="middle"></text>
          </g>
        </svg>
      </figure>
      <aside class="dx-index" aria-live="polite"></aside>
    </div>`;

  const svg = host.querySelector('svg');
  const gArcs = svg.querySelector('.dx-arcs');
  const gLabels = svg.querySelector('.dx-labels');
  const centre = svg.querySelector('.dx-centre');
  const [c1, c2, c3, c4] = ['.dx-c1', '.dx-c2', '.dx-c3', '.dx-c4'].map((s) => svg.querySelector(s));
  const index = host.querySelector('.dx-index');

  const els = new Map();                    // node → <path>, made the first time it shows
  const byEl = new WeakMap();
  let focus = root, domain = [0, 1], radii = bands(root, { inner: INNER, outer: OUTER });
  let hover = null, anim = 0;

  const fill = (n) => note(n.notes[n.depth - 1] || n.notes[n.notes.length - 1]).color;

  function pathFor(n) {
    let p = els.get(n);
    if (!p) {
      p = document.createElementNS(NS, 'path');
      p.setAttribute('fill', fill(n));
      p.setAttribute('class', 'dx-arc' + (n.children.length ? '' : ' dx-arc--leaf'));
      els.set(n, p); byEl.set(p, n);
      gArcs.appendChild(p);
    }
    return p;
  }

  // Draw every node the domain can see, at the radii of its depth.
  function draw(d0, d1, R) {
    for (const [n, p] of els) if (!(n.x1 > d0 && n.x0 < d1)) p.style.display = 'none';
    for (const n of walk(root)) {
      if (n === root) continue;
      if (!(n.x1 > d0 + 1e-9 && n.x0 < d1 - 1e-9)) continue;
      const [r0, r1] = R[n.depth] || [OUTER, OUTER];
      const [a0, a1] = angles(n, d0, d1);
      const vis = r1 - r0 > 0.4 && a1 - a0 > 1e-4;
      if (!vis) { const p = els.get(n); if (p) p.style.display = 'none'; continue; }
      const p = pathFor(n);
      p.style.display = '';
      p.setAttribute('d', arcPath(a0, a1, r0, r1));
      p.classList.toggle('dx-arc--hair', (a1 - a0) * r1 < 2.2);
    }
  }

  function labels() {
    lit();
    gLabels.textContent = '';
    const [d0, d1] = domain;
    const frag = document.createDocumentFragment();
    for (const n of walk(focus)) {
      if (n === focus || n.depth > focus.depth + 2) continue;
      const [r0, r1] = radii[n.depth] || [0, 0];
      if (r1 - r0 < 12) continue;
      const [a0, a1] = angles(n, d0, d1);
      const pl = labelPlace(a0, a1, r0, r1);
      const text = cap(n.key);
      const across = (a1 - a0) * (pl.radial ? (r0 + r1) / 2 : r0 + (r1 - r0) * 0.3);
      const along = pl.radial ? (r1 - r0) - 10 : across - 8;
      let size = pl.radial ? Math.min(17, across * 0.78) : Math.min(22, (r1 - r0) * 0.32);
      size = Math.min(size, along / (text.length * 0.5));
      if (size < 6.2) continue;
      const t = document.createElementNS(NS, 'text');
      const light = !DARK_TEXT.has(n.notes[n.depth - 1]);
      t.setAttribute('class', 'dx-lab' + (light ? ' dx-lab--light' : '') + (n.children.length ? '' : ' dx-lab--word'));
      t.setAttribute('transform', `translate(${pl.x.toFixed(1)},${pl.y.toFixed(1)}) rotate(${pl.rotate.toFixed(1)})`);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'central');
      t.style.fontSize = size.toFixed(1) + 'px';
      t.textContent = text;
      // a key's field of meaning, under its name, where there is room
      if (n.depth === 1 && !pl.radial && across > 70) {
        t.setAttribute('dy', '-0.35em');
        const sub = document.createElementNS(NS, 'tspan');
        sub.setAttribute('x', '0'); sub.setAttribute('dy', '1.25em');
        sub.setAttribute('class', 'dx-lab-sub');
        sub.textContent = SEMANTIC_KEYS[n.key];
        t.appendChild(sub);
      }
      frag.appendChild(t);
    }
    gLabels.appendChild(frag);
  }

  function zoom(target, { instant = false } = {}) {
    if (!target) return;
    if (!target.children.length) target = target.parent;       // a word: show its family
    const from = { d: domain.slice(), R: radii };
    const to = { d: [target.x0, target.x1], R: bands(target, { inner: INNER, outer: OUTER }) };
    focus = target;
    cancelAnimationFrame(anim);
    gLabels.textContent = '';
    paintCentre(); paintIndex(); lit();
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (instant || reduce) { domain = to.d; radii = to.R; draw(...domain, radii); labels(); return; }
    const t0 = performance.now(), dur = 520;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      domain = [lerp(from.d[0], to.d[0], e), lerp(from.d[1], to.d[1], e)];
      radii = {};
      for (let d = 0; d <= 6; d++) {
        const a = from.R[d] || [OUTER, OUTER], b = to.R[d] || [OUTER, OUTER];
        radii[d] = [lerp(a[0], b[0], e), lerp(a[1], b[1], e)];
      }
      draw(...domain, radii);
      if (k < 1) anim = requestAnimationFrame(step);
      else { domain = to.d; radii = to.R; draw(...domain, radii); labels(); }
    };
    anim = requestAnimationFrame(step);
  }

  // The centre reads whatever is under the pointer, else the place you are in.
  function paintCentre(n = hover || focus) {
    const isRoot = n === root;
    const lines = isRoot
      ? ['Solresol', `${fmt(entries.length)} words`, 'seven keys', '']
      : [cap(n.key),
        n.word ? clip(n.word.definition, 20) : (n.depth === 1 ? SEMANTIC_KEYS[n.key] : 'not itself a word'),
        n.children.length ? `${fmt(n.count)} ${n.count === 1 ? 'word' : 'words'} under it` : '',
        n === focus ? '↺ back out' : (n.children.length ? 'go in' : 'open')];
    c1.textContent = lines[0]; c2.textContent = lines[1]; c3.textContent = lines[2]; c4.textContent = lines[3];
    c1.style.fontSize = lines[0].length > 9 ? '15px' : '20px';
    centre.classList.toggle('is-root', focus === root);
    centre.setAttribute('aria-label', focus === root ? 'The whole dictionary' : `Back out of ${cap(focus.key)}`);
  }

  function paintIndex() {
    const trail = [];
    for (let n = focus; n; n = n.parent) trail.unshift(n);
    const crumbs = trail.map((n, i) => i === trail.length - 1
      ? `<span aria-current="true">${n === root ? 'All' : cap(n.key)}</span>`
      : `<button class="dx-crumb" data-zoom="${n.key}">${n === root ? 'All' : cap(n.key)}</button>`).join('<i>›</i>');
    const head = focus === root
      ? `<h2 class="section-title">The seven keys</h2><p class="dx-index-note">${fmt(entries.length)} words, filed by their first note.</p>`
      : `<h2 class="section-title">${swatches(focus.notes, 'dx-index-sw')} ${cap(focus.key)}–</h2>
         <p class="dx-index-note">${focus.word ? `<button class="dx-link" data-open="${focus.key}">${cap(focus.key)}</button> itself: <i>${esc(focus.word.definition)}</i>. ` : ''}
         ${focus.depth === 1 ? `The key of <b>${SEMANTIC_KEYS[focus.key].toLowerCase()}</b>. ` : ''}${fmt(focus.count)} words under it.</p>`;
    index.innerHTML = `
      <nav class="dx-crumbs" aria-label="Where you are">${crumbs}</nav>
      ${head}
      <ol class="dx-index-list">${focus.children.map((c) => c.children.length
        ? `<li><button class="dx-irow" data-zoom="${c.key}">${swatches(c.notes)}<b>${cap(c.key)}–</b>
            <span>${c.depth === 1 ? `${SEMANTIC_KEYS[c.key]}${c.word ? ` <em>· alone, “${esc(clip(c.word.definition, 24))}”</em>` : ''}`
              : c.word ? esc(clip(c.word.definition, 40)) : '<em>not itself a word</em>'}</span><small>${fmt(c.count)}</small></button></li>`
        : `<li><button class="dx-irow dx-irow--word" data-open="${c.key}">${swatches(c.notes)}<b>${cap(c.key)}</b>
            <span>${c.word ? esc(c.word.definition) : ''}</span></button></li>`).join('')}</ol>`;
  }

  // The word on the instrument, if any, is traced on the wheel.
  function lit() {
    const key = ctx.word.key;
    for (const [n, p] of els) p.classList.toggle('is-lit', !!key && n.notes.length <= ctx.word.notes.length && startsWithNotes(ctx.word.notes, n.notes));
  }

  const onClick = (e) => {
    const zoomBtn = e.target.closest('[data-zoom]');
    if (zoomBtn && host.contains(zoomBtn)) { go(find(root, zoomBtn.dataset.zoom)); return; }
    if (e.target.closest('.dx-centre')) { if (focus.parent) go(focus.parent); return; }
    const n = byEl.get(e.target);
    if (!n) return;
    if (n.children.length && n !== focus) go(n);
    else if (n.word) ctx.openWord(n.notes);
  };
  const onKey = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === centre) { e.preventDefault(); if (focus.parent) go(focus.parent); }
  };
  const onOver = (e) => {
    const n = byEl.get(e.target) || null;
    if (n === hover) return;
    hover = n; paintCentre();
  };
  const onLeave = () => { hover = null; paintCentre(); };

  // Moving in the map keeps the address in step, without a new history entry.
  function go(n) {
    if (!n) return;
    zoom(n);
    const path = '#/dictionary/map' + (focus === root ? '' : '/' + cap(focus.key));
    if (location.hash !== path) history.replaceState(null, '', path);
  }

  svg.addEventListener('click', onClick);
  index.addEventListener('click', onClick);
  centre.addEventListener('keydown', onKey);
  svg.addEventListener('pointerover', onOver);
  svg.addEventListener('pointerleave', onLeave);
  const unword = ctx.word.watch(lit);

  const start = (r) => (r && r.arg ? find(root, r.arg.toLowerCase().replace(/[^a-z]/g, '')) : null) || root;
  zoom(start(route), { instant: true });

  return {
    update(r) { const n = start(r); if (n !== focus) zoom(n); },
    destroy() {
      cancelAnimationFrame(anim); unword();
      svg.removeEventListener('click', onClick); index.removeEventListener('click', onClick);
      centre.removeEventListener('keydown', onKey);
      svg.removeEventListener('pointerover', onOver); svg.removeEventListener('pointerleave', onLeave);
    },
  };
}

const lerp = (a, b, t) => a + (b - a) * t;
const clip = (s, n) => { const t = String(s).split(/[;(]/)[0].trim(); return t.length > n ? t.slice(0, n - 1).replace(/[\s,]+\S*$/, '') + '…' : t; };
const startsWithNotes = (all, pre) => pre.every((x, i) => all[i] === x);
