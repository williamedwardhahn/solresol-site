import { note, cap } from '../../dictionary/notes.js?v=8aaee6f447';
import { CORE } from '../../dictionary/core.js?v=8aaee6f447';
import { playNote } from '../../voices/index.js?v=8aaee6f447';
import { emit } from '../../live/bus.js?v=8aaee6f447';
import { noteTracker, decodeHum } from '../../learn/singing.model.js?v=8aaee6f447';
import { esc } from './common.js?v=8aaee6f447';

// Hum to speak — for someone who can hum but not speak.
//
// Hum a word's notes, one by one; a short pause ends the word. What was
// hummed is a noisy copy of what was meant, so the word is DECODED, not
// looked up: every core word is weighed by how its notes line up with the
// hum (a neighbouring note is an easy slip, a far one is not) and by how
// often it is needed. The best guesses are OFFERED — nothing is said until
// the person confirms one. Then it is played and spoken aloud.

const VOCAB = CORE.map((c) => ({ word: c.concept, gloss: c.gloss, notes: c.notes, prior: c.priority === 1 ? 2 : 1 }));
const PAUSE = 1.1;              // seconds of quiet that end a word

export function mountSpeak(host, env) {
  host.innerHTML = `
    <div class="ln-speak">
      <p class="ln-speak-how">Hum each note of a word — <i>do</i>, <i>si</i>, <i>do</i> — then pause. The best guesses appear; choose one and it is said aloud.</p>
      <div class="ln-speak-hum" aria-live="polite"><span class="ln-speak-empty">listening for notes…</span></div>
      <div class="ln-speak-guesses" aria-live="polite"></div>
      <div class="controls">
        <button class="btn btn--ghost" data-speak="clear">Start the word again</button>
      </div>
      <details class="ln-speak-words">
        <summary>What can I say?</summary>
        <ul>${VOCAB.slice().sort((a, b) => b.prior - a.prior).map((v) => `<li><b>${esc(v.gloss)}</b> ${v.notes.map((n) => `<span class="nt" style="color:${note(n).color}">${n}</span>`).join(' ')}</li>`).join('')}</ul>
      </details>
      <ol class="ln-speak-said" aria-label="Said so far"></ol>
    </div>`;
  const $ = (s) => host.querySelector(s);
  const humBox = $('.ln-speak-hum'), guessBox = $('.ln-speak-guesses'), said = $('.ln-speak-said');

  let track = noteTracker({ minHold: 0.22 });
  let hummed = [];               // the notes of the word so far
  let holding = null, lastSound = 0, offered = false;

  const chip = (n, live = false) => `<span class="ln-speak-note${live ? ' is-live' : ''}" style="--c:${note(n).color}">${n}</span>`;
  function renderHum() {
    humBox.innerHTML = hummed.length || holding
      ? hummed.map((n) => chip(n)).join('') + (holding ? chip(holding, true) : '')
      : '<span class="ln-speak-empty">listening for notes…</span>';
  }
  function reset() { hummed = []; holding = null; offered = false; track = noteTracker({ minHold: 0.22 }); guessBox.innerHTML = ''; renderHum(); }

  function offer() {
    offered = true;
    const guesses = decodeHum(hummed, VOCAB, { top: 3 });
    guessBox.innerHTML = `<p class="ln-speak-q">Did you mean…</p>` + guesses.map((gs, i) => `
      <button class="ln-speak-guess" data-say="${i}">
        <b>${esc(gs.gloss)}</b>
        <span class="ln-speak-notes">${gs.notes.map((n) => `<span class="nt" style="color:${note(n).color}">${cap(n)}</span>`).join('')}</span>
        <span class="ln-speak-p"><i style="width:${Math.round(gs.p * 100)}%"></i></span>
      </button>`).join('') + `<button class="btn btn--ghost btn--small" data-speak="none">None of these</button>`;
    guessBox._guesses = guesses;
  }

  function speak(g) {
    g.notes.forEach((n, i) => playNote(n, i * 0.28, 0.28, { octave: env.refOctave(), damp: i < g.notes.length - 1 }));
    env.ear.deafen(g.notes.length * 280 + 1600);
    try {
      if (window.speechSynthesis) {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(g.gloss.split('/')[0].trim());
        u.rate = 0.95;
        setTimeout(() => speechSynthesis.speak(u), g.notes.length * 280);
      }
    } catch { /* no voice: the notes and the words on screen still carry it */ }
    emit('word:used', { key: g.notes.join(''), channel: 'hum' });
    said.insertAdjacentHTML('afterbegin', `<li><b>${esc(g.gloss)}</b> ${g.notes.map((n) => `<span class="nt" style="color:${note(n).color}">${n}</span>`).join(' ')}</li>`);
    reset();
  }

  function hear(r, now) {
    if (offered) return;                                   // waiting for a choice
    const t = now / 1000;
    const out = track(r.reading, t);
    if (out.finished) hummed.push(out.finished.note);
    if (r.reading) lastSound = t;
    const was = holding;
    holding = out.holding;
    if (out.finished || holding !== was) renderHum();
    if (hummed.length && !holding && t - lastSound > PAUSE) offer();
  }

  host.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.say !== undefined) speak(guessBox._guesses[Number(b.dataset.say)]);
    else if (b.dataset.speak) reset();
  });
  return { hear, draw() {}, destroy() { try { speechSynthesis.cancel(); } catch { /* none */ } host.textContent = ''; } };
}
