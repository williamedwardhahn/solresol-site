import { note, cap } from '../dictionary/notes.js';
import { meaningOf } from '../dictionary/dictionary.js';
import { on } from '../live/bus.js';
import { playNote } from '../voices/index.js';
import { staffSVG } from '../graphics/graphics.js';
import { persisted } from '../site/state.js';
import { timeline, midiFile } from './midi.model.js';

// The Sequencer — words laid out in time.
//
// Record the words you say (every committed word while ● is on), or take
// the whole sentence at once; play it at any tempo, once or looping, with
// a cursor travelling the staff; and export it as a standard .mid file.
// The sequence is kept on this device between visits.

// Where staffSVG puts each note head (its layout, mirrored): the first at
// x = 18, then 22 apart, with 18 more between words.
const X0 = 18, STEP = 22, WORD_GAP = 18;

export function mountSequencer(host, ctx) {
  const seq = persisted('solresol:sequence', { words: [], tempo: 2.5, loop: false });
  let recording = false, playing = null;   // playing: { start, next, raf, timer, tl, keys }

  host.classList.add('sequencer');
  host.innerHTML = `
    <div class="seq-bar">
      <button class="btn btn--small seq-rec" data-act="rec" aria-pressed="false"><span class="seq-dot" aria-hidden="true"></span> Record</button>
      <button class="btn btn--small btn--ink" data-act="play">▶ Play</button>
      <button class="btn btn--small" data-act="loop" aria-pressed="false">↻ Loop</button>
      <label class="seq-tempo"><span>Tempo</span>
        <input type="range" min="0.8" max="6" step="0.1" data-tempo aria-label="Tempo, notes per second">
        <output data-tempo-out></output></label>
    </div>
    <div class="seq-roll" data-roll>
      <div class="seq-score" data-score></div>
    </div>
    <div class="seq-words" data-words></div>
    <div class="seq-bar seq-bar--foot">
      <button class="btn btn--small btn--ghost" data-act="take">Take the sentence</button>
      <button class="btn btn--small btn--ghost" data-act="clear">Clear</button>
      <button class="btn btn--small" data-act="export">Export .mid</button>
      <span class="seq-info" data-info></span>
    </div>`;
  const q = (s) => host.querySelector(s);
  const roll = q('[data-roll]'), score = q('[data-score]'), wordsEl = q('[data-words]'), info = q('[data-info]');
  const tempoIn = q('[data-tempo]'), tempoOut = q('[data-tempo-out]');
  const btn = (a) => q(`[data-act="${a}"]`);

  const get = () => seq.get();
  const set = (patch) => seq.set({ ...get(), ...patch });

  // x of every note head on the staff, and the staff's full width
  function layout(words) {
    const xs = []; let x = X0;
    words.forEach((ns, wi) => { if (wi) x += WORD_GAP; for (let i = 0; i < ns.length; i++) { xs.push(x); x += STEP; } });
    return { xs, width: Math.max(x + 4, 60) };
  }

  function renderControls() {
    const { words, tempo, loop } = get();
    if (document.activeElement !== tempoIn) tempoIn.value = tempo;
    tempoOut.textContent = `${tempo.toFixed(1)} notes/s`;
    btn('loop').setAttribute('aria-pressed', String(!!loop));
    ['play', 'clear', 'export'].forEach((a) => { btn(a).disabled = !words.length; });
    btn('take').disabled = !ctx.sentence.length;
    const tl = timeline(words, { tempo, wordGap: 0.5 }), n = tl.events.length;
    info.textContent = words.length
      ? `${words.length} word${words.length === 1 ? '' : 's'} · ${n} note${n === 1 ? '' : 's'} · ${tl.total.toFixed(1)} s`
      : '';
  }

  function render() {
    renderControls();
    const { words } = get();
    const has = words.length > 0;

    if (!has) {
      score.innerHTML = `<p class="seq-empty">An empty stave. Press <b>Record</b> and every word you say is written here — or take the sentence you have.</p>`;
      wordsEl.innerHTML = '';
      return;
    }
    const { width } = layout(words);
    score.innerHTML = `<div class="seq-stave" style="--w:${width};width:${Math.round(width * 116 / 84)}px">${staffSVG(words)}<i class="seq-cursor" data-cursor hidden></i></div>`;
    wordsEl.innerHTML = words.map((ns, i) => {
      const k = ns.join(''), m = meaningOf(k);
      return `<span class="seq-word" data-w="${i}">
        <span class="seq-word-colors">${ns.map((n) => `<i style="background:${note(n).color}"></i>`).join('')}</span>
        <b>${cap(k)}</b>${m ? `<em>${esc(String(m).split(/[,;]/)[0])}</em>` : ''}
        <button class="seq-x" data-del="${i}" aria-label="Remove ${cap(k)}">×</button></span>`;
    }).join('');
  }

  // ── playback: a small look-ahead scheduler, so Stop really stops ──
  function play() {
    stop();
    const { words, tempo } = get();
    if (!words.length) return;
    const tl = timeline(words, { tempo, wordGap: 0.5 });
    const { xs } = layout(words);
    playing = { start: performance.now(), next: 0, tl, xs, timer: 0, raf: 0 };
    btn('play').textContent = '■ Stop';
    const cursor = q('[data-cursor]');
    if (cursor) cursor.hidden = false;
    playing.timer = setInterval(pump, 25);
    pump();
    playing.raf = requestAnimationFrame(frame);
  }

  function pump() {
    if (!playing) return;
    const t = (performance.now() - playing.start) / 1000;
    const { events, total } = playing.tl;
    while (playing.next < events.length && events[playing.next].start < t + 0.12) {
      const e = events[playing.next++];
      playNote(e.note, Math.max(0, e.start - t), Math.min(0.5, e.dur * 1.3));
    }
    if (t > total + 0.25) {
      if (get().loop) { playing.start = performance.now(); playing.next = 0; }
      else stop();
    }
  }

  function frame() {
    if (!playing) return;
    const t = (performance.now() - playing.start) / 1000;
    const { events } = playing.tl, xs = playing.xs;
    // the cursor glides from note to note; the sounding word is lit
    let i = events.length - 1;
    while (i > 0 && events[i].start > t) i--;
    const e = events[i], nextStart = events[i + 1] ? events[i + 1].start : e.start + (e.dur / 0.9);
    const nextX = events[i + 1] ? xs[i + 1] : xs[i] + STEP;
    const f = Math.min(1, Math.max(0, (t - e.start) / (nextStart - e.start || 1)));
    const x = xs[i] - 8 + (nextX - xs[i]) * f;
    const cursor = q('[data-cursor]'), stave = q('.seq-stave');
    if (cursor && stave) {
      cursor.style.left = `${(x / Number(stave.style.getPropertyValue('--w'))) * 100}%`;
      // keep the cursor in view on a long sequence
      const px = cursor.offsetLeft;
      if (px < roll.scrollLeft + 20 || px > roll.scrollLeft + roll.clientWidth - 40) roll.scrollLeft = px - roll.clientWidth / 3;
    }
    wordsEl.querySelectorAll('.seq-word').forEach((el) => el.classList.toggle('is-now', Number(el.dataset.w) === e.word && t < playing.tl.total + 0.1));
    playing.raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!playing) return;
    clearInterval(playing.timer);
    cancelAnimationFrame(playing.raf);
    playing = null;
    btn('play').textContent = '▶ Play';
    const cursor = q('[data-cursor]');
    if (cursor) cursor.hidden = true;
    wordsEl.querySelectorAll('.is-now').forEach((el) => el.classList.remove('is-now'));
  }

  function exportMidi() {
    const { words, tempo } = get();
    if (!words.length) return;
    const bytes = midiFile(words, { tempo, wordGap: 0.5, title: words.map((w) => cap(w.join(''))).join(' ') });
    const blob = new Blob([bytes], { type: 'audio/midi' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `solresol-${words.map((w) => w.join('')).join('-').slice(0, 60)}.mid`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  host.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.del !== undefined) {
      stop();
      const words = get().words.slice(); words.splice(Number(b.dataset.del), 1); set({ words });
      return;
    }
    switch (b.dataset.act) {
      case 'rec':
        recording = !recording;
        b.setAttribute('aria-pressed', String(recording));
        host.classList.toggle('is-recording', recording);
        break;
      case 'play': if (playing) stop(); else play(); break;
      case 'loop': set({ loop: !get().loop }); break;
      case 'take': stop(); set({ words: [...get().words, ...ctx.sentence.words.map((w) => w.notes)] }); break;
      case 'clear': stop(); set({ words: [] }); break;
      case 'export': exportMidi(); break;
    }
  });
  tempoIn.addEventListener('input', () => {
    const wasPlaying = !!playing;
    set({ tempo: Number(tempoIn.value) });
    if (wasPlaying) play();
  });

  // Recording listens for committed words; it never adds to the sentence.
  const offCommit = on('word:commit', (notes) => {
    if (recording && notes?.length) { set({ words: [...get().words, notes.slice()] }); }
  });
  let drawn = null;
  const unseq = seq.watch((v) => {
    const key = JSON.stringify(v.words);
    if (key === drawn) { renderControls(); return; }
    drawn = key; stop(); render();
  });
  const unsent = ctx.sentence.watch(() => { btn('take').disabled = !ctx.sentence.length; });

  return {
    destroy() { stop(); offCommit(); unseq(); unsent(); host.textContent = ''; },
  };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
