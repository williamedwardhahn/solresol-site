import { color } from './color.js';
import { solfege } from './solfege.js';
import { number } from './number.js';
import { staff } from './staff.js';
import { hand } from './hand.js';
import { script } from './script.js';
import { braille } from './braille.js';
import { binary } from './binary.js';

export { tone, playNote, playWord, playSentence, setTimbre } from './tone.js';

// The seen voices, in display order. Adding a voice is: write one file,
// add one line here. Nothing else in the app has to change.
export const VOICES = [solfege, number, color, staff, hand, script, braille, binary];
