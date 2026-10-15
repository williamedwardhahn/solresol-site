import { note } from '../dictionary/notes.js?v=c5b00be221';
import { createMic } from '../learn/mic.js?v=c5b00be221';
import { SONGS, RANGE, BUTTONS, parseNote, syllablesOf } from './songs.js?v=c5b00be221';
import { playNote, hold, stopAll, fanfare } from './sound.js?v=c5b00be221';
import { ocarinaTabSVG } from '../voices/ocarina.js?v=c5b00be221';

// Ocarina Songs — learn the seven names through melodies already known.
//
// A song is heard, then played back note by note. Three levels take the
// help away: names on the tiles, then only their colours, then nothing at
// all (by ear). A note counts by its name, in either octave, because the
// thing being learned is the name. The keys, the computer keyboard and the
// microphone all play the same instrument.

const $ = (s) => document.querySelector(s);
const MODES = ['read', 'colour', 'ear'];
const KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"];   // home row, low do → high fa
const DIGITS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus'];   // and the number row
const SPOKEN = { do: 'doe', re: 'ray', mi: 'me', fa: 'fah', sol: 'soul', la: 'lah', si: 'see' };

// Per-viewer memory: which songs are learned at which level. Optional — the
// page works the same without it.
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('ocarina.' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ocarina.' + k, JSON.stringify(v)); } catch { /* private mode */ } },
};

const state = {
  song: SONGS.find((s) => s.id === store.get('song')) || SONGS[0],
  mode: MODES.includes(store.get('mode')) ? store.get('mode') : 'read',
  pos: 0,
  done: store.get('done', {}),     // { songId: ['read', 'colour', ...] }
  tab: 'songs',
  playing: false,
};
let timers = [];

// ---------- rendering ----------

const colourOf = (token) => note(parseNote(token).name).color;
// Ocarina tabs: the fingering of each note on a 12-hole alto C ocarina.
// Shown unless switched off — and never in the by-ear mode, where a
// fingering would give the answer away.
const tabsOn = () => $('#tabs').checked && state.mode !== 'ear';
const label = (token) => parseNote(token).name;

function syllableHTML(token) {
  const { name, up } = parseNote(token);
  return `<span class="syl" style="--c:${note(name).color}">${name}${up ? '<i class="hi" aria-label="high">•</i>' : ''}</span>`;
}

function renderList() {
  const group = (g, title) => `
    <h3>${title}</h3>
    <ul>${SONGS.filter((s) => s.group === g).map((s) => {
      const got = state.done[s.id] || [];
      const stars = MODES.map((m) => `<span class="star${got.includes(m) ? ' on' : ''}">★</span>`).join('');
      const dots = syllablesOf(s).map((n) => `<span class="dot" style="--c:${note(n).color}"></span>`).join('');
      return `<li><button data-song="${s.id}" aria-current="${s === state.song}">
        <span class="name">${s.title}</span><span class="dots">${dots}</span><span class="stars">${stars}</span></button></li>`;
    }).join('')}</ul>`;
  $('.oc-list').innerHTML = group('five', 'Five-button songs') + group('full', 'Full melodies');
}

function renderSong() {
  const s = state.song;
  $('#song-title').textContent = s.title;
  $('#song-about').textContent = s.about;
  $('#song-uses').innerHTML = syllablesOf(s).map((n) => syllableHTML(n)).join(' ');
  document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-checked', b.dataset.mode === state.mode));
  // tiles rise with pitch, so the melody's shape is visible
  $('#tiles').innerHTML = s.notes.map((t, i) => {
    const h = RANGE.indexOf(t);
    return `<li class="tile" data-i="${i}" style="--c:${colourOf(t)};--h:${h};--w:${Math.max(1, s.beats[i])}">
      <span class="face">${syllableHTML(t)}</span></li>`;
  }).join('');
  $('#tiles').dataset.mode = state.mode;
  const sheet = $('#tabsheet');
  sheet.hidden = !tabsOn();
  sheet.innerHTML = tabsOn() ? s.notes.map((t, i) =>
    `<li class="tabnote" data-i="${i}">${ocarinaTabSVG(t)}<span class="tabsyl">${syllableHTML(t)}</span></li>`).join('') : '';
  markTiles();
}

