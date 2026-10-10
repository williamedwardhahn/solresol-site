// The songbook — twenty-three tunes, each written as it appears on its
// page: two lines of staff, a note per token.
//
// A token is a pitch and a length in beats: "F#4:1.5" is the F sharp above
// middle C held for a beat and a half; no length means one beat; "R" is a
// rest. Every song stays inside the keyboard: middle C (do) up to the E an
// octave and a third above (mi').

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SOLFEGE = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
const SEMI = [0, 2, 4, 5, 7, 9, 11];

const song = (n, title, instrument, icon, ...lines) => ({ n, title, instrument, icon, lines: lines.map(parseLine) });

export const SONGS = [
  song(1, 'London Bridge', 'chimes', '🌉',
    'G4:1.5 A4:.5 G4 F4 E4 F4 G4:2 D4 E4 F4:2 E4 F4 G4:2',
    'G4:1.5 A4:.5 G4 F4 E4 F4 G4:2 D4:2 G4:2 E4 C4:3'),
  song(2, 'Mary Had a Little Lamb', 'lamb', '🐑',
    'B4:.5 A4:.5 G4:.5 A4:.5 B4:.5 B4:.5 B4 A4:.5 A4:.5 A4 B4:.5 D5:.5 D5',
    'B4:.5 A4:.5 G4:.5 A4:.5 B4:.5 B4:.5 B4:.5 B4:.5 A4:.5 A4:.5 B4:.5 A4:.5 G4:2'),
  song(3, 'Camptown Races', 'trombone', '🐎',
    'G4 G4 E4 G4 A4 G4 E4:2 E4 D4:2 R E4 D4:2 R',
    'G4 G4 E4 G4 A4 G4 E4:2 D4:2 E4 D4 C4:4'),
  song(4, 'The Muffin Man', 'clarinet', '🧁',
    'C4 F4 F4:1.5 G4:.5 A4 F4 F4:1.5 F4:.5 D4 G4 G4:1.5 F4:.5 E4 C4 C4:2',
    'C4 F4 F4:1.5 G4:.5 A4 F4 F4:1.5 F4:.5 G4 G4 E4 E4 F4:2'),
  song(5, 'Buffalo Gal', 'saxophone', '🦬',
    'G4 C4 D4 E4 F4 A4 G4 E4:2 G4 F4 D4:2 A4 G4 E4 G4',
    'C4 D4 E4 F4 A4 G4 E4 E4 G4 G4 F4 D4 C4:4'),
  song(6, 'Pop! Goes the Weasel', 'panpipe', '🎉',
    'G4 G4:.5 A4 A4:.5 B4:.5 D5:.5 B4:.5 G4 D4:.5 G4 G4:.5 A4 A4:.5 B4:1.5 G4:1.5',
    'D4:.5 G4 G4:.5 A4 A4:.5 B4:.5 D5:.5 B4:.5 G4 R:.5 E5:1.5 A4 C5:.5 B4:1.5 G4:1.5'),
  song(7, 'Good Old Summertime', 'duck', '☀️',
    'G4:.5 A4:.5 G4:.5 E4 G4 C5 E5:1.5 R:.5 D5:.5 C5:.5 C5:.5 D5 C5 A4:.5 G4:1.5',
    'R:1.5 E4 G4:.5 C5 D5:.5 E5 D5:.5 C5 G4:.5 A4:.5 C5 C5 D5:.5 C5:1.5'),
  song(8, 'Aura Lee', 'harp', '🌸',
    'G4 C5 B4 C5 D5 A4 D5:2 C5:1.5 B4:.5 A4 B4 C5:3 R',
    'G4 C5 B4 C5 D5 A4 D5:2 C5:1.5 B4:.5 A4 B4 C5:3'),
  song(9, 'Auld Lang Syne', 'kazoo', '🗓️',
    'C4 F4:1.5 E4:.5 F4 A4 G4:1.5 F4:.5 G4 A4:.5 G4:.5 F4:1.5 F4:.5 A4 C5 D5:3',
    'D5 C5:1.5 A4:.5 A4 F4 G4:1.5 F4:.5 G4 A4:.5 G4:.5 F4:1.5 D4:.5 D4 C4 F4:3'),
  song(10, "Comin' Thru the Rye", 'horn', '🌾',
    'D4:1.5 D4:.5 D4:.5 B4:1.5 A4:1.5 G4:.5 A4:.5 B4:1.5 D4:.5 D4:1.5 E4:1.5 D4:.5 G4:4',
    'D4:1.5 D4:.5 D5:.5 B4:1.5 A4:1.5 G4:.5 A4:.5 B4:1.5 D4:.5 D4:1.5 E4:1.5 D4:.5 G4:4'),
  song(11, 'Itsy Bitsy Spider', 'tuba', '🕷️',
    'C4:.5 F4 E4:.5 F4 G4:.5 A4:1.5 A4 A4:.5 G4 F4:.5 G4 A4:.5 F4:1.5 R:1.5',
    'A4:1.5 A4 Bb4:.5 C5:1.5 C5:1.5 Bb4 A4:.5 Bb4 C5:.5 A4:1.5'),
  song(12, 'Così Fan Tutte', 'glass', '🎭',
    'G4:.5 G4 F4:.5 E4:.5 F4:.5 G4:.5 A4 F4:1.5 F4:.5 F4 E4:.5 D4:.5 E4:.5 F4:.5',
    'G4 E4:1.5 C5:.5 B4:.5 B4:.5 B4 A4 C5 G4:1.5 C5:.5 B4:.5 B4:.5 B4 A4 C5:2'),
  song(13, 'Yankee Doodle', 'flute', '🎩',
    'G4:.5 G4:.5 A4:.5 B4:.5 G4:.5 B4:.5 A4:.5 D4:.5 G4:.5 G4:.5 A4:.5 B4:.5 G4 F#4',
    'G4:.5 G4:.5 A4:.5 B4:.5 C5:.5 B4:.5 A4:.5 G4:.5 F#4:.5 D4:.5 E4:.5 F#4:.5 G4 G4'),
  song(14, 'Jimmy Crack Corn', 'trumpet', '🌽',
    'D4:.5 D4:.5 G4 G4:1.5 G4:.5 F#4 A4 A4:2 D4:.5 D4:.5 A4 A4:1.5 A4:.5 G4 B4',
    'B4:2 G4:.5 G4:.5 B4 B4:1.5 B4:.5 C5 D5 E5:1.5 E5:.5 D5 D5 C5 F#4 G4:2'),
  song(15, 'Did You Ever See a Lassie?', 'cello', '💃',
    'F4:.5 A4:.5 C5:1.5 D5:.5 C5:.5 Bb4:.5 A4 F4 F4 G4 C4 C4 A4 F4',
    'F4:.5 A4:.5 C5:1.5 D5:.5 C5:.5 Bb4:.5 A4 F4 F4 G4 C4 C4 F4:2'),
  song(16, 'Clementine', 'harmonica', '👧',
    'G4:.5 G4:.5 G4 D4 B4:.5 B4:.5 B4 G4 G4:.5 B4:.5 D5:1.5 D5:.5 C5:.5 B4:.5 A4:2',
    'A4:.5 B4:.5 C5 C5 B4:.5 A4:.5 B4 G4 G4:.5 B4:.5 A4:1.5 D4:.5 F#4:.5 A4:.5 G4:2'),
  song(18, 'Du Liegst Mir im Herzen', 'oboe', '❤️',
    'A4:1.5 A4:1.5 A4:.5 G4:.5 A4:.5 C5 Bb4:.5 G4:1.5 G4:1.5 G4:.5 C5:.5 Bb4:.5 A4:1.5',
    'A4:1.5 A4:1.5 A4:.5 G4:.5 A4:.5 C5 Bb4:.5 G4:.5 A4:.5 Bb4:.5 D5:.5 C5:.5 E4:.5 F4:1.5'),
  song(19, 'The Four Seasons (Spring)', 'strings', '🌷',
    'F4 A4 A4 A4 G4:.5 F4:.5 C5:2 R C5:.5 Bb4:.5 A4 A4 A4 G4:.5 F4:.5',
    'C5:2 R C5:.5 Bb4:.5 A4 Bb4:.5 C5:.5 Bb4 A4 G4:3'),
  song(20, 'Carmen Sandiego Theme', 'bassoon', '🕵️',
    'D4:.5 D4:.5 F4:.5 D4:.5 G4:.5 D4:.5 G#4:.5 A4:.5 D4:.5 D4:.5 F4:.5 D4:.5 G4:.5 D4:.5 C4:.5',
    'C#4:.5 D4:.5 D4:.5 F4:.5 D4:.5 G4:.5 D4:.5 A4:.5 C5 D5:.5 C#5:.5 D5:2'),
  song(21, 'Lion Theme', 'bass', '🦁',
    'C4 G4 G4 G4 A4:1.5 G4:.5 F4 G4 Eb4:.5 D4:.5 C4:.5 D4:.5 Eb4 F4 D4:4',
    'C4 G4 G4 G4 A4:1.5 G4:.5 F4 G4 Eb4:.5 F4:.5 G4:.5 F4:.5 Eb4 D4 Eb4:4'),
  song(22, 'Russian Dance', 'violin', '🪆',
    'D5 D5:.5 C#5:.5 D5 D5 B4 A4 G4:2 A4 A4:.5 G#4:.5 A4 A4 F#4',
    'E4 D4 F#4 E4:2 D4:2 C#4:2 E4:2 F#4:2 D4:2 E4 D4 E4:2'),
  song(23, 'Bach Minuet', 'piano', '🎹',
    'A4 D4:.5 E4:.5 F#4:.5 G4:.5 A4 D4 D4 B4 G4:.5 A4:.5 B4:.5 C#5:.5 D5 D4',
    'D4 G4 A4:.5 G4:.5 F#4:.5 E4:.5 F#4 G4:.5 F#4:.5 E4:.5 D4:.5 E4 F#4 C#4 D4:3'),
  song(24, 'The Wild Rider', 'marimba', '🏇',
    'C4:.5 F4:.5 C4:.5 F4:.5 Ab4:.5 F4:.5 Ab4:.5 C5:.5 Ab4:.5 Db5:.5 C5:.5 Ab4:.5 F4:.5 G4:.5 E4:.5',
    'Ab4:.5 G4:.5 E4:.5 C4:.5 F4:.5 C4:.5 Ab4:.5 G4'),
];

