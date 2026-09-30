import { NOTES, note, cap } from '../../dictionary/notes.js';
import { meaningOf } from '../../dictionary/dictionary.js';
import { playNote } from '../../voices/index.js';
import { emit } from '../../live/bus.js';
import { HAND_ART } from '../../assets/assets.js';
import { detectPitch, hear, ladderPosition, smoother, lesson, grade } from '../../learn/singing.model.js';
import { esc } from './common.js';

// The singing lesson (#/learn/sing) — a tuner that teaches.
//
// The dial is the Solresol fan: seven coloured wedges, do to si. A needle
// swings across them to the note you are singing, which lights and lifts;
// a fine gauge in the middle shows how many cents flat or sharp; hold it
// in tune and the wedge glows and rings, as a guitar tuner locks on.
//
// Four ways to use it: a free tuner, one note at a time, the scale, and
// whole words — each word sung ends by telling you what you said. It is
// read in your own octave: the first note you sing sets where the
// lesson's reference notes are played.

const STORE = 'solresol:sing';
const BOOKS = [
  { id: 'tuner', numeral: '·',   label: 'Tuner' },
  { id: 'note',  numeral: 'I',   label: 'One note' },
  { id: 'scale', numeral: 'II',  label: 'The scale' },
  { id: 'words', numeral: 'III', label: 'Words' },
];
// Short words worth singing first — each checked against the dictionary on use.
const WORDS = ['simi', 'misol', 'solsi', 'dore', 'domi', 'fala', 'lafa', 'milasi', 'solsire', 'domisol', 'dosido', 'mifala'];
const SCALE = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si', 'la', 'sol', 'fa', 'mi', 're', 'do'];
const IN_TUNE = 10;          // cents: the tuner "locks"
const TAU = Math.PI * 2;
// '#e63946' → 'rgba(230,57,70,a)', so a glow fades to its own colour, not to grey
const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

