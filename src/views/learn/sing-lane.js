import { NOTES, note, cap } from '../../dictionary/notes.js?v=d5188c5e91';
import { meaningOf } from '../../dictionary/dictionary.js?v=d5188c5e91';
import { playNote } from '../../voices/index.js?v=d5188c5e91';
import { emit } from '../../live/bus.js?v=d5188c5e91';
import { ladderPosition } from '../../learn/singing.model.js?v=d5188c5e91';
import { esc } from './common.js?v=d5188c5e91';

// Sing-along — the singing lesson as a game.
//
// Call and response: the page sings the word once while you listen, then
// its notes slide in from the right toward the line, each on the rung of
// its pitch and in its colour; sing each one as it crosses. A note scores
// by how much of its time you held it in tune. Levels grow from single
// notes to two-, three- and four-note words; each word sung tells you
// what you said.

const LEVELS = [
  { name: 'Single notes',      words: ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'], beat: 1.0 },
  { name: 'Two notes',         words: ['simi', 'misol', 'solsi', 'dore', 'domi', 'fala', 'lafa', 'misi'], beat: 0.85 },
  { name: 'Three notes',       words: ['milasi', 'solsire', 'domisol', 'dosido', 'mifala', 'sidosi', 'remifa'], beat: 0.75 },
  { name: 'Four notes',        words: ['solresol', 'dolamisi', 'remifala', 'misolrela', 'sollafasol', 'residosol'], beat: 0.7 },
];
const STORE = 'solresol:singalong';
const LEAD = 2.2;          // seconds a note takes to slide from the right edge to the line
const OK_CENTS = 40;       // in tune enough to count, in the game

const load = () => { try { return { level: 0, best: {}, ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { return { level: 0, best: {} }; } };
const save = (s) => { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* private mode */ } };

export function mountLane(host, env) {
  const saved = load();
  host.innerHTML = `
    <div class="ln-lane">
      <div class="ln-lane-top">
        <div class="seg" role="group" aria-label="Level">
          ${LEVELS.map((l, i) => `<button class="seg-btn" data-level="${i}">${i + 1}. ${l.name}</button>`).join('')}
        </div>
        <p class="ln-lane-score" aria-live="polite"></p>
      </div>
      <canvas class="ln-lane-canvas" aria-hidden="true"></canvas>
      <p class="ln-lane-say" aria-live="polite"></p>
      <div class="controls"><button class="btn btn--ink" data-lane="go">▶ Play a word</button></div>
    </div>`;
  const $ = (s) => host.querySelector(s);
  const canvas = $('.ln-lane-canvas'), g = canvas.getContext('2d');
  const say = $('.ln-lane-say'), scoreEl = $('.ln-lane-score'), goBtn = $('[data-lane=go]');

  let level = Math.min(saved.level || 0, LEVELS.length - 1);
  let round = null;        // { word, notes: [{ n, t0, t1, on, frames, verdict }], phase, startAt }
  let trail = [];          // your voice: { t, pos, note }
  let total = 0, streak = 0;

  function setLevel(i) {
    level = i;
    host.querySelectorAll('[data-level]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.level) === i)));
    score();
  }
  const score = () => { scoreEl.innerHTML = `<b>${total}</b> points · <b>${streak}</b> in a row · best ${saved.best[level] ?? '—'}`; };

  function startRound() {
    if (!env.ear.active) { say.textContent = 'Start singing first (the microphone button below).'; return; }
    const L = LEVELS[level];
    const pool = L.words.filter((w) => level === 0 || meaningOf(w));
    const word = pool[Math.floor(Math.random() * pool.length)];
    const notes = word.match(/do|re|mi|fa|sol|la|si/g);
    // 1. listen: the page sings it; the ear rests meanwhile
    const listen = notes.length * L.beat * 0.62 + 0.4;
    notes.forEach((n, i) => playNote(n, i * L.beat * 0.62, L.beat * 0.62, { octave: env.refOctave(), damp: i < notes.length - 1 }));
    env.ear.deafen(listen * 1000 + 250);
    // 2. your turn: the notes arrive at the line one beat apart
    const start = performance.now() / 1000 + listen + 0.6 + LEAD;
    round = {
      word, phase: 'listen',
      notes: notes.map((n, i) => ({ n, t0: start + i * L.beat, t1: start + i * L.beat + L.beat * 0.8, on: 0, frames: 0, cents: [], verdict: null })),
    };
    say.innerHTML = `Listen… then sing <b>${notes.map((n) => `<span class="nt" style="color:${note(n).color}">${cap(n)}</span>`).join(' ')}</b>`;
    goBtn.disabled = true;
  }

  function finishRound() {
    const hits = round.notes.filter((x) => x.verdict !== 'miss').length;
    const perfect = round.notes.filter((x) => x.verdict === 'perfect').length;
    const all = round.notes.length;
    const meaning = level ? meaningOf(round.word) : null;
    const stars = hits === all ? (perfect === all ? 3 : 2) : hits ? 1 : 0;
    const link = `<button class="chip-word" data-open="${round.word}">${cap(round.word)}</button>`;
    const gloss = meaning ? `, <i>${esc(meaning.split(/[,;]/)[0])}</i>` : '';
    say.innerHTML = `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)} ${hits} of ${all} notes — ` +
      (hits === all ? `you sang ${link}${gloss}.` : `the word was ${link}${gloss}. Try it again?`);
    if (hits === all) {
      emit('word:used', { key: round.word, channel: 'sing' });
      round.notes.forEach((x, i, a) => playNote(x.n, 0.2 + i * 0.22, 0.22, { octave: env.refOctave(), damp: i < a.length - 1 }));
      env.ear.deafen(400 + all * 220);
    }
    saved.best[level] = Math.max(saved.best[level] || 0, total);
    if (stars >= 2 && level < LEVELS.length - 1 && (saved.level || 0) <= level) saved.level = level + 1;
    save(saved); score();
    round = null; goBtn.disabled = false; goBtn.textContent = '▶ Next word';
  }

  // each hearing: credit the note on the line
  function hear(r, now) {
    const t = now / 1000;
    if (r.freq) {
      const p = ladderPosition(r.freq, env.refOctave());
      trail.push({ t, pos: ((p + 0.5) % 7 + 7) % 7 - 0.5, note: r.reading.note });
    }
    trail = trail.filter((x) => t - x.t < LEAD);
    if (!round) return;
    if (round.phase === 'listen' && t >= round.notes[0].t0 - LEAD) round.phase = 'sing';
    for (const x of round.notes) {
      if (t >= x.t0 && t <= x.t1) {
        x.frames++;
        if (r.reading && r.reading.note === x.n && Math.abs(r.reading.cents) <= OK_CENTS) { x.on++; x.cents.push(Math.abs(r.reading.cents)); }
      } else if (t > x.t1 && !x.verdict) {
        const share = x.frames ? x.on / x.frames : 0;
        const mean = x.cents.length ? x.cents.reduce((a, b) => a + b, 0) / x.cents.length : 99;
        x.verdict = share >= 0.5 ? (mean <= 15 ? 'perfect' : 'good') : 'miss';
        if (x.verdict === 'miss') streak = 0; else { streak++; total += x.verdict === 'perfect' ? 100 : 60; }
        score();
      }
    }
    if (round.notes.every((x) => x.verdict)) finishRound();
  }

  // the lane: seven rungs, the line, notes sliding in, your voice
  function draw(now) {
    const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const t = now / 1000, lineX = w * 0.24, speed = (w - lineX) / LEAD;
    const row = h / 7.4, yOf = (pos) => h - row * 0.7 - pos * row;
    NOTES.forEach((n, i) => {
      g.fillStyle = n.color; g.globalAlpha = 0.09; g.fillRect(0, yOf(i) - row / 2, w, row); g.globalAlpha = 1;
      g.fillStyle = n.color; g.font = `${Math.round(row * 0.42)}px "IM Fell English", Georgia, serif`;
      g.textBaseline = 'middle'; g.textAlign = 'left';
      g.strokeStyle = 'rgba(34,27,20,.8)'; g.lineWidth = 2.2; g.lineJoin = 'round';
      g.strokeText(cap(n.name), 6, yOf(i)); g.fillText(cap(n.name), 6, yOf(i));   // the key's colour, edged in ink
    });
    g.strokeStyle = '#9c2a1c'; g.lineWidth = 2; g.beginPath(); g.moveTo(lineX, 0); g.lineTo(lineX, h); g.stroke();
    if (round) {
      for (const x of round.notes) {
        const xa = lineX + (x.t0 - t) * speed, xb = lineX + (x.t1 - t) * speed;
        if (xb < -20 || xa > w + 20) continue;
        const y = yOf(note(x.n).step);
        g.fillStyle = note(x.n).color;
        g.globalAlpha = x.verdict === 'miss' ? 0.25 : 0.9;
        roundRect(g, xa, y - row * 0.34, Math.max(8, xb - xa), row * 0.68, row * 0.3); g.fill();
        g.globalAlpha = 1;
        g.fillStyle = x.n === 'mi' ? '#221b14' : '#fffaf0';
        g.font = `${Math.round(row * 0.36)}px "IM Fell English", Georgia, serif`; g.textAlign = 'left';
        g.fillText(cap(x.n), xa + 8, y);
        if (x.verdict) {
          g.fillStyle = x.verdict === 'miss' ? '#9c2a1c' : '#2f7d63';
          g.font = `italic ${Math.round(row * 0.32)}px "Newsreader", Georgia, serif`;
          g.fillText(x.verdict === 'perfect' ? 'perfect' : x.verdict === 'good' ? 'good' : 'miss', xa + 4, y - row * 0.55);
        }
      }
      if (round.phase === 'listen') {
        g.fillStyle = 'rgba(34,27,20,.55)'; g.font = `italic ${Math.round(row * 0.5)}px "Newsreader", Georgia, serif`;
        g.textAlign = 'center'; g.fillText('listen…', w * 0.62, h * 0.12);
      }
    }
    // your voice, drawn leftward from the line as it happened
    g.lineWidth = 4; g.lineCap = 'round';
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1], b = trail[i];
      if (b.t - a.t > 0.15) continue;
      g.strokeStyle = note(b.note).color;
      g.beginPath(); g.moveTo(lineX - (t - a.t) * speed * 0.5, yOf(a.pos)); g.lineTo(lineX - (t - b.t) * speed * 0.5, yOf(b.pos)); g.stroke();
    }
    const last = trail[trail.length - 1];
    if (last && t - last.t < 0.15) {
      g.fillStyle = '#221b14'; g.beginPath(); g.arc(lineX, yOf(last.pos), 9, 0, Math.PI * 2); g.fill();
      g.fillStyle = note(last.note).color; g.beginPath(); g.arc(lineX, yOf(last.pos), 6, 0, Math.PI * 2); g.fill();
    }
  }

  host.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.level) setLevel(Number(b.dataset.level));
    else if (b.dataset.lane === 'go') startRound();             // word links are opened by the shell
  });
  setLevel(level);
  say.textContent = 'The page sings a word; then its notes slide toward the red line — sing each as it crosses.';
  return { hear, draw, destroy() { host.textContent = ''; } };
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