// ---------- notes ----------


// "F#4:1.5" → { letter, step, acc, octave, midi, beats, name, up }
// step counts staff positions from middle C (C4 = 0, D4 = 1 …); up is 1
// for the octave above, so the syllable can carry its dot.
export function parseToken(token) {
  const [p, b] = token.split(':');
  const beats = b === undefined ? 1 : Number(b);
  if (p === 'R') return { rest: true, beats };
  const m = /^([A-G])(#|b)?(\d)$/.exec(p);
  if (!m) throw new Error(`bad note "${token}"`);
  const i = LETTERS.indexOf(m[1]);
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  const octave = Number(m[3]);
  return {
    letter: m[1], acc, octave, beats,
    step: i + 7 * (octave - 4),
    midi: 12 * (octave + 1) + SEMI[i] + acc,
    name: SOLFEGE[i],
    up: octave - 4,
  };
}

function parseLine(text) { return text.trim().split(/\s+/).map(parseToken); }

export const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);
export const accidental = (acc) => (acc > 0 ? '♯' : acc < 0 ? '♭' : '');

// The keyboard: ten white keys from middle C, with the black keys between.
export const WHITE = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'].map(parseToken);
export const BLACK = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'C#5', 'D#5'].map(parseToken);
export const LOW = WHITE[0].midi, HIGH = WHITE[WHITE.length - 1].midi;

// Same pitch, any spelling (A#4 is Bb4).
export const samePitch = (a, b) => a.midi === b.midi;
export const notesOf = (s) => s.lines.flat().filter((t) => !t.rest);
