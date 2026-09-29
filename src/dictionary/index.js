// makeIndex — the pure core of the Dictionary.
//
// Given a list of {solresol, definition} entries, build the lookup maps
// and return a small query object. No DOM, no fetch, no globals — so it
// can be tested with a 12-word fixture. The singleton in dictionary.js
// is just this, wrapped around the fetched data.

export function makeIndex(words) {
  const meaning = new Map();   // solresol → definition
  const en = new Map();        // folded english word → solresol (shortest wins)
  for (const w of words) {
    meaning.set(w.solresol.toLowerCase(), w.definition);
    for (const t of tokens(w.definition)) {
      const cur = en.get(t);
      if (!cur || w.solresol.length < cur.length) en.set(t, w.solresol);
    }
  }

  return {
    words,
    all: () => words,
    meaningOf: (text) => meaning.get(String(text).toLowerCase()) || null,
    englishToSolresol: (word) => en.get(fold(word)) || null,
    search(query, limit = 20) {
      const q = fold(query);
      if (!q) return [];
      const out = [];
      for (const w of words) {
        // diacritic-insensitive: "cafe" matches "Café", "frene" matches "Frêne"
        if (fold(w.solresol).startsWith(q) || fold(w.definition).includes(q)) {
          out.push(w);
          if (out.length >= limit) break;
        }
      }
      return out;
    },
  };
}

// Fold to lowercase ASCII: strip diacritics so accented/French glosses are findable.
export const fold = (s) =>
  String(s).trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// "Well, well done, good" → well/done/good  (accent-folded)
export function tokens(definition) {
  return fold(definition).match(/[a-z']+/g) || [];
}
