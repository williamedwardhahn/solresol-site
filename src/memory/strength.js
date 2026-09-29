// strength — the pure core of Memory (the number behind The Fading).
//
// Familiarity grows with each encounter; it then decays with the time
// since the word was last seen. No clock, no storage — you pass the
// moment in — so it is fully testable.

export function familiarity(count) {
  return 1 - Math.pow(0.6, count);          // 0, 0.4, 0.64, 0.78, …
}

export function decay(elapsedMs, halfLifeMs) {
  if (elapsedMs <= 0) return 1;                 // never brighter than fresh
  return Math.pow(0.5, elapsedMs / halfLifeMs);
}

export function strength(entry, at, halfLifeMs) {
  if (!entry || entry.last == null) return 0;
  const s = familiarity(entry.count) * decay(at - entry.last, halfLifeMs);
  return Math.max(0, Math.min(1, s));           // clamped to 0..1
}
