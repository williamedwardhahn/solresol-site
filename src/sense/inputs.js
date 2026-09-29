import { NOTES, note, noteFromMidi } from '../dictionary/notes.js';
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
    well.addEventListener('click', () => { word.add(n.name); playNote(n.name); });
    host.appendChild(well);
  }
  return { destroy() { host.textContent = ''; } };
}

// Number-in: type "4-1-5-1" (or "4151") → a word.
export function mountNumberIn(host, word) {
  host.textContent = '';
  const input = document.createElement('input');
  input.className = 'search';
  input.placeholder = 'numbers, e.g. 4-1-5-1';
  input.addEventListener('input', () => {
    const notes = (input.value.match(/[1-7]/g) || []).map((d) => note(d).name);
    word.set(notes);
  });
  host.appendChild(input);
  return { destroy() { host.textContent = ''; } };
}

// Tone-in: sing or hum; the nearest note is added. Browser only (mic).
export function mountToneIn(host, word) {
  host.textContent = '';
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = '🎤 Listen';
  const status = document.createElement('span');
  status.className = 'mic-status';
  host.append(btn, status);

  let listening = false, ac, analyser, raf, last = '', quietSince = 0;

  btn.addEventListener('click', async () => {
    if (listening) { stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const src = ac.createMediaStreamSource(stream);
      analyser = ac.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      listening = true; btn.classList.add('btn--on'); btn.textContent = '🎤 Stop';
      status._stream = stream;
      loop();
    } catch { status.textContent = 'no microphone'; }
  });

  function loop() {
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    const freq = autocorrelate(buf, ac.sampleRate);
    const now = performance.now();
    if (freq) {
      const { note: n, confidence } = detectNote(freq);
      status.textContent = n ? `${n.toUpperCase()} ${Math.round(confidence * 100)}%` : '';
      // only ACT on a confident interpretation — a hypothesis held with uncertainty
      if (n && confidence > 0.5 && (n !== last || now - quietSince > 350)) {
        word.add(n); playNote(n); last = n;
      }
      quietSince = now;
    } else if (now - quietSince > 200) {
      last = '';
    }
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    listening = false; btn.classList.remove('btn--on'); btn.textContent = '🎤 Listen';
    status.textContent = '';
    cancelAnimationFrame(raf);
    status._stream?.getTracks().forEach((t) => t.stop());
    ac?.close();
  }
  return { destroy: stop };
}

// MIDI-in: play a real instrument; notes become a word. Browser only.
//
// Asking for MIDI on load throws a permission prompt at someone who only
// came to look, and leaves "denied" on the card forever if they decline.
// So it waits: the connection is offered, not taken.
export function mountMidiIn(host, word) {
  host.textContent = '';
  const btn = document.createElement('button');
  btn.className = 'btn btn--ghost';
  btn.textContent = '🎹 Connect MIDI';
  const status = document.createElement('span');
  status.className = 'mic-status';
  host.append(btn, status);

  const opened = [];

  if (!navigator.requestMIDIAccess) {
    btn.disabled = true;
    status.textContent = 'this browser has no MIDI';
    return { destroy() { host.textContent = ''; } };
  }

  btn.addEventListener('click', () => {
    btn.disabled = true;
    status.textContent = 'connecting…';
    navigator.requestMIDIAccess().then((access) => {
      const inputs = [...access.inputs.values()];
      status.textContent = inputs.length
        ? `listening to ${inputs.length} device${inputs.length > 1 ? 's' : ''}`
        : 'no device found — plug one in and press again';
      btn.disabled = inputs.length > 0;
      for (const input of inputs) {
        input.onmidimessage = ({ data }) => {
          const [cmd, key, vel] = data;
          if ((cmd & 0xf0) === 0x90 && vel > 0) {          // note-on
            const n = noteFromMidi(key);
            if (n) { word.add(n); playNote(n); }
          }
        };
        opened.push(input);
      }
    }, () => {
      status.textContent = 'MIDI access declined';
      btn.disabled = false;
    });
  });

  return {
    destroy() {
      for (const input of opened) input.onmidimessage = null;
      host.textContent = '';
    },
  };
}
