import { color } from './color.js?v=8aaee6f447';
import { solfege } from './solfege.js?v=8aaee6f447';
import { number } from './number.js?v=8aaee6f447';
import { staff } from './staff.js?v=8aaee6f447';
import { hand } from './hand.js?v=8aaee6f447';
import { finger } from './finger.js?v=8aaee6f447';
import { script } from './script.js?v=8aaee6f447';
import { braille } from './braille.js?v=8aaee6f447';
import { binary } from './binary.js?v=8aaee6f447';

export { tone, playNote, playWord, playSentence, setTimbre } from './tone.js?v=8aaee6f447';

// The seen voices, in display order. Adding a voice is: write one file,
// add one line here. Nothing else in the app has to change.
export const VOICES = [solfege, number, color, staff, hand, finger, script, braille, binary];
