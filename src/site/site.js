import { CARDS } from './cards.js';

// renderSite — turn the card registry into the page. Each card gets its
// own <section>, its own body, and the SAME shared ctx. That's the whole
// site: a grid of connected, modular cards.

export function renderSite(root, ctx, cards = CARDS) {
  root.textContent = '';
  const mounted = [];
  for (const card of cards) {
    const section = document.createElement('section');
    section.className = 'card' + (card.wide ? ' card--wide' : '');
    section.dataset.card = card.id;

    if (card.title) {
      const h = document.createElement('h2');
      h.className = 'card-title';
      h.textContent = card.title;
      section.appendChild(h);
    }
    const body = document.createElement('div');
    body.className = 'card-body';
    section.appendChild(body);
    root.appendChild(section);

    mounted.push(card.mount(body, ctx) || null);
  }
  return { destroy() { mounted.forEach((m) => m && m.destroy && m.destroy()); root.textContent = ''; } };
}
