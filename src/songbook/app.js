import { note } from '../dictionary/notes.js?v=c5b00be221';
import { SONGS, WHITE, BLACK, notesOf, samePitch, accidental } from './songs.js?v=c5b00be221';
import { INSTRUMENTS, start, play, stopAll } from './instruments.js?v=c5b00be221';
import { staffSVG } from './staff.js?v=c5b00be221';

// The songbook page — a song on its sheet, the instrument that plays it,
// and a keyboard to play along on.
//
// Listen plays the song and lights each note as it sounds. Your turn waits
// for you: the next note glows, and the right key moves it on. Keys hold
// their tone for as long as they are held, and the sustain pedal lets it
// ring on after.

const $ = (s) => document.querySelector(s);
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('songbook.' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('songbook.' + k, JSON.stringify(v)); } catch { /* private mode */ } },
};

const state = {
  song: SONGS.find((s) => s.n === store.get('song')) || SONGS[0],
  instrument: null,
  mode: store.get('mode', 'listen'),
  pos: 0,
  playing: false,
};
let timers = [];

// ---------- the page ----------

function renderSong() {
  const s = state.song;
  state.instrument = s.instrument;
  $('#title').textContent = s.title;
  $('#number').textContent = s.n;
  $('#icon').textContent = $('#sheet-icon').textContent = s.icon;
  $('#instrument').value = s.instrument;
  drawMusic();
  state.pos = firstNote(0);
  mark();
  message(state.mode === 'turn' ? 'Your turn — play the glowing note.' : 'Press Play to hear it, or play it yourself on the keys.');
}

// On a phone a line of fifteen notes is too small to read, so long lines
// are split in half there.
const narrow = matchMedia('(max-width: 600px)');
function drawMusic() {
  const rows = state.song.lines.flatMap((line) => {
    if (!narrow.matches || line.length <= 9) return [line];
    const h = Math.ceil(line.length / 2);
    return [line.slice(0, h), line.slice(h)];
  });
  const longest = Math.max(...rows.map((r) => r.length));
  let i = 0;
  $('#music').innerHTML = rows.map((row) => { const svg = staffSVG(row, i, longest); i += row.length; return svg; }).join('');
  mark();
}
narrow.addEventListener('change', () => { if (!state.playing) drawMusic(); });

const flat = () => state.song.lines.flat();
function firstNote(i) { const f = flat(); while (i < f.length && f[i].rest) i++; return i; }

function mark() {
  document.querySelectorAll('.nt').forEach((el) => {
    const i = Number(el.dataset.i);
    el.classList.toggle('next', state.mode === 'turn' && i === state.pos && !state.playing);
    el.classList.toggle('done', state.mode === 'turn' && i < state.pos);
  });
}

function sounding(i) {
  document.querySelectorAll('.nt.on').forEach((el) => el.classList.remove('on'));
  if (i != null) document.querySelector(`.nt[data-i="${i}"]`)?.classList.add('on');
}

function message(t, kind = '') { const m = $('#msg'); m.textContent = t; m.className = 'msg ' + kind; }

// ---------- the song ----------

const beat = () => 60 / Number($('#tempo').value);

function stop() {
  timers.forEach(clearTimeout); timers = [];
  stopAll();
  state.playing = false;
  $('#play').textContent = 'Play';
  $('#play').classList.remove('on');
  sounding(null);
  document.querySelectorAll('.key.lit').forEach((k) => k.classList.remove('lit'));
  mark();
}

function playSong() {
  if (state.playing) return stop();
  stop();
  state.playing = true;
  $('#play').textContent = 'Stop';
  $('#play').classList.add('on');
  mark();
  const b = beat();
  let t = 0;
  flat().forEach((tok, i) => {
    const dur = tok.beats * b;
    if (!tok.rest) play(state.instrument, tok.midi, t, dur * 0.9);
    timers.push(setTimeout(() => {
      sounding(i);
      if (!tok.rest) light(tok, dur * 900);
    }, t * 1000));
    t += dur;
  });
  timers.push(setTimeout(() => {
    stop();
    if ($('#loop').getAttribute('aria-pressed') === 'true') playSong();
  }, t * 1000 + 250));
}

