import { Word } from '../lang/word.js';
import { playSentence } from '../voices/index.js';
import { guessRoles } from './sentence.model.js';
import { note, cap } from '../dictionary/notes.js';
import { meaningOf } from '../dictionary/dictionary.js';
import { colorStripSVG, staffSVG } from '../graphics/graphics.js';

// Compose — saying things over time. A sentence is a tune: a live Phrase
// shown as chips with a running gloss, and played back as a melody.

// mountSentence(host, ctx) shows ctx.sentence — the one Phrase every
// chapter feeds (main.js adds committed words to it; this view never
// does, or words would arrive twice). Chips open their word; each is
// given a guessed role; the sentence is played as a melody, drawn as a
// strip of colour and on the staff, and kept under a name in
// ctx.state.saved.
export function mountSentence(host, ctx) {
  const { sentence, state } = ctx;
  host.classList.add('sentence');
  host.innerHTML = `
    <div class="sent-line" data-chips></div>
    <p class="sent-gloss" data-gloss></p>
    <figure class="sent-score" data-score hidden>
      <div class="sent-strip" data-strip></div>
      <div class="sent-staff" data-staff></div>
      <figcaption class="plate-caption">The sentence in colour, and on the staff</figcaption>
    </figure>
    <div class="sent-controls">
      <button class="btn btn--ink" data-act="play">▶ Play the sentence</button>
      <button class="btn btn--ghost" data-act="undo" aria-label="Remove the last word">⌫ Undo</button>
      <button class="btn btn--ghost" data-act="clear">Clear</button>
    </div>
    <form class="sent-save" data-save>
      <input class="field" name="name" maxlength="60" placeholder="Name this sentence to keep it" autocomplete="off" aria-label="Name for the sentence">
      <button class="btn btn--small">Keep</button>
    </form>
    <div class="sent-saved" data-saved></div>`;
  const q = (sel) => host.querySelector(sel);
  const chips = q('[data-chips]'), gloss = q('[data-gloss]'), score = q('[data-score]');
  const savedEl = q('[data-saved]'), saveForm = q('[data-save]');

  const meaning = (key) => state.meanings.get()[key] || meaningOf(key);
  const first = (m) => String(m).split(/[,;]/)[0];

  function render(words) {
    const notes = words.map((w) => w.notes);
    const roles = guessRoles(notes, meaning);
    chips.innerHTML = words.length
      ? words.map((w, i) => {
          const m = meaning(w.key);
          const r = roles[i];
          return `<button class="sent-word" data-i="${i}" title="Open ${esc(w.text)}">
            <span class="sent-swatch">${w.notes.map((n) => `<i style="background:${note(n).color}"></i>`).join('')}</span>
            <b>${esc(w.text)}</b>
            <span class="sent-mean">${m ? esc(first(m)) : '—'}</span>
            <span class="sent-role">${r.role}${r.detail && r.role !== 'particle' ? ` · ${esc(r.detail)}` : ''}</span>
          </button>`;
        }).join('')
      : `<p class="sent-empty">Nothing said yet. Finish a word with <kbd>Space</kbd> or <b>Say it</b>, and it joins the sentence here.</p>`;
    gloss.innerHTML = words.length
      ? `“${esc(words.map((w) => { const m = meaning(w.key); return m ? first(m) : '·'; }).join(' '))}”
         <span class="sent-guess">roles are a guess from word order</span>`
      : '';
    score.hidden = !words.length;
    if (words.length) {
      q('[data-strip]').innerHTML = colorStripSVG(notes);
      q('[data-staff]').innerHTML = staffSVG(notes);
    }
    host.querySelectorAll('[data-act]').forEach((b) => { b.disabled = !words.length; });
    saveForm.hidden = !words.length;
  }

  function renderSaved(list) {
    savedEl.innerHTML = list.length
      ? `<h4 class="rubric">Kept sentences</h4><ol class="sent-kept">${list.map((s, i) => `
          <li>
            <button class="sent-kept-load" data-load="${i}" title="Load it into the sentence">
              <span class="sent-kept-name">${esc(s.name)}</span>
              <span class="sent-kept-words">${s.words.map((ns) => cap(ns.join(''))).join(' ')}</span>
            </button>
            <button class="btn btn--ghost btn--small" data-del="${i}" aria-label="Forget ${esc(s.name)}">×</button>
          </li>`).join('')}</ol>`
      : '';
  }

  host.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.i !== undefined) { ctx.openWord(sentence.words[Number(b.dataset.i)].notes); return; }
    if (b.dataset.load !== undefined) {
      const s = state.saved.get()[Number(b.dataset.load)];
      if (s) { sentence.set(s.words.map((ns) => Word(ns))); playSentence(sentence.words); }
      return;
    }
    if (b.dataset.del !== undefined) {
      const list = state.saved.get().slice(); list.splice(Number(b.dataset.del), 1); state.saved.set(list);
      return;
    }
    switch (b.dataset.act) {
      case 'play': playSentence(sentence.words); break;
      case 'undo': sentence.removeLast(); break;
      case 'clear': sentence.clear(); break;
    }
  });
  saveForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!sentence.length) return;
    const input = saveForm.elements.name;
    const name = input.value.trim() || sentence.words.map((w) => w.text).join(' ');
    const entry = { name, words: sentence.words.map((w) => w.notes), at: Date.now() };
    state.saved.set([entry, ...state.saved.get().filter((s) => s.name !== name)].slice(0, 40));
    input.value = '';
  });

  const unwatch = sentence.watch(render);
  const unmeanings = state.meanings.watch(() => render(sentence.words));
  const unsaved = state.saved.watch(renderSaved);
  return { destroy() { unwatch(); unmeanings(); unsaved(); host.textContent = ''; } };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
