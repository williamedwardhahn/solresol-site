import { color } from './color.js?v=d5188c5e91';
import { solfege } from './solfege.js?v=d5188c5e91';
import { number } from './number.js?v=d5188c5e91';
import { staff } from './staff.js?v=d5188c5e91';
import { hand } from './hand.js?v=d5188c5e91';
import { script } from './script.js?v=d5188c5e91';
import { braille } from './braille.js?v=d5188c5e91';
import { binary } from './binary.js?v=d5188c5e91';

export { tone, playNote, playWord, playSentence, setTimbre } from './tone.js?v=d5188c5e91';

// The seen voices, in display order. Adding a voice is: write one file,
// add one line here. Nothing else in the app has to change.
export const VOICES = [solfege, number, color, staff, hand, script, braille, binary];