// ---------- the keyboard ----------

const ALL = [...WHITE, ...BLACK];
const keyOf = (midi) => document.querySelector(`.key[data-midi="${midi}"]`);
function light(tok, ms = 300) {
  const k = keyOf(tok.midi);
  if (!k) return;
  k.classList.add('lit');
  setTimeout(() => k.classList.remove('lit'), ms);
}

function renderKeys() {
  const white = WHITE.map((t, i) => {
    const c = note(t.name).color;
    return `<button class="key white" data-midi="${t.midi}" style="--c:${c}" aria-label="${t.name}${t.up ? ' high' : ''}">
      <span class="lab"><span class="syl">${t.up ? '<i>•</i>' : ''}${t.name}</span><span class="let">${t.letter}</span><kbd>${(i + 1) % 10}</kbd></span></button>`;
  }).join('');
  // a black key sits on the line after its white key
  const black = BLACK.map((t) => {
    const i = WHITE.findIndex((w) => w.midi === t.midi - 1);
    return `<button class="key black" data-midi="${t.midi}" style="--at:${i + 1};--c:${note(t.name).color}" aria-label="${t.name} sharp">
      <span class="lab">${t.name}♯<kbd>⇧${(i + 1) % 10}</kbd></span></button>`;
  }).join('');
  $('#keys').innerHTML = white + black;
}

const held = new Map();   // pointer id or key code → voice
function down(id, midi) {
  if (held.has(id)) return;
  const tok = ALL.find((t) => t.midi === midi);
  held.set(id, { voice: start(state.instrument, midi, { sustain: $('#pedal').checked ? 1.6 : 0 }), midi });
  keyOf(midi)?.classList.add('lit');
  if (state.playing) stop();
  pressed(tok);
}
function up(id) {
  const h = held.get(id);
  if (!h) return;
  held.delete(id);
  h.voice.release();
  if (![...held.values()].some((o) => o.midi === h.midi)) keyOf(h.midi)?.classList.remove('lit');
}

// Your turn: does the key match the glowing note?
function pressed(tok) {
  if (state.mode !== 'turn') return;
  const f = flat(), want = f[state.pos];
  if (!want) return;
  if (samePitch(tok, want)) {
    state.pos = firstNote(state.pos + 1);
    mark();
    if (state.pos >= f.length) finish();
    else message('');
  } else {
    const el = document.querySelector(`.nt[data-i="${state.pos}"]`);
    el?.classList.remove('wrong'); void el?.getBoundingClientRect(); el?.classList.add('wrong');
    message(`That was ${tok.name}${accidental(tok.acc)} — this one is ${want.name}${accidental(want.acc)}.`, 'bad');
  }
}

function finish() {
  const done = new Set(store.get('done', []));
  done.add(state.song.n);
  store.set('done', [...done]);
  message(`You played ${state.song.title}! ★`, 'good');
  renderTOC();
  setTimeout(() => {
    [0, 4, 7, 12].forEach((d, i) => play(state.instrument, 60 + d, i * 0.12, 0.25));
  }, 300);
}

// ---------- contents and paging ----------

function renderTOC() {
  const done = new Set(store.get('done', []));
  $('#toc-list').innerHTML = SONGS.map((s) => `<li><button value="${s.n}" data-song="${s.n}">
    <span class="ti">${s.icon}</span><span class="tn">${s.n}</span><span class="tt">${s.title}</span>${done.has(s.n) ? '<span class="star">★</span>' : ''}</button></li>`).join('');
}

