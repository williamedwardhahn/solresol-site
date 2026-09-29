import { NOTES, parse, cap } from '../../dictionary/notes.js';
import { meaningOf } from '../../dictionary/dictionary.js';
import { SEMANTIC_KEYS, TENSE_MARKERS, accentForms, markWord } from '../../dictionary/grammar.js';
import { OPPOSITES, EXCEPTIONS, shortGloss } from '../../learn/quiz.model.js';
import { esc, wordLink, swatches, sayWord } from './common.js';

// Grammar — canonical Gajewski (Grammaire du Solrésol, 1902), set as a
// grammar book: numbered paragraphs, interlinear examples, tables. Every
// Solresol word opens its own page; every ▶ says the example aloud, with
// its accents.

// A playable token: "sirelasi:0" = accent on the first syllable;
// "dofa::f" feminine; "dore::p" plural; "sirelasi" plain.
const tok = (key, { accent = -1, feminine = false, plural = false } = {}) =>
  `${key}:${accent}:${feminine ? 'f' : ''}${plural ? 'p' : ''}`;
const readTok = (t) => {
  const [k, a = '-1', m = ''] = t.split(':');
  return { notes: parse(k), marks: { accent: Number(a), feminine: m.includes('f'), plural: m.includes('p') } };
};
const play = (tokens, label = 'Hear it') =>
  `<button type="button" class="ln-say" data-say="${tokens.join(' ')}" aria-label="${esc(label)}">▶</button>`;

// A written form (with marks) that still opens the plain word's page.
const form = (key, marks = {}) => wordLink(key, { shown: markWord(parse(key), marks) });

// An interlinear example: the Solresol line, a gloss under each word, the translation.
function example(words, english, { note: n = '' } = {}) {
  const toks = words.map((w) => tok(w.k, w.m));
  return `<div class="ln-ex">
    ${play(toks, 'Hear: ' + english)}
    <div class="ln-ex-body">
      <div class="ln-ex-line">${words.map((w) => `<span class="ln-ex-word">${w.k ? form(w.k, w.m) : ''}${w.punct || ''}<small>${esc(w.g)}</small></span>`).join('')}</div>
      <p class="ln-ex-en">“${esc(english)}”${n ? ` <span class="hint">${n}</span>` : ''}</p>
    </div>
  </div>`;
}

const FAMILY_EXAMPLES = {
  do: ['doremifa', 'domifare'], re: ['redolami', 'remisido'], mi: ['mirefado', 'miresido'],
  fa: ['fadoremi', 'faresido'], sol: ['soldoremi', 'solremido'], la: ['ladoremi', 'laresido'],
  si: ['sidoremi', 'sirelado'],
};
const FAMILY_FULL = {   // Gajewski's domains in full (SOLRESOL_MASTER §5)
  do: 'Physical and moral man; the intellectual faculties; good qualities; food',
  re: 'Clothing and the toilet; the house, furniture, housekeeping; the family',
  mi: "Man's actions, and his faults",
  fa: 'The countryside, agriculture, travel, war, the sea',
  sol: 'The theatre, literature, the fine arts and the sciences',
  la: 'Industry and commerce',
  si: 'The city, administration, government, politics, finance, the police',
};

const PARAGRAPHS = [
  ['words', 'The word and its length'],
  ['keys', 'The seven keys'],
  ['accent', 'The movable accent'],
  ['gender', 'Gender and number'],
  ['tense', 'Tense and mood'],
  ['negation', 'Negation'],
  ['question', 'Questions'],
  ['pronouns', 'Pronouns'],
  ['articles', 'The article'],
  ['order', 'The order of words'],
  ['reversal', 'Opposition by reversal'],
];
const num = (id) => PARAGRAPHS.findIndex(([p]) => p === id) + 1;
const head = (id) => `<h3 class="ln-para-head"><span class="ln-para-num">§ ${num(id)}</span>${PARAGRAPHS[num(id) - 1][1]}</h3>`;

