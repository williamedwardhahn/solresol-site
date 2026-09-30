import { mountStudy } from './study.js';
import { mountGrammar } from './grammar.js';
import { mountQuiz } from './quiz.js';
import { mountSing } from './sing.js';
import { mountGames } from './games.js';
import { mountHistory } from './history.js';
import { mountYours } from './yours.js';
import { bindWordLinks } from './common.js';

// The Learn chapter — the School. mountLearnView(host, ctx, route) → { update(route), destroy() }.
// Seven leaves, each its own route so every one is linkable:
//   #/learn           Study — the seven notes, every voice
//   #/learn/grammar   Grammar — Gajewski's rules, playable
//   #/learn/quiz      Examinations — five levels that unlock
//   #/learn/sing      The singing lesson — a tuner that teaches
//   #/learn/games     Games — the learning cards, and the sky
//   #/learn/history   History — Sudre's story
//   #/learn/yours     Yours — your stars, sentences and memory

const LEAVES = [
  { id: '',        label: 'Study',    mount: mountStudy },
  { id: 'grammar', label: 'Grammar',  mount: mountGrammar },
  { id: 'quiz',    label: 'Quiz',     mount: mountQuiz },
  { id: 'sing',    label: 'Sing',     mount: mountSing },
  { id: 'games',   label: 'Games',    mount: mountGames },
  { id: 'history', label: 'History',  mount: mountHistory },
  { id: 'yours',   label: 'Yours',    mount: mountYours },
];

export function mountLearnView(host, ctx, route) {
  host.classList.add('school');
  host.innerHTML = `
    <nav class="tabs school-tabs" aria-label="The School">
      ${LEAVES.map((l) => `<a class="tab" href="#/learn${l.id ? '/' + l.id : ''}" data-leaf="${l.id}">${l.label}</a>`).join('')}
    </nav>
    <div class="school-leaf"></div>`;
  const page = host.querySelector('.school-leaf');
  const unlink = bindWordLinks(host, ctx);

  let current = null;       // { id, handle }
  function show(r) {
    const want = LEAVES.find((l) => l.id === (r?.sub || '')) || LEAVES[0];
    if (current && current.id === want.id) return;
    current?.handle?.destroy?.();
    page.textContent = '';
    page.className = `school-leaf school-leaf--${want.id || 'study'}`;
    current = { id: want.id, handle: want.mount(page, ctx) };
    host.querySelectorAll('[data-leaf]').forEach((a) => {
      const on = a.dataset.leaf === want.id;
      a.classList.toggle('is-on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    // arriving on a new leaf from further down the page: bring its tabs back into view
    const tabs = host.querySelector('.school-tabs');
    if (!first && tabs.getBoundingClientRect().top < 0) tabs.scrollIntoView({ block: 'start' });
  }
  let first = true;
  show(route);
  first = false;

  return {
    update: show,
    destroy() { current?.handle?.destroy?.(); unlink(); host.classList.remove('school'); host.textContent = ''; },
  };
}
