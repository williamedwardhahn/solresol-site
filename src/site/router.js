import { live } from '../live/live.js';

// The router — where you are, as a live value read from the address.
//
//   #/                       → { view: 'play' }
//   #/dictionary/families    → { view: 'dictionary', sub: 'families' }
//   #/word/Domisol           → { view: 'word', arg: 'Domisol' }  (opens the word panel)
//   ?word=Domisol            → the old share links still open that word
//
// A hash router, so the single-file build works from file:// as well.

export function parseRoute(hash) {
  const [path, query = ''] = String(hash || '').replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const params = Object.fromEntries(new URLSearchParams(query));
  if (parts[0] === 'word') return { view: 'word', arg: parts[1] || '', sub: null, params };
  return { view: parts[0] || 'play', sub: parts[1] || null, arg: parts[2] || null, params };
}

export function createRouter() {
  // Carry an old-style ?word= link into the hash, once, on arrival.
  const legacy = new URLSearchParams(location.search).get('word');
  if (legacy && !location.hash) history.replaceState(null, '', `${location.pathname}#/word/${encodeURIComponent(legacy)}`);

  const route = live(parseRoute(location.hash));
  const onHash = () => route.set(parseRoute(location.hash));
  window.addEventListener('hashchange', onHash);

  const go = (path) => {
    const next = '#/' + String(path).replace(/^#?\/?/, '');
    if (location.hash === next) onHash(); else location.hash = next;
  };

  return { route, go, destroy() { window.removeEventListener('hashchange', onHash); } };
}
