// The pure core of the Sequencer — no DOM, no audio.
//
// `timeline` lays a list of words out in time (one note per beat, a rest
// between words); `midiFile` writes the same timeline as a standard
// MIDI file (format 0, one track), so a sentence can leave the browser
// and be opened in any notation program or DAW.

// do = middle C (60) … si = B (71): the white keys of one octave.
export const MIDI_OF = { do: 60, re: 62, mi: 64, fa: 65, sol: 67, la: 69, si: 71 };

// words: [[notes]]; tempo: notes per second; wordGap: seconds of rest.
// → { events: [{ note, word, index, start, dur }], total }
export function timeline(words, { tempo = 2.5, wordGap = 0.5 } = {}) {
  const beat = 1 / tempo, events = [];
  let t = 0, index = 0;
  words.forEach((notes, wi) => {
    if (wi) t += wordGap;
    for (const n of notes) {
      events.push({ note: n, word: wi, index: index++, start: t, dur: beat * 0.9 });
      t += beat;
    }
  });
  return { events, total: t };
}

// A MIDI variable-length quantity: 7 bits per byte, high bit = "more".
export function varLen(value) {
  let v = Math.max(0, Math.round(value));
  const bytes = [v & 0x7f];
  v >>= 7;
  while (v > 0) { bytes.unshift((v & 0x7f) | 0x80); v >>= 7; }
  return bytes;
}

const u32 = (n) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const ascii = (s) => [...s].map((c) => c.charCodeAt(0));

// → Uint8Array holding a complete .mid file.
export function midiFile(words, { tempo = 2.5, wordGap = 0.5, ppq = 480, velocity = 96, title = 'Solresol' } = {}) {
  const bpm = tempo * 60;                     // one note = one beat
  const ticksPerSec = ppq * tempo;
  const { events } = timeline(words, { tempo, wordGap });

  const raw = [];
  for (const e of events) {
    const on = Math.round(e.start * ticksPerSec);
    const off = on + Math.round(e.dur * ticksPerSec);
    raw.push({ tick: on, bytes: [0x90, MIDI_OF[e.note] ?? 60, velocity] });
    raw.push({ tick: off, bytes: [0x80, MIDI_OF[e.note] ?? 60, 0] });
  }
  // note-offs before note-ons at the same tick, so repeated notes re-strike
  raw.sort((a, b) => a.tick - b.tick || (a.bytes[0] === 0x80 ? -1 : 1) - (b.bytes[0] === 0x80 ? -1 : 1));

  const usPerBeat = Math.round(60000000 / bpm);
  const name = ascii(title).slice(0, 120);
  const track = [
    0x00, 0xff, 0x03, ...varLen(name.length), ...name,                       // track name
    0x00, 0xff, 0x51, 0x03, (usPerBeat >> 16) & 0xff, (usPerBeat >> 8) & 0xff, usPerBeat & 0xff, // tempo
    0x00, 0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08,                          // 4/4
  ];
  let last = 0;
  for (const ev of raw) {
    track.push(...varLen(ev.tick - last), ...ev.bytes);
    last = ev.tick;
  }
  track.push(0x00, 0xff, 0x2f, 0x00);                                         // end of track

  return new Uint8Array([
    ...ascii('MThd'), ...u32(6), 0x00, 0x00, 0x00, 0x01, (ppq >> 8) & 0xff, ppq & 0xff,
    ...ascii('MTrk'), ...u32(track.length), ...track,
  ]);
}
