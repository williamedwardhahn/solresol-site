import { parse, cap } from '../../dictionary/notes.js';
import { toSolresol, TABLE } from './numbers.model.js';
import { lexicon, esc, fmt, swatches, digits } from './common.js';

// Numbers — any whole number said in Solresol. The base words are the
// dictionary's own; how they join is marked as the reading it is.

const PICKS = [7, 12, 21, 71, 99, 365, 1827, 2026, 1000000];

export function mountNumbers(host, ctx, route, memo) {
  const { byKey } = lexicon();
  const st = memo.numbers ||= { n: '1827' };
  const fromRoute = route && route.arg && /^\d+$/.test(route.arg) ? route.arg : null;
  if (fromRoute) st.n = fromRoute;

  host.innerHTML = `
    <p class="lede dx-lede">The numbers are words like any other, and every base number below is a headword in the
      dictionary — <i>Remimi</i> is glossed “two, second”. Larger numbers are built from them.</p>

    <figure class="plate dx-count-plate">
      <label class="dx-numin">
        <span class="rubric">Write a number</span>
        <input class="search dx-n" inputmode="numeric" autocomplete="off" aria-label="A whole number" value="${esc(st.n)}">
      </label>
      <div class="dx-picks">${PICKS.map((p) => `<button class="chip-word dx-pick" data-n="${p}">${fmt(p)}</button>`).join('')}</div>
      <div class="dx-said" aria-live="polite"></div>
    </figure>

    <section class="leaf">
      <h2 class="rubric">The base words <span class="rubric-note">each a headword in the dictionary</span></h2>
      <div class="dx-ntable">
        ${TABLE.map((row) => `<div class="dx-nrow">
          <p class="dx-nrow-head"><b>${row.title}</b><i>${row.rule}</i></p>
          <ol class="dx-ncells">${row.cells.map((c) => {
            const notes = parse(c.key), e = byKey.get(c.key);
            return `<li><button class="dx-ncell" data-open="${c.key}" title="${e ? esc(e.definition) : ''}">
              <span class="dx-nval">${numeral(c.value)}</span>
              <b>${cap(c.key)}</b>${swatches(notes)}</button></li>`;
          }).join('')}</ol></div>`).join('')}
      </div>
    </section>

    <section class="leaf dx-canon">
      <h2 class="rubric">What the dictionary does not say</h2>
      <ul>
        <li><b>No zero.</b> No headword is glossed “zero”. <i>Dodore</i>, which an earlier version of this site gave for it, means “earth, world”.</li>
        <li><b>No seventy, no ninety.</b> The tens run <i>fafa</i> + a note (20 <i>re</i>, 30 <i>mi</i>, 40 <i>sol</i>, 50 <i>la</i>, 60 <i>si</i>)
          and the notes run out; 80 is <i>Fadodo</i>. So 70 and 90 are read here as the French read them — 60 + 10 and 80 + 10 — and marked as a reading.</li>
        <li><b>No joining rule.</b> The parts are canon; putting them largest first, adding and multiplying as French does
          (<i>cent</i> and <i>mille</i> bare, <i>un million</i> counted), is this site's inference. Whether Sudre put <i>re</i>, “and”, into
          twenty-one as French puts <i>et</i> is not recorded here.</li>
        <li><b>No minus, no fractions.</b> <i>Do</i> before a word means “not”, not “less than zero”.</li>
      </ul>
    </section>`;

  const input = host.querySelector('.dx-n');
  const said = host.querySelector('.dx-said');

  function paint() {
    const raw = st.n.trim();
    if (!raw) { said.innerHTML = '<p class="dx-said-note">Write a whole number, from one to a thousand trillion.</p>'; return; }
    const r = toSolresol(raw);
    if (!r.ok) { said.innerHTML = `<p class="dx-said-note dx-said-note--no">${esc(r.note)}</p>`; return; }
    const keys = r.words.map((w) => w.key);
    const badge = { word: 'In the dictionary', composed: 'Composed', french: 'Composed · a reading' }[r.kind];
    said.innerHTML = `
      <p class="dx-said-fig">${fmt(r.n)}</p>
      <div class="dx-said-words">
        ${r.words.map((w) => `<button class="dx-sw ${w.role === 'times' ? 'dx-sw--times' : ''}" data-open="${w.key}">
          <b>${cap(w.key)}</b>${swatches(parse(w.key))}<small>${fmt(w.value)}${w.role === 'times' ? ' ×' : ''}</small></button>`).join('')}
      </div>
      <p class="dx-said-digits" aria-label="as figures, one per note">${keys.map((k) => digits(parse(k))).join(' · ')}</p>
      <div class="controls dx-said-ctl">
        <button class="btn btn--ink" data-play2="${keys.join(' ')}">▶ Say it</button>
        <span class="tag">${badge}</span>
      </div>
      <p class="dx-said-note">${esc(r.note)}</p>`;
  }

  const onInput = () => { st.n = input.value; paint(); };
  const onClick = (e) => {
    const t = e.target.closest('[data-n]');
    if (t) { st.n = t.dataset.n; input.value = st.n; paint(); }
  };
  input.addEventListener('input', onInput);
  host.addEventListener('click', onClick);
  paint();

  return {
    update(r) { if (r && r.arg && /^\d+$/.test(r.arg)) { st.n = r.arg; input.value = st.n; paint(); } },
    destroy() { input.removeEventListener('input', onInput); host.removeEventListener('click', onClick); },
  };
}

// 1e12 would print as 1,000,000,000,000 — too wide for a cell.
const numeral = (v) => v >= 1e6 ? `10<sup>${Math.round(Math.log10(v))}</sup>` : fmt(v);
