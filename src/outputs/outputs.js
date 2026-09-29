import { NOTES, note, parse, cap } from '../dictionary/notes.js';
import { meaningOf } from '../dictionary/dictionary.js';
import { playNote } from '../voices/index.js';
import { emit } from '../live/bus.js';

// Outputs — the test of the whole architecture: a book and a game built
// from the SAME kernel with NO new primitives. If these are cheap, the
// seed was right.

// ── The book ── the Voices rendered to a printable SVG plate.
export function renderWordSVG(notes) {
  const size = 64, pad = 20, w = Math.max(1, notes.length) * size + pad * 2, h = 200;
  let cells = '';
  notes.forEach((n, i) => {
    const x = pad + i * size, N = note(n);
    const y = 150 - N.step * 12;                       // staff height
    cells +=
      `<rect x="${x}" y="${pad}" width="${size - 8}" height="${size - 8}" rx="8" fill="${N.color}"/>` +
      `<text x="${x + (size - 8) / 2}" y="${pad + 34}" text-anchor="middle" font-size="18" font-weight="700" fill="#fff">${cap(n)}</text>` +
      `<text x="${x + (size - 8) / 2}" y="${pad + 54}" text-anchor="middle" font-size="12" fill="#fff">${N.num}</text>` +
      `<circle cx="${x + (size - 8) / 2}" cy="${y}" r="5" fill="#111"/>`;
  });
  const key = notes.join(''), meaning = meaningOf(key) || '—';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    `<rect width="${w}" height="${h}" fill="#faf7f2"/>` +
    `${[110, 122, 134, 146, 158].map((ly) => `<line x1="${pad}" y1="${ly}" x2="${w - pad}" y2="${ly}" stroke="#ddd"/>`).join('')}` +
    `${cells}` +
    `<text x="${w / 2}" y="${h - 16}" text-anchor="middle" font-size="20" font-weight="600" fill="#222">${cap(key)} — ${meaning}</text>` +
    `</svg>`;
}

export function mountBook(host, word) {
  host.classList.add('book');
  // A print-plate preview; regenerating this leaf SVG on change is fine —
  // it is an export artifact, not the live stage.
  const unwatch = word.watch((notes) => {
    host.innerHTML = notes.length
      ? renderWordSVG(notes)
      : '<p class="hint">Play a word and its printed plate appears here — every voice on one page.</p>';
  });
  return { destroy() { unwatch(); host.textContent = ''; } };
}

// ── The game ── "hear the colour": a note plays, you name its colour.
export function mountGame(host, memory) {
  host.classList.add('game');
  const prompt = document.createElement('div'); prompt.className = 'game-prompt';
  const wells = document.createElement('div'); wells.className = 'colorwells';
  const score = document.createElement('div'); score.className = 'game-score';
  host.append(prompt, wells, score);

  let target, right = 0, seen = 0;
  const play = document.createElement('button');
  play.className = 'btn'; play.textContent = '▶ Hear the colour';
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'A note sounds. Tap the colour you heard.';
  prompt.append(play, hint);
  play.addEventListener('click', () => {
    target = NOTES[Math.floor(Math.random() * 7)];
    playNote(target.name);
    hint.textContent = 'Which colour was that?';
  });

  for (const n of NOTES) {
    const well = document.createElement('button');
    well.className = 'well'; well.style.background = n.color; well.title = 'which note?';
    well.addEventListener('click', () => {
      if (!target) { hint.textContent = 'Press “Hear the colour” first.'; return; }
      seen++;
      if (n.name === target.name) {
        right++; well.classList.add('well--right');
        emit('word:used', { key: target.name, channel: 'game' });
        setTimeout(() => well.classList.remove('well--right'), 400);
      } else {
        well.classList.add('well--wrong');
        setTimeout(() => well.classList.remove('well--wrong'), 400);
      }
      score.textContent = `${right} right of ${seen}`;
    });
    wells.appendChild(well);
  }

  return { destroy() { host.textContent = ''; } };
}
