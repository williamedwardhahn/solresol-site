import { color } from './color.js?v=ea2512429f';
import { solfege } from './solfege.js?v=ea2512429f';
import { number } from './number.js?v=ea2512429f';
import { staff } from './staff.js?v=ea2512429f';
import { hand } from './hand.js?v=ea2512429f';
import { script } from './script.js?v=ea2512429f';
import { braille } from './braille.js?v=ea2512429f';
import { binary } from './binary.js?v=ea2512429f';

export { tone, playNote, playWord, playSentence, setTimbre } from './tone.js?v=ea2512429f';

// The seen voices, in display order. Adding a voice is: write one file,
// add one line here. Nothing else in the app has to change.
export const VOICES = [solfege, number, color, staff, hand, script, braille, binary];
