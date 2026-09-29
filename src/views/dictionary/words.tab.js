import { NOTES, cap } from '../../dictionary/notes.js';
import { filterEntries, queryNotes } from './lexicon.model.js';
import { lexicon, entryRow, esc, fmt, swatches } from './common.js';

// All words — the dictionary leafed page by page, in the order of the scale,
// with a thumb index of the seven notes down its edge.

const PER = 50;

export function mountWords(host, ctx, route, memo) {
  const { entries } = lexicon();
  const st = memo.words ||= { q: '', syllables: 0, start: null, page: 0 };

  host.innerHTML = `
    <p class="lede dx-lede">Every word Sudre's successors wrote down, in the order of the scale —
      <i>do</i> before <i>re</i>, a word before every longer word it begins.
      Search in Solresol, in English, or in figures (<span class="dx-num">135</span> is <i>Domisol</i>).</p>
    <div class="dx-find">
      <input class="search dx-q" type="search" placeholder="Search Solresol or English…" aria-label="Search the dictionary"
        autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(st.q)}">
      <div class="dx-filters">
        <span class="dx-filter-label">Syllables</span>
        <div class="seg" role="group" aria-label="Syllables">
          ${[0, 1, 2, 3, 4, 5].map((n) => `<button class="seg-btn" data-syl="${n}" aria-pressed="${st.syllables === n}">${n || 'All'}</button>`).join('')}
        </div>
      </div>
    </div>
    <div class="dx-book">
      <div class="dx-page">
        <div class="dx-runhead" aria-live="polite"></div>
        <ol class="dx-entries"></ol>
        <nav class="dx-folio" aria-label="Pages"></nav>
      </div>
      <nav class="dx-thumbs" aria-label="Words beginning with">
        ${NOTES.map((n) => `<button class="dx-thumb" data-start="${n.name}" style="--c:${n.color}" aria-pressed="${st.start === n.name}"><span>${cap(n.name)}</span></button>`).join('')}
      </nav>
    </div>`;

  const q = host.querySelector('.dx-q');
  const head = host.querySelector('.dx-runhead');
  const list = host.querySelector('.dx-entries');
  const folio = host.querySelector('.dx-folio');
  let found = [];

  function run(resetPage = true) {
    found = filterEntries(entries, st);
    if (resetPage) st.page = 0;
    paint();
  }

  function paint() {
    const pages = Math.max(1, Math.ceil(found.length / PER));
    st.page = Math.min(st.page, pages - 1);
    const slice = found.slice(st.page * PER, st.page * PER + PER);
    const filters = [st.syllables ? `${st.syllables} syllable${st.syllables > 1 ? 's' : ''}` : '', st.start ? `beginning ${cap(st.start)}` : ''].filter(Boolean).join(', ');

    if (!found.length) {
      const spelled = queryNotes(st.q);
      head.innerHTML = `<span class="dx-count">No words</span>`;
      list.innerHTML = `<li class="dx-empty">
        <p>Nothing in the dictionary answers to <b>“${esc(st.q || filters)}”</b>${st.q && filters ? ` among words ${filters}` : ''}.</p>
        ${spelled && spelled.length > 1 ? `<p><button class="chip-word" data-open="${spelled.join('')}">${swatches(spelled)} ${cap(spelled.join(''))}</button>
          is not a word yet — open its page to hear it, or give it a meaning of your own.</p>` : ''}
        ${st.syllables || st.start ? '<button class="btn btn--small btn--ghost" data-clear>Clear the filters</button>' : ''}
      </li>`;
      folio.innerHTML = '';
      return;
    }

    const first = slice[0], last = slice[slice.length - 1];
    head.innerHTML = `
      <span class="dx-guide"><b>${first.text}</b>${slice.length > 1 ? `<i>—</i><b>${last.text}</b>` : ''}</span>
      <span class="dx-count">${fmt(found.length)} ${found.length === 1 ? 'word' : 'words'}${st.q ? ` for “${esc(st.q)}”` : ''}${filters ? ` · ${filters}` : ''}</span>`;
    list.innerHTML = slice.map((e) => entryRow(e)).join('');
    list.classList.toggle('dx-entries--few', slice.length < 12);

    folio.innerHTML = pages < 2 ? '' : `
      <button class="btn btn--small btn--ghost" data-page="${st.page - 1}" ${st.page ? '' : 'disabled'} aria-label="Previous page">‹ Before</button>
      <span class="dx-folio-n">page <b>${st.page + 1}</b> of ${pages}</span>
      <button class="btn btn--small btn--ghost" data-page="${st.page + 1}" ${st.page < pages - 1 ? '' : 'disabled'} aria-label="Next page">After ›</button>`;
  }

  const onInput = () => { st.q = q.value; run(); };
  const onClick = (e) => {
    const t = e.target.closest('button');
    if (!t || !host.contains(t)) return;
    if (t.dataset.syl !== undefined) {
      st.syllables = Number(t.dataset.syl);
      host.querySelectorAll('[data-syl]').forEach((b) => b.setAttribute('aria-pressed', String(b === t)));
      run();
    } else if (t.dataset.start) {
      st.start = st.start === t.dataset.start ? null : t.dataset.start;
      host.querySelectorAll('[data-start]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.start === st.start)));
      run();
    } else if (t.dataset.page !== undefined) {
      st.page = Number(t.dataset.page);
      paint();
      const top = head.getBoundingClientRect().top + window.scrollY - 12;
      if (top < window.scrollY) window.scrollTo({ top });
    } else if (t.hasAttribute('data-clear')) {
      st.syllables = 0; st.start = null;
      host.querySelectorAll('[data-syl]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.syl === '0')));
      host.querySelectorAll('[data-start]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
      run();
    }
  };
  q.addEventListener('input', onInput);
  host.addEventListener('click', onClick);
  run(false);

  return {
    update() {},
    destroy() { q.removeEventListener('input', onInput); host.removeEventListener('click', onClick); },
  };
}
