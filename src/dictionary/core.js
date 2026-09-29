// The core vocabulary — the palette for the Gate.
// ~30 high-frequency meanings (needs, feelings, responses) a person can
// reach for first. Curated from the real dictionary (gloss + notes exact).
// priority 1 = the first set the Gate offers; 2 = the extended palette.

export const CORE = [
  { concept: 'yes', gloss: 'yes', solresol: 'Si', notes: ["si"], group: 'response', priority: 1, full: 'Yes, willingly' },
  { concept: 'no', gloss: 'no', solresol: 'Do', notes: ["do"], group: 'response', priority: 1, full: 'No, not, nor' },
  { concept: 'more', gloss: 'more', solresol: 'Miredodo', notes: ["mi", "re", "do", "do"], group: 'response', priority: 1, full: 'More, in addition, moreover, also, further' },
  { concept: 'stop', gloss: 'stop', solresol: 'Fasisolla', notes: ["fa", "si", "sol", "la"], group: 'response', priority: 1, full: 'Stop, to park, station, respite, truce, stationary' },
  { concept: 'done', gloss: 'done, finished', solresol: 'Fadosi', notes: ["fa", "do", "si"], group: 'response', priority: 2, full: 'End, complete, finish, final, finally, termination, achieve' },
  { concept: 'again', gloss: 'again', solresol: 'Sifala', notes: ["si", "fa", "la"], group: 'response', priority: 2, full: 'Repeat, recapitulate' },
  { concept: 'help', gloss: 'help', solresol: 'Dosido', notes: ["do", "si", "do"], group: 'social', priority: 1, full: 'Help, aid, assist, rescue' },
  { concept: 'please', gloss: 'please', solresol: 'Mifare', notes: ["mi", "fa", "re"], group: 'social', priority: 2, full: 'Please, like, pleasant, seductive' },
  { concept: 'thank you', gloss: 'thank you', solresol: 'Solsi', notes: ["sol", "si"], group: 'social', priority: 2, full: 'Thanks, thank' },
  { concept: 'hello', gloss: 'hello', solresol: 'Simi', notes: ["si", "mi"], group: 'social', priority: 2, full: 'Good morning/afternoon, hello' },
  { concept: 'eat', gloss: 'eat / hungry', solresol: 'Dolamisi', notes: ["do", "la", "mi", "si"], group: 'need', priority: 1, full: 'Eat, eating, eater, eatable' },
  { concept: 'drink', gloss: 'drink / thirsty', solresol: 'Dolamisol', notes: ["do", "la", "mi", "sol"], group: 'need', priority: 1, full: 'Drink, drinker' },
  { concept: 'water', gloss: 'water', solresol: 'Dolamire', notes: ["do", "la", "mi", "re"], group: 'need', priority: 2, full: 'Water, wet' },
  { concept: 'tired', gloss: 'tired', solresol: 'Resollado', notes: ["re", "sol", "la", "do"], group: 'need', priority: 1, full: 'To get tired, grow weary, fatigue, weariness, dejection, tired, overwhelmed, tiring' },
  { concept: 'hurt', gloss: 'hurt', solresol: 'Miresifa', notes: ["mi", "re", "si", "fa"], group: 'need', priority: 1, full: 'Hurt, wound, bruise' },
  { concept: 'toilet', gloss: 'toilet', solresol: 'Solsisido', notes: ["sol", "si", "si", "do"], group: 'need', priority: 1, full: 'Latrines, toilet, loo, restroom, bathroom' },
  { concept: 'hot', gloss: 'hot', solresol: 'Sisila', notes: ["si", "si", "la"], group: 'need', priority: 2, full: 'Heat, warmth, warm, caloric, with heat, warmly' },
  { concept: 'cold', gloss: 'cold', solresol: 'Lasisi', notes: ["la", "si", "si"], group: 'need', priority: 2, full: 'Cold, chilly, frigid' },
  { concept: 'want', gloss: 'want', solresol: 'Mifala', notes: ["mi", "fa", "la"], group: 'need', priority: 2, full: 'Desire, wish, want, desirous' },
  { concept: 'happy', gloss: 'happy', solresol: 'Solsire', notes: ["sol", "si", "re"], group: 'feeling', priority: 1, full: 'To be happy, happiness, joy, playfulness, elation, happy, gay, joyful, perky, merrily, cheerfully, happily' },
  { concept: 'sad', gloss: 'sad', solresol: 'Resisol', notes: ["re", "si", "sol"], group: 'feeling', priority: 1, full: 'To be sad, sadness, gloom, melancholy, sad' },
  { concept: 'love', gloss: 'love', solresol: 'Milasi', notes: ["mi", "la", "si"], group: 'feeling', priority: 2, full: 'Love, cherish, lover, enamored' },
  { concept: 'afraid', gloss: 'afraid', solresol: 'Midosoldo', notes: ["mi", "do", "sol", "do"], group: 'feeling', priority: 2, full: 'Fear, apprehend, apprehension, fearful, apprehensive' },
  { concept: 'angry', gloss: 'angry', solresol: 'Miresisol', notes: ["mi", "re", "si", "sol"], group: 'feeling', priority: 2, full: 'To get angry, angry, upset' },
  { concept: 'I', gloss: 'I / me', solresol: 'Dore', notes: ["do", "re"], group: 'person', priority: 1, full: 'I, me, myself, personally, we, ourselves' },
  { concept: 'you', gloss: 'you', solresol: 'Domi', notes: ["do", "mi"], group: 'person', priority: 1, full: 'You, yourself, (singular or plural)' },
  { concept: 'parent', gloss: 'parent (mother / father)', solresol: 'Residosi', notes: ["re", "si", "do", "si"], group: 'person', priority: 2, full: 'Father, mother, paternity, maternity, paternal, maternal' },
  { concept: 'home', gloss: 'home', solresol: 'Remifala', notes: ["re", "mi", "fa", "la"], group: 'place', priority: 2, full: 'Home, house, hut, cottage, hotel' },
  { concept: 'go', gloss: 'go', solresol: 'Farefa', notes: ["fa", "re", "fa"], group: 'action', priority: 2, full: 'Go, proceed' },
  { concept: 'come', gloss: 'come', solresol: 'Dosolfala', notes: ["do", "sol", "fa", "la"], group: 'action', priority: 2, full: 'Come, approach, hasten, coming' },
  { concept: 'play', gloss: 'play', solresol: 'Sifasire', notes: ["si", "fa", "si", "re"], group: 'action', priority: 2, full: 'Play, play a game, game' },
  { concept: 'good', gloss: 'good', solresol: 'Misol', notes: ["mi", "sol"], group: 'quality', priority: 2, full: 'Well, well done, good' },
  { concept: 'bad', gloss: 'bad', solresol: 'Lafa', notes: ["la", "fa"], group: 'quality', priority: 2, full: 'Bad' },
];

export const coreByGroup = () => {
  const g = {};
  for (const w of CORE) (g[w.group] ||= []).push(w);
  return g;
};
