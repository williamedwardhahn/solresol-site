import { cap } from '../../dictionary/notes.js';
import { getIndex } from '../../dictionary/dictionary.js';
import { staffSVG, colorStripSVG } from '../../graphics/graphics.js';
import { compose, writeOut, rulesInPlay, SLOTS, TENSES, PRONOUN_CHOICES } from '../../translate/composer.model.js';
import { lookup, shortGloss, readNotes } from '../../translate/lookup.js';
import { esc, swatches, written, encSentence } from './parts.js';

// The composer — five slots for the parts of speech, a tense, a negation,
// a mood. The grammar (src/translate/composer.model.js) puts the words in
// their canonical places; the result is written with its accents, sung,
// and can be sent to the sentence.

const SLOT_INFO = {
  subject:   { label: 'Subject',   hint: 'who',       num: 'i' },
  verb:      { label: 'Verb',      hint: 'does',      num: 'ii' },
  object:    { label: 'Object',    hint: 'what',      num: 'iii' },
  adjective: { label: 'Adjective', hint: 'kind',      num: 'iv' },
  adverb:    { label: 'Adverb',    hint: 'how',       num: 'v' },
};
const ROLE_LABEL = { subject: 'subject', verb: 'verb', object: 'object', adjective: 'adjective', adverb: 'adverb', tense: 'tense', negation: 'negation' };

const pron = (en) => { const p = PRONOUN_CHOICES.find((x) => x.en === en); return { notes: p.notes, form: p.form, pronoun: true, en: p.en }; };
const entry = (text) => { const notes = text.match(/do|re|mi|fa|sol|la|si/g); return { notes, en: shortGloss(getIndex().meaningOf(text)) }; };

