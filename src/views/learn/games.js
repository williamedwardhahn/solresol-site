import { NOTES, parse, cap } from '../../dictionary/notes.js';
import { wordCount } from '../../dictionary/dictionary.js';
import { Word } from '../../lang/word.js';
import { playNote, playWord } from '../../voices/index.js';
import { mountMirror, mountDiscovery, mountFading } from '../../learn/learn.js';
import { mountGame } from '../../outputs/outputs.js';
import { mountConstellation } from '../../map/map.js';

// Games — the learning cards, each on its own plate, and the sky as a
// map of everything you have met.

const MIRROR_EXAMPLES = ['Fala', 'Misol', 'Solla', 'Domisol', 'Solsire', 'Milasi'];

export function mountGames(host, ctx) {
  host.innerHTML = `
    <p class="lede ln-games-lede">Five small games. None of them keeps score against you: they are here to be played until the notes are yours.</p>
    <div class="ln-games">
      <figure class="plate ln-game">
        <h3 class="rubric">Hear the colour <span class="rubric-note">the ear learns the rainbow</span></h3>
        <div data-game></div>
      </figure>
      <figure class="plate ln-game">
        <h3 class="rubric">The mirror <span class="rubric-note">play a word, see its opposite</span></h3>
        <div class="ln-mini-keys" role="group" aria-label="Play a word">
          ${NOTES.map((n) => `<button type="button" class="ln-mini-key" data-k="${n.name}" style="--c:${n.color}">${cap(n.name)}</button>`).join('')}
          <button type="button" class="ln-mini-key ln-mini-key--clear" data-clear aria-label="Clear">⌫</button>
        </div>
        <div data-mirror></div>
        <div class="chip-row ln-mirror-ex">${MIRROR_EXAMPLES.map((w) => `<button type="button" class="chip-word" data-mex="${w}">${w}</button>`).join('')}</div>
      </figure>
      <figure class="plate ln-game">
        <h3 class="rubric">Discover <span class="rubric-note">meet the examples, find the rule</span></h3>
        <div data-discovery></div>
      </figure>
      <figure class="plate ln-game">
        <h3 class="rubric">Fading <span class="rubric-note">sing them back before they go</span></h3>
        <div data-fading></div>
      </figure>
      <figure class="plate ln-game ln-game--sky">
        <h3 class="rubric">The sky <span class="rubric-note">every word a star — the ones you know shine</span></h3>
        <div class="ln-sky" data-sky></div>
        <figcaption class="plate-caption" data-skycap></figcaption>
      </figure>
    </div>`;
  const $ = (s) => host.querySelector(s);

  // the mirror plays on its own little word, not the instrument's
  const mirrorWord = Word(parse('Fala'));
  const fadingWord = Word();
  const skyWord = Word();

  const kids = [
    mountGame($('[data-game]'), ctx.memory),
    mountMirror($('[data-mirror]'), mirrorWord),
    mountDiscovery($('[data-discovery]')),
    mountFading($('[data-fading]'), fadingWord, ctx.memory),
    mountConstellation($('[data-sky]'), skyWord, ctx.memory),
  ];

  // a star touched in the sky opens that word
  let first = true;
  const unsky = skyWord.watch((notes) => {
    if (first) { first = false; return; }
    if (notes.length) { playWord({ notes }); ctx.openWord(notes); }
  });

  const cap$ = $('[data-skycap]');
  const unmem = ctx.memory.watch(() => {
    const n = ctx.memory.known().filter((k) => parse(k).length > 1).length;
    cap$.textContent = n
      ? `You have met ${n.toLocaleString()} of ${wordCount().toLocaleString()} words · touch a star to open it`
      : `${wordCount().toLocaleString()} words, coloured by their first note · the words you use will brighten`;
  });

  const onClick = (e) => {
    const t = e.target.closest('button'); if (!t || !host.contains(t)) return;
    if (t.dataset.k) {
      if (mirrorWord.length >= 6) mirrorWord.clear();
      mirrorWord.add(t.dataset.k); playNote(t.dataset.k, 0, 0.4);
    } else if (t.dataset.clear !== undefined) mirrorWord.removeLast();
    else if (t.dataset.mex) { mirrorWord.set(parse(t.dataset.mex)); playWord(mirrorWord); }
  };
  host.addEventListener('click', onClick);

  return {
    destroy() {
      host.removeEventListener('click', onClick);
      unsky(); unmem();
      for (const k of kids) k?.destroy?.();
      host.textContent = '';
    },
  };
}
