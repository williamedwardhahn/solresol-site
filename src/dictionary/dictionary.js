import { makeIndex } from './index.js';

// The Dictionary singleton — the one book of truth, loaded once at
// startup. All the logic lives in makeIndex (pure, tested); this file
// only holds the fetched data and exposes the stable app-facing API.

let dict = makeIndex([]);

export async function loadDictionary() {
  const res = await fetch(new URL('./words.json', import.meta.url));
  dict = makeIndex(await res.json());
}

export const getIndex          = () => dict;
export const wordCount         = () => dict.words.length;
export const allWords          = () => dict.words;
export const meaningOf         = (text) => dict.meaningOf(text);
export const englishToSolresol = (word) => dict.englishToSolresol(word);
export const search            = (query, limit) => dict.search(query, limit);