export function mountComposerLeaf(el) {
  const slots = { subject: pron('I'), verb: entry('milasi'), object: pron('you'), adjective: null, adverb: null };
  let tense = '', negate = null, question = false;

  el.innerHTML = `
    <p class="hint cm-intro">Fill the slots in any order — the grammar sets the words in their places.
      Search in English or in Solresol.</p>
    <div class="cm-slots">
      ${SLOTS.map((s) => `
        <div class="cm-slot" data-slot="${s}">
          <p class="cm-slot-label"><span class="cm-slot-num">${SLOT_INFO[s].num}</span>${SLOT_INFO[s].label}<span class="cm-slot-hint">${SLOT_INFO[s].hint}</span></p>
          <div class="cm-chosen" data-chosen></div>
          ${s === 'subject' || s === 'object' ? `<div class="cm-prons" role="group" aria-label="Pronouns">${PRONOUN_CHOICES.map((p) =>
            `<button type="button" class="cm-pron" data-pron="${p.en}" title="${p.en}">${esc(written(p.notes, p.form, { capital: false }))}</button>`).join('')}</div>` : ''}
          <div class="cm-search-wrap">
            <input class="field cm-search" data-search type="search" placeholder="find ${/^[AO]/.test(SLOT_INFO[s].label) ? 'an' : 'a'} ${SLOT_INFO[s].label.toLowerCase()}…" autocomplete="off" spellcheck="false" aria-label="Find a ${SLOT_INFO[s].label.toLowerCase()}">
            <ul class="cm-results" data-results hidden></ul>
          </div>
        </div>`).join('')}
    </div>

    <div class="cm-inflect">
      <label class="cm-ctl">
        <span class="cm-ctl-label">Tense</span>
        <select class="field cm-tense" data-tense>
          <option value="">present — no particle</option>
          ${TENSES.map((t) => `<option value="${t.key}">${cap(t.key)} — ${t.name}</option>`).join('')}
        </select>
      </label>
      <div class="cm-ctl">
        <span class="cm-ctl-label">Negate</span>
        <div class="seg cm-seg" role="group" aria-label="Negate which word">
          <button type="button" class="seg-btn" data-neg="">none</button>
          ${SLOTS.map((s) => `<button type="button" class="seg-btn" data-neg="${s}">${s === 'adjective' ? 'adj.' : s === 'adverb' ? 'adv.' : s}</button>`).join('')}
        </div>
      </div>
      <div class="cm-ctl">
        <span class="cm-ctl-label">Mood</span>
        <div class="seg cm-seg" role="group" aria-label="Statement or question">
          <button type="button" class="seg-btn" data-q="0">statement</button>
          <button type="button" class="seg-btn" data-q="1">question</button>
        </div>
      </div>
    </div>

    <div data-result aria-live="polite"></div>`;

  const resultEl = el.querySelector('[data-result]');

  function renderSlots() {
    for (const s of SLOTS) {
      const box = el.querySelector(`[data-slot="${s}"]`), v = slots[s];
      box.classList.toggle('is-filled', !!v);
      box.querySelector('[data-chosen]').innerHTML = v
        ? `<button type="button" class="cm-chosen-word" data-open="${v.notes.join('-')}">${esc(written(v.notes, v.form || {}))}</button>
           ${swatches(v.notes)}<span class="cm-chosen-en">${esc(v.en || '')}</span>
           <button type="button" class="cm-clear" data-clear="${s}" aria-label="Empty the ${s} slot" title="Empty">×</button>`
        : '<span class="cm-empty">—</span>';
      box.querySelectorAll('[data-pron]').forEach((b) => b.setAttribute('aria-pressed', String(!!(v && v.pronoun && v.en === b.dataset.pron))));
    }
    el.querySelectorAll('[data-neg]').forEach((b) => {
      const k = b.dataset.neg;
      b.disabled = !!k && !slots[k];
      b.setAttribute('aria-pressed', String((negate || '') === k));
    });
    el.querySelectorAll('[data-q]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.q === '1') === question)));
  }

  function glossOf(w) {
    if (w.role === 'tense') return `(${w.name})`;
    if (w.role === 'negation') return 'not';
    const s = slots[w.role];
    return s?.en || shortGloss(getIndex().meaningOf(w.notes.join(''))) || '';
  }

  function renderResult() {
    if (negate && !slots[negate]) negate = null;
    const parts = { ...slots, tense: tense || null, negate, question };
    const ws = compose(parts);
    if (!ws.length) {
      resultEl.innerHTML = '<p class="tr-empty cm-none">Choose a word for a slot, and the sentence will be set here.</p>';
      return;
    }
    const words = ws.map((w) => w.notes);
    const line = writeOut(ws, question && !!slots.verb);
    const english = ws.map(glossOf).join(' ') + (question ? '?' : '');
    const rules = rulesInPlay(parts);
    const t = TENSES.find((x) => x.key === tense);
    const notes = [];
    if (rules.includes('question')) notes.push('<b>Question</b> — the verb comes before its subject. Nothing is added: no particle, only the order (§6.5).');
    else if (rules.includes('order')) notes.push('<b>Order</b> — subject, verb, object, as in English (§6.1).');
    if (rules.includes('tense')) notes.push(`<b>Tense</b> — the particle <i>${t.key}</i> (${t.name}) stands before the verb, the same for every person; the verb itself never changes (§6.4).`);
    if (tense && !slots.verb) notes.push('<b>Tense</b> — a tense particle needs a verb to stand before.');
    if (rules.includes('negation')) notes.push(`<b>Negation</b> — <i>do</i>, once, immediately before the word it denies: here the ${negate} (§6.5).`);
    if (rules.includes('adjective')) notes.push(`<b>Adjective</b> — it follows its noun (§6.1).`);
    if (ws.some((w) => w.accent >= 0)) notes.push('<b>Accent</b> — the circumflex marks the stressed note that tells a root its part: first for a noun, next-to-last for an adjective, last for an adverb. The verb is written plain (§6.2).');
    if (tense === 'solsol' && slots.subject) notes.push('<b>Imperative</b> — the subject is usually left out: <i>solsol sifala</i>, “repeat!”.');

    resultEl.innerHTML = `
      <figure class="plate cm-result" data-score>
        <ol class="cm-words">
          ${ws.map((w, i) => `<li class="cm-w cm-w--${w.role}" data-wi="${i}" style="--i:${i}">
            <button type="button" class="cm-w-sol" data-open="${w.notes.join('-')}">${esc(i === 0 ? cap(w.text) : w.text)}</button>
            ${swatches(w.notes)}
            <span class="cm-w-role">${ROLE_LABEL[w.role]}</span>
            <span class="cm-w-en">${esc(glossOf(w))}</span>
          </li>`).join('')}
          <li class="cm-stop" aria-hidden="true">${question && slots.verb ? '?' : '.'}</li>
        </ol>
        <p class="tr-read cm-read"><span class="tr-read-sol">${esc(line)}</span><span class="tr-read-en">${esc(english)}</span></p>
        <div class="tr-staff">${staffSVG(words)}</div>
        ${colorStripSVG(words, { height: 14 })}
        <div class="controls tr-score-acts">
          <button type="button" class="btn btn--ink" data-play="${encSentence(words)}">▶ Hear it</button>
          <button type="button" class="btn" data-add="${encSentence(words)}">＋ Use this sentence</button>
          <button type="button" class="btn btn--ghost" data-reset>Clear</button>
        </div>
        <figcaption class="plate-caption">Set by the grammar of Gajewski, 1902</figcaption>
      </figure>
      ${notes.length ? `<ul class="tr-notes cm-rules">${notes.map((n) => `<li>${n}</li>`).join('')}</ul>` : ''}`;
  }

  function render() { renderSlots(); renderResult(); }

  // search a slot
  let timer = 0;
  function search(input) {
    const box = input.closest('[data-slot]'), res = box.querySelector('[data-results]');
    const q = input.value.trim();
    if (!q) { res.hidden = true; res.innerHTML = ''; return; }
    const list = lookup(getIndex(), q, 7);
    const english = !readNotes(q);     // an English search: gloss the word by what was asked
    res.hidden = false;
    res.innerHTML = list.length
      ? list.map((c) => `<li><button type="button" class="cm-hit" data-pick="${c.notes.join('-')}" data-en="${esc(english ? (c.via || q).toLowerCase() : shortGloss(c.definition))}">
          <b>${esc(cap(c.notes.join('')))}</b>${swatches(c.notes)}<span>${esc(c.definition)}</span></button></li>`).join('')
      : `<li class="cm-nohit">No word for “${esc(q)}”.</li>`;
  }
  function onInput(e) {
    const input = e.target.closest('[data-search]');
    if (input) { clearTimeout(timer); timer = setTimeout(() => search(input), 120); }
    const sel = e.target.closest('[data-tense]');
    if (sel) { tense = sel.value; render(); }
  }
  function onClick(e) {
    const t = e.target;
    const pick = t.closest('[data-pick]');
    if (pick) {
      const box = pick.closest('[data-slot]'), s = box.dataset.slot;
      slots[s] = { notes: pick.dataset.pick.split('-'), en: pick.dataset.en };
      const input = box.querySelector('[data-search]'); input.value = '';
      box.querySelector('[data-results]').hidden = true;
      render(); return;
    }
    const p = t.closest('[data-pron]');
    if (p) { const s = p.closest('[data-slot]').dataset.slot; slots[s] = pron(p.dataset.pron); render(); return; }
    const c = t.closest('[data-clear]');
    if (c) { slots[c.dataset.clear] = null; render(); return; }
    const n = t.closest('[data-neg]');
    if (n && !n.disabled) { negate = n.dataset.neg || null; render(); return; }
    const q = t.closest('[data-q]');
    if (q) { question = q.dataset.q === '1'; render(); return; }
    if (t.closest('[data-reset]')) {
      for (const s of SLOTS) slots[s] = null;
      tense = ''; negate = null; question = false;
      el.querySelector('[data-tense]').value = '';
      render(); return;
    }
    // a click elsewhere closes open result lists
    if (!t.closest('.cm-search-wrap')) el.querySelectorAll('[data-results]').forEach((r) => { r.hidden = true; });
  }
  function onKey(e) {
    if (e.key === 'Enter' && e.target.matches('[data-search]')) {
      clearTimeout(timer); search(e.target);
      e.target.closest('[data-slot]').querySelector('[data-pick]')?.click();
    }
    if (e.key === 'Escape' && e.target.matches('[data-search]')) {
      e.target.value = ''; e.target.closest('[data-slot]').querySelector('[data-results]').hidden = true;
    }
  }

  el.addEventListener('input', onInput);
  el.addEventListener('change', onInput);
  el.addEventListener('click', onClick);
  el.addEventListener('keydown', onKey);
  render();
  return {
    destroy() {
      clearTimeout(timer);
      el.removeEventListener('input', onInput); el.removeEventListener('change', onInput);
      el.removeEventListener('click', onClick); el.removeEventListener('keydown', onKey);
    },
  };
}
