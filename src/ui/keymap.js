// Home-row entry — play Solresol like an instrument and a typewriter.
//
// Left hand  A S D F  and right hand  J K L  play the seven notes;
// Space (or ;, or Enter) finishes a word, like a typewriter space between
// words. Pure data + lookups, so the mapping is tested on its own.
//
//   A S D F   J K L
//   do re mi fa sol la si

export const KEY_TO_NOTE = {
  a: 'do', s: 're', d: 'mi', f: 'fa', j: 'sol', k: 'la', l: 'si',
};

const NOTE_TO_KEY = Object.fromEntries(
  Object.entries(KEY_TO_NOTE).map(([k, n]) => [n, k])
);

export const COMMIT_KEYS = [' ', ';', 'Enter'];

export const noteForKey  = (key)  => KEY_TO_NOTE[String(key).toLowerCase()] || null;
export const keyForNote  = (note) => NOTE_TO_KEY[String(note).toLowerCase()] || null;
export const isCommitKey = (key)  => COMMIT_KEYS.includes(key);
