import { NOTES, noteByNumber, noteFromMidi } from '../dictionary/notes.js';
import { playNote } from '../voices/index.js';
import { detectNote, autocorrelate } from './pitch.model.js';

// The ears — ways the language comes IN.
//
// Each input feeds the same live Word by adding notes to it. A word can
// now enter through any channel and leave through any other: sing it,
// see its colour; play it, read its meaning. This is the founding
// premise the project once had and lost — reclaimed.

// Colour-in: seven wells; paint a word by colour.
export function mountColorIn(host, word) {
  host.classList.add('colorwells');
  host.textContent = '';
  for (const n of NOTES) {
    const well = document.createElement('button');
    well.className = 'well';
    well.style.background = n.color;
    well.title = n.name;
    well.setAttribute('aria-label', `paint ${n.name}`);
    well.addEventListener('click', () => { word.add(n.name); playNote(n.name); });
    host.appendChild(well);
  }
  return { destroy() { host.textContent = ''; } };
}

// Number-in: type "4-1-5-1" (or "4151") → a word.
export function mountNumberIn(host, word, { onCommit = null } = {}) {
  host.textContent = '';
  const input = document.createElement('input');
  input.className = 'field';
  input.inputMode = 'numeric';
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'A word as numbers, 1 to 7');
  input.placeholder = 'numbers, e.g. 1-3-5 — Enter says it';
  input.addEventListener('input', () => {
    const notes = (input.value.match(/[1-7]/g) || []).map((d) => noteByNumber(d).name);
    word.set(notes);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && onCommit) { e.preventDefault(); onCommit(); input.value = ''; }
  });
  host.appendChild(input);
  return { destroy() { host.textContent = ''; } };
}

// After a pause, the word is said. Every sung or played note calls poke();
// if `ms` pass with no new note and the word holds something, onCommit fires.
// (After archive/src/audio/midi.js: one second of silence ends a word.)
export function silenceCommit(word, onCommit, ms = 1000) {
  let timer = 0;
  return {
    poke() {
      clearTimeout(timer);
      if (!onCommit) return;
      timer = setTimeout(() => { if (word.length) onCommit(); }, ms);
    },
    cancel() { clearTimeout(timer); },
  };
}

// Tone-in: sing or hum; the nearest note is added. Browser only (mic).
export function mountToneIn(host, word, { onCommit = null } = {}) {
  host.textContent = '';
  const btn = document.createElement('button');
  btn.className = 'btn btn--small';
  btn.textContent = 'Listen';
  const status = document.createElement('span');
  status.className = 'mic-status';
  status.setAttribute('aria-live', 'polite');
  host.append(btn, status);

  const pause = silenceCommit(word, onCommit);
  let listening = false, ac, analyser, raf, last = '', quietSince = 0, stream = null;

  btn.addEventListener('click', async () => {
    if (listening) { stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia) { status.textContent = 'no microphone here'; return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const src = ac.createMediaStreamSource(stream);
      analyser = ac.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      listening = true; btn.setAttribute('aria-pressed', 'true'); btn.textContent = 'Stop';
      status.textContent = 'sing a note… a second of quiet says the word';
      loop();
    } catch { status.textContent = 'no microphone, or it was declined'; }
  });

  function loop() {
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    const freq = autocorrelate(buf, ac.sampleRate);
    const now = performance.now();
    if (freq) {
      const { note: n, confidence } = detectNote(freq);
      if (n) status.textContent = `heard ${n} · ${Math.round(confidence * 100)}%`;
      // only ACT on a confident interpretation — a hypothesis held with uncertainty
      if (n && confidence > 0.5 && (n !== last || now - quietSince > 350)) {
        word.add(n); playNote(n); last = n; pause.poke();
      }
      quietSince = now;
    } else if (now - quietSince > 200) {
      last = '';
    }
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    pause.cancel();
    if (!listening) return;
    listening = false; btn.setAttribute('aria-pressed', 'false'); btn.textContent = 'Listen';
    status.textContent = '';
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach((t) => t.stop());
    ac?.close();
  }
  return { destroy() { stop(); host.textContent = ''; } };
}

// MIDI-in: play a real instrument; notes become a word, and a second of
// silence says it. Browser only.
//
// Asking for MIDI on load throws a permission prompt at someone who only
// came to look. So it connects by itself only when the browser already
// allows it (permission granted before); otherwise it is offered, not
// taken. Once connected it follows devices as they are plugged in.
export function mountMidiIn(host, word, { onCommit = null } = {}) {
  host.textContent = '';
  const btn = document.createElement('button');
  btn.className = 'btn btn--small';
  btn.textContent = 'Connect MIDI';
  const status = document.createElement('span');
  status.className = 'mic-status';
  status.setAttribute('aria-live', 'polite');
  host.append(btn, status);

  const pause = silenceCommit(word, onCommit);
  let access = null, gone = false;

  if (!navigator.requestMIDIAccess) {
    btn.disabled = true;
    status.textContent = 'this browser has no MIDI';
    return { destroy() { host.textContent = ''; } };
  }

  const onMessage = ({ data }) => {
    const [cmd, key, vel] = data;
    if ((cmd & 0xf0) === 0x90 && vel > 0) {          // note-on
      const n = noteFromMidi(key);
      if (n) { word.add(n); playNote(n); pause.poke(); }
    }
  };

  function attach() {
    if (!access || gone) return;
    const inputs = [...access.inputs.values()];
    for (const input of inputs) input.onmidimessage = onMessage;
    btn.hidden = inputs.length > 0;
    status.textContent = inputs.length
      ? `listening to ${inputs.map((i) => i.name || 'a device').join(', ')} — a second of silence says the word`
      : 'no device yet — plug one in';
  }

  function connect() {
    btn.disabled = true;
    status.textContent = 'connecting…';
    navigator.requestMIDIAccess().then((a) => {
      if (gone) return;
      access = a; btn.disabled = false;
      access.onstatechange = attach;                  // hot-plug
      attach();
    }, () => {
      if (gone) return;
      status.textContent = 'MIDI access declined';
      btn.disabled = false;
    });
  }
  btn.addEventListener('click', connect);

  // auto-connect when the browser already said yes
  navigator.permissions?.query({ name: 'midi' }).then((p) => {
    if (p.state === 'granted' && !gone) connect();
  }, () => {});

  return {
    destroy() {
      gone = true;
      pause.cancel();
      if (access) {
        access.onstatechange = null;
        for (const input of access.inputs.values()) input.onmidimessage = null;
      }
      host.textContent = '';
    },
  };
}
