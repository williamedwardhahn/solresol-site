import { note, cap, parse } from '../dictionary/notes.js';
import { meaningOf, wordCount } from '../dictionary/dictionary.js';
import { playNote, playWord } from '../voices/index.js';
import { Word } from '../lang/word.js';

// The introduction — three steps, shown once, on a first visit.
//
//   i    play any three notes            (the keys are right there)
//   ii   that was a word: here it is     (every combination is a word)
//   iii  colours are sounds are numbers  (and read backwards, a word flips)
//
// It rides on the live building-word: it only watches ctx.word, so the
// instrument below keeps working the whole time. Skipping or finishing
// sets prefs.onboarded, and it is not shown again (unless replayed).

const NUMERALS = ['i', 'ii', 'iii'];
const FALLBACK = parse('milasi');          // love ⇄ silami, hate

export function mountOnboarding(host, ctx, { onStep = () => {}, onDone = () => {} } = {}) {
  host.classList.add('intro');
  host.setAttribute('role', 'region');
  host.setAttribute('aria-label', 'Introduction');
  let step = 0, unwatch = () => {}, timer = 0, said = null, flipped = false;

  const first = (m) => String(m).split(/[,;]/)[0];

  function frame(title, body) {
    host.innerHTML = `
      <div class="intro-head">
        <span class="intro-count">${NUMERALS.map((n, i) => `<span class="${i === step ? 'is-on' : i < step ? 'is-done' : ''}">${n}</span>`).join('')}</span>
        <button class="intro-skip" data-skip>skip the introduction</button>
      </div>
      <h2 class="intro-title">${title}</h2>
      <div class="intro-body">${body}</div>`;
  }

  function show(i) {
    unwatch(); unwatch = () => {};
    clearTimeout(timer);
    step = i;
    onStep(step);
    if (i === 0) stepPlay();
    else if (i === 1) stepWord();
    else stepVoices();
    host.classList.remove('intro--in'); void host.offsetWidth; host.classList.add('intro--in');
  }

  // i — play any three notes
  function stepPlay() {
    frame('Play any three notes.',
      `<p class="intro-text">Tap the coloured keys below — or the home row, <kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd> <kbd>J</kbd><kbd>K</kbd><kbd>L</kbd>. Any three.</p>
       <div class="intro-beads" aria-hidden="true"><i></i><i></i><i></i></div>`);
    ctx.word.clear();
    const beads = [...host.querySelectorAll('.intro-beads i')];
    unwatch = ctx.word.watch((notes) => {
      beads.forEach((b, k) => {
        const n = notes[k];
        b.style.background = n ? note(n).color : '';
        b.classList.toggle('is-set', !!n);
      });
      if (notes.length >= 3 && !timer) {
        said = notes.slice();
        timer = setTimeout(() => show(1), 650);
      }
    });
  }

  // ii — reveal: that was a word
  function stepWord() {
    const key = said.join(''), m = ctx.state.meanings.get()[key] || meaningOf(key);
    frame('You just said a word.',
      `<div class="intro-reveal">
         <button class="intro-word" data-hear title="Hear it again">${cap(key)}</button>
         <p class="intro-meaning">${m ? `means <em>“${esc(first(m))}”</em>` : '<em>— a word Sudre left empty</em>'}</p>
       </div>
       <p class="intro-text">In Solresol <b>every combination of notes is a word</b> — ${wordCount().toLocaleString()} of them in Sudre’s dictionary.
       ${m ? '' : 'This one is still unclaimed; you may give it a meaning.'} Play more and watch the meaning change; <kbd>Space</kbd> says the word into your sentence.</p>
       <div class="intro-actions"><button class="btn btn--ink" data-next>Next — the voices →</button></div>`);
  }

  // iii — colours are sounds are numbers, and the reversal
  // the pair to flip: the word just played, if it and its mirror both mean something
  function pair() {
    const key = said.join(''), opp = said.slice().reverse().join('');
    return meaningOf(key) && meaningOf(opp) && opp !== key ? said : FALLBACK;
  }
  const shown = () => (flipped ? pair().slice().reverse() : pair());

  function stepVoices() {
    const w = Word(shown());
    const m = meaningOf(w.key);
    frame('Colours are sounds are numbers.',
      `<p class="intro-text">Each note is also a colour, a number, a hand sign and a stroke of the pen — so a word can be sung, painted, counted or written, and it is the same word.</p>
       <div class="intro-voices" data-voices>
         ${w.notes.map((n) => {
           const nt = note(n);
           return `<button class="intro-note" data-note="${n}" style="--c:${nt.color}" aria-label="${n}, ${nt.num}">
             <i></i><b>${n}</b><span>${nt.num}</span></button>`;
         }).join('')}
         <span class="intro-eq">=</span>
         <span class="intro-vword"><b>${w.text}</b><em>${m ? esc(first(m)) : ''}</em></span>
       </div>
       <p class="intro-text">And read it backwards: <b>a reversed word means the opposite</b>.</p>
       <div class="intro-actions">
         <button class="btn" data-flip>⇄ Reverse it</button>
         <button class="btn btn--ink" data-done>Begin playing →</button>
       </div>`);
  }

  function finish() {
    unwatch(); clearTimeout(timer);
    ctx.state.setPref('onboarded', true);
    host.textContent = '';
    onDone();
  }

  host.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.skip !== undefined || b.dataset.done !== undefined) finish();
    else if (b.dataset.next !== undefined) { flipped = false; show(2); }
    else if (b.dataset.hear !== undefined) playWord(Word(said));
    else if (b.dataset.note) playNote(b.dataset.note);
    else if (b.dataset.flip !== undefined) {
      flipped = !flipped;
      stepVoices();
      const v = host.querySelector('[data-voices]');
      v.classList.add('is-flipping');
      playWord(Word(shown()));
    }
  });

  show(0);
  return { destroy() { unwatch(); clearTimeout(timer); host.textContent = ''; } };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
