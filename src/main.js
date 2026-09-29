import { loadDictionary, wordCount } from './dictionary/dictionary.js';
import { Word } from './lang/word.js';
import { createMemory } from './memory/memory.js';
import { emit } from './live/bus.js';
import { renderSite } from './site/site.js';

// Load the one book of truth, build the shared kernel, render the cards.
await loadDictionary();

const word = Word();               // the one live building-word
const memory = createMemory();     // listens on the bus for word:used

// Commit the building word into the sentence, then clear it.
function commit() {
  if (!word.length) return;
  emit('word:commit', word.notes.slice());
  word.clear();
}

// ctx is the shared kernel every card connects through.
const ctx = { word, memory, commit };

// Keep the teardown handle: every card returns a working destroy(), so the
// whole site can be cleanly unmounted (no leaked watchers/listeners).
const site = renderSite(document.getElementById('site'), ctx);
window.__solresol = { ctx, site };   // handle for debugging / future re-render

document.getElementById('count').textContent = wordCount().toLocaleString();
