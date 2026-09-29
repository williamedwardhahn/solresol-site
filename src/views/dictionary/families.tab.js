import { NOTES, note, cap } from '../../dictionary/notes.js';
import { SEMANTIC_KEYS } from '../../dictionary/grammar.js';
import { familyTree } from './lexicon.model.js';
import { lexicon, entryRow, esc, fmt, swatches } from './common.js';

// By family — Gajewski's seven keys (the first note decides the field of
// meaning), each split by its second note into seven sub-families. The
// sub-families have no names in the canon, so they are shown as what they
// are: two notes, the two-note word that heads them, and a few members.

// Gajewski's own description of each key (docs/SOLRESOL_MASTER.md §5).
const DOMAIN = {
  do:  'Physical and moral man; the intellectual faculties; good qualities; food and sustenance.',
  re:  'Clothing and the toilet; the house, its furniture and keeping; the family.',
  mi:  'The actions of man, and his faults.',
  fa:  'The countryside and agriculture; travel; war; the sea and the navy.',
  sol: 'The theatre, literature, the fine arts and the sciences.',
  la:  'Industry and commerce.',
  si:  'The city: administration, government, politics, finance, the police.',
};

let treeCache = { entries: null, tree: null };

export function mountFamilies(host, ctx, route) {
  const { entries } = lexicon();
  if (treeCache.entries !== entries) treeCache = { entries, tree: familyTree(entries) };
  const tree = treeCache.tree;
  const max = Math.max(...tree.flatMap((f) => f.subs.map((s) => s.words.length)));

  host.innerHTML = `
    <p class="lede dx-lede">In Gajewski's grammar the first note of a four-syllable word is its <em>key</em>: it names the field
      the meaning lies in. The second note divides each field again, seven ways. The canon leaves those forty-nine
      unnamed, so here each is shown by its notes, the two-note word that heads it, and a few of its words.</p>

    <figure class="plate dx-matrix-plate">
      <table class="dx-matrix">
        <caption class="sr-only">Words in each of the forty-nine sub-families: rows are the first note, columns the second.</caption>
        <thead><tr><th scope="col"><span class="dx-corner">1st <i>╲</i> 2nd</span></th>
          ${NOTES.map((n) => `<th scope="col"><span class="dx-mh" style="--c:${n.color}">${cap(n.name)}</span></th>`).join('')}</tr></thead>
        <tbody>${tree.map((f) => `<tr>
          <th scope="row"><a class="dx-mh" style="--c:${note(f.note).color}" href="#/dictionary/families/${f.note}">${cap(f.note)}</a></th>
          ${f.subs.map((s) => {
            const n = s.words.length, k = n / max;
            return `<td><a class="dx-cell${k > 0.5 ? ' dx-cell--dark' : ''}" href="#/dictionary/families/${s.key}" style="--k:${k.toFixed(3)}"
              title="${cap(s.key)}${s.head ? ' — ' + esc(s.head.definition) : ''}: ${n} words">
              <b>${n}</b><span>${cap(s.key)}</span></a></td>`;
          }).join('')}</tr>`).join('')}
        </tbody>
      </table>
      <figcaption class="plate-caption">Table of the forty-nine · the darker, the fuller</figcaption>
      <p class="dx-matrix-note">${matrixNote(tree, entries)}</p>
    </figure>

    ${tree.map((f) => {
      const n = note(f.note);
      return `<section class="dx-family" id="dx-fam-${f.note}" style="--c:${n.color}">
        <header class="dx-family-head">
          <span class="dx-family-note">${cap(f.note)}</span>
          <div class="dx-family-title">
            <p class="rubric">The key of ${cap(f.note)} <span class="rubric-note">${fmt(f.count)} words</span></p>
            <h2 class="section-title">${SEMANTIC_KEYS[f.note]}</h2>
            <p class="dx-domain">${DOMAIN[f.note]}</p>
            ${f.head ? `<p class="dx-family-particle">Alone, <button class="dx-link" data-open="${f.note}">${cap(f.note)}</button> is the particle <i>“${esc(f.head.definition)}”</i>.</p>` : ''}
          </div>
        </header>
        <div class="dx-subs">
          ${f.subs.map((s) => `<details class="dx-sub" id="dx-sub-${s.key}" data-key="${s.key}">
            <summary>
              ${swatches(s.notes, 'dx-sub-sw')}
              <span class="dx-sub-name"><b>${cap(s.key)}–</b>${s.head ? `<i>${esc(firstGloss(s.head.definition))}</i>` : ''}</span>
              <span class="dx-sub-eg">${s.samples.length ? s.samples.map(esc).join(' · ') : '—'}</span>
              <span class="dx-sub-n">${s.words.length}</span>
            </summary>
            <div class="dx-sub-body"></div>
          </details>`).join('')}
        </div>
      </section>`;
    }).join('')}
    <p class="hint dx-foot">The keys are Gajewski's and hold for four-syllable words. Shorter words and the five-syllable
      words of this dictionary are filed by the same first note, but their meaning need not lie in its field.</p>`;

  // Fill a sub-family's list only when it is first opened: 3,000 rows are
  // not built for a page that shows forty-nine summaries.
  const fill = (d) => {
    const body = d.querySelector('.dx-sub-body');
    if (body.childElementCount) return;
    const s = tree.flatMap((f) => f.subs).find((x) => x.key === d.dataset.key);
    body.innerHTML = `
      ${s.head ? `<ol class="dx-entries dx-entries--head">${entryRow(s.head)}</ol>` : ''}
      <ol class="dx-entries">${s.words.map((e) => entryRow(e)).join('')}</ol>`;
  };
  const onToggle = (e) => { if (e.target.open) fill(e.target); };
  host.addEventListener('toggle', onToggle, true);

  function go(r) {
    const arg = (r && r.arg) || '';
    if (!arg) return;
    const key = arg.toLowerCase().replace(/[^a-z]/g, '');
    const target = host.querySelector(`#dx-sub-${key}`) || host.querySelector(`#dx-fam-${key}`);
    if (!target) return;
    if (target.tagName === 'DETAILS') { target.open = true; fill(target); }
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }
  go(route);

  return {
    update: go,
    destroy() { host.removeEventListener('toggle', onToggle, true); },
  };
}

// What the table shows, read from the data rather than asserted.
function matrixNote(tree, entries) {
  const subs = tree.flatMap((f) => f.subs);
  const tally = new Map();
  for (const s of subs) tally.set(s.words.length, (tally.get(s.words.length) || 0) + 1);
  const [common] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
  const doubled = subs.filter((s) => s.notes[0] === s.notes[1]).map((s) => s.words.length);
  const sameDoubled = doubled.every((n) => n === doubled[0]) ? doubled[0] : null;
  const five = entries.filter((e) => e.notes.length >= 5);
  const fiveHomes = subs.filter((s) => s.words.some((e) => e.notes.length >= 5)).map((s) => `<i>${cap(s.key)}</i>`);
  const list = fiveHomes.length > 1 ? fiveHomes.slice(0, -1).join(', ') + ' and ' + fiveHomes[fiveHomes.length - 1] : fiveHomes[0];
  return `Most sub-families hold the same ${common} words${sameDoubled ? `; those that begin on a doubled note hold ${sameDoubled}` : ''}.
    ${five.length ? `${list} swell with this dictionary's ${fmt(five.length)} five-syllable words, which Gajewski's list of 2,660 does not include.` : ''}`;
}

const firstGloss = (def) => String(def).split(/[;(]/)[0].split(',').slice(0, 2).join(',').trim();
