// A meaning profile — the pivot the multisensory briefs require.
//
// A shared vocabulary (the canonical Dictionary) sits UNDERNEATH the
// user's own confirmed mappings. Personal meaning wins; the shared
// meaning shows through only where the user hasn't defined their own.
// Meaning is user-defined, never universal — but nobody starts from
// nothing. Pure and deterministic, so it's tested before it gets a card.

export function makeProfile(shared, personal = {}) {
  const own = new Map(Object.entries(personal).map(([k, v]) => [norm(k), v]));
  const self = {
    meaningOf(key) {
      const k = norm(key);
      return own.has(k) ? own.get(k) : shared.meaningOf(k);
    },
    define(key, meaning) { own.set(norm(key), meaning); return self; },
    forget(key) { own.delete(norm(key)); return self; },
    source(key) {
      const k = norm(key);
      if (own.has(k)) return 'personal';
      return shared.meaningOf(k) ? 'shared' : null;
    },
    personal() { return Object.fromEntries(own); },
  };
  return self;
}

const norm = (k) => String(k).trim().toLowerCase();