function markTiles() {
  document.querySelectorAll('.tile, .tabnote').forEach((el) => {
    const i = Number(el.dataset.i);
    el.classList.toggle('played', i < state.pos);
    el.classList.toggle('next', i === state.pos && !state.playing);
  });
}

function renderKeys() {
  $('#keys').classList.toggle('with-tabs', $('#tabs').checked);
  $('#keys').innerHTML = RANGE.map((t, i) => {
    const { name, up } = parseNote(t);
    const btn = BUTTONS[t] ? `<span class="btn64">${BUTTONS[t]}</span>` : '';
    return `<button class="key${up ? ' up' : ''}" data-note="${t}" style="--c:${note(name).color}" aria-label="${name}${up ? ' high' : ''}">
      ${up ? '<i class="hi">•</i>' : ''}<span class="kname">${name}</span>${btn}${$('#tabs').checked ? `<span class="ktab">${ocarinaTabSVG(t)}</span>` : ''}<kbd>${DIGITS[i].replace('Digit', '').replace('Minus', '-')}</kbd></button>`;
  }).join('');
}

function say(text) {
  if (!$('#say').checked || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(SPOKEN[text] || text);
  u.rate = 1.3;
  speechSynthesis.speak(u);
}

function flashNow(token, el = $('#now'), hidden = false) {
  el.innerHTML = hidden ? '<span class="q">?</span>'
    : syllableHTML(token) + (el.id === 'now' && tabsOn() ? `<span class="nowtab">${ocarinaTabSVG(token)}</span>` : '');
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
}

function flashKey(token) {
  const k = document.querySelector(`.key[data-note="${CSS.escape(token)}"]`);
  if (!k) return;
  k.classList.remove('lit'); void k.offsetWidth; k.classList.add('lit');
}

function message(text, kind = '') { const m = $('#msg'); m.textContent = text; m.className = 'oc-msg ' + kind; }

// ---------- listening ----------

const beatSeconds = () => 60 / Number($('#tempo').value);

function stop() {
  timers.forEach(clearTimeout); timers = [];
  stopAll();
  state.playing = false;
  $('#listen').textContent = '▶ Listen';
  document.querySelectorAll('.tile.sounding').forEach((el) => el.classList.remove('sounding'));
  markTiles();
}

function listen() {
  if (state.playing) return stop();
  stop();
  state.playing = true;
  $('#listen').textContent = '■ Stop';
  markTiles();
  const s = state.song, b = beatSeconds();
  let t = 0;
  mic?.deafen((s.beats.reduce((a, x) => a + x, 0) * b + 0.8) * 1000);
  s.notes.forEach((tok, i) => {
    const dur = s.beats[i] * b;
    playNote(tok, t, dur * 0.92);
    timers.push(setTimeout(() => {
      document.querySelectorAll('.tile.sounding').forEach((el) => el.classList.remove('sounding'));
      document.querySelector(`.tile[data-i="${i}"]`)?.classList.add('sounding');
      flashNow(tok, $('#now'), state.mode === 'ear');
      if (state.mode !== 'ear') { flashKey(tok); say(label(tok)); }
    }, t * 1000 + 20));
    t += dur;
  });
  timers.push(setTimeout(() => { stop(); message(state.pos ? 'Carry on from where you were.' : 'Now you play it.'); }, t * 1000 + 300));
}

// ---------- playing ----------

function press(token, { sound = true } = {}) {
  if (sound) { playNote(token, 0, 0.42); mic?.deafen(600); }
  flashKey(token);
  say(label(token));
  if (state.tab === 'ear') return earAnswer(token);
  if (state.playing) stop();

  const s = state.song, want = s.notes[state.pos];
  if (want === undefined) return;
  flashNow(token);
  if (label(token) === label(want)) {
    state.pos++;
    markTiles();
    if (state.pos === s.notes.length) finish();
    else message('');
  } else {
    const tile = document.querySelector(`.tile[data-i="${state.pos}"]`);
    tile?.classList.remove('wrong'); void tile?.offsetWidth; tile?.classList.add('wrong');
    if (state.mode === 'ear') message(`That was ${label(token)}. Listen again, or press Hint.`, 'bad');
    else message(`That was ${label(token)} — this one is ${label(want)}.`, 'bad');
  }
}

function finish() {
  const got = new Set(state.done[state.song.id] || []);
  const first = !got.has(state.mode);
  got.add(state.mode);
  state.done[state.song.id] = [...got];
  store.set('done', state.done);
  setTimeout(fanfare, 250);
  const nextMode = MODES[MODES.indexOf(state.mode) + 1];
  message(nextMode
    ? `You played ${state.song.title}! ${first ? 'Try it again with less help: level ' + (MODES.indexOf(nextMode) + 1) + '.' : ''}`
    : `You played ${state.song.title} by ear. Every name is yours now.`, 'good');
  renderList();
}

function hint() {
  const want = state.song.notes[state.pos];
  if (!want) return;
  playNote(want, 0, 0.5);
  mic?.deafen(700);
  if (state.mode === 'ear') { flashNow(want, $('#now'), true); message('That is the next note — find it on the keys.'); }
  else { flashNow(want); flashKey(want); say(label(want)); }
}

function choose(id) {
  stop();
  state.song = SONGS.find((s) => s.id === id) || state.song;
  state.pos = 0;
  store.set('song', state.song.id);
  renderList(); renderSong(); message('Press Listen first.');
  $('#now').innerHTML = '';
}

function setMode(m) {
  stop();
  state.mode = m; state.pos = 0;
  store.set('mode', m);
  renderSong(); message(m === 'ear' ? 'No help now — listen, then play it from memory.' : '');
  $('#now').innerHTML = '';
}

// ---------- the ear game ----------

const ear = { set: store.get('earSet', 'five'), answer: null, right: 0, tries: 0, streak: 0 };
const EAR_NOTES = { five: ['re', 'fa', 'la', 'si', "re'"], seven: ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'] };

function earRender() {
  document.querySelectorAll('[data-set]').forEach((b) => b.setAttribute('aria-checked', b.dataset.set === ear.set));
  $('#ear-score').textContent = ear.tries ? `${ear.right} of ${ear.tries} right · streak ${ear.streak}` : '';
}

function earPlay(fresh = true) {
  if (fresh) {
    const pool = EAR_NOTES[ear.set];
    let n; do n = pool[Math.floor(Math.random() * pool.length)]; while (pool.length > 1 && n === ear.answer);
    ear.answer = n;
  }
  if (!ear.answer) return;
  playNote('do', 0, 0.45);          // the reference
  playNote(ear.answer, 0.75, 0.7);
  mic?.deafen(1800);
  flashNow('do', $('#ear-now'), true);
}

function earAnswer(token) {
  if (!ear.answer) return;
  const ok = label(token) === label(ear.answer);
  ear.tries++;
  if (ok) { ear.right++; ear.streak++; flashNow(ear.answer, $('#ear-now')); ear.answer = null; setTimeout(() => earPlay(), 900); }
  else { ear.streak = 0; $('#ear-now').innerHTML = `<span class="miss">not ${label(token)}</span>`; }
  earRender();
}

// ---------- the microphone ----------

// A sung note counts once it has held steady for a moment; the same note
// counts again only after a breath (silence) or a different note.
let mic = null, micLoop = 0;
const heard = { note: null, since: 0, taken: false };

async function toggleMic(on) {
  if (!on) { cancelAnimationFrame(micLoop); mic?.stop(); mic = null; $('#mic-meter').hidden = true; return; }
  try {
    mic = createMic();
    await mic.start();
    $('#mic-meter').hidden = false;
    const tick = () => {
      if (!mic) return;
      const r = mic.read();
      const meter = $('#mic-meter');
      const n = r.reading?.note || null;
      meter.innerHTML = n ? syllableHTML(n) : (r.open ? '…' : 'listening');
      const now = performance.now();
      if (n !== heard.note) Object.assign(heard, { note: n, since: now, taken: false });
      else if (n && !heard.taken && now - heard.since > 160) { heard.taken = true; press(n, { sound: false }); }
      micLoop = requestAnimationFrame(tick);
    };
    tick();
  } catch (e) {
    $('#mic').checked = false; mic = null;
    message(e.message || 'The microphone could not start.', 'bad');
  }
}

// ---------- wiring ----------

function setTab(t) {
  stop();
  state.tab = t;
  document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === t));
  $('#tab-songs').hidden = t !== 'songs';
  $('#tab-ear').hidden = t !== 'ear';
  earRender();
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('button');
  if (!el) return;
  if (el.dataset.note) { if (e.detail === 0) press(el.dataset.note); }   // keyboard activation; pointers press on pointerdown
  else if (el.dataset.song) choose(el.dataset.song);
  else if (el.dataset.mode) setMode(el.dataset.mode);
  else if (el.dataset.tab) setTab(el.dataset.tab);
  else if (el.dataset.set) { ear.set = el.dataset.set; store.set('earSet', ear.set); ear.answer = null; earRender(); }
});
// Keys sound on press and hold their tone until released, so a long
// press is a long note; the sustain pedal lets it ring on after.
const held = new Map();   // pointer or key → voice
function down(id, token) {
  if (held.has(id)) return;
  held.set(id, hold(token));
  mic?.deafen(60000);
  press(token, { sound: false });
}
function up(id) {
  const v = held.get(id);
  if (!v) return;
  held.delete(id);
  v.release(0, $('#pedal').checked ? 1.4 : 0.08);
  if (!held.size) mic?.deafen(600);
}
document.addEventListener('pointerdown', (e) => {
  const k = e.target.closest('.key');
  if (k) { e.preventDefault(); down('p' + e.pointerId, k.dataset.note); }
});
for (const ev of ['pointerup', 'pointercancel']) document.addEventListener(ev, (e) => up('p' + e.pointerId));
document.addEventListener('keyup', (e) => up(e.code));
window.addEventListener('blur', () => [...held.keys()].forEach(up));

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.target.matches('input[type=range]')) return;
  let i = DIGITS.indexOf(e.code);
  if (i < 0) i = KEYS.indexOf(e.key.toLowerCase());
  if (i >= 0) { e.preventDefault(); down(e.code, RANGE[i]); return; }
  if (e.key === ' ' && state.tab === 'songs' && !e.target.closest('button')) { e.preventDefault(); listen(); }
});

$('#listen').onclick = listen;
$('#restart').onclick = () => { stop(); state.pos = 0; markTiles(); message(''); $('#now').innerHTML = ''; };
$('#hint').onclick = hint;
$('#ear-play').onclick = () => earPlay(true);
$('#ear-again').onclick = () => earPlay(false);
$('#mic').onchange = (e) => toggleMic(e.target.checked);
$('#say').checked = store.get('say', false);
$('#pedal').checked = store.get('pedal', true);
$('#pedal').onchange = (e) => store.set('pedal', e.target.checked);
$('#say').onchange = (e) => store.set('say', e.target.checked);
$('#tabs').checked = store.get('tabs', true);
$('#tabs').onchange = (e) => { store.set('tabs', e.target.checked); renderKeys(); renderSong(); };

renderKeys(); renderList(); renderSong(); earRender();
message('Pick a song, press Listen, then play it back.');
