// The phrasebook. Every word is in words.json and every sentence follows the
// canonical grammar (docs/SOLRESOL_MASTER.md §6): SVO; tense particle before
// the verb; "do" once before the negated word; questions by putting the verb
// before its subject — never an appended particle. `lit` is the word-for-word
// gloss, one entry per Solresol word. tests/phrases.test.js holds it to this.
//
// Checked against the archive's phrasebook (archive/src/utils/phrases.js):
// wrong words replaced, "…Sol" questions rebuilt by inversion, and the
// "condensed" forms left out (no source for them in the master reference).

export const PHRASEBOOK = [
  {
    id: 'greetings', label: 'Greetings', note: 'Sudre gave the greetings their own short words.',
    phrases: [
      { en: 'Hello · Good day', sol: 'Simi', lit: ['hello'] },
      { en: 'Good evening · Good night', sol: 'Misi', lit: ['good evening'] },
      { en: 'Good day, sir', sol: 'Simi, sisol', lit: ['hello', 'sir'] },
      { en: 'Good day, madam', sol: 'Simi, sila', lit: ['hello', 'madam'] },
      { en: 'Greetings!', sol: 'Dosolfasi', lit: ['greet'] },
    ],
  },
  {
    id: 'essentials', label: 'Essentials', note: 'Yes and no are the two single notes at the ends of the scale.',
    phrases: [
      { en: 'Yes', sol: 'Si', lit: ['yes'] },
      { en: 'No', sol: 'Do', lit: ['no'] },
      { en: 'Thank you', sol: 'Solsi', lit: ['thanks'] },
      { en: 'Please', sol: 'Mifare', lit: ['please'] },
      { en: 'Excuse me', sol: 'Sollado', lit: ['excuse'] },
      { en: 'Forgive me', sol: 'Solsol sollami dore', lit: ['(imperative)', 'forgive', 'me'] },
      { en: 'Help me!', sol: 'Solsol dosido dore', lit: ['(imperative)', 'help', 'me'] },
    ],
  },
  {
    id: 'questions', label: 'Questions', note: 'A question puts the verb before its subject. There is no question word to add.',
    phrases: [
      { en: 'What? · What is this?', sol: 'Fado?', lit: ['what?'] },
      { en: 'Why?', sol: 'Solre?', lit: ['why?'] },
      { en: 'How?', sol: 'Sido?', lit: ['how'] },
      { en: 'Where?', sol: 'Mimisoldo?', lit: ['where'] },
      { en: 'When?', sol: 'Milalami?', lit: ['when'] },
      { en: 'Who is it?', sol: 'Misirere?', lit: ['who is it?'] },
      { en: 'Are you well?', sol: 'Redofafa domi?', lit: ['be healthy', 'you'] },
      { en: 'Do you understand?', sol: 'Falafa domi?', lit: ['understand', 'you'] },
      { en: "Don't you understand?", sol: 'Do falafa domi?', lit: ['not', 'understand', 'you'] },
      { en: 'Do you speak Solresol?', sol: 'Domilado domi solresol?', lit: ['speak', 'you', 'language'] },
    ],
  },
  {
    id: 'communication', label: 'Communication', note: 'The verb is the bare root; a doubled note in front of it sets the tense.',
    phrases: [
      { en: 'I understand', sol: 'Dore falafa', lit: ['I', 'understand'] },
      { en: "I don't understand", sol: 'Dore do falafa', lit: ['I', 'not', 'understand'] },
      { en: "Excuse me, I don't understand", sol: 'Sollado, dore do falafa', lit: ['excuse', 'I', 'not', 'understand'] },
      { en: 'Please repeat', sol: 'Mifare, solsol sifala', lit: ['please', '(imperative)', 'repeat'] },
      { en: 'Please speak slowly', sol: 'Mifare, solsol domilado remisifa', lit: ['please', '(imperative)', 'speak', 'slowly'] },
      { en: 'Write that', sol: 'Solsol lamire fare', lit: ['(imperative)', 'write', 'that'] },
      { en: 'Wait!', sol: 'Solsol sifasol', lit: ['(imperative)', 'wait'] },
      { en: 'I speak Solresol', sol: 'Dore domilado solresol', lit: ['I', 'speak', 'language'] },
    ],
  },
  {
    id: 'social', label: 'Social', note: 'Plural and feminine are marked on the last syllable, shown here as small pl. and fem. labels: we is dore pl., she is dofa fem.',
    phrases: [
      { en: 'I love you', sol: 'Dore milasi domi', lit: ['I', 'love', 'you'] },
      { en: 'Well done!', sol: 'Misol!', lit: ['well done'] },
      { en: 'Delicious!', sol: 'Fala!', lit: ['good, tasty'] },
      { en: 'I am happy', sol: 'Dore solsire', lit: ['I', 'be happy'] },
      { en: 'I was happy', sol: 'Dore dodo solsire', lit: ['I', '(past)', 'be happy'] },
      { en: 'She is tired', sol: 'Dofā resollado', lit: ['she', 'grow tired'] },
      { en: 'We will sing', sol: 'Doré mimi solremifa', lit: ['we', '(future)', 'sing'] },
    ],
  },
  {
    id: 'colours', label: 'Colours', note: 'The colours are one family: la-re-, then the hue. Gold and silver are la-fa-sol-.',
    phrases: [
      { en: 'Red', sol: 'Laremisi', lit: ['red'] },
      { en: 'Yellow', sol: 'Laremisol', lit: ['yellow'] },
      { en: 'Green', sol: 'Laremifa', lit: ['green'] },
      { en: 'Blue', sol: 'Laremila', lit: ['blue'] },
      { en: 'Violet', sol: 'Laremire', lit: ['violet'] },
      { en: 'Grey', sol: 'Laremido', lit: ['grey'] },
      { en: 'White', sol: 'Laredosol', lit: ['white'] },
      { en: 'Brown · dark', sol: 'Laredomi', lit: ['dark, brown'] },
      { en: 'Gold', sol: 'Lafasolre', lit: ['gold'] },
      { en: 'Silver', sol: 'Lafasolfa', lit: ['silver'] },
    ],
  },
  {
    id: 'text', label: 'A real text', note: 'Article 1 of the Universal Declaration of Human Rights, as it is usually given in Solresol. Every word is in the dictionary.',
    phrases: [
      { en: 'All human beings are born free and equal in dignity and rights.',
        sol: 'Sire misolredo doredore famido re misolla, re famisol dosila re refasi.',
        lit: ['each', 'person', 'born', 'free', 'and', 'equal', 'and', 'have', 'dignity', 'and', 'rights'] },
      { en: 'They are endowed with reason and conscience and should act towards one another in a spirit of brotherhood.',
        sol: 'Dofa midomido midodosi dofasifa re domilafa, re falado fasolfa miladomi midodosi simisila.',
        lit: ['they', 'endow', 'with', 'conscience', 'and', 'reason', 'and', 'must', 'act', 'together', 'with', 'brotherhood'] },
    ],
  },
];

// The words of a phrase, as they are written (marks kept): "Dore do falafa" → ['Dore','do','falafa'].
export const phraseWords = (sol) => String(sol).split(/[\s,.!?]+/).filter(Boolean);
