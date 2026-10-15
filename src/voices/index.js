import { color } from './color.js?v=c5b00be221';
import { solfege } from './solfege.js?v=c5b00be221';
import { number } from './number.js?v=c5b00be221';
import { staff } from './staff.js?v=c5b00be221';
import { hand } from './hand.js?v=c5b00be221';
import { finger } from './finger.js?v=c5b00be221';
import { ocarina } from './ocarina.js?v=c5b00be221';
import { script } from './script.js?v=c5b00be221';
import { braille } from './braille.js?v=c5b00be221';
import { binary } from './binary.js?v=c5b00be221';

export { tone, playNote, playWord, playSentence, setTimbre } from './tone.js?v=c5b00be221';

// The seen voices, in display order. Adding a voice is: write one file,
// add one line here. Nothing else in the app has to change.
export const VOICES = [solfege, number, color, staff, hand, finger, ocarina, script, braille, binary];