const loadStats = () => { try { return { sung: 0, words: [], streak: 0, best: 0, ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch { return { sung: 0, words: [], streak: 0, best: 0 }; } };
const saveStats = (s) => { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* private mode */ } };

// A needle with weight: a damped spring toward where it should point.
function spring(k = 90, damp = 14) {
  let x = 0, v = 0;
  return {
    get value() { return x; },
    set(to) { x = to; v = 0; },
    step(to, dt) { v += ((to - x) * k - v * damp) * dt; x += v * dt; return x; },
  };
}

export function mountSing(host, ctx) {
  const stats = loadStats();
  host.innerHTML = `
    <div class="sg-intro">
      <h2 class="section-title">The singing lesson</h2>
      <p class="lede">Solresol was meant to be sung. Sing into the fan: the needle finds your note,
        the gauge shows how true it is, and when you hold it in tune the colour rings.</p>
    </div>

    <div class="plate sg-plate">
      <div class="sg-top">
        <div class="seg sg-books" role="group" aria-label="Lesson">
          ${BOOKS.map((b) => `<button class="seg-btn" data-book="${b.id}"><i>${b.numeral}</i> ${b.label}</button>`).join('')}
        </div>
        <div class="seg sg-range" role="group" aria-label="Your voice">
          <button class="seg-btn" data-range="auto">Any voice</button>
          <button class="seg-btn" data-range="0">High</button>
          <button class="seg-btn" data-range="-1">Low</button>
        </div>
      </div>

      <div class="sg-stage">
        <canvas class="sg-dial" aria-hidden="true"></canvas>

        <div class="sg-card">
          <div class="sg-hand"><img alt=""></div>
          <p class="sg-sing">Sing</p>
          <p class="sg-syllable" aria-live="polite"></p>
          <div class="sg-word" hidden></div>
          <div class="sg-hold" aria-hidden="true"><i></i></div>
          <p class="sg-status" aria-live="polite"></p>
        </div>
      </div>

      <div class="controls sg-controls">
        <button class="btn btn--ink" data-act="listen">🎤 Start singing</button>
        <button class="btn" data-act="hear">▶ Hear it</button>
        <button class="btn btn--ghost" data-act="skip">Skip</button>
      </div>
      <p class="sg-tally"></p>
      <p class="plate-caption">Sing on an open vowel — <i>“soool”</i>. Headphones help the lesson hear only you.</p>
    </div>`;

  const $ = (s) => host.querySelector(s);
  const canvas = $('.sg-dial'), g = canvas.getContext('2d');
  const card = $('.sg-card'), handImg = $('.sg-hand img'), singLbl = $('.sg-sing');
  const syllable = $('.sg-syllable'), wordBox = $('.sg-word'), holdBar = $('.sg-hold i');
  const status = $('.sg-status'), tally = $('.sg-tally'), listenBtn = $('[data-act=listen]');

  let book = 'tuner', rangePref = 'auto', refOctave = 0, octaveKnown = false;
  let current = null;              // { lesson, notes, word? } — null in the free tuner
  let mic = null;                  // { ac, analyser, stream, buf }
  let raf = 0, lastT = 0, lastHear = 0, deafUntil = 0;
  const smooth = smoother(5);

  // what the dial shows, and how it moves
  const needle = spring(70, 13);   // position across the fan (0 = do … 6 = si)
  const fine = spring(110, 16);    // cents, −50…+50
  const glow = spring(40, 12);     // 0…1 how locked-in
  let live = null;                 // { note, cents, pos } the latest confident reading
  let liveAt = 0, presence = 0;    // fades the needle when you stop singing
  let rings = [];                  // in-tune ripples: { born, color }
  let lastRing = 0, bloom = 0;
  const lift = NOTES.map(() => spring(120, 14));

  // ── the lesson in hand ─────────────────────────────────────────────
  function newLesson() {
    if (book === 'tuner') { current = null; drawCard(); return; }
    let notes, word = null;
    if (book === 'note') {
      const prev = current?.notes?.[0];
      const pool = NOTES.map((n) => n.name).filter((n) => n !== prev);
      notes = [pool[Math.floor(Math.random() * pool.length)]];
    } else if (book === 'scale') {
      notes = SCALE.slice();
    } else {
      const pool = WORDS.filter((w) => meaningOf(w));
      const fresh = pool.filter((w) => !stats.words.includes(w));
      const from = fresh.length ? fresh : pool;
      word = from[Math.floor(Math.random() * from.length)];
      notes = word.match(/do|re|mi|fa|sol|la|si/g);
    }
    current = { lesson: lesson(notes, { tolerance: 35, hold: book === 'note' ? 0.8 : 0.55 }), notes, word };
    drawCard();
  }

  // The card: in a lesson, the note to sing; in the tuner, the note you sing.
  function drawCard(heard = null) {
    const n = current ? current.lesson.target : heard;
    singLbl.textContent = current ? 'Sing' : heard ? 'You are singing' : 'Sing any note';
    if (!n) {
      syllable.textContent = current ? '' : '—';
      handImg.removeAttribute('src');
      card.style.setProperty('--c', 'var(--rule)');
      wordBox.hidden = true;
      return;
    }
    if (handImg.dataset.n !== n) { handImg.src = HAND_ART[n]; handImg.dataset.n = n; handImg.alt = `hand sign for ${n}`; }
    syllable.textContent = cap(n);
    card.style.setProperty('--c', note(n).color);
    if (current && (current.word || book === 'scale')) {
      const L = current.lesson;
      wordBox.hidden = false;
      wordBox.innerHTML = current.notes.map((x, i) =>
        `<span class="sg-syl ${i < L.index ? 'is-sung' : i === L.index ? 'is-now' : ''}" style="--c:${note(x).color}">${cap(x)}</span>`).join('')
        + (current.word ? `<span class="sg-gloss">${L.done ? esc(meaningOf(current.word)) : ''}</span>` : '');
    } else {
      wordBox.hidden = true;
    }
  }

  function sayTarget() {
    const n = current?.lesson.target;
    if (!n) return;
    playNote(n, 0, 0.9, { octave: refOctave });
    deafUntil = performance.now() + 1100;          // don't hear the lesson's own voice
  }

  function celebrate() {
    const L = current.lesson;
    stats.sung++; stats.streak++; stats.best = Math.max(stats.best, stats.streak);
    const g2 = grade(L.best), stars = `${'★'.repeat(g2.stars)}${'☆'.repeat(3 - g2.stars)}`;
    if (current.word) {
      if (!stats.words.includes(current.word)) stats.words.push(current.word);
      emit('word:used', { key: current.word, channel: 'sing' });
      current.notes.forEach((n, i) => playNote(n, 0.15 + i * 0.3, 0.45, { octave: refOctave }));
      deafUntil = performance.now() + 700 + current.notes.length * 300;
      status.innerHTML = `${stars} You sang <button class="chip-word" data-open="${current.word}">${cap(current.word)}</button> — <i>${esc(meaningOf(current.word))}</i>. ${g2.word}.`;
    } else if (book === 'scale') {
      status.textContent = `${stars} The whole scale, up and down — ${g2.word}.`;
    } else {
      status.textContent = `${stars} ${cap(current.notes[0])}, ${g2.word}.`;
    }
    saveStats(stats); renderTally(); drawCard();
    bloom = 1;
    setTimeout(() => { if (current?.lesson.done) { newLesson(); if (mic) sayTarget(); } }, current.word ? 3200 : 1400);
  }

  function renderTally() {
    tally.innerHTML = `<b>${stats.sung}</b> sung · <b>${stats.streak}</b> in a row (best ${stats.best}) · <b>${stats.words.length}</b> of ${WORDS.length} words learned by voice`;
  }

  // ── the microphone ─────────────────────────────────────────────────
  async function startMic() {
    if (!navigator.mediaDevices?.getUserMedia) { status.textContent = 'This browser has no microphone.'; return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
      });
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state !== 'running') await ac.resume().catch(() => {});
      const analyser = ac.createAnalyser();
      analyser.fftSize = 2048;
      ac.createMediaStreamSource(stream).connect(analyser);
      mic = { ac, analyser, stream, buf: new Float32Array(2048) };
      listenBtn.textContent = '■ Stop'; listenBtn.setAttribute('aria-pressed', 'true');
      status.textContent = current ? `Listen, then sing ${cap(current.lesson.target)}.` : 'Sing any note — the needle will find it.';
      sayTarget();
    } catch {
      status.textContent = 'The microphone was declined — allow it in the browser to sing.';
    }
  }
  function stopMic() {
    mic?.stream.getTracks().forEach((t) => t.stop());
    mic?.ac.close().catch(() => {});
    mic = null; smooth(null); live = null;
    listenBtn.textContent = '🎤 Start singing'; listenBtn.setAttribute('aria-pressed', 'false');
  }

  // ── each frame: hear (~30 times a second), judge, and animate ─────
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016;
    lastT = now;

    if (now - lastHear >= 32) {
      const hdt = lastHear ? Math.min(0.1, (now - lastHear) / 1000) : 0.03;
      lastHear = now;
      let reading = null;
      if (mic && now > deafUntil) {
        mic.analyser.getFloatTimeDomainData(mic.buf);
        const f = smooth(detectPitch(mic.buf, mic.ac.sampleRate));
        if (f) {
          reading = hear(f);
          if (!octaveKnown && rangePref === 'auto') { refOctave = Math.max(-2, Math.min(1, reading.octave)); octaveKnown = true; }
          const p = ladderPosition(f, refOctave);
          const pos = ((p + 0.5) % 7 + 7) % 7 - 0.5;               // its place in the octave, do … si
          live = { note: reading.note, cents: reading.cents, pos };
          liveAt = now;
        }
      } else if (!mic) smooth(null);
      judge(reading, hdt, now);
    }
    draw(now, dt);
  }

  function judge(reading, dt, now) {
    if (!current) {                                                  // the free tuner
      if (reading) {
        drawCard(reading.note);
        const c = reading.cents, off = Math.abs(c);
        status.textContent = off <= IN_TUNE ? `${cap(reading.note)} — in tune.`
          : `${cap(reading.note)}, ${off} cents ${c < 0 ? 'flat — lift it' : 'sharp — ease down'}.`;
        holdBar.style.width = `${Math.max(0, 100 - off * 2)}%`;
      } else if (mic && now - liveAt > 600) {
        holdBar.style.width = '0%';
      }
      return;
    }
    if (!mic || current.lesson.done || now <= deafUntil) return;
    const verdict = current.lesson.feed(reading, dt);
    holdBar.style.width = `${current.lesson.progress * 100}%`;
    const t = cap(current.lesson.target);
    if (verdict === 'sung') {
      playNote(current.notes[current.lesson.index - 1], 0, 0.3, { octave: refOctave });
      deafUntil = now + 380; drawCard(); bloom = 0.6;
      status.textContent = `Yes — now ${cap(current.lesson.target)}.`;
    } else if (verdict === 'done') celebrate();
    else if (verdict === 'holding') status.textContent = `That's ${t} — hold it…`;
    else if (verdict === 'flat') status.textContent = `${t}, a little low — lift it.`;
    else if (verdict === 'sharp') status.textContent = `${t}, a little high — ease down.`;
    else if (verdict === 'wrong') status.textContent = `That was ${cap(reading.note)}. ${note(reading.note).step < note(current.lesson.target).step ? 'Go up' : 'Go down'} to ${t}.`;
  }

  // ── the dial: the fan, a needle, a fine gauge ──────────────────────
  function draw(now, dt) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    const fresh = live && now - liveAt < 220;
    presence += ((fresh ? 1 : 0) - presence) * Math.min(1, dt * (fresh ? 14 : 3));
    const pos = needle.step(fresh ? live.pos : live ? live.pos : 3, dt);
    const cents = fine.step(fresh ? live.cents : 0, dt);
    const locked = fresh && Math.abs(live.cents) <= IN_TUNE;
    const gl = glow.step(locked ? 1 : 0, dt);
    const heardIdx = live ? Math.max(0, Math.min(6, Math.round(live.pos))) : -1;
    const tgt = current && !current.lesson.done ? note(current.lesson.target).step : -1;

    const R = Math.min(w / 2 - 34, h - 44), cx = w / 2, cy = h - 14;   // room for the lift, rings and glow
    const r0 = R * 0.6, span = Math.PI / 7;
    const angleOf = (p) => Math.PI + ((p + 0.5) / 7) * Math.PI;

    // the seven wedges
    NOTES.forEach((n, i) => {
      const on = fresh && i === heardIdx;
      const up = lift[i].step(on ? 1 : 0, dt);
      const a0 = Math.PI + i * span + 0.012, a1 = a0 + span - 0.024;
      const ro = R + up * 10, ri = r0 - up * 4;
      g.beginPath(); g.arc(cx, cy, ro, a0, a1); g.arc(cx, cy, ri, a1, a0, true); g.closePath();
      g.fillStyle = n.color;
      g.globalAlpha = 0.28 + up * 0.72 * Math.max(0.5, presence);
      g.fill();
      g.globalAlpha = 1;
      if (i === tgt) {                                                // the note to sing
        g.save(); g.setLineDash([5, 4]); g.lineWidth = 2; g.strokeStyle = '#9c2a1c';
        g.beginPath(); g.arc(cx, cy, R + 16, a0, a1); g.stroke(); g.restore();
      }
      // its name
      const am = (a0 + a1) / 2, rl = (ro + ri) / 2;
      g.fillStyle = up > 0.5 || n.name === 'mi' ? (n.name === 'mi' ? '#221b14' : '#fffaf0') : '#221b14';
      g.globalAlpha = up > 0.5 ? 1 : 0.75;
      g.font = `${Math.round(R * 0.085 + up * 4)}px "IM Fell English SC", Georgia, serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(n.name.toUpperCase(), cx + Math.cos(am) * rl, cy + Math.sin(am) * rl);
      g.globalAlpha = 1;
    });

    // in tune: the wedge glows and rings go out from it
    if (gl > 0.02 && heardIdx >= 0) {
      const col = NOTES[heardIdx].color;
      const am = angleOf(heardIdx);
      const gx = cx + Math.cos(am) * (R * 0.8), gy = cy + Math.sin(am) * (R * 0.8);
      const grd = g.createRadialGradient(gx, gy, 0, gx, gy, R * 0.5);
      grd.addColorStop(0, rgba(col, 0.4 * gl)); grd.addColorStop(1, rgba(col, 0));
      // keep the glow inside the fan's own outline, so no edge of the canvas shows
      g.save(); g.beginPath(); g.arc(cx, cy, R + 30, Math.PI, TAU); g.closePath(); g.clip();
      g.fillStyle = grd; g.fillRect(0, 0, w, h); g.restore();
      if (locked && now - lastRing > 520) { rings.push({ born: now, color: col, idx: heardIdx }); lastRing = now; }
    }
    rings = rings.filter((rg) => now - rg.born < 1400);
    for (const rg of rings) {
      const k = (now - rg.born) / 1400;
      const a0 = Math.PI + rg.idx * span, a1 = a0 + span;
      g.strokeStyle = rg.color; g.lineWidth = 3 * (1 - k); g.globalAlpha = 0.7 * (1 - k);
      g.beginPath(); g.arc(cx, cy, R + 8 + k * 40, a0 - k * 0.15, a1 + k * 0.15); g.stroke();
    }
    g.globalAlpha = 1;

    // the fine gauge: ±50 cents across the top of the hub
    const rg = r0 * 0.8, sweep = 1.0;
    const cAng = (c) => -Math.PI / 2 + (Math.max(-50, Math.min(50, c)) / 50) * sweep;
    g.lineWidth = 10; g.lineCap = 'butt';
    g.strokeStyle = 'rgba(34,27,20,.08)';
    g.beginPath(); g.arc(cx, cy, rg, cAng(-50), cAng(50)); g.stroke();
    g.strokeStyle = `rgba(67,170,139,${0.35 + 0.5 * gl})`;                // the in-tune zone
    g.beginPath(); g.arc(cx, cy, rg, cAng(-IN_TUNE), cAng(IN_TUNE)); g.stroke();
    g.lineWidth = 1; g.strokeStyle = 'rgba(34,27,20,.45)';
    for (let c = -50; c <= 50; c += 10) {
      const a = cAng(c), l = c === 0 ? 12 : c % 50 === 0 ? 9 : 5;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * (rg + 7), cy + Math.sin(a) * (rg + 7));
      g.lineTo(cx + Math.cos(a) * (rg + 7 + l), cy + Math.sin(a) * (rg + 7 + l)); g.stroke();
    }
    g.fillStyle = '#76685a'; g.font = `${Math.max(11, Math.round(R * 0.05))}px "IM Fell English SC", Georgia, serif`;
    g.textAlign = 'center';
    g.fillText('♭', cx + Math.cos(cAng(-50)) * (rg + 26), cy + Math.sin(cAng(-50)) * (rg + 26));
    g.fillText('♯', cx + Math.cos(cAng(50)) * (rg + 26), cy + Math.sin(cAng(50)) * (rg + 26));
    if (presence > 0.02) {                                             // the fine needle
      const a = cAng(cents);
      g.globalAlpha = presence;
      g.strokeStyle = locked ? '#221b14' : '#9c2a1c'; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx + Math.cos(a) * (rg - 12), cy + Math.sin(a) * (rg - 12));
      g.lineTo(cx + Math.cos(a) * (rg + 12), cy + Math.sin(a) * (rg + 12)); g.stroke();
      g.globalAlpha = 1;
    }

    // the great needle, from the hub out across the fan
    const na = angleOf(Math.max(-0.5, Math.min(6.5, pos)));
    g.globalAlpha = 0.25 + 0.75 * presence;
    g.strokeStyle = '#221b14'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx + Math.cos(na) * r0 * 0.25, cy + Math.sin(na) * r0 * 0.25);
    g.lineTo(cx + Math.cos(na) * (R + 4), cy + Math.sin(na) * (R + 4)); g.stroke();
    g.globalAlpha = 1;

    // the hub, and the note in it
    const hubC = fresh ? NOTES[heardIdx].color : '#cbbb98';
    const hub = r0 * 0.56;
    g.fillStyle = '#faf5e6'; g.beginPath(); g.arc(cx, cy, hub, Math.PI, TAU); g.fill();
    g.strokeStyle = '#221b14'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, hub, Math.PI, TAU); g.stroke();
    g.fillStyle = hubC; g.beginPath(); g.arc(cx, cy, 5 + gl * 2, Math.PI, TAU); g.fill();
    g.fillStyle = '#221b14';
    g.font = `${Math.round(hub * 0.56)}px "IM Fell English", Georgia, serif`;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.globalAlpha = 0.3 + 0.7 * presence;
    g.fillText(live ? cap(live.note) : '—', cx, cy - hub * 0.42);
    g.globalAlpha = 1;
    g.fillStyle = locked ? '#2f7d63' : '#76685a';
    g.font = `italic ${Math.max(11, Math.round(hub * 0.17))}px "Newsreader", Georgia, serif`;
    g.fillText(!fresh ? (mic ? 'listening…' : 'sing to begin') : locked ? 'in tune' :
      `${Math.abs(live.cents)} cents ${live.cents < 0 ? 'flat' : 'sharp'}`, cx, cy - hub * 0.12 - 4);

    // a bloom of light when a note is sung
    if (bloom > 0) {
      g.globalAlpha = bloom * 0.45; g.fillStyle = '#fff8e6'; g.fillRect(0, 0, w, h); g.globalAlpha = 1;
      bloom = Math.max(0, bloom - dt * 1.6);
    }
  }

  // ── controls ───────────────────────────────────────────────────────
  function setBook(id) {
    book = id;
    host.querySelectorAll('[data-book]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.book === id)));
    host.querySelector('[data-act=hear]').hidden = id === 'tuner';
    host.querySelector('[data-act=skip]').hidden = id === 'tuner';
    newLesson();
    holdBar.style.width = '0%';
    status.textContent = current
      ? (mic ? `Sing ${cap(current.lesson.target)}.` : 'Start singing when you are ready.')
      : (mic ? 'Sing any note — the needle will find it.' : 'Start singing, and the needle will find your note.');
    if (mic) sayTarget();
  }
  function setRange(v) {
    rangePref = v;
    octaveKnown = v !== 'auto';
    if (v !== 'auto') refOctave = Number(v);
    host.querySelectorAll('[data-range]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.range === v)));
  }

  host.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.book) return setBook(b.dataset.book);
    if (b.dataset.range) return setRange(b.dataset.range);
    if (b.dataset.open) return ctx.openWord(b.dataset.open);
    if (b.dataset.act === 'listen') return mic ? stopMic() : startMic();
    if (b.dataset.act === 'hear') return sayTarget();
    if (b.dataset.act === 'skip') { stats.streak = 0; saveStats(stats); renderTally(); newLesson(); if (mic) sayTarget(); }
  });

  needle.set(3);
  setRange('auto');
  setBook('tuner');
  renderTally();
  raf = requestAnimationFrame(frame);

  return {
    destroy() { cancelAnimationFrame(raf); stopMic(); host.textContent = ''; },
  };
}
