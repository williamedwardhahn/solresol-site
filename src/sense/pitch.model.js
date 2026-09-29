import { NOTES } from '../dictionary/notes.js';

// The pure core of tone-in — a heard pitch is an INTERPRETATION, not a
// fact. `detectNote` returns the nearest note AND a confidence that falls
// off as the pitch drifts between two notes. The card only acts on high
// confidence — the multisensory briefs' rule: an inference is a
// hypothesis, held with uncertainty, until it's clear.

// Pure pitch detection (normalized autocorrelation, after cwilso's method).
// Returns a frequency in Hz, or null for silence / no clear pitch. Pure —
// pass a sample buffer, get a number — so it's tested on a synthetic sine.
export function autocorrelate(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null;                    // too quiet

  // trim to the loud region (edges below threshold add noise)
  let r1 = 0, r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
  const b = buf.slice(r1, r2);
  const n = b.length;
  if (n < 2) return null;

  const c = new Array(n).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) c[i] += b[j] * b[j + i];

  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;        // skip the zero-lag descent
  let maxval = -1, maxpos = -1;
  for (let i = d; i < n; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  if (maxpos <= 0) return null;

  // parabolic interpolation around the peak for sub-sample accuracy
  let T0 = maxpos;
  const x1 = c[T0 - 1] || 0, x2 = c[T0] || 0, x3 = c[T0 + 1] || 0;
  const a = (x1 + x3 - 2 * x2) / 2, bb = (x3 - x1) / 2;
  if (a) T0 -= bb / (2 * a);

  return sampleRate / T0;
}

export function detectNote(freq) {
  if (!freq || freq <= 0) return { note: null, cents: null, confidence: 0 };
  let best = NOTES[0], bestCents = Infinity;
  for (const n of NOTES) {
    const cents = 1200 * Math.log2(freq / n.freq);
    if (Math.abs(cents) < Math.abs(bestCents)) { bestCents = cents; best = n; }
  }
  const confidence = Math.max(0, 1 - Math.abs(bestCents) / 100);
  return { note: best.name, cents: Math.round(bestCents), confidence };
}
