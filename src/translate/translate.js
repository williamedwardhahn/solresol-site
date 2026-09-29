import { parse, cap } from '../dictionary/notes.js';
import { getIndex } from '../dictionary/dictionary.js';
import { emit } from '../live/bus.js';

// Translation — the reclaimed point of a language: saying things.
// Both directions, whole sentences. Pure: the index is passed in, so the
// same functions the card uses are the ones the tests exercise.

export function enToSol(index, text) {
  return splitWords(text).map((w) => ({ from: w, to: index.englishToSolresol(w) }));
}

export function solToEn(index, text) {
  return splitWords(text).map((w) => {
    const notes = parse(w);
    return { from: cap(notes.join('')), to: index.meaningOf(notes.join('')) };
  });
}

const splitWords = (text) => String(text).trim().split(/\s+/).filter(Boolean);

// UI — a direction toggle, an input, and a living gloss. Clicking a
// translated word sends it to the sentence bar via the bus.
export function mountTranslate(host) {
  host.textContent = '';
  let dir = 'en-sol';

  const toggle = document.createElement('div');
  toggle.className = 'seg';
  const bEn = seg('English → Solresol', true);
  const bSol = seg('Solresol → English', false);
  toggle.append(bEn, bSol);

  const input = document.createElement('input');
  input.className = 'search';
  input.placeholder = 'type a sentence…';

  const out = document.createElement('div');
  out.className = 'translation';

  host.append(toggle, input, out);

  function seg(label, on) {
    const b = document.createElement('button');
    b.className = 'seg-btn' + (on ? ' seg-btn--on' : '');
    b.textContent = label;
    return b;
  }
  function setDir(d) {
    dir = d;
    bEn.classList.toggle('seg-btn--on', d === 'en-sol');
    bSol.classList.toggle('seg-btn--on', d === 'sol-en');
    input.placeholder = d === 'en-sol' ? 'type English…' : 'type Solresol, e.g. Dore Solresol…';
    render();
  }
  bEn.addEventListener('click', () => setDir('en-sol'));
  bSol.addEventListener('click', () => setDir('sol-en'));
  input.addEventListener('input', render);

  function render() {
    const index = getIndex();
    const pairs = dir === 'en-sol' ? enToSol(index, input.value) : solToEn(index, input.value);
    out.textContent = '';
    if (!input.value.trim()) return;

    for (const p of pairs) {
      const chip = document.createElement('span');
      chip.className = 'tpair' + (p.to ? '' : ' tpair--miss');
      chip.innerHTML = `<b>${p.from}</b><i>${p.to || '·'}</i>`;
      if (dir === 'en-sol' && p.to) {
        chip.style.cursor = 'pointer';
        chip.title = 'send to sentence';
        chip.addEventListener('click', () => emit('sentence:add', parse(p.to)));
      }
      out.appendChild(chip);
    }
  }
  setDir('en-sol');
}
