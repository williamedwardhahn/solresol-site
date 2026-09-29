// The "weight" of a note — the tunable, testable heart of the toy's feel.
//
// Low notes are heavier: they swell a little slower, ring a little longer,
// and sit a touch louder. High notes are lighter and quicker. Pure math on
// the note's scale step (0 = do … 6 = si), so the feel is tuned by tests,
// not by ear-in-the-browser.

export function voiceParams(step) {
  const s = Math.max(0, Math.min(6, Number(step) || 0));
  const low = 6 - s;                 // 6 at do … 0 at si
  return {
    attack:  0.02 + low * 0.006,     // seconds — low notes bloom slower
    release: 0.55 + low * 0.13,      // seconds — low notes have a longer tail
    gain:    0.30 - s * 0.014,       // low notes a touch louder
    cutoff:  900 + s * 700,          // brighter filter as pitch rises
    detune:  7,                      // cents of chorus for warmth
  };
}
