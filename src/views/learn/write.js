import { NOTES, note, cap, noteByNumber } from '../../dictionary/notes.js?v=c5b00be221';
import { meaningOf } from '../../dictionary/dictionary.js?v=c5b00be221';
import { playNote, playWord, playSentence } from '../../voices/index.js?v=c5b00be221';
import { emit } from '../../live/bus.js?v=c5b00be221';
import { noteForKey, isCommitKey } from '../../ui/keymap.js?v=c5b00be221';
import { wordHTML, numbersHTML } from '../../graphics/graphics.js?v=c5b00be221';
import { PHRASEBOOK } from '../../translate/phrases.js?v=c5b00be221';
import { targetWords, checkWriting } from '../../learn/write.model.js?v=c5b00be221';
import { esc } from './common.js?v=c5b00be221';

// Write (#/learn/write) — learning sentences by typing them.
//
// A sentence is given in English; you write it in Solresol on the seven
// keys (the home row A S D F J K L, or 1–7, or the keys on screen), Space
// or ; between words. Each word is judged the moment it is finished — a
// right word sounds, a wrong one shows the right one — and the sentence is
// written when every word is. Hints show the next word's colours.

const STORE = 'solresol:write';
// A whole paragraph (the "A real text" section) is reading, not a writing drill.
const PHRASES = PHRASEBOOK.filter((s) => s.id !== 'text')
  .flatMap((s) => s.phrases.map((p) => ({ ...p, section: s.label })))
  .filter((p) => targetWords(p.sol).length);

