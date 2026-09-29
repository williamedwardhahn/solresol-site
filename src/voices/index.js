import { color } from './color.js';
import { solfege } from './solfege.js';
import { number } from './number.js';
import { staff } from './staff.js';
import { braille } from './braille.js';
import { sign } from './sign.js';

export { tone, playNote, playWord, playSentence } from './tone.js';

// The seen voices, in display order. Adding a voice is: write one file,
// add one line here. Nothing else in the app has to change.
export const VOICES = [color, solfege, number, staff, braille, sign];
