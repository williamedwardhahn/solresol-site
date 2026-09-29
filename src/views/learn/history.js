import { parse } from '../../dictionary/notes.js';
import { markWord } from '../../dictionary/grammar.js';
import { fanSVG, staffSVG, scriptSVG, colorStripSVG } from '../../graphics/graphics.js';
import { wordLink, sayWord } from './common.js';
import { wordHTML } from '../../graphics/graphics.js';

// History — Sudre's story, as a short illustrated timeline. Only the
// facts SOLRESOL_MASTER §1–3 marks [canon] or [documented]; the popular
// "1851 London medal" and the chromatic-clarion origin are left out
// because verification refuted them.

const EVENTS = [
  {
    year: '1817', title: 'Téléphonie',
    text: `Jean-François Sudre, a French violinist and teacher of music, first conceives of communicating <i>at a
      distance</i> with musical sounds — a way of signalling, not yet a language.`,
    art: () => `<div class="ln-art-staff">${staffSVG([parse('dore'), parse('misol'), parse('fala')], { labels: true })}</div>`,
    cap: 'a call, as it might be sounded',
  },
  {
    year: '1827', title: 'The language',
    text: `The idea becomes a whole language: seven syllables, and every word a row of them. The same sentence can be
      sung, played, painted, counted or signed. Its name is itself a word of it: ${wordLink('solresol')}, <i>language</i>.`,
    art: () => `<div class="ln-art-fan">${fanSVG({ title: 'The seven notes' })}</div>`,
    cap: 'do re mi fa sol la si',
    big: true,
  },
  {
    year: '1828', title: 'Before the Institut',
    text: `In January Sudre presents the system to the <b>Institut de France</b>. A commission — among them Prony, Arago,
      Fourier, Cherubini, Lesueur and Boieldieu — reports that it holds “the seeds of an ingenious discovery.”
      In the years after, the Ministry of War tries bugle signals on the Champ-de-Mars and the Navy tests them too —
      the application Sudre calls <i>téléphonie</i>.`,
  },
  {
    year: '1833', title: 'On the road',
    text: `Sudre tours France, Belgium and England with his collaborators Deldevez and Larsonneur, giving live demonstrations.
      On 14 September a second report of the Institut confirms his improvements. In 1838 he publishes a 62-page booklet
      on the language.`,
  },
  {
    year: '1855', title: 'Ten thousand francs',
    text: `The jury of the <b>Exposition Universelle</b> in Paris awards Sudre a prize of <b>10,000 francs</b>.`,
    art: () => `<div class="ln-art-medal"><span>10 000</span><small>francs</small></div>`,
    cap: 'Exposition Universelle, Paris',
  },
  {
    year: '1862', title: 'London',
    text: `At the <b>International Exhibition</b> in London, the music section tests the method, confirms it, and successfully
      petitions for a <b>pension for life</b> for Sudre.`,
  },
  {
    year: '1866', title: 'Langue musicale universelle',
    text: `His widow, <b>Joséphine Sudre</b>, publishes his definitive treatise after his death: <i>Langue musicale
      universelle</i>, a double dictionary of the language, with the seven written strokes. In 1869 she founds a
      Central Committee for the study and advancement of Solresol.`,
    art: () => `<div class="ln-art-script">${scriptSVG(parse('solresol'), { color: false })}</div>`,
    cap: 'Solresol, in Sudre’s strokes',
    big: true,
  },
  {
    year: '1902', title: 'Gajewski’s grammar',
    text: `Boleslas Gajewski publishes the <i>Grammaire du Solrésol</i> (Paris, R. Moutier): some forty pages, the most
      complete account of the rules — the keys, the movable accent, the doubled particles of tense. This School follows it.`,
    art: () => `<div class="ln-art-paradigm">${[-1, 0, 1, 2, 3].map((a) => `<button type="button" data-say="${a}">${wordHTML(markWord(parse('sirelasi'), { accent: a }))}</button>`).join('')}</div>`,
    cap: 'one root, five parts of speech — touch to hear',
  },
];

const AFTER = [
  ['1879 · 1887', 'Volapük, then Esperanto, far easier to learn, draw the world’s attention away.'],
  ['1997', 'Stephen L. Rice translates Gajewski’s grammar into English.'],
  ['2017', 'A request for an ISO 639-3 code is made, and refused the next year. The language travels under the tag <code>art-x-solresol</code>.'],
];

export function mountHistory(host) {
  host.innerHTML = `
    <header class="ln-history-head">
      <p class="ln-kicker">The story of Jean-François Sudre and his language</p>
      <h2 class="section-title">A life in seven notes</h2>
      <p class="lede">From a signal sounded across a field to a language with a dictionary of thousands of words — and then, almost, to silence.</p>
    </header>
    <ol class="ln-timeline">
      ${EVENTS.map((e) => `
      <li class="ln-event ${e.big ? 'ln-event--big' : ''}">
        <div class="ln-year">${e.year}</div>
        <div class="ln-event-body">
          <h3>${e.title}</h3>
          <p>${e.text}</p>
          ${e.art ? `<figure class="ln-event-art">${e.art()}<figcaption>${e.cap}</figcaption></figure>` : ''}
        </div>
      </li>`).join('')}
    </ol>
    <section class="ln-after">
      <h3 class="rubric">Afterwards</h3>
      <dl>${AFTER.map(([y, t]) => `<dt>${y}</dt><dd>${t}</dd>`).join('')}</dl>
      <div class="ln-after-strip">${colorStripSVG([parse('solresol')], { height: 10 })}</div>
      <p class="hint">Sources: French Wikipedia, <i>François Sudre</i>; Gajewski, <i>Grammaire du Solrésol</i> (1902). See the project's master reference for what is documented and what is legend.</p>
    </section>`;

  const onClick = (e) => {
    const b = e.target.closest('[data-say]'); if (!b) return;
    sayWord(parse('sirelasi'), { accent: Number(b.dataset.say) });
  };
  host.addEventListener('click', onClick);
  return { destroy() { host.removeEventListener('click', onClick); host.textContent = ''; } };
}
