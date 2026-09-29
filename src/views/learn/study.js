import { NOTES, note, parse, cap } from '../../dictionary/notes.js';
import { meaningOf } from '../../dictionary/dictionary.js';
import { semanticKey } from '../../dictionary/grammar.js';
import { Word } from '../../lang/word.js';
import { emit } from '../../live/bus.js';
import { playNote, playWord } from '../../voices/index.js';
import { mountChoir } from '../../ui/choir.js';
import { fanSVG, glyphSVG, staffSVG, colorStripSVG } from '../../graphics/graphics.js';
import { HAND_PLATES } from '../../assets/assets.js';
import { esc } from './common.js';

// Study — the seven notes, and one word shown in every voice at once.

const LETTER = { do: 'C', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B' };
const COLOUR = { do: 'red', re: 'orange', mi: 'yellow', fa: 'green', sol: 'blue', la: 'indigo', si: 'violet' };
const EXAMPLES = ['Solresol', 'Fala', 'Lafa', 'Domisol', 'Milasi', 'Dore', 'Solsire'];

export function mountStudy(host, ctx) {
  host.innerHTML = `
    <section class="ln-intro">
      <div class="ln-intro-text">
        <h2 class="section-title">A language of seven notes</h2>
        <p class="ln-dropcap">Solresol is a language invented from nothing, built only of the seven syllables
          of the scale — <b>do, re, mi, fa, sol, la, si</b>. It was devised by the French violinist and teacher
          <em>Jean-François Sudre</em>, and by 1827 it was a whole language.</p>
        <p>Because every word is only a row of those seven, the same sentence can be <em>spoken</em>,
          <em>sung</em>, <em>played</em> on any instrument, <em>painted</em> in the seven colours of the rainbow,
          <em>counted</em> in the numbers one to seven, <em>signed</em> with the hand, or <em>written</em>
          in Sudre's seven strokes. It was meant for everyone — the blind and the deaf included — and it was the
          first invented language to find a real public, half a century before Volapük and Esperanto.</p>
        <p class="hint">Touch any note below to hear it, or press the keys 1 to 7.</p>
      </div>
      <figure class="ln-intro-fig">
        ${fanSVG()}
        <figcaption class="plate-caption">The seven notes, low to high</figcaption>
      </figure>
    </section>

    <figure class="plate ln-table-plate">
      <h3 class="rubric ln-plate-title">Tabula I <span class="rubric-note">the seven notes and their seven voices</span></h3>
      <div class="ln-notes-table" role="list">
        <div class="ln-nt-head" aria-hidden="true">
          <span></span><span>The sign</span><span>The note</span><span>Stroke</span><span>Staff</span><span>Pitch</span><span>Braille</span>
        </div>
        ${NOTES.map((n) => `
        <button type="button" class="ln-nt-row" role="listitem" data-note="${n.name}" style="--c:${n.color}" aria-label="${cap(n.name)}: number ${n.num}, ${COLOUR[n.name]}, ${LETTER[n.name]}. Play it.">
          <span class="ln-nt-num">${n.num}</span>
          <span class="ln-nt-hand"><img src="${HAND_PLATES[n.name]}" alt="Curwen's hand sign for ${n.name}" loading="lazy" decoding="async"></span>
          <span class="ln-nt-name"><b>${cap(n.name)}</b><i class="ln-nt-band"></i><small>${COLOUR[n.name]}</small></span>
          <span class="ln-nt-stroke">${glyphSVG(n.name, { color: false })}</span>
          <span class="ln-nt-staff">${staffSVG([n.name], { compact: true, cls: 'ln-nt-staffsvg' })}</span>
          <span class="ln-nt-pitch"><b>${LETTER[n.name]}</b><small>${n.freq.toFixed(1)} Hz</small></span>
          <span class="ln-nt-braille">${n.braille}</span>
        </button>`).join('')}
      </div>
      <figcaption class="plate-caption">Hand signs: John Curwen's engraved tonic sol-fa plates · strokes after Sudre, <i>Langue musicale universelle</i> (1866)</figcaption>
    </figure>

    <div class="ornament" aria-hidden="true"></div>

    <section class="ln-demo">
      <h2 class="section-title">One word, every voice</h2>
      <p class="lede">Write a word — its notes, its numbers, its colours, its strokes, its hand, its braille — all at once. They are the same word.</p>
      <div class="ln-demo-controls">
        <label class="ln-demo-field"><span class="rubric">Write a word</span>
          <input class="field" data-in value="Solresol" autocomplete="off" spellcheck="false" aria-label="A word in Solresol, or numbers 1 to 7">
        </label>
        <div class="chip-row ln-demo-examples">${EXAMPLES.map((w) => `<button type="button" class="chip-word" data-ex="${w}">${w}</button>`).join('')}</div>
      </div>
      <div class="plate ln-demo-plate">
        <div class="ln-demo-head">
          <div>
            <p class="ln-demo-family" data-family></p>
            <h3 class="ln-demo-word" data-name></h3>
            <p class="ln-demo-meaning" data-meaning></p>
          </div>
          <div class="ln-demo-actions">
            <button type="button" class="btn btn--ink" data-play>▶ Hear it</button>
            <button type="button" class="btn" data-open>Its page</button>
          </div>
        </div>
        <div class="ln-demo-strip" data-strip></div>
        <div data-choir class="ln-demo-choir"></div>
        <p class="hint" data-empty hidden>No notes yet — write do, re, mi… or the numbers 1 to 7.</p>
      </div>
    </section>`;

  // ── the table: click (or 1–7) to hear ──
  const ring = (name) => {
    const row = host.querySelector(`.ln-nt-row[data-note="${name}"]`);
    if (!row) return;
    row.classList.remove('is-ringing'); void row.offsetWidth; row.classList.add('is-ringing');
  };
  const sound = (name) => { playNote(name, 0, 0.7); ring(name); emit('word:used', { key: name, channel: 'study' }); };
  host.querySelector('.ln-notes-table').addEventListener('click', (e) => {
    const r = e.target.closest('[data-note]'); if (r) sound(r.dataset.note);
  });
  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || document.body.classList.contains('has-panel')) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const n = NOTES[Number(e.key) - 1];
    if (n) { e.preventDefault(); sound(n.name); }
  };
  window.addEventListener('keydown', onKey);

  // ── the demo ──
  const word = Word(parse('Solresol'));
  const q = (s) => host.querySelector(s);
  const input = q('[data-in]');
  const choir = mountChoir(q('[data-choir]'), word);

  const read = (text) => {
    const t = String(text).trim();
    if (/^[1-7\s]+$/.test(t)) return t.replace(/\s/g, '').split('').map((d) => NOTES[Number(d) - 1].name);
    return parse(t);
  };
  const unwatch = word.watch((notes) => {
    const key = notes.join('');
    const m = meaningOf(key);
    q('[data-name]').textContent = notes.length ? cap(key) : '—';
    q('[data-meaning]').innerHTML = !notes.length ? '' : m ? esc(m) : '<em>Not in the dictionary — a word still waiting for a meaning.</em>';
    const fam = semanticKey(notes);
    q('[data-family]').textContent = notes.length > 1 && fam ? `${cap(notes[0])} · ${fam}` : notes.length === 1 ? 'A particle' : '';
    q('[data-strip]').innerHTML = notes.length ? colorStripSVG([notes], { height: 14 }) : '';
    q('[data-empty]').hidden = notes.length > 0;
    q('[data-play]').disabled = q('[data-open]').disabled = !notes.length;
  });
  input.addEventListener('input', () => word.set(read(input.value).slice(0, 8)));
  q('.ln-demo-examples').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ex]'); if (!b) return;
    input.value = b.dataset.ex; word.set(parse(b.dataset.ex)); playWord(word);
  });
  q('[data-play]').addEventListener('click', () => { playWord(word); emit('word:used', { key: word.key, channel: 'study' }); });
  q('[data-open]').addEventListener('click', () => ctx.openWord(word.notes));
  q('[data-name]').addEventListener('click', () => word.length && ctx.openWord(word.notes));

  return {
    destroy() { window.removeEventListener('keydown', onKey); unwatch(); choir.destroy(); host.textContent = ''; },
  };
}

