import { parse, cap } from '../../dictionary/notes.js';
import { meaningOf } from '../../dictionary/dictionary.js';
import { Word } from '../../lang/word.js';
import { playSentence } from '../../voices/index.js';
import { colorStripSVG } from '../../graphics/graphics.js';
import { LEVELS, UNLOCK_AT, QUIZ_KEY, normalize, freshProgress, accuracy } from '../../learn/quiz.model.js';
import { SRS_KEY, normalizeSrs, freshSrs } from '../../learn/srs.model.js';
import { esc, wordLink, swatches, loadJSON, saveJSON } from './common.js';

// Yours — what this device remembers of you: starred words, saved
// sentences, the words memory holds and how brightly, your examinations,
// and a way to begin again.

export function mountYours(host, ctx) {
  host.innerHTML = `
    <header class="ln-yours-head">
      <p class="ln-kicker">Kept on this device only</p>
      <h2 class="section-title">Your commonplace book</h2>
      <p class="lede">The words you starred, the sentences you kept, and what your memory holds.</p>
    </header>
    <div class="ln-yours">
      <section class="ln-ysec" data-stars></section>
      <section class="ln-ysec" data-saved></section>
      <section class="ln-ysec ln-ysec--wide" data-memory></section>
      <section class="ln-ysec" data-exams></section>
      <section class="ln-ysec" data-reset></section>
    </div>`;
  const $ = (s) => host.querySelector(s);

  const renderStars = (stars) => {
    $('[data-stars]').innerHTML = `
      <h3 class="rubric">Starred <span class="rubric-note">${stars.length || 'none yet'}</span></h3>
      ${stars.length ? `<ul class="ln-list">${stars.map((k) => `<li>
          ${swatches(parse(k))}${wordLink(k)}<span class="ln-list-gloss">${esc(short(meaningOf(k)) || '—')}</span>
          <button type="button" class="ln-x" data-unstar="${k}" aria-label="Unstar ${cap(k)}" title="Unstar">★</button>
        </li>`).join('')}</ul>`
        : '<p class="hint">Star a word from its page (☆) and it will be kept here.</p>'}`;
  };

  const renderSaved = (saved) => {
    $('[data-saved]').innerHTML = `
      <h3 class="rubric">Saved sentences <span class="rubric-note">${saved.length || 'none yet'}</span></h3>
      ${saved.length ? `<ul class="ln-sentences">${saved.map((s, i) => `<li>
          <div class="ln-sent-strip">${colorStripSVG(s.words, { height: 8 })}</div>
          <p class="ln-sent-name">${esc(s.name || 'Untitled')}${s.at ? ` <small>${new Date(s.at).toLocaleDateString()}</small>` : ''}</p>
          <p class="ln-sent-words">${s.words.map((ns) => wordLink(ns.join(''))).join(' ')}</p>
          <div class="ln-sent-actions">
            <button type="button" class="btn btn--small" data-playsent="${i}">▶ Play</button>
            <button type="button" class="btn btn--small btn--ghost" data-load="${i}">Load into the sentence</button>
            <button type="button" class="ln-x" data-delsent="${i}" aria-label="Delete">×</button>
          </div>
        </li>`).join('')}</ul>`
        : '<p class="hint">Sentences you save while composing are kept here, to play or load again.</p>'}`;
  };

  const renderMemory = () => {
    const now = Date.now();
    const known = ctx.memory.known().filter((k) => parse(k).length)
      .map((k) => ({ k, s: ctx.memory.strengthOf(k, now) }))
      .sort((a, b) => b.s - a.s);
    const bright = known.filter((x) => x.s >= 0.5).length;
    $('[data-memory]').innerHTML = `
      <h3 class="rubric">What memory holds <span class="rubric-note">${known.length ? `${known.length} ${known.length === 1 ? 'word' : 'words'} met · ${bright} bright` : 'nothing yet'}</span></h3>
      ${known.length ? `<ul class="ln-memory">${known.slice(0, 60).map(({ k, s }) => `<li>
          ${wordLink(k)}
          <span class="ln-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(s * 100)}" aria-label="strength"><i style="width:${Math.max(3, Math.round(s * 100))}%"></i></span>
        </li>`).join('')}</ul>
        ${known.length > 60 ? `<p class="hint">and ${known.length - 60} more, fainter.</p>` : ''}
        <p class="hint">A word brightens each time you meet it and fades over a day and a half without it. The faint ones wait for you in <a href="#/learn/games">Games · Fading</a>.</p>`
        : '<p class="hint">Every word you play, hear or open is remembered here, and fades if you leave it.</p>'}`;
  };

  const renderExams = () => {
    const p = normalize(loadJSON(QUIZ_KEY));
    const mq = normalizeSrs(loadJSON(SRS_KEY));
    $('[data-exams]').innerHTML = `
      <h3 class="rubric">Examinations</h3>
      <ol class="ln-exam-summary">${LEVELS.map((L, i) => `<li><span class="ln-es-num">${L.numeral}</span>${L.title}
        <span class="ln-es-count">${p.levels[i] >= UNLOCK_AT ? '✓ passed' : `${p.levels[i]} / ${UNLOCK_AT}`}</span></li>`).join('')}</ol>
      <p class="hint">${p.asked ? `${p.right} right of ${p.asked} (${Math.round(accuracy(p) * 100)}%) · best run ${p.best}.` : 'Not yet begun.'}
        <a href="#/learn/quiz">Go to the examinations ›</a></p>
      <p class="ln-mq-row">Little questions while you play:
        <button type="button" class="btn btn--small ${mq.off ? '' : 'btn--ghost'}" data-mq>${mq.off ? 'Turn them back on' : 'Stop asking'}</button></p>`;
  };

  const RESETS = [
    ['quiz', 'Forget examination progress'],
    ['memory', 'Forget what memory holds'],
    ['stars', 'Clear starred words'],
    ['saved', 'Clear saved sentences'],
  ];
  let confirming = null;
  const renderReset = () => {
    $('[data-reset]').innerHTML = `
      <h3 class="rubric">Begin again</h3>
      <ul class="ln-resets">${RESETS.map(([id, label]) => `<li>${confirming === id
        ? `<span class="ln-confirm">Sure? This cannot be undone.</span>
           <button type="button" class="btn btn--small btn--rubric" data-doreset="${id}">Yes, forget</button>
           <button type="button" class="btn btn--small btn--ghost" data-cancel>Keep</button>`
        : `<button type="button" class="btn btn--small btn--ghost" data-reset="${id}">${label}</button>`}</li>`).join('')}</ul>`;
  };

  const doReset = (id) => {
    if (id === 'quiz') { saveJSON(QUIZ_KEY, freshProgress()); saveJSON(SRS_KEY, { ...freshSrs(), off: normalizeSrs(loadJSON(SRS_KEY)).off }); renderExams(); }
    if (id === 'memory') ctx.memory.forget?.();
    if (id === 'stars') ctx.state.stars.set([]);
    if (id === 'saved') ctx.state.saved.set([]);
  };

  const onClick = (e) => {
    const t = e.target.closest('button'); if (!t || !host.contains(t)) return;
    const d = t.dataset;
    if (d.unstar) ctx.state.toggleStar(d.unstar);
    else if (d.playsent !== undefined) {
      const s = ctx.state.saved.get()[Number(d.playsent)];
      if (s) playSentence(s.words.map((ns) => Word(ns)));
    } else if (d.load !== undefined) {
      const s = ctx.state.saved.get()[Number(d.load)];
      if (s) { ctx.sentence.set(s.words.map((ns) => Word(ns))); flash(t, '✓ Loaded'); }
    } else if (d.delsent !== undefined) {
      const list = ctx.state.saved.get().slice(); list.splice(Number(d.delsent), 1); ctx.state.saved.set(list);
    } else if (d.mq !== undefined) {
      const mq = normalizeSrs(loadJSON(SRS_KEY)); saveJSON(SRS_KEY, { ...mq, off: !mq.off }); renderExams();
    } else if (d.reset) { confirming = d.reset; renderReset(); }
    else if (d.cancel !== undefined) { confirming = null; renderReset(); }
    else if (d.doreset) { doReset(d.doreset); confirming = null; renderReset(); }
  };
  host.addEventListener('click', onClick);

  const offs = [
    ctx.state.stars.watch(renderStars),
    ctx.state.saved.watch(renderSaved),
    ctx.memory.watch(renderMemory),
  ];
  renderExams(); renderReset();

  return {
    destroy() { offs.forEach((f) => f()); host.removeEventListener('click', onClick); host.textContent = ''; },
  };
}

const short = (d) => (d ? d.split(/,\s*/).slice(0, 3).join(', ') : '');

function flash(btn, text) {
  const was = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { if (btn.isConnected) btn.textContent = was; }, 1400);
}