function go(n) {
  stop();
  const s = SONGS.find((x) => x.n === n) || SONGS.find((x) => x.n > n) || SONGS[SONGS.length - 1];
  state.song = s;
  store.set('song', s.n);
  renderSong();
}
const step = (d) => { const i = SONGS.indexOf(state.song); go(SONGS[(i + d + SONGS.length) % SONGS.length].n); };

function setMode(m) {
  stop();
  state.mode = m;
  store.set('mode', m);
  document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-checked', b.dataset.mode === m));
  state.pos = firstNote(0);
  mark();
  message(m === 'turn' ? 'Your turn — play the glowing note.' : 'Press Play to hear it.');
}

// ---------- wiring ----------

$('#instrument').innerHTML = Object.entries(INSTRUMENTS).map(([id, r]) => `<option value="${id}">${r.label}</option>`).join('');
$('#instrument').onchange = (e) => { state.instrument = e.target.value; };
$('#play').onclick = playSong;
$('#prev').onclick = () => step(-1);
$('#next').onclick = () => step(1);
$('#loop').onclick = (e) => { const b = e.currentTarget; b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); };
$('#contents').onclick = () => $('#toc').showModal();
$('#names').onchange = (e) => { document.body.classList.toggle('no-names', !e.target.checked); store.set('names', e.target.checked); };
$('#names').checked = store.get('names', true);
document.body.classList.toggle('no-names', !$('#names').checked);
$('#pedal').checked = store.get('pedal', true);
$('#pedal').onchange = (e) => store.set('pedal', e.target.checked);

document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.midi && e.detail === 0) { const v = start(state.instrument, Number(b.dataset.midi)); v.release(0.5); }   // Enter on a focused key
  else if (b.dataset.jump) go(Number(b.dataset.jump));
  else if (b.dataset.song) go(Number(b.dataset.song));
  else if (b.dataset.mode) setMode(b.dataset.mode);
});
// tap a note on the sheet to hear it
$('#music').addEventListener('click', (e) => {
  const el = e.target.closest('.nt');
  const tok = el && flat()[Number(el.dataset.i)];
  if (tok && !tok.rest) { play(state.instrument, tok.midi, 0, 0.6); light(tok, 500); }
});

// keys: sound on press, hold to sustain, release on lift
const keysEl = $('#keys');
keysEl.addEventListener('pointerdown', (e) => {
  const k = e.target.closest('.key');
  if (!k) return;
  e.preventDefault();
  keysEl.setPointerCapture?.(e.pointerId);
  down('p' + e.pointerId, Number(k.dataset.midi));
});
// sliding across the keys plays each one, like a glissando
keysEl.addEventListener('pointermove', (e) => {
  const h = held.get('p' + e.pointerId);
  if (!h) return;
  const k = document.elementFromPoint(e.clientX, e.clientY)?.closest('.key');
  if (k && Number(k.dataset.midi) !== h.midi) { up('p' + e.pointerId); down('p' + e.pointerId, Number(k.dataset.midi)); }
});
for (const ev of ['pointerup', 'pointercancel']) keysEl.addEventListener(ev, (e) => up('p' + e.pointerId));

// the computer keyboard: 1–0 are the white keys, Shift for the black key above
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || $('#toc').open) return;
  const d = /^Digit(\d)$/.exec(e.code);
  if (d) {
    e.preventDefault();
    if (e.repeat) return;
    const w = WHITE[(Number(d[1]) + 9) % 10];
    const midi = e.shiftKey && BLACK.some((b) => b.midi === w.midi + 1) ? w.midi + 1 : w.midi;
    down(e.code, midi);
    return;
  }
  if (e.target.closest('input, select')) return;
  if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) playSong(); }
  else if (e.key === 'ArrowLeft') step(-1);
  else if (e.key === 'ArrowRight') step(1);
});
document.addEventListener('keyup', (e) => { if (/^Digit/.test(e.code)) up(e.code); });
window.addEventListener('blur', () => [...held.keys()].forEach(up));

renderKeys(); renderTOC(); renderSong(); setMode(state.mode);
