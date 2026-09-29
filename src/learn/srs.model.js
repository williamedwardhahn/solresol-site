// The pure scheduler behind the micro-quiz — no DOM, storage or clock;
// `now` is always passed in.
//
// A question is about a *concept* ("mirror:fala", "accent:domisol").
// Each concept has an interval: right answers double it (to 64×), a wrong
// answer resets it. A concept is due once its interval has passed. The
// micro-quiz never asks twice within MIN_GAP_MS, only after a few words
// have been used since the last question, and never once stopped.

export const SRS_KEY = 'solresol:microquiz';
export const MIN_GAP_MS = 2 * 60 * 1000;      // never more than once per ~2 minutes
export const BASE_MS = 10 * 60 * 1000;        // a new concept's first interval: ten minutes
export const EVERY = 3;                        // words used between questions
export const MAX_INTERVAL = 64;

export function freshSrs() {
  return { v: 1, off: false, lastAsked: 0, since: 0, concepts: {} };
}

export function normalizeSrs(raw) {
  const s = freshSrs();
  if (!raw || typeof raw !== 'object') return s;
  s.off = raw.off === true;
  s.lastAsked = Number.isFinite(raw.lastAsked) ? raw.lastAsked : 0;
  s.since = Number.isFinite(raw.since) ? raw.since : 0;
  if (raw.concepts && typeof raw.concepts === 'object') {
    for (const [id, c] of Object.entries(raw.concepts)) {
      if (c && Number.isFinite(c.interval) && Number.isFinite(c.last)) {
        s.concepts[id] = { interval: c.interval, last: c.last, right: c.right | 0, wrong: c.wrong | 0 };
      }
    }
  }
  return s;
}

// A word was used: one more toward the next question.
export const noteUse = (s) => ({ ...s, since: s.since + 1 });

export function shouldAsk(s, now, every = EVERY) {
  return !s.off && s.since >= every && now - s.lastAsked >= MIN_GAP_MS;
}

export function isDue(s, id, now) {
  const c = s.concepts[id];
  return !c || now - c.last >= c.interval * BASE_MS;
}

// Of the candidate concept ids, the most overdue (unseen ones first). null if none is due.
export function chooseDue(s, ids, now) {
  let best = null, bestRatio = -1;
  for (const id of ids) {
    const c = s.concepts[id];
    const ratio = c ? (now - c.last) / (c.interval * BASE_MS) : Infinity;
    if (ratio >= 1 && ratio > bestRatio) { best = id; bestRatio = ratio; }
  }
  return best;
}

// A question was shown (answered or not): reset the gap and the count.
export const markAsked = (s, now) => ({ ...s, lastAsked: now, since: 0 });

export function recordAnswer(s, id, correct, now) {
  const prev = s.concepts[id] || { interval: 1, last: now, right: 0, wrong: 0 };
  const next = correct
    ? { ...prev, interval: Math.min(prev.interval * 2, MAX_INTERVAL), right: prev.right + 1, last: now }
    : { ...prev, interval: 1, wrong: prev.wrong + 1, last: now };
  return { ...s, concepts: { ...s.concepts, [id]: next } };
}

export const stopAsking = (s) => ({ ...s, off: true });
export const resumeAsking = (s) => ({ ...s, off: false });
