import { note } from '../dictionary/notes.js?v=8aaee6f447';
import { accidental } from './songs.js?v=8aaee6f447';

// One line of music as SVG: a treble staff, the notes in their own colours
// (heads, stems, flags, dots, ledger lines and accidentals as on a printed
// page), and each note's syllable written underneath. Every note gets a
// data-i so the page can light it up while it sounds.

const GAP = 16;            // between staff lines
const HALF = GAP / 2;      // one step (line to space)
const TOP = 46;            // y of the top line (F5)
const STEP_F5 = 10;        // F5 is ten steps above middle C
const X0 = 84, DX = 62;    // first note, spacing
const NAME_Y = TOP + 10 * HALF + 40;

const yOf = (step) => TOP + (STEP_F5 - step) * HALF;

// longest: the most notes on any line of this page, so every line is drawn
// to the same scale and a short line stays short.
export function staffSVG(line, startIndex, longest = line.length) {
  const width = X0 + line.length * DX + 10;
  const share = (width / (X0 + longest * DX + 10)) * 100;
  const parts = [];
  for (let k = 0; k < 5; k++) parts.push(`<line class="sl" x1="4" x2="${width - 4}" y1="${TOP + k * GAP}" y2="${TOP + k * GAP}"/>`);
  parts.push(`<text class="clef" x="8" y="${TOP + 4 * GAP + 18}">𝄞</text>`);

  line.forEach((t, j) => {
    const i = startIndex + j;
    const x = X0 + j * DX;
    if (t.rest) { parts.push(restSVG(t, x, i)); return; }
    const y = yOf(t.step);
    const c = note(t.name).color;
    const hollow = t.beats >= 2;
    const dotted = [0.75, 1.5, 3].includes(t.beats);
    const flag = t.beats < 1;
    const up = t.step < 6;                         // below the middle line, stems go up
    const g = [`<g class="nt" data-i="${i}" style="--c:${c}">`, `<rect class="hl" x="${x - 28}" y="${TOP - 40}" width="56" height="${NAME_Y - TOP + 54}" rx="10"/>`];
    // ledger lines below the staff (middle C sits on one)
    for (let s = 0; s >= t.step; s -= 2) g.push(`<line class="ledger" x1="${x - 18}" x2="${x + 18}" y1="${yOf(s)}" y2="${yOf(s)}"/>`);
    if (t.acc) g.push(`<text class="acc" x="${x - 32}" y="${y + 8}">${accidental(t.acc)}</text>`);
    if (t.beats < 4) {
      const sx = up ? x + 11 : x - 11;
      const sy = up ? y - 46 : y + 46;
      g.push(`<line class="stem" x1="${sx}" x2="${sx}" y1="${y}" y2="${sy}"/>`);
      if (flag) g.push(up
        ? `<path class="flag" d="M${sx} ${sy} q 5 10 15 15 q -8 -3 -15 -4"/>`
        : `<path class="flag" d="M${sx} ${sy} q 5 -10 15 -15 q -8 3 -15 4"/>`);
    }
    g.push(`<ellipse class="head${hollow ? ' hollow' : ''}" cx="${x}" cy="${y}" rx="11.5" ry="8.5" transform="rotate(-20 ${x} ${y})"/>`);
    if (dotted) g.push(`<circle class="dot" cx="${x + 19}" cy="${t.step % 2 === 0 ? y - 4 : y}" r="3"/>`);
    g.push(`<text class="nm" x="${x}" y="${NAME_Y}">${t.name}<tspan class="nacc">${accidental(t.acc)}</tspan></text>`);
    if (t.up > 0) g.push(`<circle class="updot" cx="${x}" cy="${NAME_Y - 24}" r="3"/>`);
    g.push('</g>');
    parts.push(g.join(''));
  });
  return `<svg class="staff" style="width:${share.toFixed(2)}%" viewBox="0 0 ${width} ${NAME_Y + 12}" role="img" aria-label="music">${parts.join('')}</svg>`;
}

function restSVG(t, x, i) {
  const mid = TOP + 2 * GAP;
  const shape = t.beats >= 1
    ? `<path class="rest" d="M${x - 3} ${mid - 16} l7 9 l-7 7 l7 9 q-9 -4 -6 6"/>`
    : `<path class="rest" d="M${x - 5} ${mid - 6} q 3 4 9 0 l -6 16"/>`;
  return `<g class="nt rest-g" data-i="${i}"><rect class="hl" x="${x - 28}" y="${TOP - 40}" width="56" height="${NAME_Y - TOP + 54}" rx="10"/>${shape}${t.beats === 1.5 ? `<circle class="dot" cx="${x + 9}" cy="${mid - 4}" r="2.2"/>` : ''}</g>`;
}
