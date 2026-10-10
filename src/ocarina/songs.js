// The ocarina songs — melodies people already carry in their heads, written
// in solfège so the names attach to sounds they know.
//
// Fixed do: do = C. A note is a syllable, with a trailing ' for the octave
// above (re' = the D above middle C's octave). Beats are quarter notes.
// The twelve five-button songs use only re fa la si re' — the five buttons
// the game's ocarina has (A = re, C▼ = fa, C▶ = la, C◀ = si, C▲ = re').
// The three full melodies bring in do, mi and sol, so all seven are learned.

export const BUTTONS = { re: 'A', fa: 'C▼', la: 'C▶', si: 'C◀', "re'": 'C▲' };

// The instrument's range: low do up to the fa an octave above.
export const RANGE = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si', "do'", "re'", "mi'", "fa'"];

const song = (id, title, group, notes, beats, about) => ({ id, title, group, notes: notes.split(' '), beats, about });

export const SONGS = [
  // The five-button songs, ordered so each brings at most a little that is new.
  song('saria',     "Saria's Song",       'five', "fa la si fa la si",              [1, 1, 2, 1, 1, 2],             'Three notes climbing: fa, la, si. Start here.'),
  song('lullaby',   "Zelda's Lullaby",    'five', "si re' la si re' la",            [2, 1, 3, 2, 1, 3],             'Si up to the high re, then down to la.'),
  song('epona',     "Epona's Song",       'five', "re' si la re' si la",            [1, 1, 4, 1, 1, 4],             'The same three notes as the lullaby, walking straight down.'),
  song('sun',       "Sun's Song",         'five', "la fa re' la fa re'",            [0.5, 0.5, 1.5, 0.5, 0.5, 1.5], 'Down to fa, then a leap up to high re.'),
  song('time',      'Song of Time',       'five', "la re fa la re fa",              [2, 3, 2, 2, 3, 2],             'Low re appears: la, down to re, up to fa.'),
  song('storms',    'Song of Storms',     'five', "re fa re' re fa re'",            [0.5, 0.5, 2, 0.5, 0.5, 2],     'Re, fa, and the re an octave above — same name, higher voice.'),
  song('minuet',    'Minuet of Forest',   'five', "re re' si la si la",             [1, 2, 1, 1, 1, 2],             'An octave leap, then a little dance on si and la.'),
  song('bolero',    'Bolero of Fire',     'five', "fa re fa re la fa la fa",        [1, 1, 1, 1, 1, 1, 1, 1],       'Rocking between pairs: fa–re, then la–fa.'),
  song('serenade',  'Serenade of Water',  'five', "re fa la la si",                 [1, 1, 2, 1, 3],                'Climbing steadily from re to si.'),
  song('nocturne',  'Nocturne of Shadow', 'five', "si la la re si la fa",           [1, 1, 2, 2, 1, 1, 3],          'Starts high on si, falls to re, climbs, and settles on fa.'),
  song('requiem',   'Requiem of Spirit',  'five', "re fa re la fa re",              [1, 1, 1, 2, 1, 3],             'Built on low re: up to fa, up to la, home again.'),
  song('prelude',   'Prelude of Light',   'five', "re' la re' si la re'",           [1, 2, 1, 1, 1, 3],             'All high: re above, la below, si between.'),

  // The full melodies — the tunes as they are heard, with every note.
  song('woods',     "Saria's Song, in full", 'full',
    "fa la si fa la si fa la si mi' re' si do' si sol mi re mi sol mi",
    [0.5, 0.5, 1, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 2, 0.5, 0.5, 0.5, 2.5],
    'All seven notes. Mi, do and sol arrive in the second line.'),
  song('storms-full', 'Song of Storms, in full', 'full',
    "re fa re' re fa re' mi' fa' mi' fa' mi' do' la la re fa sol la la re fa sol mi",
    [0.5, 0.5, 2, 0.5, 0.5, 2, 1.5, 0.5, 0.5, 0.5, 0.5, 0.5, 2, 1, 1, 0.5, 0.5, 3, 1, 1, 0.5, 0.5, 3],
    'Up to high mi and fa, then sol walks in on the way home.'),
  song('time-full', 'Song of Time, in full', 'full',
    "la re fa la re fa la do' si sol fa sol la re do mi re",
    [1, 2, 1, 1, 2, 1, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 1, 1, 0.5, 0.5, 3],
    'The bottom of the range: low do and mi, ending home on re.'),
];

// "re'" → { name: 're', up: 1 }
export const parseNote = (token) => ({ name: token.replace(/'/g, ''), up: (token.match(/'/g) || []).length });

// Equal-tempered pitch of a note in the instrument's range.
const SEMITONE = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 };
export function frequency(token) {
  const { name, up } = parseNote(token);
  const midi = 60 + SEMITONE[name] + 12 * up;     // do = middle C
  return 440 * 2 ** ((midi - 69) / 12);
}

// The distinct syllables a song uses, in do…si order.
export const syllablesOf = (s) =>
  ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'].filter((n) => s.notes.some((t) => parseNote(t).name === n));
