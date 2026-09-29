import { VIEWS, ELSEWHERE } from './views.js';
import { fanSVG } from '../graphics/graphics.js';
import { mountPanel } from './panel.js';
import { mountMicroQuiz } from '../learn/microquiz.js';

// renderSite — the book's binding: the masthead, the chapter you are in,
// the colophon, and the word panel that any word anywhere opens into.
// Chapters are mounted when you arrive and destroyed when you leave, so
// only the one on screen is listening to anything.

export function renderSite(root, ctx, { standalone = false } = {}) {
  root.textContent = '';
  root.classList.add('book');

  const masthead = document.createElement('header');
  masthead.className = 'masthead';
  masthead.innerHTML = `
    <a class="brand" href="#/" aria-label="Solresol — home">
      ${fanSVG({ labels: false, title: '' })}
      <span class="brand-name">Solresol</span>
    </a>
    <nav class="chapters" aria-label="Chapters">
      ${VIEWS.map((v) => `<a href="#/${v.id}" data-view="${v.id}"><span class="numeral">${v.numeral}</span>${v.label}</a>`).join('')}
    </nav>
    ${standalone ? '' : `<nav class="elsewhere" aria-label="Elsewhere">
      ${ELSEWHERE.map((e) => `<a href="${e.href}">${e.label}</a>`).join('')}
    </nav>`}`;

  const main = document.createElement('main');
  main.className = 'chapter';
  main.id = 'chapter';
  main.tabIndex = -1;

  const colophon = document.createElement('footer');
  colophon.className = 'colophon';
  colophon.innerHTML = `
    <div class="colophon-rule" aria-hidden="true"></div>
    <p>Solresol, the universal musical language of <em>Jean-François Sudre</em> (1827),
      after the grammar of <em>Boleslas Gajewski</em> (1902). <b data-count>3,152</b> words.</p>
    <p class="colophon-small">Seven notes · seven colours · seven numbers · one word.</p>`;

  const panelHost = document.createElement('aside');
  root.append(masthead, main, colophon, panelHost);

  const panel = mountPanel(panelHost, ctx);
  ctx.openWord = panel.open;
  // An occasional, dismissable question about a word you just said.
  const microquiz = mountMicroQuiz(document.body, ctx);

  let current = null;      // { id, handle }
  function show(route) {
    const wantsWord = route.view === 'word';
    const id = wantsWord ? (current ? current.id : 'play') : route.view;
    const view = VIEWS.find((v) => v.id === id) || VIEWS[0];

    if (!current || current.id !== view.id) {
      current?.handle?.destroy?.();
      main.textContent = '';
      main.dataset.view = view.id;
      const head = document.createElement('div');
      head.className = 'chapter-head';
      head.innerHTML = `<span class="chapter-numeral">Chapter ${view.numeral}</span><h1>${view.title}</h1>`;
      const body = document.createElement('div');
      body.className = 'chapter-body';
      main.append(head, body);
      current = { id: view.id, handle: view.mount(body, ctx, route) };
      if (!wantsWord) window.scrollTo({ top: 0 });
    } else if (!wantsWord) {
      current.handle?.update?.(route);
    }

    masthead.querySelectorAll('[data-view]').forEach((a) => {
      const on = a.dataset.view === view.id;
      a.classList.toggle('is-here', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });

    if (wantsWord && route.arg) panel.open(route.arg, { fromRoute: true });
    else if (!wantsWord) panel.close({ fromRoute: true });
  }

  const unroute = ctx.route.watch(show);

  return {
    colophon,
    destroy() { unroute(); current?.handle?.destroy?.(); panel.destroy(); microquiz.destroy(); root.textContent = ''; },
  };
}
