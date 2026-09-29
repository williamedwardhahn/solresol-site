import { allWords } from '../dictionary/dictionary.js';
import { cap } from '../dictionary/notes.js';
import { on } from '../live/bus.js';
import { prepare, microQuestions } from './quiz.model.js';
import {
  SRS_KEY, normalizeSrs, noteUse, shouldAsk, chooseDue, markAsked, recordAnswer, stopAsking,
} from './srs.model.js';

// The micro-quiz — now and then, a small question about a word you just
// used: its mirror, its family, its part of speech by accent. Scheduled
// by spaced repetition (srs.model.js), never more than once in two
// minutes, dismissed with ×, Escape or by waiting, and silenced for good
// with "stop asking" (kept in localStorage under 'solresol:microquiz').
//
//   const mq = mountMicroQuiz(document.body, ctx);   // once, by the shell
//   mq.destroy();
//
// It listens on the bus for 'word:commit' (notes). `host` receives one
// fixed-position toast; nothing else is added to the page.

const SHOW_AFTER_MS = 900;          // let the commit land before asking
const LINGER_MS = 20000;            // an unanswered question leaves by itself

let ENTRIES = null;
const entries = () => (ENTRIES ||= prepare(allWords()));

export function mountMicroQuiz(host, ctx, { now = () => Date.now() } = {}) {
  const load = () => { try { return normalizeSrs(JSON.parse(localStorage.getItem(SRS_KEY))); } catch { return normalizeSrs(null); } };
  const save = (s) => { try { localStorage.setItem(SRS_KEY, JSON.stringify(s)); } catch { /* private mode */ } };

  const toast = document.createElement('aside');
  toast.className = 'mq';
  toast.hidden = true;
  toast.setAttribute('role', 'dialog');
  toast.setAttribute('aria-label', 'A small question');
  host.appendChild(toast);

  let showTimer = 0, lingerTimer = 0, hideTimer = 0, current = null;

  const off = on('word:commit', (notes) => {
    if (!Array.isArray(notes) || !notes.length) return;
    let s = noteUse(load());
    save(s);
    if (!toast.hidden || !shouldAsk(s, now())) return;
    const qs = microQuestions(notes, entries());
    const id = chooseDue(s, qs.map((q) => q.id), now());
    if (!id) return;
    const q = qs.find((x) => x.id === id);
    s = markAsked(s, now());
    save(s);
    clearTimeout(showTimer);
    showTimer = setTimeout(() => show(q), SHOW_AFTER_MS);
  });

  function show(q) {
    current = q;
    toast.innerHTML = `
      <div class="mq-head">
        <span class="mq-title">${q.title}</span>
        <button type="button" class="mq-close" data-dismiss aria-label="Dismiss">×</button>
      </div>
      <p class="mq-prompt">${q.prompt}</p>
      <div class="mq-options">${q.options.map((o, i) => `<button type="button" class="mq-opt" data-i="${i}">${o.label}</button>`).join('')}</div>
      <p class="mq-result" aria-live="polite"></p>
      <div class="mq-foot">
        <button type="button" class="mq-link" data-open>Open ${cap(q.answerWord || q.word)}</button>
        <button type="button" class="mq-link" data-stop>Stop asking</button>
      </div>`;
    toast.hidden = false;
    toast.classList.remove('is-leaving', 'is-right', 'is-wrong');
    clearTimeout(lingerTimer);
    lingerTimer = setTimeout(dismiss, LINGER_MS);
  }

  function dismiss() {
    clearTimeout(lingerTimer); clearTimeout(hideTimer);
    if (toast.hidden) return;
    toast.classList.add('is-leaving');
    hideTimer = setTimeout(() => { toast.hidden = true; toast.textContent = ''; current = null; }, 260);
  }

  function answer(i) {
    const q = current; if (!q || toast.classList.contains('is-right') || toast.classList.contains('is-wrong')) return;
    const o = q.options[i]; if (!o) return;
    save(recordAnswer(load(), q.id, o.correct, now()));
    toast.classList.add(o.correct ? 'is-right' : 'is-wrong');
    toast.querySelectorAll('.mq-opt').forEach((b, k) => {
      b.disabled = true;
      if (q.options[k].correct) b.classList.add('is-right'); else if (k === i) b.classList.add('is-wrong');
    });
    toast.querySelector('.mq-result').textContent = o.correct ? 'Right.' : 'Not quite — the right answer is marked.';
    clearTimeout(lingerTimer);
    lingerTimer = setTimeout(dismiss, o.correct ? 1800 : 4200);
  }

  const onClick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.i !== undefined) answer(Number(t.dataset.i));
    else if (t.dataset.dismiss !== undefined) dismiss();
    else if (t.dataset.stop !== undefined) { save(stopAsking(load())); dismiss(); }
    else if (t.dataset.open !== undefined && current) { const w = current.answerWord || current.word; dismiss(); ctx.openWord(w); }
  };
  const onKey = (e) => { if (e.key === 'Escape' && !toast.hidden) dismiss(); };
  toast.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);

  return {
    destroy() {
      off();
      clearTimeout(showTimer); clearTimeout(lingerTimer); clearTimeout(hideTimer);
      window.removeEventListener('keydown', onKey);
      toast.remove();
    },
  };
}
