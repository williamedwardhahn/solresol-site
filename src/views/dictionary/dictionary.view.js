import { parse } from '../../dictionary/notes.js?v=c115d42191';
import { Word } from '../../lang/word.js?v=c115d42191';
import { emit } from '../../live/bus.js?v=c115d42191';
import { playWord, playSentence } from '../../voices/index.js?v=c115d42191';
import { mountWords } from './words.tab.js?v=c115d42191';
import { mountFamilies } from './families.tab.js?v=c115d42191';
import { mountMirrors } from './mirrors.tab.js?v=c115d42191';
import { mountNumbers } from './numbers.tab.js?v=c115d42191';
import { mountMap } from './map.tab.js?v=c115d42191';

// Chapter II · The Dictionary. mountDictionaryView(host, ctx, route) → { update(route), destroy() }.
// Five leaves, each linkable: #/dictionary (all words), /families, /mirrors,
// /numbers, /map. A leaf is mount(host, ctx, route, memo) → { update, destroy };
// `memo` keeps a leaf's search and page while you visit the others.
// Every word in the chapter opens its page through ctx.openWord, and every
// ▶ plays through the one voice — both handled here, once, for all leaves.

const LEAVES = [
  { id: '',         label: 'All words',  mount: mountWords },
  { id: 'families', label: 'By family',  mount: mountFamilies },
  { id: 'mirrors',  label: 'Mirrors',    mount: mountMirrors },
  { id: 'numbers',  label: 'Numbers',    mount: mountNumbers },
  { id: 'map',      label: 'The map',    mount: mountMap },
];

export function mountDictionaryView(host, ctx, route) {
  host.innerHTML = `
    <nav class="tabs dx-tabs" aria-label="The Dictionary">
      ${LEAVES.map((l) => `<a class="tab" href="#/dictionary${l.id ? '/' + l.id : ''}" data-leaf="${l.id}">${l.label}</a>`).join('')}
    </nav>
    <div class="dx-leaf"></div>`;
  const pane = host.querySelector('.dx-leaf');
  const memo = {};
  let current = null, currentId = null;

  function show(r) {
    const leaf = LEAVES.find((l) => l.id === (r.sub || '')) || LEAVES[0];
    host.querySelectorAll('[data-leaf]').forEach((a) => {
      const on = a.dataset.leaf === leaf.id;
      a.classList.toggle('is-on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (leaf.id === currentId) { current?.update?.(r); return; }
    current?.destroy?.();
    pane.textContent = '';
    pane.dataset.leaf = leaf.id || 'words';
    currentId = leaf.id;
    current = leaf.mount(pane, ctx, r, memo);
  }

  const onClick = (e) => {
    const t = e.target.closest('[data-open], [data-play], [data-play2]');
    if (!t || !host.contains(t)) return;
    if (t.dataset.play) {
      e.stopPropagation();
      const notes = parse(t.dataset.play);
      playWord(Word(notes));
      emit('word:used', { key: notes.join(''), channel: 'dictionary' });
      ring(t);
    } else if (t.dataset.play2) {
      const words = t.dataset.play2.split(' ').map((k) => Word(parse(k)));
      playSentence(words);
      ring(t);
    } else if (t.dataset.open) {
      ctx.openWord(parse(t.dataset.open));
    }
  };
  host.addEventListener('click', onClick);
  show(route);

  return {
    update: show,
    destroy() { current?.destroy?.(); host.removeEventListener('click', onClick); host.textContent = ''; },
  };
}

// A struck button rings once, so a sound always has a sight.
function ring(el) {
  el.classList.remove('is-ringing');
  void el.offsetWidth;
  el.classList.add('is-ringing');
}
