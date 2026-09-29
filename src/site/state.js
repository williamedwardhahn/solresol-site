import { live } from '../live/live.js';

// State that outlives a visit — preferences, starred words, recent words,
// and saved sentences. Each is one live value mirrored to localStorage,
// so a view just watches it and never keeps a second copy.

export function persisted(key, initial) {
  let start = initial;
  try {
    const raw = localStorage.getItem(key);
    if (raw) start = { ...initial, ...JSON.parse(raw) };
    if (raw && Array.isArray(initial)) start = JSON.parse(raw);
  } catch { /* private mode or corrupt value: fall back to the default */ }
  const value = live(start);
  value.watch((v) => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* quota or private mode */ }
  });
  return value;
}

// The seen voices a person can switch on and off in the word display.
export const VOICE_IDS = ['solfege', 'number', 'color', 'staff', 'hand', 'script', 'braille', 'binary'];

export const DEFAULT_PREFS = {
  timbre: 'triangle',                                   // sine | triangle | sawtooth | square
  voices: ['solfege', 'number', 'color', 'staff', 'hand', 'script'],
  onboarded: false,
};

export function createState() {
  const prefs   = persisted('solresol:prefs', DEFAULT_PREFS);
  const stars   = persisted('solresol:stars', []);        // word keys, newest first
  const recent  = persisted('solresol:recent', []);       // word keys, newest first, max 12
  const saved   = persisted('solresol:sentences', []);    // [{ name, words: [[notes]], at }]
  const meanings = persisted('solresol:meanings', {});    // user-proposed meanings: key → text

  const setPref = (k, v) => prefs.set({ ...prefs.get(), [k]: v });

  const isStarred = (key) => stars.get().includes(key);
  const toggleStar = (key) => {
    const s = stars.get();
    stars.set(s.includes(key) ? s.filter((k) => k !== key) : [key, ...s]);
  };

  const touch = (key) => {
    if (!key) return;
    recent.set([key, ...recent.get().filter((k) => k !== key)].slice(0, 12));
  };

  return { prefs, setPref, stars, isStarred, toggleStar, recent, touch, saved, meanings };
}
