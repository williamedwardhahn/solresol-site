import { loadDictionary, wordCount } from './dictionary/dictionary.js';
import { Word } from './lang/word.js';
import { Phrase } from './lang/phrase.js';
import { createMemory } from './memory/memory.js';
import { emit, on } from './live/bus.js';
import { setTimbre } from './voices/index.js';
import { createState } from './site/state.js';
import { createRouter } from './site/router.js';
import { renderSite } from './site/site.js';

// Load the one book of truth, build the shared kernel, bind the book.
await loadDictionary();

const word = Word();               // the one live building-word (the instrument)
const sentence = Phrase();         // the sentence being said, shared by every chapter
const memory = createMemory();     // listens on the bus for word:used
const state = createState();       // prefs, stars, recent, saved sentences, own meanings
const { route, go } = createRouter();

// Commit the building word into the sentence, then clear it.
function commit() {
  if (!word.length) return;
  emit('word:commit', word.notes.slice());
  word.clear();
}

// Words reach the sentence from anywhere: the instrument, a panel, a phrase.
const addToSentence = (notes) => {
  if (!notes || !notes.length) return;
  sentence.add(Word(notes));
  emit('word:used', { key: notes.join(''), channel: 'sentence' });
};
on('word:commit', addToSentence);
on('sentence:add', addToSentence);

state.prefs.watch((p) => setTimbre(p.timbre));

// ctx is the shared kernel every chapter connects through:
//   word      the live building-word          sentence  the live Phrase being said
//   memory    strength and decay per word     state     prefs · stars · recent · saved · meanings
//   route     where we are (live)             go(path)  move there ('dictionary/families')
//   commit()  building-word → sentence        openWord(text | notes)  show a word's own page
const ctx = { word, sentence, memory, state, route, go, commit, openWord: () => {} };

const standalone = !!window.__SOLRESOL_STANDALONE;
const site = renderSite(document.getElementById('site'), ctx, { standalone });
window.__solresol = { ctx, site };   // handle for debugging and the QC harness

site.colophon.querySelector('[data-count]').textContent = wordCount().toLocaleString();
