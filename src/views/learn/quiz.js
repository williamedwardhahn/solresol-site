import { NOTES, note, cap } from '../../dictionary/notes.js';
import { allWords } from '../../dictionary/dictionary.js';
import { SEMANTIC_KEYS } from '../../dictionary/grammar.js';
import { emit } from '../../live/bus.js';
import { playNote, playWord } from '../../voices/index.js';
import {
  LEVELS, UNLOCK_AT, QUIZ_KEY, normalize, isUnlocked, highestUnlocked, record, accuracy, dayStreak,
  weightOf, prepare, question, checkComposition, shortGloss, ROLE_LABEL, TENSE_EN,
} from '../../learn/quiz.model.js';
import { esc, wordLink, swatches, sayWord, today, loadJSON, saveJSON } from './common.js';

// The examinations — five levels, each opened by ten right answers in the
// one before. Keys 1–7 answer; Enter goes on. The pure logic (questions,
// weighting toward weak spots, progress) is in src/learn/quiz.model.js.

let ENTRIES = null;
const entries = () => (ENTRIES ||= prepare(allWords()));
const ORD = ['first', 'second', 'third', 'fourth', 'fifth'];
const COLOUR = { do: 'red', re: 'orange', mi: 'yellow', fa: 'green', sol: 'blue', la: 'indigo', si: 'violet' };

