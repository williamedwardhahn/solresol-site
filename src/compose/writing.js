import { cap } from '../dictionary/notes.js?v=8aaee6f447';
import { getIndex } from '../dictionary/dictionary.js?v=8aaee6f447';
import { playSentence } from '../voices/index.js?v=8aaee6f447';
import { wordHTML } from '../graphics/graphics.js?v=8aaee6f447';
import { glossSolresol } from '../translate/english.model.js?v=8aaee6f447';
import { shortGloss } from '../translate/lookup.js?v=8aaee6f447';

// The writing line — type a sentence on the instrument like a typewriter.
//
// The home row plays the notes of a word; Space or ; ends it and starts
// the next (ctx.commit puts it into ctx.sentence); Backspace on an empty
// word reopens the last one. The line shows every word written so far in
// its colours with its sense under it, the word being written with a
// caret, and the whole sentence read in English as it grows — so you can
// type, read the translation, and learn sentences in one place.

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function mountWriting(host, ctx) {
  const { word, sentence } = ctx;
  host.classList.add('writing');
  host.innerHTML = `
    <p class="writing-label">The page <span>— <kbd>Space</kbd> or <kbd>;</kbd> starts the next word · <kbd>⌫</kbd> on an empty word reopens the last</span></p>
    <div class="writing-line" aria-live="polite"></div>
    <p class="writing-reading"></p>
    <div class="writing-actions">
      <button class="btn btn--small" data-w="hear">▶ Hear the sentence</button>
      <button class="btn btn--small btn--ink" data-w="translate">Translate it →</button>
      <button class="btn btn--small btn--ghost" data-w="clear">Clear the page</button>
    </div>`;
  const line = host.querySelector('.writing-line'), reading = host.querySelector('.writing-reading');

  const text = () => sentence.words.map((w) => w.key).concat(word.length ? [word.key] : []).join(' ');

  function render() {
    const ws = sentence.words;
    const cells = ws.map((w, i) => `
      <button class="writing-word" data-i="${i}" title="Open ${cap(w.key)}">
        <b>${wordHTML(cap(w.key), { color: true })}</b>
        <small>${w.meaning ? esc(shortGloss(w.meaning)) : '—'}</small>
      </button>`);
    cells.push(`<span class="writing-word writing-word--now">
        <b>${word.length ? wordHTML(cap(word.key), { color: true }) : ''}<i class="writing-caret" aria-hidden="true"></i></b>
        <small>${word.length ? (word.meaning ? esc(shortGloss(word.meaning)) : 'not a word yet') : '&nbsp;'}</small>
      </span>`);
    line.innerHTML = cells.join('');
    const t = text();
    if (!t) { reading.innerHTML = '<span class="writing-empty">Play a word, press Space, play the next — the sentence is read here.</span>'; }
    else {
      const g = glossSolresol(getIndex(), t);
      reading.innerHTML = `<span class="writing-en">“${g.items.map((it) => esc(it.gloss || (it.notes ? '…' : '?'))).join(' ')}”</span>` +
        (g.notes.length ? ` <span class="writing-note">${esc(g.notes[0])}</span>` : '');
    }
    host.querySelectorAll('[data-w]').forEach((b) => { b.disabled = !ws.length && !word.length; });
  }

  host.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.i !== undefined) { ctx.openWord(sentence.words[Number(b.dataset.i)].notes); return; }
    if (b.dataset.w === 'hear') {
      const ws = sentence.words.concat(word.length ? [{ notes: word.notes }] : []);
      if (ws.length) playSentence(ws);
    } else if (b.dataset.w === 'translate') {
      ctx.go(`translate/sentence?sol=${encodeURIComponent(text())}`);
    } else if (b.dataset.w === 'clear') { sentence.clear(); word.clear(); }
  });

  const unS = sentence.watch(render), unW = word.watch(render);
  return { destroy() { unS(); unW(); host.textContent = ''; } };
}

// Backspace on an empty word: take the last word of the sentence back into
// the hands, to be edited.
export function reopenLast(ctx) {
  const ws = ctx.sentence.words;
  if (!ws.length || ctx.word.length) return false;
  const last = ws[ws.length - 1];
  ctx.sentence.removeLast();
  ctx.word.set(last.notes.slice());
  return true;
}
