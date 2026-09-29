import { parse, cap, note } from '../dictionary/notes.js';
import { meaningOf } from '../dictionary/dictionary.js';
import { semanticKey, reverse, accentForms, markWord, partOfSpeech } from '../dictionary/grammar.js';
import { Word } from '../lang/word.js';
import { emit } from '../live/bus.js';
import { playWord } from '../voices/index.js';
import { mountChoir } from '../ui/choir.js';
import { staffSVG, GLYPH_PATHS } from '../graphics/graphics.js';

// The word panel — every word's own page. Opened from anywhere (a search
// hit, a chip, a star on the map) through ctx.openWord, and addressable
// as #/word/Domisol so a word can be shared as a link.

export function mountPanel(host, ctx) {
  host.className = 'panel';
  host.hidden = true;
  host.setAttribute('role', 'dialog');
  host.setAttribute('aria-modal', 'false');
  host.setAttribute('aria-label', 'Word');
  host.innerHTML = `
    <div class="panel-scrim" data-close></div>
    <div class="panel-sheet">
      <button class="panel-close" data-close aria-label="Close">×</button>
      <div class="panel-body"></div>
    </div>`;
  const body = host.querySelector('.panel-body');

  const shown = Word();            // the word on display (not the one being built)
  let choir = null, unwatch = null, lastHash = '';
  let form = { accent: -1, feminine: false, plural: false };

  function render() {
    const notes = shown.notes, key = shown.key;
    const meaning = ctx.state.meanings.get()[key] || meaningOf(key);
    const own = !!ctx.state.meanings.get()[key];
    const opp = reverse(notes), oppKey = opp.join(''), oppMeaning = meaningOf(oppKey);
    const forms = accentForms(notes);
    const starred = ctx.state.isStarred(key);
    const family = semanticKey(notes);

    body.innerHTML = `
      <p class="panel-family">${family ? `${cap(notes[0])} · ${family}` : 'A particle'}</p>
      <h2 class="panel-word">${cap(markWord(notes, form))}</h2>
      <p class="panel-meaning">${meaning ? esc(meaning) : '<em>Not in the dictionary.</em>'}${own ? ' <span class="tag">your meaning</span>' : ''}</p>
      ${notes.length > 1 ? `<p class="panel-role">${form.accent < 0 ? 'Written plain, it is a <b>verb</b>' : `Accented so, it is a <b>${partOfSpeech(notes, form.accent)}</b>`}${form.feminine ? ', feminine' : ''}${form.plural ? ', plural' : ''}.</p>` : ''}

      <div class="panel-actions">
        <button class="btn btn--ink" data-act="play">▶ Hear it</button>
        <button class="btn" data-act="add">＋ To sentence</button>
        <button class="btn" data-act="star" aria-pressed="${starred}">${starred ? '★ Starred' : '☆ Star'}</button>
        <button class="btn" data-act="link">Copy link</button>
        <button class="btn" data-act="card">Save as image</button>
      </div>

      <section class="panel-section">
        <h3 class="rubric">Every voice</h3>
        <div data-choir></div>
      </section>

      <section class="panel-section">
        <h3 class="rubric">On the staff</h3>
        <div class="panel-staff">${staffSVG([notes], { labels: true })}</div>
      </section>

      ${forms.length ? `
      <section class="panel-section">
        <h3 class="rubric">Its forms <span class="rubric-note">the tonic accent decides the part of speech</span></h3>
        <div class="forms">
          ${forms.map((f) => `<button class="form ${form.accent === f.accent ? 'is-on' : ''}" data-accent="${f.accent}">
              <b>${cap(markWord(notes, { ...form, accent: f.accent }))}</b><span>${f.role}</span></button>`).join('')}
        </div>
        <div class="forms forms--marks">
          <button class="form form--mark ${form.feminine ? 'is-on' : ''}" data-mark="feminine"><b>¯</b><span>feminine</span></button>
          <button class="form form--mark ${form.plural ? 'is-on' : ''}" data-mark="plural"><b>´</b><span>plural</span></button>
        </div>
      </section>` : ''}

      ${notes.length > 1 ? `
      <section class="panel-section">
        <h3 class="rubric">Its mirror <span class="rubric-note">reverse a word to reverse its meaning</span></h3>
        <button class="mirror-link" data-open="${oppKey}">
          <span class="swatches">${opp.map((n) => `<i style="background:${note(n).color}"></i>`).join('')}</span>
          <b>${cap(oppKey)}</b>
          <span>${oppMeaning ? esc(oppMeaning) : 'no word yet — the mirror is empty'}</span>
        </button>
      </section>` : ''}

      ${!meaning || own ? `
      <section class="panel-section">
        <h3 class="rubric">${own ? 'Your meaning' : 'Give it a meaning'}</h3>
        <form class="propose" data-propose>
          <input name="m" maxlength="80" placeholder="What should ${cap(key)} mean?" value="${own ? esc(ctx.state.meanings.get()[key]) : ''}" autocomplete="off">
          <button class="btn">Keep</button>
          ${own ? '<button type="button" class="btn btn--ghost" data-act="unpropose">Forget</button>' : ''}
        </form>
        <p class="hint">Kept on this device only. The shared dictionary stays as Sudre wrote it.</p>
      </section>` : ''}

      ${recentMarkup(ctx, key)}`;

    choir?.destroy();
    choir = mountChoir(body.querySelector('[data-choir]'), shown, { prefs: ctx.state.prefs });
  }

  body.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    const key = shown.key;
    if (t.dataset.accent !== undefined) { form = { ...form, accent: Number(t.dataset.accent) }; render(); return; }
    if (t.dataset.mark) { form = { ...form, [t.dataset.mark]: !form[t.dataset.mark] }; render(); return; }
    if (t.dataset.open) { open(t.dataset.open); return; }
    switch (t.dataset.act) {
      case 'play': playWord(shown); emit('word:used', { key, channel: 'panel' }); break;
      case 'add':  emit('sentence:add', shown.notes); flashLabel(t, '✓ Added'); break;
      case 'star': ctx.state.toggleStar(key); render(); break;
      case 'link': copyLink(key).then((ok) => flashLabel(t, ok ? '✓ Copied' : 'Copy failed')); break;
      case 'card': saveCard(shown.notes, ctx.state.meanings.get()[key] || meaningOf(key)); break;
      case 'unpropose': {
        const m = { ...ctx.state.meanings.get() }; delete m[key]; ctx.state.meanings.set(m); render(); break;
      }
    }
  });
  body.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = new FormData(e.target).get('m').trim();
    const m = { ...ctx.state.meanings.get() };
    if (v) m[shown.key] = v; else delete m[shown.key];
    ctx.state.meanings.set(m);
    render();
  });
  host.addEventListener('click', (e) => { if (e.target.closest('[data-close]') && !e.target.closest('.panel-body')) close(); });
  const onKey = (e) => { if (e.key === 'Escape' && !host.hidden) close(); };
  window.addEventListener('keydown', onKey);

  // open(text | notes): from a click, this moves the address to #/word/…
  // (so Back closes it and the link can be shared); from the router, it shows.
  function open(what, { fromRoute = false } = {}) {
    const notes = Array.isArray(what) ? what : parse(what);
    if (!notes.length) return;
    const key = notes.join('');
    if (!fromRoute) {
      if (!location.hash.startsWith('#/word/')) lastHash = location.hash || '#/';
      ctx.go('word/' + cap(key));
      return;
    }
    if (!location.hash.startsWith('#/word/')) lastHash = location.hash;
    if (host.hidden || shown.key !== key) form = { accent: -1, feminine: false, plural: false };
    shown.set(notes);
    ctx.state.touch(key);
    emit('word:used', { key, channel: 'panel' });
    render();
    host.hidden = false;
    document.body.classList.add('has-panel');
    host.querySelector('.panel-sheet').scrollTop = 0;
    host.querySelector('.panel-close').focus({ preventScroll: true });
  }

  function close({ fromRoute = false } = {}) {
    if (host.hidden) return;
    host.hidden = true;
    document.body.classList.remove('has-panel');
    if (!fromRoute) {
      const back = lastHash && !lastHash.startsWith('#/word/') ? lastHash : '#/';
      location.hash = back;
    }
  }

  unwatch = ctx.state.stars.watch(() => { if (!host.hidden) render(); });

  return {
    open, close,
    destroy() { unwatch(); choir?.destroy(); window.removeEventListener('keydown', onKey); host.textContent = ''; },
  };
}

