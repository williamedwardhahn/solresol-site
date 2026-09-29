import { live } from '../live/live.js';
import { on } from '../live/bus.js';
import { strength } from './strength.js';

// Memory — the medium remembers you.
//
// One persisted live value: for every word you have met, when you last
// met it and how many times. From that we derive a *strength* that
// decays with time — the number behind The Fading. Everything in learn/
// reads this; nobody writes their own copy.

const KEY = 'solresol:memory';
const HALF_LIFE_MS = 1000 * 60 * 60 * 36; // memory half-life ~36h of not seeing a word

export function createMemory() {
  const store = live(loadMem());

  function record(wordKey, channel = 'keyboard') {
    if (!wordKey) return;
    const now = Date.now();
    const data = { ...store.get() };
    const prev = data[wordKey] || { count: 0, first: now, channels: [] };
    data[wordKey] = {
      count: prev.count + 1,
      first: prev.first,
      last: now,
      channels: [...new Set([...(prev.channels || []), channel])],
    };
    store.set(data);
    saveMem(data);
  }

  // Strength 0..1: grows with encounters, decays since last seen.
  const strengthOf = (wordKey, at = Date.now()) =>
    strength(store.get()[wordKey], at, HALF_LIFE_MS);

  const known    = () => Object.keys(store.get());
  const fading    = (lo = 0.12, hi = 0.72) =>
    known().filter((k) => { const s = strengthOf(k); return s > lo && s < hi; });

  // Any module that uses a word just announces it; memory listens.
  on('word:used', ({ key, channel }) => record(key, channel));

  return { watch: store.watch, record, strengthOf, known, fading,
           get: store.get, forget() { store.set({}); saveMem({}); } };
}

function loadMem() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}
function saveMem(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* private mode */ }
}
