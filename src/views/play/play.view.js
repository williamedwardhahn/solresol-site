import { cap } from '../../dictionary/notes.js';
import { meaningOf, wordCount } from '../../dictionary/dictionary.js';
import { playWord, VOICES } from '../../voices/index.js';
import { mountChoir } from '../../ui/choir.js';
import { mountKeyboard } from '../../ui/keyboard.js';
import { mountPredictor } from '../../map/map.js';
import { mountSentence } from '../../compose/compose.js';
import { mountColorIn, mountNumberIn, mountToneIn, mountMidiIn } from '../../sense/inputs.js';
import { mountSequencer } from '../../sequencer/sequencer.js';
import { mountOnboarding } from '../../onboarding/onboarding.js';
import { emit } from '../../live/bus.js';

// Chapter I — Play: the instrument, and its companions.
//
//   the hero       what Solresol is, in three sentences, with the keys right under it
//   the instrument the readout, the seven keys, what each next key leads to, every voice,
//                  and the stops (which voices show, which timbre sounds)
//   § 1 sentence   what you have said: chips, roles, melody, colour, staff, kept sentences
//   § 2 listening  the language coming in: paint, count, sing, a MIDI keyboard
//   § 3 sequencer  words in time: record, loop, tempo, export a .mid
//
// mountPlayView(host, ctx, route) → { update(route), destroy() }.

const TIMBRES = [
  { id: 'bell', label: 'Celesta' },
  { id: 'sine', label: 'Flute' },
  { id: 'triangle', label: 'Reed' },
  { id: 'sawtooth', label: 'Bowed' },
  { id: 'square', label: 'Organ' },
];

