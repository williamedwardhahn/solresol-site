import { color } from './color.js?v=c115d42191';
import { solfege } from './solfege.js?v=c115d42191';
import { number } from './number.js?v=c115d42191';
import { staff } from './staff.js?v=c115d42191';
import { hand } from './hand.js?v=c115d42191';
import { script } from './script.js?v=c115d42191';
import { braille } from './braille.js?v=c115d42191';
import { binary } from './binary.js?v=c115d42191';

export { tone, playNote, playWord, playSentence, setTimbre } from './tone.js?v=c115d42191';

// The seen voices, in display order. Adding a voice is: write one file,
// add one line here. Nothing else in the app has to change.
export const VOICES = [solfege, number, color, staff, hand, script, braille, binary];
