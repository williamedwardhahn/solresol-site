import { unlockAudio } from '../voices/tone.js?v=8aaee6f447';
import { frequency } from './songs.js?v=8aaee6f447';

// The ocarina's voice.
//
// An ocarina is nearly a pure tone: a vessel resonating at one frequency,
// a whisper of second harmonic, breath at the start of each note and a
// slow vibrato that blooms once the note settles. Every note goes through
// one small room so a melody sounds played, not beeped. unlockAudio (shared
// with the site) handles phones and the iPhone silent switch.

let ac, out;
function context() {
  if (ac) { if (ac.state !== 'running') ac.resume().catch(() => {}); return ac; }
  unlockAudio();
  ac = new (window.AudioContext || window.webkitAudioContext)();
  const limiter = ac.createDynamicsCompressor();
  limiter.threshold.value = -12; limiter.ratio.value = 6;
  limiter.connect(ac.destination);

  // A short, soft room: decaying noise as an impulse response.
  const len = Math.floor(ac.sampleRate * 1.4);
  const ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  const room = ac.createConvolver(); room.buffer = ir;
  const wet = ac.createGain(); wet.gain.value = 0.28;
  out = ac.createGain(); out.gain.value = 0.9;
  out.connect(limiter);
  out.connect(room); room.connect(wet); wet.connect(limiter);
  return ac;
}

let noise;
function breathBuffer(a) {
  if (noise) return noise;
  noise = a.createBuffer(1, a.sampleRate, a.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

const live = new Set();   // nodes still sounding, so stop() can silence a song

// Start a note ("la", "re'") `when` seconds from now; it sounds until
// released, so a held key sustains. Returns { release(after, ring) }: the
// tone fades `after` seconds from now over its ring time (longer with the
// sustain pedal).
export function hold(token, when = 0) {
  const a = context();
  const t = a.currentTime + 0.02 + when;
  const f = frequency(token);

  const env = a.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.32, t + 0.035);
  env.gain.setTargetAtTime(0.24, t + 0.04, 0.12);
  env.connect(out);

  const body = a.createOscillator(); body.type = 'sine'; body.frequency.value = f;
  const over = a.createOscillator(); over.type = 'sine'; over.frequency.value = f * 2;
  const overGain = a.createGain(); overGain.gain.value = 0.06;
  body.connect(env); over.connect(overGain); overGain.connect(env);

  // vibrato that arrives a moment after the attack, as a player's does
  const lfo = a.createOscillator(); lfo.frequency.value = 5.2;
  const depth = a.createGain();
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(f * 0.004, t + 0.5);
  lfo.connect(depth); depth.connect(body.frequency); depth.connect(over.frequency);

  // the chiff: a puff of filtered breath at the start
  const breath = a.createBufferSource(); breath.buffer = breathBuffer(a);
  const band = a.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = f * 2; band.Q.value = 3;
  const puff = a.createGain();
  puff.gain.setValueAtTime(0, t);
  puff.gain.linearRampToValueAtTime(0.09, t + 0.015);
  puff.gain.exponentialRampToValueAtTime(0.004, t + 0.12);
  breath.connect(band); band.connect(puff); puff.connect(out);

  const nodes = [body, over, lfo, breath];
  for (const n of nodes) { n.start(t); live.add(n); }
  body.onended = () => nodes.forEach((n) => live.delete(n));

  let done = false;
  return {
    release(after = 0, ring = 0.08) {
      if (done) return; done = true;
      const at = Math.max(a.currentTime, t + 0.06) + after;
      for (const g of [env.gain, puff.gain]) {
        if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(at); else g.cancelScheduledValues(at);
        g.setTargetAtTime(0, at, ring / 3 + 0.02);
      }
      for (const n of nodes) { try { n.stop(at + ring + 0.5); } catch { /* already stopped */ } }
    },
  };
}

// Play one note for dur seconds.
export function playNote(token, when = 0, dur = 0.45) {
  hold(token, when).release(Math.max(0.12, dur) - 0.04);
}

// Silence everything that is playing or scheduled.
export function stopAll() {
  for (const n of live) { try { n.stop(); } catch { /* already stopped */ } }
  live.clear();
}

// A small flourish for finishing a song: sol do' mi' sol', quickly.
export function fanfare() {
  ['sol', "do'", "mi'", "sol'"].forEach((n, i) => playNote(n, i * 0.11, i === 3 ? 0.7 : 0.18));
}
