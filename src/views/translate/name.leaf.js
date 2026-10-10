import { note, cap } from '../../dictionary/notes.js?v=8aaee6f447';
import { spellName, writeName, ALPHABET, ALPHABET_ROWS } from '../../translate/name.model.js?v=8aaee6f447';
import { playNote } from '../../voices/index.js?v=8aaee6f447';
import { cursiveSVG } from '../../graphics/cursive.js?v=8aaee6f447';
import { wordHTML } from '../../graphics/graphics.js?v=8aaee6f447';
import { esc, swatches } from './parts.js?v=8aaee6f447';

// Your name — spelled by sound in Sudre's alphabet for proper nouns, shown
// sound by sound (the letters, the sound heard in them, its notes), then as
// one word in colour, in the connected script, and to the ear: an accented
// note is held longer, which is how the ear tells p (dô) from a (do).

const NAMES = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
const NOTE_S = 0.3, ACCENT_S = 0.6, GAP_S = 0.06, WORD_GAP_S = 0.35;

const noteChip = (n, accent) =>
  `<span class="nm-note nt" style="color:${note(n).color}">${accent ? n.replace(/[aeiou]/, (v) => ({ a: 'â', e: 'ê', i: 'î', o: 'ô', u: 'û' }[v])) : n}</span>`;

export function mountNameLeaf(el) {
  let timers = [];
  const stored = (() => { try { return localStorage.getItem('solresol:name') || ''; } catch { return ''; } })();

  el.innerHTML = `
    <header class="nm-head">
      <h2 class="section-title">Your name in Solresol</h2>
      <p class="hint">A name has no meaning to translate, so Sudre spelled names by sound: each vowel is one note,
        each consonant an accented note or a doubled one. An accent is held longer, so the ear can tell them apart.</p>
    </header>
    <input class="nm-input" type="text" autocomplete="off" autocapitalize="words" spellcheck="false"
      aria-label="A name" placeholder="Type a name" value="${esc(stored || 'Maya')}" />
    <div class="nm-out" aria-live="polite"></div>
    <section class="nm-table">
      <h3 class="rubric">Sudre’s alphabet for names</h3>
      <table>
        <thead><tr><th></th>${NAMES.map((n) => `<th style="color:${note(n).color}" class="nt">${n}</th>`).join('')}</tr></thead>
        <tbody>${ALPHABET_ROWS.map((r) => `<tr><th scope="row">${r.label}<small>${r.note}</small></th>${r.sounds.map((s) =>
          s ? `<td><button type="button" class="nm-sound" data-sound="${s}" title="${esc(s)}: ${ALPHABET[s].notes.join(' ')}${ALPHABET[s].accent ? ', accented' : ''}">${esc(r.show?.[s] || s)}</button></td>` : '<td></td>').join('')}</tr>`).join('')}</tbody>
      </table>
      <p class="hint nm-src">Sudre’s <i>Alphabet phonétique</i>, <i>Langue Musicale Universelle</i> (1866), pp. XXII–XXIV.
        He spells by sound, never by letter: <i>c</i> is always hard and a soft <i>c</i> is written <i>s</i>; an <i>s</i> said as <i>z</i> is written <i>z</i>;
        <i>ai</i> is <i>é</i> and <i>au</i> is <i>o</i>. Reading English letters — <i>w</i>, <i>y</i>, <i>h</i>, <i>ph</i>, <i>th</i>, <i>sh</i>, a silent final <i>e</i> —
        as his sounds is this site’s guess.</p>
    </section>`;

  const input = el.querySelector('.nm-input');
  const out = el.querySelector('.nm-out');

  function render() {
    const text = input.value.trim();
    try { localStorage.setItem('solresol:name', text); } catch { /* private mode */ }
    const r = spellName(text);
    if (!r.notes.length) { out.innerHTML = text ? '<p class="hint">No letters there to spell.</p>' : ''; return; }
    let k = 0;
    out.innerHTML = `
      <div class="nm-word" data-score>
        <p class="nm-written">${r.words.map((w) => wordHTML(cap(writeName(w)), { color: true })).join(' ')}</p>
        <button type="button" class="tr-icon nm-play" aria-label="Hear the name" title="Hear the name">▶</button>
      </div>
      <div class="nm-strip">${swatches(r.notes)}</div>
      <div class="nm-script">${r.words.map((w) => cursiveSVG(w.notes, { size: 40, weight: 2.4, title: w.text })).join('')}</div>
      <ol class="nm-parts">${r.words.map((w, wi) => w.parts.map((p) => {
        if (!p.sound) return `<li class="nm-part nm-part--silent"><span class="nm-letters">${esc(p.letters)}</span><span class="nm-say">silent</span></li>`;
        const html = `<li class="nm-part" data-k="${k}">
          <span class="nm-letters">${esc(p.letters)}</span>
          <span class="nm-say">${p.kind === 'vowel' ? 'vowel' : 'consonant'} <b>${esc(p.sound)}</b></span>
          <span class="nm-notes">${p.notes.map((n, j) => noteChip(n, p.accent && j === 0)).join('')}</span></li>`;
        k++;
        return html;
      }).join('') + (wi < r.words.length - 1 ? '<li class="nm-gap" aria-hidden="true"></li>' : '')).join('')}</ol>`;
  }

  function stop() { timers.forEach(clearTimeout); timers = []; el.querySelectorAll('.is-sounding').forEach((x) => x.classList.remove('is-sounding')); }

  // the name as sound: accented notes held longer, a breath between words
  function hear() {
    stop();
    const r = spellName(input.value);
    let t = 0, k = 0;
    r.words.forEach((w) => {
      for (const p of w.parts) {
        if (!p.sound) continue;
        const start = t, card = k++;
        p.notes.forEach((n, j) => {
          const dur = p.accent && j === 0 ? ACCENT_S : NOTE_S;
          playNote(n, t, dur * 0.95);
          t += dur + GAP_S;
        });
        later(() => out.querySelector(`[data-k="${card}"]`)?.classList.add('is-sounding'), start * 1000);
        later(() => out.querySelector(`[data-k="${card}"]`)?.classList.remove('is-sounding'), t * 1000);
      }
      t += WORD_GAP_S;
    });
  }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  input.addEventListener('input', () => { stop(); render(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') hear(); });
  el.addEventListener('click', (e) => {
    if (e.target.closest('.nm-play')) hear();
    const s = e.target.closest('[data-sound]');
    if (s) {
      const a = ALPHABET[s.dataset.sound];
      let t = 0;
      a.notes.forEach((n, j) => { const d = a.accent && j === 0 ? ACCENT_S : NOTE_S; playNote(n, t, d * 0.95); t += d + GAP_S; });
    }
  });
  render();
  return { destroy() { stop(); } };
}
