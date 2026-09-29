import { NOTES, note, cap } from '../dictionary/notes.js';
import { meaningOf } from '../dictionary/dictionary.js';
import { playNote } from '../voices/index.js';
import { emit } from '../live/bus.js';

// Outputs — the test of the whole architecture: a book and a game built
// from the SAME kernel with NO new primitives. If these are cheap, the
// seed was right.

// ── The book ── the Voices rendered to a printable SVG plate.
export function renderWordSVG(notes) {
  const size = 64, pad = 20, w = Math.max(1, notes.length) * size + pad * 2, h = 200;
  const ink = '#221b14', paper = '#faf5e6', rule = '#cbbb98';
  let cells = '';
  notes.forEach((n, i) => {
    const x = pad + i * size, N = note(n);
    const y = 150 - N.step * 6;                        // on the staff
    cells +=
      `<rect x="${x}" y="${pad}" width="${size - 8}" height="${size - 8}" rx="3" fill="${N.color}"/>` +
      `<text x="${x + (size - 8) / 2}" y="${pad + 34}" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#fffdf6">${cap(n)}</text>` +
      `<text x="${x + (size - 8) / 2}" y="${pad + 50}" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#fffdf6">${N.num}</text>` +
      `<ellipse cx="${x + (size - 8) / 2}" cy="${y}" rx="6" ry="4.5" fill="${N.color}" stroke="${ink}" stroke-width=".6"/>`;
  });
  const key = notes.join(''), meaning = meaningOf(key) || '—';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    `<rect width="${w}" height="${h}" fill="${paper}"/>` +
    `${[126, 132, 138, 144, 150].map((ly) => `<line x1="${pad}" y1="${ly - 6}" x2="${w - pad}" y2="${ly - 6}" stroke="${rule}"/>`).join('')}` +
    `${cells}` +
    `<text x="${w / 2}" y="${h - 16}" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="${ink}">${cap(key)} — ${meaning}</text>` +
    `</svg>`;
}

export function mountBook(host, word) {
  host.classList.add('book-plate');
  // A print-plate preview; regenerating this leaf SVG on change is fine —
  // it is an export artifact, not the live stage.
  const unwatch = word.watch((notes) => {
    host.innerHTML = notes.length
      ? renderWordSVG(notes)
      : '<p class="hint">Play a word and its printed plate appears here — every voice on one page.</p>';
  });
  return { destroy() { unwatch(); host.textContent = ''; } };
}

// ── The game ── "hear the colour": a note sounds, you name its colour.
// Seven pans of colour, like a watercolour box; the right one answers.
export function mountGame(host, memory) {
  host.classList.add('hearing');
  host.innerHTML = `
    <div class="hearing-prompt">
      <button type="button" class="btn btn--ink" data-sound>▶ Sound a note</button>
      <p class="hint" data-say>A note sounds. Touch the colour you heard.</p>
    </div>
    <div class="hearing-pans" role="group" aria-label="The seven colours">
      ${NOTES.map((n) => `<button type="button" class="hearing-pan" data-note="${n.name}" style="--c:${n.color}" aria-label="${n.name}"><i></i><span>${cap(n.name)}</span></button>`).join('')}
    </div>
    <p class="hearing-score" data-score></p>`;
  const say = host.querySelector('[data-say]'), score = host.querySelector('[data-score]');
  let target = null, right = 0, seen = 0, run = 0, timer = 0;

  const sound = () => {
    target = NOTES[Math.floor(Math.random() * 7)];
    playNote(target.name, 0, 0.8);
    say.textContent = 'Which colour was that?';
    host.classList.remove('is-answered');
  };
  const onClick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.sound !== undefined) { if (target && !host.classList.contains('is-answered')) playNote(target.name, 0, 0.8); else sound(); return; }
    const n = t.dataset.note; if (!n) return;
    if (!target) { playNote(n, 0, 0.5); say.textContent = 'That is ' + cap(n) + '. Press “Sound a note” to play.'; return; }
    if (host.classList.contains('is-answered')) return;
    seen++;
    const ok = n === target.name;
    if (ok) { right++; run++; emit('word:used', { key: target.name, channel: 'game' }); } else run = 0;
    t.classList.add(ok ? 'is-right' : 'is-wrong');
    host.querySelector(`[data-note="${target.name}"]`).classList.add('is-answer');
    say.innerHTML = ok ? `Yes — <b>${cap(target.name)}</b>.` : `It was <b>${cap(target.name)}</b>. You chose ${cap(n)}.`;
    host.classList.add('is-answered');
    score.textContent = `${right} of ${seen}${run > 2 ? ` · ${run} in a row` : ''}`;
    timer = setTimeout(() => {
      host.querySelectorAll('.hearing-pan').forEach((p) => p.classList.remove('is-right', 'is-wrong', 'is-answer'));
      sound();
    }, ok ? 900 : 1800);
  };
  host.addEventListener('click', onClick);
  void memory;   // kept for the signature; the bus feeds memory
  return { destroy() { clearTimeout(timer); host.removeEventListener('click', onClick); host.textContent = ''; } };
}
