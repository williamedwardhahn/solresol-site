import { Phrase } from '../lang/phrase.js';
import { Word } from '../lang/word.js';
import { on, emit } from '../live/bus.js';
import { playWord, playSentence } from '../voices/index.js';
import { getIndex } from '../dictionary/dictionary.js';
import { sentenceGloss } from './sentence.model.js';

// Compose — saying things over time.
//
// A live Phrase (a sequence of Words) shown as chips with a running
// gloss, and played back as a melody: a sentence IS a tune. Words arrive
// from anywhere on the bus — the keyboard, the translator, a click.

export function mountSentenceBar(host) {
  const phrase = Phrase();
  host.classList.add('sentence');
  host.textContent = '';

  const chipRow = document.createElement('div'); chipRow.className = 'chips';
  const gloss   = document.createElement('div'); gloss.className = 'gloss';
  const row     = document.createElement('div'); row.className = 'controls';
  const play  = mkBtn('▶ Play sentence');
  const undo  = mkBtn('⌫', 'btn--ghost');
  const clear = mkBtn('Clear', 'btn--ghost');
  row.append(play, undo, clear);
  host.append(chipRow, gloss, row);

  const mounted = [];

  function addNotes(notes) {
    if (!notes || !notes.length) return;
    const w = Word(notes);
    phrase.add(w);
    emit('word:used', { key: w.key, channel: 'sentence' });
  }
  const offCommit = on('word:commit', addNotes);
  const offAdd = on('sentence:add', addNotes);

  play.addEventListener('click', () => playSentence(phrase.words));
  undo.addEventListener('click', () => phrase.removeLast());
  clear.addEventListener('click', () => phrase.clear());

  const unwatch = phrase.watch((words) => {
    reconcileChips(chipRow, words, mounted);
    gloss.textContent = words.length
      ? sentenceGloss(getIndex(), words.map((w) => w.notes))
      : 'your sentence appears here';
  });

  return { destroy() { offCommit(); offAdd(); unwatch(); host.textContent = ''; } };
}

// Chips added/removed only at the end; survivors are never rebuilt.
function reconcileChips(row, words, mounted) {
  while (mounted.length < words.length) {
    const chip = document.createElement('button');
    chip.className = 'chip';
    row.appendChild(chip);
    mounted.push(chip);
  }
  while (mounted.length > words.length) row.removeChild(mounted.pop());
  words.forEach((w, i) => {
    const chip = mounted[i];
    chip.innerHTML = `<b>${w.text}</b><i>${w.meaning || '·'}</i>`;
    chip.onclick = () => playWord(w);
  });
}

function mkBtn(label, extra = '') {
  const b = document.createElement('button');
  b.className = 'btn ' + extra;
  b.textContent = label;
  return b;
}