const load = () => { try { return { written: 0, words: 0, seen: [], ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { return { written: 0, words: 0, seen: [] }; } };
const save = (s) => { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* private mode */ } };

export function mountWrite(host, ctx) {
  const stats = load();
  host.innerHTML = `
    <div class="wr">
      <p class="lede wr-lede">Write the sentence in Solresol. Play each word on the keys —
        <kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd> <kbd>J</kbd><kbd>K</kbd><kbd>L</kbd> or <kbd>1</kbd>–<kbd>7</kbd> —
        and press <kbd>Space</kbd> or <kbd>;</kbd> between words.</p>
      <div class="plate wr-plate">
        <p class="wr-section"></p>
        <h2 class="wr-en"></h2>
        <p class="wr-hint" hidden></p>
        <div class="wr-line" aria-live="polite"></div>
        <p class="wr-say" aria-live="polite"></p>
        <div class="wr-keys">
          ${NOTES.map((n) => `<button class="tr-key" data-k="${n.name}" style="--c:${n.color}">${cap(n.name)}</button>`).join('')}
          <button class="tr-key tr-key--gap" data-k=" ">space</button>
          <button class="tr-key tr-key--gap" data-k="back">⌫</button>
        </div>
        <div class="controls">
          <button class="btn btn--ghost" data-w="hint">Hint</button>
          <button class="btn btn--ghost" data-w="hear">▶ Hear the answer</button>
          <button class="btn btn--ink" data-w="next">Next sentence</button>
        </div>
        <p class="plate-caption wr-tally"></p>
      </div>
    </div>`;
  const $ = (s) => host.querySelector(s);
  const enEl = $('.wr-en'), sectionEl = $('.wr-section'), hintEl = $('.wr-hint'), lineEl = $('.wr-line'), sayEl = $('.wr-say'), tally = $('.wr-tally');

  let phrase = null, target = [], typed = [], building = [], hints = 0, finished = false;

  function pick() {
    const fresh = PHRASES.filter((p) => !stats.seen.includes(p.sol));
    const pool = fresh.length ? fresh : PHRASES;
    let next;
    do { next = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && next === phrase);
    phrase = next; target = targetWords(phrase.sol); typed = []; building = []; hints = 0; finished = false;
    sectionEl.textContent = phrase.section;
    enEl.textContent = phrase.en;
    hintEl.hidden = true; sayEl.textContent = `${target.length} word${target.length === 1 ? '' : 's'}.`;
    render();
  }

  function render() {
    const { verdicts } = checkWriting(target, typed);
    const cells = typed.map((w, i) => {
      const v = verdicts[i], t = target[i];
      return `<span class="wr-word wr-word--${v}">
        <b>${wordHTML(cap(w.join('')), { color: true })}</b>
        <small>${v === 'right' ? esc(phrase.lit[i] || '') : v === 'wrong' ? `→ ${wordHTML(cap(t.join('')), { color: true })}` : 'one too many'}</small>
      </span>`;
    });
    if (!finished) cells.push(`<span class="wr-word wr-word--now"><b>${building.length ? wordHTML(cap(building.join('')), { color: true }) : ''}<i class="writing-caret"></i></b><small>${building.length ? numbersHTML(building, ' ') : '&nbsp;'}</small></span>`);
    lineEl.innerHTML = cells.join('');
    const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
    tally.textContent = `${n(stats.written, 'sentence', 'sentences')} written · ${n(stats.words, 'word', 'words')} right`;
  }

  function endWord() {
    if (!building.length || finished) return;
    const w = building.slice(); typed.push(w); building = [];
    const i = typed.length - 1, t = target[i];
    const ok = t && w.join() === t.join();
    if (ok) { stats.words++; emit('word:used', { key: w.join(''), channel: 'write' }); playWord({ notes: w }); }
    else if (t) { sayEl.innerHTML = `Not quite — the word for <i>${esc(phrase.lit[i] || '…')}</i> is ${wordHTML(cap(t.join('')), { color: true })}.`; playWord({ notes: t }); }
    const { done } = checkWriting(target, typed);
    if (done) {
      finished = true; stats.written++;
      if (!stats.seen.includes(phrase.sol)) stats.seen.push(phrase.sol);
      const clean = typed.every((x, k) => target[k] && x.join() === target[k].join()) && hints === 0;
      sayEl.innerHTML = `${clean ? '★★★ Written perfectly' : '★ Written'} — <i>${esc(phrase.en)}</i>. Press <kbd>Enter</kbd> for the next.`;
      setTimeout(() => playSentence(target.map((notes) => ({ notes }))), 500);
    } else if (ok) {
      sayEl.textContent = typed.length < target.length ? `Yes. ${target.length - typed.length} to go.` : '';
    }
    save(stats); render();
  }

  function key(k) {
    if (finished) { if (k === 'enter') pick(); return; }
    if (k === 'back') {
      if (building.length) building.pop();
      else if (typed.length) building = typed.pop();          // reopen the last word
    } else if (k === ' ' || k === 'enter') endWord();
    else { building.push(k); playNote(k); }
    render();
  }

  function onKey(e) {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(input|textarea|select)$/i.test(e.target.tagName) || document.body.classList.contains('has-panel')) return;
    const n = noteForKey(e.key) || noteByNumber(e.key)?.name;
    if (n) { e.preventDefault(); key(n); return; }
    if (e.key === 'Backspace') { e.preventDefault(); key('back'); }
    else if (e.key === 'Enter') { e.preventDefault(); key('enter'); }
    else if (isCommitKey(e.key)) { e.preventDefault(); key(' '); }
  }
  window.addEventListener('keydown', onKey);

  host.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.k) { key(b.dataset.k); b.blur(); return; }
    if (b.dataset.w === 'next') pick();
    else if (b.dataset.w === 'hear') playSentence(target.map((notes) => ({ notes })));
    else if (b.dataset.w === 'hint') {
      hints++;
      const next = target[typed.length];
      hintEl.hidden = false;
      hintEl.innerHTML = next ? `Next word, <i>${esc(phrase.lit[typed.length] || '')}</i>: ${next.map((n) => `<span class="wr-hint-note" style="--c:${note(n).color}"></span>`).join('')}${hints > 1 ? ` — ${numbersHTML(next, ' ')}` : ''}` : '';
    }
  });

  pick();
  return { destroy() { window.removeEventListener('keydown', onKey); host.textContent = ''; } };
}