export function mountPlayView(host, ctx, route) {
  const { word, state } = ctx;
  host.classList.add('play');
  host.innerHTML = `
    <section class="play-hero">
      <p class="play-lede"><span class="play-initial" aria-hidden="true">I</span><span class="sr-only">I</span>n 1827 <em>Jean-François Sudre</em>
        made a language out of the seven notes of the scale. Every word is a little tune — and since each note is
        also a colour, a number, a hand sign and a stroke of the pen, a word can be sung, painted, counted, signed
        or written, and it is still the same word.</p>
      <p class="play-cue"><span>Seven notes</span><span class="play-cue-dot">·</span><span><b data-count>${wordCount().toLocaleString()}</b> words</span><span class="play-cue-dot">·</span><span>whatever you play is one of them</span></p>
    </section>

    <figure class="plate instrument" data-instrument>
      <div class="intro" data-intro hidden></div>

      <div class="readout" aria-live="polite">
        <p class="readout-family" data-family></p>
        <h2 class="readout-word" data-word></h2>
        <p class="readout-meaning" data-meaning></p>
        <p class="readout-more" data-more></p>
        <div class="readout-actions">
          <button class="btn btn--small" data-act="hear">▶ Hear</button>
          <button class="btn btn--small btn--ink" data-act="say" title="Space, ; or Enter">Say it <kbd>␣</kbd></button>
          <button class="btn btn--small btn--rubric" data-act="open">Open this word →</button>
          <button class="btn btn--small btn--ghost" data-act="clear" title="Escape">Clear</button>
        </div>
      </div>

      <div class="manual">
        <div data-keyboard></div>
        <div data-predictor></div>
      </div>

      <div class="instrument-choir" data-choir-wrap><div data-choir></div></div>

      <div class="stops">
        <div class="stops-group">
          <span class="stops-label">Voices</span>
          <div class="stops-row" data-voices>
            ${VOICES.map((v) => `<button class="stop" data-voice="${v.name}" aria-pressed="false">${v.label}</button>`).join('')}
          </div>
        </div>
        <div class="stops-group">
          <span class="stops-label">Timbre</span>
          <div class="seg" data-timbres role="group" aria-label="Timbre">
            ${TIMBRES.map((t) => `<button class="seg-btn" data-timbre="${t.id}" aria-pressed="false" title="${t.label}">${t.label}</button>`).join('')}
          </div>
        </div>
      </div>
      <figcaption class="plate-caption">Plate I · The seven keys — <span class="keys-legend"><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd> <kbd>J</kbd><kbd>K</kbd><kbd>L</kbd> or <kbd>1</kbd>–<kbd>7</kbd> play · <kbd>Space</kbd> says the word · <kbd>⌫</kbd> takes a note back · <kbd>Esc</kbd> clears</span></figcaption>
    </figure>
    <p class="play-replay"><button class="linkish" data-replay>Replay the introduction</button></p>

    <article class="companion" id="sentence">
      <header class="companion-margin">
        <span class="companion-mark">§ 1</span>
        <h2 class="section-title">The Sentence</h2>
        <p class="companion-note">Each word you say joins it. A sentence is a melody too.</p>
      </header>
      <div class="companion-body" data-sentence></div>
    </article>

    <article class="companion" id="listen">
      <header class="companion-margin">
        <span class="companion-mark">§ 2</span>
        <h2 class="section-title">Listening</h2>
        <p class="companion-note">The language comes in by any sense. Each of these plays the same living word.</p>
      </header>
      <div class="companion-body">
        <div class="echo" data-echo aria-live="polite"></div>
        <div class="ledger">
          <div class="ledger-row"><div class="ledger-head"><b>Paint</b><span>tap the colours</span></div><div data-in-color></div></div>
          <div class="ledger-row"><div class="ledger-head"><b>Count</b><span>type the numbers</span></div><div data-in-number></div></div>
          <div class="ledger-row"><div class="ledger-head"><b>Sing</b><span>hum each note</span></div><div class="ledger-inline" data-in-tone></div></div>
          <div class="ledger-row"><div class="ledger-head"><b>Play</b><span>a MIDI keyboard</span></div><div class="ledger-inline" data-in-midi></div></div>
        </div>
        <p class="hint">Singing and MIDI say the word by themselves after a second of silence; painting and counting wait for <kbd>Space</kbd>, <kbd>Enter</kbd> or <b>Say it</b>.</p>
      </div>
    </article>

    <article class="companion" id="sequencer">
      <header class="companion-margin">
        <span class="companion-mark">§ 3</span>
        <h2 class="section-title">The Sequencer</h2>
        <p class="companion-note">Words laid out in time: record, loop, change the tempo, and take it away as a MIDI file.</p>
      </header>
      <div class="companion-body" data-sequencer></div>
    </article>`;

  const q = (s) => host.querySelector(s);
  const plate = q('[data-instrument]');
  const commit = () => ctx.commit();

  const kids = [
    mountKeyboard(q('[data-keyboard]'), word, { onCommit: commit }),
    mountPredictor(q('[data-predictor]'), word, { openWord: ctx.openWord, meanings: state.meanings }),
    mountChoir(q('[data-choir]'), word, { prefs: state.prefs }),
    mountSentence(q('[data-sentence]'), ctx),
    mountColorIn(q('[data-in-color]'), word),
    mountNumberIn(q('[data-in-number]'), word, { onCommit: commit }),
    mountToneIn(q('[data-in-tone]'), word, { onCommit: commit }),
    mountMidiIn(q('[data-in-midi]'), word, { onCommit: commit }),
    mountSequencer(q('[data-sequencer]'), ctx),
  ];

  // ── the readout ──
  const els = { family: q('[data-family]'), word: q('[data-word]'), meaning: q('[data-meaning]'), more: q('[data-more]') };
  const echo = q('[data-echo]');
  const ownMeaning = (key) => state.meanings.get()[key] || null;

  function readout() {
    const notes = word.notes, key = word.key;
    const own = ownMeaning(key), m = own || meaningOf(key);
    const parts = m ? String(m).split(/\s*[,;]\s*/) : [];
    plate.classList.toggle('is-empty', !notes.length);
    if (!notes.length) {
      els.family.textContent = 'the instrument';
      els.word.innerHTML = '<span class="readout-ghost">Play a note</span>';
      els.meaning.innerHTML = 'Strike the keys, and a word appears here.';
      els.more.textContent = '';
    } else {
      els.family.textContent = notes.length === 1 ? 'a particle' : (word.family || '');
      els.word.textContent = word.text;
      els.meaning.innerHTML = m
        ? `“${esc(parts[0])}”${own ? ' <span class="tag">your meaning</span>' : ''}`
        : '<span class="readout-none">not in the dictionary — yet</span>';
      els.more.textContent = parts.length > 1 ? parts.slice(1).join(', ') : '';
    }
    host.querySelectorAll('.readout-actions [data-act]').forEach((b) => { b.disabled = !notes.length; });
    echo.innerHTML = notes.length
      ? `<span class="echo-label">the living word</span><b>${word.text}</b><em>${m ? esc(parts[0]) : '…'}</em><button class="btn btn--small btn--ink" data-act="say">Say it</button>`
      : `<span class="echo-label">the living word</span><em>— nothing yet —</em>`;
  }
  const unword = word.watch(readout);
  const unmeanings = state.meanings.watch(readout);

  host.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    switch (b.dataset.act) {
      case 'hear': if (word.length) { playWord(word); emit('word:used', { key: word.key, channel: 'instrument' }); } break;
      case 'say': commit(); break;
      case 'open': if (word.length) ctx.openWord(word.notes); break;
      case 'clear': word.clear(); break;
    }
    if (b.dataset.voice) {
      const on = new Set(state.prefs.get().voices || []);
      if (on.has(b.dataset.voice)) on.delete(b.dataset.voice); else on.add(b.dataset.voice);
      state.setPref('voices', VOICES.map((v) => v.name).filter((n) => on.has(n)));
    }
    if (b.dataset.timbre) {
      state.setPref('timbre', b.dataset.timbre); state.setPref('timbreChosen', true);
      playWord({ notes: ['do', 'mi', 'sol'] });
    }
    if (b.dataset.replay !== undefined) startIntro(true);
  });

  // ── the stops reflect the prefs ──
  const unprefs = state.prefs.watch((p) => {
    const on = new Set(p.voices || []);
    host.querySelectorAll('[data-voice]').forEach((b) => b.setAttribute('aria-pressed', String(on.has(b.dataset.voice))));
    host.querySelectorAll('[data-timbre]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.timbre === p.timbre)));
  });

  // ── the introduction, first visit only ──
  let intro = null;
  const introHost = q('[data-intro]');
  function startIntro(scroll = false) {
    intro?.destroy();
    introHost.hidden = false;
    intro = mountOnboarding(introHost, ctx, {
      onStep: (i) => { plate.dataset.introStep = String(i); },
      onDone: () => { introHost.hidden = true; intro = null; delete plate.dataset.introStep; },
    });
    if (scroll) plate.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (!state.prefs.get().onboarded) startIntro();

  // ── sub-routes scroll to a companion: #/play/sentence, /listen, /sequencer ──
  function update(r) {
    const target = r?.sub && host.querySelector(`#${CSS.escape(r.sub)}`);
    if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  update(route);

  return {
    update,
    destroy() {
      intro?.destroy();
      unword(); unmeanings(); unprefs();
      for (const k of kids) k?.destroy?.();
      host.textContent = '';
      host.classList.remove('play');
    },
  };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