export function mountQuiz(host, ctx) {
  let progress = normalize(loadJSON(QUIZ_KEY));
  let level = highestUnlocked(progress);
  let q = null, answered = false, built = [], hinted = false, timer = 0, heard = false;

  host.innerHTML = `
    <section class="ln-exam">
      <header class="ln-exam-head">
        <p class="ln-kicker">The examinations</p>
        <div class="ln-ladder" data-ladder></div>
        <div class="ln-stats" data-stats></div>
      </header>
      <div class="plate ln-exam-card" data-card aria-live="polite"></div>
      <p class="hint ln-exam-keys">Keys <kbd>1</kbd>–<kbd>7</kbd> answer · <kbd>Enter</kbd> goes on · every word opens its page</p>
    </section>`;
  const $ = (s) => host.querySelector(s);
  const ladder = $('[data-ladder]'), stats = $('[data-stats]'), card = $('[data-card]');

  function renderLadder() {
    ladder.innerHTML = LEVELS.map((L, i) => {
      const open = isUnlocked(progress, i), n = Math.min(progress.levels[i], UNLOCK_AT);
      const need = i ? Math.max(0, UNLOCK_AT - progress.levels[i - 1]) : 0;
      return `<button type="button" class="ln-rung ${i === level ? 'is-on' : ''} ${open ? '' : 'is-locked'}" data-level="${i}" ${open ? '' : 'disabled'}
          aria-pressed="${i === level}" title="${open ? L.task : `Opens after ${need} more right in ${LEVELS[i - 1].title}`}">
        <span class="ln-rung-num">${L.numeral}</span>
        <span class="ln-rung-title">${L.title}</span>
        <span class="ln-rung-pips" aria-label="${n} of ${UNLOCK_AT}">${Array.from({ length: UNLOCK_AT }, (_, k) => `<i class="${k < n ? 'on' : ''}"></i>`).join('')}</span>
        ${open ? '' : `<span class="ln-rung-lock">locked · ${need} to go</span>`}
      </button>`;
    }).join('');
  }

  function renderStats() {
    const weak = Object.keys(progress.concepts)
      .filter((c) => progress.concepts[c].wrong > 0 && weightOf(progress, c) > 1.2)
      .sort((a, b) => weightOf(progress, b) - weightOf(progress, a)).slice(0, 3);
    stats.innerHTML = `
      <span><b>${progress.score}</b> right</span>
      <span><b>${progress.streak}</b> in a row <small>(best ${progress.best})</small></span>
      <span><b>${Math.round(accuracy(progress) * 100)}%</b> accuracy</span>
      <span><b>${dayStreak(progress.days, today())}</b> ${dayStreak(progress.days, today()) === 1 ? 'day' : 'days'} running</span>
      ${weak.length ? `<span class="ln-weak">practising: ${weak.map(conceptLabel).join(' · ')}</span>` : ''}`;
  }

  // ── a question ──
  function next() {
    clearTimeout(timer);
    q = question(level, entries(), progress);
    answered = false; built = []; hinted = false;
    card.innerHTML = `<p class="ln-q-level">${LEVELS[level].numeral} · ${LEVELS[level].title}</p>${body(q)}<div class="ln-feedback" data-fb></div>`;
    card.classList.remove('is-right', 'is-wrong');
    card.classList.remove('is-turning'); void card.offsetWidth; card.classList.add('is-turning');
    if (q.kind === 'compose') renderBuilt();
    if (heard) speak();
  }

  function speak() {
    if (!q) return;
    if (q.kind === 'ear') playNote(q.target, 0, 0.9);
    else if (q.kind === 'family') { let t = 0; for (const w of q.words) t += sayWord(w.notes, {}, t) + 0.35; }
    else if (q.kind === 'mirror-meaning' || q.kind === 'mirror-form') sayWord(q.word.notes);
    else if (q.kind === 'accent') sayWord(q.word.notes, { accent: q.accent });
    else if (q.kind === 'mark') sayWord(q.word.notes, { accent: 0, ...q.form.marks });
    else if (q.kind === 'tense') { let t = 0; for (const k of q.sentence) t += sayWord(parseKey(k), {}, t) + 0.25; }
  }

  function body(q) {
    const options = (list, cls = '') => `<ol class="ln-options ${cls}">${list.map((o, i) =>
      `<li><button type="button" class="ln-option" data-opt="${i}"><kbd>${i + 1}</kbd><span>${o.label}</span></button></li>`).join('')}</ol>`;
    const hear = (label = 'Hear it') => `<button type="button" class="btn btn--ink ln-hear" data-hear>▶ ${label}</button>`;
    switch (q.kind) {
      case 'ear': return `
        <h3 class="ln-q">A note sounds. Which is it?</h3>
        <div class="ln-q-stage">${hear('Hear the note')}</div>
        <div class="ln-keys" role="group" aria-label="The seven notes">
          ${NOTES.map((n, i) => `<button type="button" class="ln-notekey" data-opt="${i}" style="--c:${n.color}"><i></i><b>${cap(n.name)}</b><kbd>${n.num}</kbd></button>`).join('')}
        </div>`;
      case 'family': return `
        <h3 class="ln-q">Three words share a first note. Which family do they belong to?</h3>
        <div class="ln-trio">${q.words.map((w) => `<div class="ln-trio-word">${swatches(w.notes)}${wordLink(w.key)}<i>${esc(shortGloss(w.def, 2))}</i></div>`).join('')}</div>
        <div class="ln-q-stage">${hear('Hear all three')}</div>
        ${options(q.options)}`;
      case 'mirror-meaning': return `
        <h3 class="ln-q">${wordLink(q.word.key)} means <i>“${esc(shortGloss(q.word.def, 2))}”</i>. Reverse it — what does ${wordLink(q.mirror.key)} mean?</h3>
        <div class="ln-mirrorpair">${mirrorRow(q.word.notes)}<span class="ln-mirror-rule" aria-hidden="true"></span>${mirrorRow(q.mirror.notes)}</div>
        <div class="ln-q-stage">${hear('Hear the word')}</div>
        ${options(q.options)}`;
      case 'mirror-form': return `
        <h3 class="ln-q">${wordLink(q.word.key)} means <i>“${esc(shortGloss(q.word.def, 2))}”</i>. Which word says the opposite?</h3>
        <div class="ln-mirrorpair">${mirrorRow(q.word.notes)}</div>
        <div class="ln-q-stage">${hear('Hear the word')}</div>
        ${options(q.options, 'ln-options--words')}`;
      case 'accent': return `
        <h3 class="ln-q">Written with its accent on the ${ORD[q.accent]} syllable, what is this word?</h3>
        <p class="ln-written-big">${esc(cap(q.written))}</p>
        <p class="ln-q-sub">the root ${wordLink(q.word.key)}: <i>${esc(shortGloss(q.word.def, 3))}</i></p>
        <div class="ln-q-stage">${hear('Hear the accent')}</div>
        ${options(q.options)}`;
      case 'tense': return `
        <h3 class="ln-q">What does the particle ${wordLink(q.particle)} do to the verb?</h3>
        <p class="ln-written-big ln-sentence">${q.sentence.map((k) => wordLink(k, { cls: k === q.particle ? 'is-marked' : '' })).join(' ')}</p>
        <p class="ln-q-sub"><i>${esc(q.subjEn)}</i> · <i>?</i> · <i>${esc(shortGloss(q.verbDef, 1))}</i></p>
        <div class="ln-q-stage">${hear('Hear the sentence')}</div>
        ${options(q.options)}`;
      case 'mark': return `
        <h3 class="ln-q">Read the marks on the last syllable. Gender and number?</h3>
        <p class="ln-written-big">${esc(cap(q.written))}</p>
        <p class="ln-q-sub">the noun ${wordLink(q.word.key)}: <i>${esc(shortGloss(q.word.def, 2))}</i></p>
        <div class="ln-q-stage">${hear('Hear it')}</div>
        ${options(q.options)}`;
      default: return `
        <h3 class="ln-q">Build the word for <i>“${esc(shortGloss(q.word.def, 3))}”</i></h3>
        <div class="ln-built" data-built aria-live="polite"></div>
        <div class="ln-keys" role="group" aria-label="The seven notes">
          ${NOTES.map((n, i) => `<button type="button" class="ln-notekey" data-add="${i}" style="--c:${n.color}"><i></i><b>${cap(n.name)}</b><kbd>${n.num}</kbd></button>`).join('')}
        </div>
        <div class="controls ln-compose-controls">
          <button type="button" class="btn btn--ghost btn--small" data-back>⌫ Back</button>
          <button type="button" class="btn btn--ghost btn--small" data-hint>Hint</button>
          <button type="button" class="btn btn--ink" data-submit>Submit ↵</button>
        </div>
        <p class="hint" data-hinttext></p>`;
    }
  }

  function renderBuilt() {
    const el = card.querySelector('[data-built]'); if (!el) return;
    const len = Math.max(q.target.length, built.length);
    el.innerHTML = Array.from({ length: len }, (_, i) => built[i]
      ? `<span class="ln-slot is-filled" style="--c:${note(built[i]).color}"><b>${cap(built[i])}</b></span>`
      : `<span class="ln-slot"></span>`).join('');
    card.querySelector('[data-submit]').disabled = !built.length;
  }

  // ── answering ──
  function choose(i) {
    if (answered || !q || q.kind === 'compose') return;
    const o = q.options[i]; if (!o) return;
    answered = true;
    settle(o.correct, i);
  }

  function submit() {
    if (answered || q?.kind !== 'compose' || !built.length) return;
    answered = true;
    settle(checkComposition(built, q.target));
  }

  function settle(right, chosen = -1) {
    progress = record(progress, level, q.concept, right, today());
    saveJSON(QUIZ_KEY, progress);
    card.classList.add(right ? 'is-right' : 'is-wrong');
    card.querySelectorAll('[data-opt]').forEach((b, i) => {
      b.disabled = true;
      const o = q.options[i];
      if (o?.correct) b.classList.add('is-right');
      else if (i === chosen) b.classList.add('is-wrong');
    });
    card.querySelectorAll('[data-add],[data-back],[data-hint],[data-submit]').forEach((b) => { b.disabled = true; });
    const key = usedKey(q);
    if (right && key) emit('word:used', { key, channel: 'quiz' });
    if (q.kind === 'compose') playWord({ notes: q.target });
    else if (q.kind === 'mirror-meaning' || q.kind === 'mirror-form') sayWord(q.mirror.notes);

    const justOpened = level + 1 < LEVELS.length && progress.levels[level] === UNLOCK_AT && right;
    card.querySelector('[data-fb]').innerHTML = `
      <p class="ln-verdict">${right ? '<span class="ln-tick">✓</span> Right.' : '<span class="ln-cross">✗</span> Not quite.'} ${explain(q)}</p>
      ${justOpened ? `<p class="ln-unlocked">Level ${LEVELS[level + 1].numeral} — <i>${LEVELS[level + 1].title}</i> — is open.</p>` : ''}
      <div class="controls ln-next-row"><button type="button" class="btn ${right ? '' : 'btn--ink'}" data-next>Next question ›</button></div>`;
    renderLadder(); renderStats();
    if (right && !justOpened) timer = setTimeout(next, q.kind === 'ear' ? 1300 : 2600);
  }

  function explain(q) {
    switch (q.kind) {
      case 'ear': { const n = note(q.target); return `It was <b>${cap(n.name)}</b> — note ${n.num}, ${COLOUR[n.name]}.`; }
      case 'family': return `All three begin with <b>${cap(q.key)}</b>, the key of <i>${esc(SEMANTIC_KEYS[q.key].toLowerCase())}</i>.`;
      case 'mirror-meaning':
      case 'mirror-form': return `${wordLink(q.word.key)} <i>${esc(shortGloss(q.word.def, 1))}</i> reversed is ${wordLink(q.mirror.key)} <i>${esc(shortGloss(q.mirror.def, 1))}</i>.`;
      case 'accent': return `The accent on the ${ORD[q.accent]} syllable makes ${esc(ROLE_LABEL[q.role])}: ${accentRule(q)}.`;
      case 'tense': return `${wordLink(q.particle)} before the verb marks ${esc(TENSE_EN[q.particle])}.`;
      case 'mark': return `${q.form.id === 'plain' ? 'No mark: masculine and singular.' : `${q.form.marks.feminine ? 'The bar (¯) is the feminine' : ''}${q.form.marks.feminine && q.form.marks.plural ? '; ' : ''}${q.form.marks.plural ? 'the acute (´) is the plural' : ''}.`}`;
      default: return `${wordLink(q.word.key)} — ${q.target.map((n) => cap(n)).join(' · ')} — <i>${esc(shortGloss(q.word.def, 2))}</i>.`;
    }
  }
  const accentRule = (q) => q.accent === 0 ? 'first, the thing' : q.accent === q.word.notes.length - 1 ? 'last, the adverb'
    : q.accent === q.word.notes.length - 2 ? 'penultimate, the adjective' : 'second, the person';

  // ── events ──
  const onClick = (e) => {
    heard = true;
    const t = e.target.closest('button'); if (!t || !host.contains(t)) return;
    if (t.dataset.level !== undefined) { level = Number(t.dataset.level); renderLadder(); next(); return; }
    if (t.dataset.opt !== undefined) { choose(Number(t.dataset.opt)); return; }
    if (t.dataset.hear !== undefined) { speak(); return; }
    if (t.dataset.next !== undefined) { next(); return; }
    if (t.dataset.add !== undefined) { add(NOTES[Number(t.dataset.add)].name); return; }
    if (t.dataset.back !== undefined) { built.pop(); renderBuilt(); return; }
    if (t.dataset.submit !== undefined) { submit(); return; }
    if (t.dataset.hint !== undefined) giveHint();
  };
  const add = (n) => {
    if (answered || q?.kind !== 'compose' || built.length >= 6) return;
    built.push(n); playNote(n, 0, 0.35); renderBuilt();
  };
  const giveHint = () => {
    if (hinted || answered) return;
    hinted = true;
    card.querySelector('[data-hinttext]').textContent = `It begins with ${cap(q.target[0])} and has ${q.target.length} notes.`;
    playNote(q.target[0], 0, 0.5);
  };
  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || document.body.classList.contains('has-panel')) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 7) {
      e.preventDefault(); heard = true;
      if (q?.kind === 'compose') add(NOTES[n - 1].name); else choose(n - 1);
    } else if (e.key === 'Enter') {
      if (e.target.closest?.('button') && !answered) return;   // let a focused button act
      e.preventDefault();
      if (answered) next(); else if (q?.kind === 'compose') submit();
    } else if (e.key === 'Backspace' && q?.kind === 'compose' && !answered) {
      e.preventDefault(); built.pop(); renderBuilt();
    }
  };
  host.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);

  renderLadder(); renderStats(); next();

  return {
    destroy() {
      clearTimeout(timer);
      host.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey);
      host.textContent = '';
    },
  };
}

const parseKey = (k) => k.match(/do|re|mi|fa|sol|la|si/g) || [];

function mirrorRow(notes) {
  return `<span class="ln-mirror-row">${notes.map((n) => `<span class="ln-mblock" style="--c:${note(n).color}">${cap(n)}</span>`).join('')}</span>`;
}

function usedKey(q) {
  if (q.kind === 'ear') return q.target;
  if (q.kind === 'compose' || q.kind === 'accent' || q.kind === 'mark') return q.word.key;
  if (q.kind.startsWith('mirror')) return q.mirror.key;
  if (q.kind === 'tense') return q.particle;
  return null;
}

function conceptLabel(c) {
  const [kind, v] = c.split(':');
  switch (kind) {
    case 'note': return `the note ${cap(v)}`;
    case 'family': return `the ${cap(v)} family`;
    case 'mirror': return `${cap(v)}'s mirror`;
    case 'accent': return `the ${v}`;
    case 'tense': return cap(v);
    case 'mark': return v.replace('-', ' ');
    case 'word': return cap(v);
    default: return c;
  }
}