function markup() {
  const sire = parse('sirelasi');
  const glossSire = { '-1': 'to constitute', 0: 'constitution', 1: 'a constituent (person)', 2: 'constitutional', 3: 'constitutionally' };
  const accentName = { '-1': 'none', 0: 'first', 1: 'second', 2: 'penultimate', 3: 'last' };

  const tenseRows = [
    { p: null, name: 'Present', en: 'I love', words: ['dore', 'milasi'] },
    ...Object.entries(TENSE_MARKERS).map(([p, name]) => ({ p, name })),
  ];
  const TENSE_EX = {
    dodo: ['dore dodo milasi', 'I loved, I was loving'],
    rere: ['dore rere milasi', 'I had loved'],
    mimi: ['dore mimi milasi', 'I shall love'],
    fafa: ['dore fafa milasi', 'I would love'],
    solsol: ['solsol milasi', 'Love!'],
    lala: ['lala milasi', 'loving'],
    sisi: ['sisi milasi', 'loved'],
  };
  const GAJ = {
    dodo: 'Imparfait et passé défini', rere: 'Plus-que-parfait', mimi: 'Futur', fafa: 'Conditionnel',
    solsol: 'Impératif', lala: 'Participe présent', sisi: 'Participe passé',
  };

  return `
  <header class="ln-grammar-head">
    <p class="ln-kicker">After Boleslas Gajewski, <i>Grammaire du Solrésol</i>, Paris, 1902</p>
    <h2 class="section-title">The Grammar</h2>
    <p class="lede">“The syntax of the musical language is of an extreme simplicity.” Eleven short paragraphs hold nearly all of it.
      Every word below opens its own page; every ▶ says the example aloud, accents and all.</p>
    <nav class="ln-contents" aria-label="Paragraphs">
      ${PARAGRAPHS.map(([id, t], i) => `<button type="button" data-goto="${id}"><span>§ ${i + 1}</span>${t}</button>`).join('')}
    </nav>
  </header>

  <section class="ln-para" id="g-words">
    ${head('words')}
    <p>Words are rows of one to five notes, and their length says something of their use. The one-note words
      are the smallest particles — ${wordLink('si')} <i>yes</i>, ${wordLink('do')} <i>no</i>, ${wordLink('la')} <i>the</i>.
      Two notes make the pronouns and the commonest small words; three, the everyday words; four, the bulk of the language.</p>
    <table class="ln-table">
      <thead><tr><th>Notes</th><th>Use</th><th class="num">Words</th><th>For example</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>particles</td><td class="num">7</td><td>${wordLink('re')} and · ${wordLink('mi')} or</td></tr>
        <tr><td>2</td><td>pronouns, small words</td><td class="num">49</td><td>${wordLink('dore')} I · ${wordLink('misol')} good</td></tr>
        <tr><td>3</td><td>the everyday words</td><td class="num">336</td><td>${wordLink('domisol')} God · ${wordLink('milasi')} love</td></tr>
        <tr><td>4</td><td>under the seven keys (§ 2)</td><td class="num">2,268</td><td>${wordLink('doremifa')} nose · ${wordLink('fadoremi')} countryside</td></tr>
        <tr class="total"><td colspan="2">Gajewski's dictionary</td><td class="num">2,660</td><td></td></tr>
      </tbody>
    </table>
    <p class="hint">Fewer than the arithmetic allows (7 × 7 × 7 = 343), because the doubled notes — dodo, rere, mimi… — are kept back as particles of tense (§ 5).</p>
  </section>

  <section class="ln-para" id="g-keys">
    ${head('keys')}
    <p>In a four-note word without a repeated note, the <b>first note is a key</b>: it names the region of thought the word belongs to.
      Meaning can be half-guessed from sound.</p>
    <table class="ln-table ln-keytable">
      <thead><tr><th>Key</th><th>Its domain</th><th>For example</th></tr></thead>
      <tbody>
        ${NOTES.map((n) => `<tr>
          <td><span class="ln-key" style="--c:${n.color}">${cap(n.name)}</span></td>
          <td>${FAMILY_FULL[n.name]}</td>
          <td class="ln-keys-ex">${FAMILY_EXAMPLES[n.name].map((k) => `${wordLink(k)} <i>${esc(shortGloss(meaningOf(k), 1))}</i>`).join('<br>')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </section>

  <section class="ln-para" id="g-accent">
    ${head('accent')}
    <p>One root serves as verb, noun, adjective and adverb. What changes is the <b>tonic accent</b> — in speech a
      <i>rinforzando</i> on one syllable, in writing a mark above it (Gajewski prints a circumflex; this book sets the stressed syllable <span class="w-stress">in red</span>). The <b>verb</b> is the bare word; the accent on
      the <b>first</b> syllable makes a noun of the thing, on the <b>second</b> a noun of the person, on the
      <b>penultimate</b> an adjective, on the <b>last</b> an adverb. Gajewski's paradigm is ${wordLink('sirelasi')}, <i>to constitute</i>:</p>
    <table class="ln-table ln-paradigm">
      <thead><tr><th></th><th>Part of speech</th><th>Accent</th><th>Written</th><th>Meaning</th></tr></thead>
      <tbody>
        ${accentForms(sire).map((f) => `<tr>
          <td>${play([tok('sirelasi', { accent: f.accent })], 'Hear ' + f.role)}</td>
          <td class="sc">${f.role}</td>
          <td>${accentName[f.accent]}</td>
          <td class="ln-written">${form('sirelasi', { accent: f.accent })}</td>
          <td><i>${glossSire[f.accent]}</i></td>
        </tr>`).join('')}
      </tbody>
    </table>
    <p>So too ${wordLink('midofa')}, <i>to prefer</i>: ${form('midofa', { accent: 1 })} <i>preferable</i>,
      ${form('midofa', { accent: 2 })} <i>preferably</i>. On a word of three notes the second syllable is also the
      penultimate, and the adjective takes it. Every word's own page lets you try its forms.</p>
  </section>

  <section class="ln-para" id="g-gender">
    ${head('gender')}
    <p>Only the <b>feminine</b> is marked: the last vowel is lengthened in speech, and Gajewski writes a bar over it.
      The <b>plural</b> lengthens the last syllable too, and he writes an acute on it. Here they are shown as small
      labels, <span class="w-mark">fem.</span> and <span class="w-mark">pl.</span>, so no letter wears an accent. The masculine and the singular are unmarked.</p>
    <div class="ln-forms-grid">
      ${[
        ['dofa', {}, 'he'], ['dofa', { feminine: true }, 'she'], ['dofa', { plural: true }, 'they'], ['dofa', { feminine: true, plural: true }, 'they (fem.)'],
      ].map(([k, m, g]) => `<div class="ln-formcard">${play([tok(k, m)], 'Hear ' + g)}<b>${form(k, m)}</b><i>${g}</i></div>`).join('')}
    </div>
  </section>

  <section class="ln-para" id="g-tense">
    ${head('tense')}
    <p>The verb never changes. Its tense is carried by a <b>doubled note</b> set before it — the same for every person,
      since the pronoun already says who. The present is the bare verb. These seven doubled notes are reserved for
      this work alone.</p>
    <table class="ln-table ln-tenses">
      <thead><tr><th>Particle</th><th>Tense or mood</th><th>Gajewski</th><th>With ${wordLink('milasi')}, <i>to love</i></th><th></th></tr></thead>
      <tbody>
        ${tenseRows.map((r) => {
          const [line, en] = r.p ? TENSE_EX[r.p] : ['dore milasi', 'I love'];
          const words = line.split(' ');
          return `<tr>
            <td>${r.p ? wordLink(r.p) : '<span class="ln-none">—</span>'}</td>
            <td class="sc">${r.p ? r.name : 'present'}</td>
            <td><i>${r.p ? GAJ[r.p] : 'infinitif seul'}</i></td>
            <td><span class="ln-inline-sent">${words.map((w) => wordLink(w)).join(' ')}</span> <i class="ln-en">${en}</i></td>
            <td>${play(words.map((w) => tok(w)), 'Hear: ' + en)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    <p class="hint">The passive and the compound tenses use ${wordLink('faremi')}, <i>to be</i>, and ${wordLink('famisol')}, <i>to have</i>, between the particle and the verb.</p>
  </section>

  <section class="ln-para" id="g-negation">
    ${head('negation')}
    <p>To deny, put ${wordLink('do')} — <i>no, not</i> — <b>once</b>, just before the word denied. It is never doubled.</p>
    ${example([{ k: 'dore', g: 'I' }, { k: 'do', g: 'not' }, { k: 'milasi', g: 'love' }], 'I do not love.')}
    <p>And ${wordLink('si')}, the highest note, is <i>yes</i>.</p>
  </section>

  <section class="ln-para" id="g-question">
    ${head('question')}
    <p>There is no word for asking. A question is made by <b>inversion</b>: the pronoun comes after the verb.</p>
    ${example([{ k: 'domi', g: 'you' }, { k: 'mifala', g: 'want' }], 'You want.')}
    ${example([{ k: 'mifala', g: 'want' }, { k: 'domi', g: 'you', punct: '?' }], 'Do you want?')}
    ${example([{ k: 'do', g: 'not' }, { k: 'mifala', g: 'want' }, { k: 'domi', g: 'you', punct: '?' }], "Don't you want?", { note: 'negation and inversion together' })}
  </section>

  <section class="ln-para" id="g-pronouns">
    ${head('pronouns')}
    <p>The personal pronouns all begin with ${wordLink('do')}. Their plurals and feminines take the same marks as any word.
      The possessives are the same words with the first note moved up to ${wordLink('re')}.</p>
    <div class="ln-two-tables">
      <table class="ln-table">
        <thead><tr><th colspan="2">Singular</th><th colspan="2">Plural</th></tr></thead>
        <tbody>
          <tr><td>I, me</td><td>${form('dore')}</td><td>we</td><td>${form('dore', { plural: true })}</td></tr>
          <tr><td>you</td><td>${form('domi')}</td><td>you</td><td>${form('domi', { plural: true })}</td></tr>
          <tr><td>he</td><td>${form('dofa')}</td><td>they</td><td>${form('dofa', { plural: true })}</td></tr>
          <tr><td>she</td><td>${form('dofa', { feminine: true })}</td><td>oneself</td><td>${form('dosol')}</td></tr>
        </tbody>
      </table>
      <table class="ln-table">
        <thead><tr><th colspan="2">Possessive</th><th colspan="2">Others</th></tr></thead>
        <tbody>
          <tr><td>my</td><td>${wordLink('redo')}</td><td>who, which</td><td>${wordLink('mire')}</td></tr>
          <tr><td>your</td><td>${wordLink('remi')}</td><td>this · that</td><td>${wordLink('fami')} · ${wordLink('fare')}</td></tr>
          <tr><td>his, her</td><td>${wordLink('refa')}</td><td>someone</td><td>${wordLink('dola')}</td></tr>
          <tr><td>our</td><td>${wordLink('resol')}</td><td>what</td><td>${wordLink('fado')}</td></tr>
          <tr><td>your (pl.)</td><td>${wordLink('rela')}</td><td>nothing</td><td>${wordLink('soldo')}</td></tr>
          <tr><td>their</td><td>${wordLink('resi')}</td><td></td><td></td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="ln-para" id="g-articles">
    ${head('articles')}
    <p>The one article is ${wordLink('la')}, <i>the</i>, and it declines. There is no indefinite article: where English says
      <i>a</i>, Solresol says nothing, or the numeral <i>one</i>.</p>
    <table class="ln-table">
      <thead><tr><th>Case</th><th>Singular</th><th>Feminine</th><th>Plural</th></tr></thead>
      <tbody>
        <tr><td>the <span class="hint">nom. · acc.</span></td><td>${wordLink('la')}</td><td>${form('la', { feminine: true })}</td><td>${wordLink('la', { shown: "l'a" })}</td></tr>
        <tr><td>to the <span class="hint">dative</span></td><td>${wordLink('fa')}</td><td>${form('fa', { feminine: true })}</td><td>${wordLink('fa', { shown: "f'a" })}</td></tr>
        <tr><td>of the <span class="hint">gen. · abl.</span></td><td>${wordLink('lasi')}</td><td>${form('lasi', { feminine: true })}</td><td>${wordLink('lasi', { shown: "la s'i" })}</td></tr>
      </tbody>
    </table>
  </section>

  <section class="ln-para" id="g-order">
    ${head('order')}
    <p>Subject, verb, object — as in English. The adjective always <b>follows</b> its noun; the indirect object always
      follows the verb. Idioms are first reduced to plain words, then translated.</p>
    ${example([{ k: 'dola', g: 'someone' }, { k: 'famisol', g: 'has' }, { k: 'mirefado', g: 'said' }, { k: 'fare', g: 'that' }], 'Someone has said that.')}
    ${example([{ k: 'mila', g: 'here is' }, { k: 'dolaresi', g: 'wine' }, { k: 're', g: 'and' }, { k: 'dosifare', g: 'beer' }], 'Here is wine and beer.')}
  </section>

  <section class="ln-para" id="g-reversal">
    ${head('reversal')}
    <p>Sudre's loveliest idea: <b>the inverse of the thought by the inverse of the sign</b>. Read a word backwards and,
      often, you say its opposite. Press a pair to hear the word and then its mirror.</p>
    <div class="ln-mirrors">
      ${OPPOSITES.map(([a, b]) => `<div class="ln-mirror-pair">
        ${play([tok(a), tok(b)], `Hear ${cap(a)} then ${cap(b)}`)}
        <span class="ln-mp-side">${swatches(parse(a))}${wordLink(a)}<i>${esc(shortGloss(meaningOf(a), 1))}</i></span>
        <span class="ln-mp-arrow" aria-hidden="true">⇄</span>
        <span class="ln-mp-side">${swatches(parse(b))}${wordLink(b)}<i>${esc(shortGloss(meaningOf(b), 1))}</i></span>
      </div>`).join('')}
    </div>
    <p>It is a principle, not a law. Umberto Eco noticed that it is applied unevenly, and mostly to short words:</p>
    <ul class="ln-exceptions">
      ${EXCEPTIONS.map(([a, b]) => `<li>${wordLink(a)} <i>${esc(shortGloss(meaningOf(a), 1))}</i> — reversed, ${wordLink(b)} <i>${esc(shortGloss(meaningOf(b), 1))}</i>.</li>`).join('')}
    </ul>
  </section>
  <div class="ornament" aria-hidden="true"></div>`;
}

export function mountGrammar(host, ctx) {
  host.innerHTML = markup();
  const onClick = (e) => {
    const s = e.target.closest('[data-say]');
    if (s) {
      const words = s.dataset.say.split(' ').map(readTok);
      let t = 0;
      for (const w of words) t += sayWord(w.notes, w.marks, t) + 0.3;
      s.classList.remove('is-ringing'); void s.offsetWidth; s.classList.add('is-ringing');
      return;
    }
    const g = e.target.closest('[data-goto]');
    if (g) host.querySelector('#g-' + g.dataset.goto)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  host.addEventListener('click', onClick);
  return { destroy() { host.removeEventListener('click', onClick); host.textContent = ''; } };
}