function recentMarkup(ctx, key) {
  const recent = ctx.state.recent.get().filter((k) => k !== key).slice(0, 8);
  const stars = ctx.state.stars.get().filter((k) => k !== key).slice(0, 8);
  const chips = (list) => list.map((k) => `<button class="chip-word" data-open="${k}">${cap(k)}</button>`).join('');
  if (!recent.length && !stars.length) return '';
  return `<section class="panel-section">
    ${stars.length ? `<h3 class="rubric">Starred</h3><div class="chip-row">${chips(stars)}</div>` : ''}
    ${recent.length ? `<h3 class="rubric">Lately</h3><div class="chip-row">${chips(recent)}</div>` : ''}
  </section>`;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function flashLabel(btn, text) {
  const was = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = was; }, 1400);
}

async function copyLink(key) {
  const url = `${location.origin}${location.pathname}#/word/${cap(key)}`;
  try { await navigator.clipboard.writeText(url); return true; } catch { return false; }
}

// A word as a printed plate — 1200×630, the size link previews use.
async function saveCard(notes, meaning) {
  const W = 1200, H = 630, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  try { await document.fonts.ready; } catch { /* fonts are a nicety */ }
  const ink = '#221b14', paper = '#f5edd8';
  g.fillStyle = paper; g.fillRect(0, 0, W, H);
  g.strokeStyle = ink; g.lineWidth = 3; g.strokeRect(36, 36, W - 72, H - 72);
  g.lineWidth = 1; g.strokeRect(46, 46, W - 92, H - 92);

  g.fillStyle = '#9c2a1c';
  g.font = '28px "IM Fell English SC", Georgia, serif';
  g.textAlign = 'center';
  g.fillText('S O L R E S O L', W / 2, 112);

  g.fillStyle = ink;
  g.font = '118px "IM Fell English", Georgia, serif';
  g.fillText(cap(notes.join('')), W / 2, 250);

  // the colours, then Sudre's strokes under them
  const cell = 86, gap = 14, total = notes.length * cell + (notes.length - 1) * gap;
  let x = (W - total) / 2;
  for (const n of notes) {
    g.fillStyle = note(n).color; g.fillRect(x, 292, cell, 70);
    g.save(); g.translate(x + cell / 2 - 22, 382); g.scale(2.2, 2.2);
    g.strokeStyle = ink; g.lineWidth = 2; g.lineCap = 'round'; g.stroke(new Path2D(GLYPH_PATHS[n])); g.restore();
    x += cell + gap;
  }

  g.fillStyle = ink;
  g.font = 'italic 34px "Newsreader", Georgia, serif';
  wrapText(g, meaning || 'a word not yet in the dictionary', W / 2, 500, W - 240, 42);

  g.fillStyle = '#6d604c';
  g.font = '22px "Newsreader", Georgia, serif';
  g.fillText(notes.map((n) => note(n).num).join(' · '), W / 2, 566);

  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const file = new File([blob], `solresol-${notes.join('')}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: cap(notes.join('')) }); return; } catch { /* fall through to download */ }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function wrapText(g, text, cx, y, maxW, lh) {
  const words = String(text).split(/\s+/); let line = '', lines = [];
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  lines.push(line);
  lines = lines.slice(0, 2);
  lines.forEach((l, i) => g.fillText(l, cx, y + i * lh - (lines.length - 1) * lh / 2));
}
