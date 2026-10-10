import { detectPitch, hear, smoother, levelGate, octaveGuard, rmsOf } from './singing.model.js?v=c115d42191';

// The ear — one microphone for every singing mode.
//
// start() asks for the microphone; read() is called each frame and says
// how loud the room is, whether the gate is open (it follows the room's
// own noise floor, so a quiet phone mic still hears a soft hum), and what
// note was sung, if any. The pitch passes an octave guard and a median
// smoother before it is read as a note, so one stray frame cannot move
// the needle.

export function createMic() {
  let ac = null, analyser = null, stream = null, buf = null;
  const gate = levelGate();
  const guard = octaveGuard();
  const smooth = smoother(5);
  let deafUntil = 0;

  const self = {
    get active() { return !!ac; },
    async start() {
      if (ac) return true;
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser has no microphone.');
      stream = await navigator.mediaDevices.getUserMedia({
        // echo cancellation keeps the lesson's own notes out; the others
        // would flatten the voice and chase its loudness
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
      });
      ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state !== 'running') await ac.resume().catch(() => {});
      analyser = ac.createAnalyser();
      analyser.fftSize = 2048;
      ac.createMediaStreamSource(stream).connect(analyser);
      buf = new Float32Array(analyser.fftSize);
      return true;
    },
    stop() {
      stream?.getTracks().forEach((t) => t.stop());
      ac?.close().catch(() => {});
      ac = analyser = stream = buf = null;
      smooth(null); guard(null);
    },
    // Don't listen for a while (the page is playing a note of its own).
    deafen(ms) { deafUntil = Math.max(deafUntil, performance.now() + ms); },
    get deaf() { return performance.now() < deafUntil; },
    // → { level, threshold, open, freq, reading } — reading is { note, cents, octave, midi } or null
    read() {
      if (!ac) return { level: 0, threshold: 0, open: false, freq: null, reading: null };
      analyser.getFloatTimeDomainData(buf);
      const g = gate(rmsOf(buf));
      let freq = null;
      if (g.open && !self.deaf) freq = smooth(guard(detectPitch(buf, ac.sampleRate, { minRms: 0 })));
      else { smooth(null); guard(null); }
      return { ...g, freq, reading: freq ? hear(freq) : null };
    },
  };
  return self;
}
