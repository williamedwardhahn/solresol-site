// Spell a name in Solresol — Sudre's alphabet for proper nouns.
//
// A name has no meaning to translate, so Sudre wrote it by sound: each
// vowel is one note, each consonant is one note with an accent or a doubled
// note, with or without an accent. An accent lengthens the note it sits on,
// so the ear can tell a consonant (an accented do) from a vowel (a plain do).
//
//            do   re   mi   fa   sol  la   si
//   vowels   a    eu   e    i    o    u    ou     one note
//   cons.*   p    n    k    f    j                one accented note
//   cons.    s    t    r    v    m    l    d      doubled note
//   cons.*   z    b    g    ch   x                doubled, first accented
//
// Source: Sudre, Langue Musicale Universelle (1866), pp. XXII–XXIV — the
// "Alphabet phonétique", checked against the scan (docs/XXIIVV.md §7). A dot
// before a note is spoken as a rinforzando (stress); a black note is doubled.
// Sudre spells by sound, never by letter: c is always hard (a soft c is
// written s), s is always hard (an s said as z is written z), ai is é, au
// is o. Those rules are his; reading English letters (w, y, h, ph, th, sh,
// a silent final e) as his sounds is this site's guess.

const N = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];

// sound → { notes, accent } (accent marks the first note)
export const ALPHABET = {};
const row = (sounds, make) => sounds.forEach((s, i) => { if (s) ALPHABET[s] = make(N[i]); });
row(['a', 'eu', 'e', 'i', 'o', 'u', 'ou'], (n) => ({ notes: [n], accent: false, kind: 'vowel' }));
row(['p', 'n', 'k', 'f', 'j'], (n) => ({ notes: [n], accent: true, kind: 'consonant' }));
row(['s', 't', 'r', 'v', 'm', 'l', 'd'], (n) => ({ notes: [n, n], accent: false, kind: 'consonant' }));
row(['z', 'b', 'g', 'ch', 'x'], (n) => ({ notes: [n, n], accent: true, kind: 'consonant' }));

// The alphabet as rows, for a reference table.
export const ALPHABET_ROWS = [
  { label: 'Vowels', note: 'one note', sounds: ['a', 'eu', 'e', 'i', 'o', 'u', 'ou'], show: { e: 'é' } },
  { label: 'Consonants', note: 'one note, accented', sounds: ['p', 'n', 'k', 'f', 'j', '', ''], show: { k: 'k, qu, c' } },
  { label: 'Consonants', note: 'a doubled note', sounds: ['s', 't', 'r', 'v', 'm', 'l', 'd'] },
  { label: 'Consonants', note: 'doubled, accented', sounds: ['z', 'b', 'g', 'ch', 'x', '', ''] },
];

// Letters this site reads as one of Sudre's sounds. Longest first.
const READINGS = [
  ['eau', 'o'], ['au', 'o'], ['ai', 'e'], ['ay', 'e'], ['eu', 'eu'], ['oeu', 'eu'], ['ou', 'ou'], ['oo', 'ou'],
  ['ch', 'ch'], ['sh', 'ch'], ['sch', 'ch'], ['ph', 'f'], ['th', 't'],
  ['qu', 'k'], ['ck', 'k'], ['kh', 'k'],
  ['a', 'a'], ['e', 'e'], ['i', 'i'], ['y', 'i'], ['o', 'o'], ['u', 'u'], ['w', 'ou'],
  ['p', 'p'], ['n', 'n'], ['k', 'k'], ['q', 'k'], ['f', 'f'], ['j', 'j'],
  ['s', 's'], ['t', 't'], ['r', 'r'], ['v', 'v'], ['m', 'm'], ['l', 'l'], ['d', 'd'],
  ['z', 'z'], ['b', 'b'], ['g', 'g'], ['x', 'x'],
];
const VOWEL_LETTERS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

const fold = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/ß/g, 'ss').replace(/æ/g, 'ae').replace(/œ/g, 'oe').toLowerCase();

// One word of a name → its sounds.
function spellWord(word) {
  const src = String(word);
  const w = fold(src);
  const parts = [];
  let i = 0;
  while (i < w.length) {
    const c = w[i], next = w[i + 1] || '';
    // a doubled consonant is said once (Anna, Matthew)
    if (i > 0 && c === w[i - 1] && !VOWEL_LETTERS.has(c) && c !== 'h') { i++; continue; }
    let sound = null, len = 1;
    if (c === 'c') sound = /[eiy]/.test(next) ? 's' : (next === 'h' ? (len = 2, 'ch') : 'k');   // Cecile, Carl, Charles
    else if (c === 'g' && /[eiy]/.test(next)) sound = 'j';                                     // George, Gina
    else if (c === 'g' && next === 'u' && /[aeiy]/.test(w[i + 2] || '')) { sound = 'g'; len = 2; }   // Guy, Guillaume
    else if (c === 'a' && /[iy]/.test(next) && VOWEL_LETTERS.has(w[i + 2] || '')) sound = 'a';   // Maya, Kaia: a new syllable, not é
    else if (c === 'h') sound = null;                                                          // silent, as in French
    else if (c === 's' && VOWEL_LETTERS.has(w[i - 1]) && VOWEL_LETTERS.has(next)) sound = 'z';   // Rosa, Pontoise → Pontoize (Sudre)
    else if (c === 'e' && i === w.length - 1 && i > 1 && !VOWEL_LETTERS.has(w[i - 1]) && src[i] === 'e') sound = null;   // Anne, George: a silent final e
    else {
      for (const [letters, s] of READINGS) {
        if (w.startsWith(letters, i)) { sound = s; len = letters.length; break; }
      }
    }
    const letters = src.slice(i, i + len) || w.slice(i, i + len);
    if (sound && ALPHABET[sound]) parts.push({ letters, sound, ...ALPHABET[sound] });
    else parts.push({ letters, sound: null, notes: [], accent: false, kind: 'silent' });
    i += len;
  }
  // a doubled consonant read as two letters (e.g. "tth") still says one sound
  return parts.filter((p, k) => !(p.kind === 'consonant' && parts[k - 1]?.sound === p.sound));
}

// A name → { words: [{ text, parts, notes, accents }], notes, accents }.
// accents are the indices (into that word's notes) that carry an accent.
export function spellName(text) {
  const words = String(text || '').split(/[\s\-–—]+/).filter((w) => /[a-zà-ÿ]/i.test(w)).map((t) => {
    const parts = spellWord(t.replace(/[^\p{L}]/gu, ''));
    const notes = [], accents = [];
    for (const p of parts) {
      if (p.accent) accents.push(notes.length);
      notes.push(...p.notes);
    }
    return { text: t, parts, notes, accents };
  });
  return { words, notes: words.flatMap((w) => w.notes), accents: words.map((w) => w.accents) };
}

// The name written out, an accented note carrying the site's stress mark
// (a circumflex, as on the word pages): Anna → "dorêdo".
const STRESSED = { do: 'dô', re: 'rê', mi: 'mî', fa: 'fâ', sol: 'sôl', la: 'lâ', si: 'sî' };
export function writeName(word) {
  return word.notes.map((n, i) => (word.accents.includes(i) ? STRESSED[n] : n)).join('');
}
