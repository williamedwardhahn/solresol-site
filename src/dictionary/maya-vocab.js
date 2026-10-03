// Maya's vocabulary — what a nonspeaking child and her family need to say,
// in Sudre's own words. Every `sol` is a word of the dictionary (checked by
// tests/maya-vocab.test.js); `sol: null` is a gap Sudre left, for the family
// to fill with a word of their own (the vocabulary is meant to evolve: a
// family word can also replace one of Sudre's). `feminine` marks the women of
// a pair Sudre gives one word for (mum/dad = residosi), told apart as his
// grammar does. `critical` words must stay hard to mistake for each other.
// `family` is the first note a word coined in that category should begin
// with, after Sudre's keys (do: the body and food; re: home and family; …).
// Kept as strict JSON inside the array brackets so the Maya build can read it.

export const MAYA_CATEGORIES = [
 {
  "id": "talk",
  "label": "Talk",
  "emoji": "💬",
  "family": "do"
 },
 {
  "id": "needs",
  "label": "Needs",
  "emoji": "🍽️",
  "family": "do"
 },
 {
  "id": "feel",
  "label": "Feelings",
  "emoji": "🙂",
  "family": "mi"
 },
 {
  "id": "people",
  "label": "People",
  "emoji": "👪",
  "family": "re"
 },
 {
  "id": "food",
  "label": "Food",
  "emoji": "🍞",
  "family": "do"
 },
 {
  "id": "body",
  "label": "Body",
  "emoji": "🖐️",
  "family": "do"
 },
 {
  "id": "places",
  "label": "Places",
  "emoji": "🏠",
  "family": "fa"
 },
 {
  "id": "do",
  "label": "Do",
  "emoji": "🎵",
  "family": "sol"
 },
 {
  "id": "little",
  "label": "Little words",
  "emoji": "❓",
  "family": "si"
 }
];

export const MAYA_VOCAB = [
 {
  "id": "yes",
  "cat": "talk",
  "say": "yes",
  "emoji": "👍",
  "sol": "si",
  "critical": true
 },
 {
  "id": "no",
  "cat": "talk",
  "say": "no",
  "emoji": "✋",
  "sol": "do",
  "critical": true
 },
 {
  "id": "more",
  "cat": "talk",
  "say": "more",
  "emoji": "➕",
  "sol": "miredodo"
 },
 {
  "id": "stop",
  "cat": "talk",
  "say": "stop",
  "emoji": "🛑",
  "sol": "fasisolla",
  "critical": true
 },
 {
  "id": "finished",
  "cat": "talk",
  "say": "all done",
  "emoji": "✅",
  "sol": "fadosi"
 },
 {
  "id": "wait",
  "cat": "talk",
  "say": "wait",
  "emoji": "⏳",
  "sol": "sifasol"
 },
 {
  "id": "help",
  "cat": "talk",
  "say": "help",
  "emoji": "🆘",
  "sol": "dosido",
  "critical": true
 },
 {
  "id": "want",
  "cat": "talk",
  "say": "I want",
  "emoji": "👉",
  "sol": "mifala"
 },
 {
  "id": "again",
  "cat": "talk",
  "say": "again",
  "emoji": "🔁",
  "sol": "sifasi"
 },
 {
  "id": "please",
  "cat": "talk",
  "say": "please",
  "emoji": "🙏",
  "sol": "mifare"
 },
 {
  "id": "thanks",
  "cat": "talk",
  "say": "thank you",
  "emoji": "💐",
  "sol": "solsi"
 },
 {
  "id": "hello",
  "cat": "talk",
  "say": "hello",
  "emoji": "👋",
  "sol": "simi"
 },
 {
  "id": "goodbye",
  "cat": "talk",
  "say": "goodbye",
  "emoji": "👋🏽",
  "sol": null
 },
 {
  "id": "i",
  "cat": "talk",
  "say": "I",
  "emoji": "🙋",
  "sol": "dore"
 },
 {
  "id": "you",
  "cat": "talk",
  "say": "you",
  "emoji": "🫵",
  "sol": "domi"
 },
 {
  "id": "go",
  "cat": "talk",
  "say": "go",
  "emoji": "🚶",
  "sol": "farefa"
 },
 {
  "id": "come",
  "cat": "talk",
  "say": "come here",
  "emoji": "🫴",
  "sol": "dosolfala"
 },
 {
  "id": "like",
  "cat": "talk",
  "say": "I like it",
  "emoji": "😍",
  "sol": "milasol"
 },
 {
  "id": "dontknow",
  "cat": "talk",
  "say": "I don't know",
  "emoji": "🤷",
  "sol": null
 },
 {
  "id": "eat",
  "cat": "needs",
  "say": "eat",
  "emoji": "🍽️",
  "sol": "dolamisi",
  "critical": true
 },
 {
  "id": "drink",
  "cat": "needs",
  "say": "drink",
  "emoji": "🥤",
  "sol": "dolamisol",
  "critical": true
 },
 {
  "id": "toilet",
  "cat": "needs",
  "say": "toilet",
  "emoji": "🚽",
  "sol": "solsisido",
  "critical": true
 },
 {
  "id": "hurt",
  "cat": "needs",
  "say": "it hurts",
  "emoji": "🤕",
  "sol": "miresifa",
  "critical": true
 },
 {
  "id": "sick",
  "cat": "needs",
  "say": "I feel sick",
  "emoji": "🤢",
  "sol": "fafadore",
  "critical": true
 },
 {
  "id": "tired",
  "cat": "needs",
  "say": "tired",
  "emoji": "😴",
  "sol": "resollado"
 },
 {
  "id": "sleep",
  "cat": "needs",
  "say": "sleep",
  "emoji": "🛌",
  "sol": "remisoldo"
 },
 {
  "id": "hot",
  "cat": "needs",
  "say": "hot",
  "emoji": "🥵",
  "sol": "sisila"
 },
 {
  "id": "cold",
  "cat": "needs",
  "say": "cold",
  "emoji": "🥶",
  "sol": "lasisi"
 },
 {
  "id": "wash",
  "cat": "needs",
  "say": "wash",
  "emoji": "🧼",
  "sol": "redomido"
 },
 {
  "id": "bath",
  "cat": "needs",
  "say": "bath",
  "emoji": "🛁",
  "sol": "resolfare"
 },
 {
  "id": "medicine",
  "cat": "needs",
  "say": "medicine",
  "emoji": "💊",
  "sol": "fafamire"
 },
 {
  "id": "quiet",
  "cat": "needs",
  "say": "quiet please",
  "emoji": "🤫",
  "sol": "misoldomi"
 },
 {
  "id": "loud",
  "cat": "needs",
  "say": "too loud",
  "emoji": "🔊",
  "sol": null
 },
 {
  "id": "kiss",
  "cat": "needs",
  "say": "kiss",
  "emoji": "😘",
  "sol": "resirela"
 },
 {
  "id": "happy",
  "cat": "feel",
  "say": "happy",
  "emoji": "😊",
  "sol": "solsire"
 },
 {
  "id": "sad",
  "cat": "feel",
  "say": "sad",
  "emoji": "😢",
  "sol": "resisol"
 },
 {
  "id": "angry",
  "cat": "feel",
  "say": "angry",
  "emoji": "😠",
  "sol": "miresisol"
 },
 {
  "id": "scared",
  "cat": "feel",
  "say": "scared",
  "emoji": "😨",
  "sol": "fasifasi"
 },
 {
  "id": "bored",
  "cat": "feel",
  "say": "bored",
  "emoji": "🥱",
  "sol": "resila"
 },
 {
  "id": "calm",
  "cat": "feel",
  "say": "calm",
  "emoji": "😌",
  "sol": "misoldomi"
 },
 {
  "id": "excited",
  "cat": "feel",
  "say": "excited",
  "emoji": "🤩",
  "sol": "solrelasol"
 },
 {
  "id": "love",
  "cat": "feel",
  "say": "love",
  "emoji": "❤️",
  "sol": "milasi"
 },
 {
  "id": "surprised",
  "cat": "feel",
  "say": "surprised",
  "emoji": "😲",
  "sol": "solrelare"
 },
 {
  "id": "good",
  "cat": "feel",
  "say": "good",
  "emoji": "👌",
  "sol": "fala"
 },
 {
  "id": "bad",
  "cat": "feel",
  "say": "bad",
  "emoji": "👎",
  "sol": "lafa"
 },
 {
  "id": "mum",
  "cat": "people",
  "say": "mum",
  "emoji": "👩",
  "sol": "residosi",
  "feminine": true
 },
 {
  "id": "dad",
  "cat": "people",
  "say": "dad",
  "emoji": "👨",
  "sol": "residosi"
 },
 {
  "id": "sister",
  "cat": "people",
  "say": "sister",
  "emoji": "👧",
  "sol": "resimire",
  "feminine": true
 },
 {
  "id": "brother",
  "cat": "people",
  "say": "brother",
  "emoji": "👦",
  "sol": "resimire"
 },
 {
  "id": "grandma",
  "cat": "people",
  "say": "grandma",
  "emoji": "👵",
  "sol": "residola",
  "feminine": true
 },
 {
  "id": "grandpa",
  "cat": "people",
  "say": "grandpa",
  "emoji": "👴",
  "sol": "residola"
 },
 {
  "id": "child",
  "cat": "people",
  "say": "child",
  "emoji": "🧒",
  "sol": "domifasol"
 },
 {
  "id": "friend",
  "cat": "people",
  "say": "friend",
  "emoji": "🤝",
  "sol": "midosi"
 },
 {
  "id": "teacher",
  "cat": "people",
  "say": "teacher",
  "emoji": "🧑‍🏫",
  "sol": "solmisire"
 },
 {
  "id": "doctor",
  "cat": "people",
  "say": "doctor",
  "emoji": "🧑‍⚕️",
  "sol": "fafadofa"
 },
 {
  "id": "dog",
  "cat": "people",
  "say": "dog",
  "emoji": "🐶",
  "sol": "faresire"
 },
 {
  "id": "cat",
  "cat": "people",
  "say": "cat",
  "emoji": "🐱",
  "sol": "faresimi"
 },
 {
  "id": "water",
  "cat": "food",
  "say": "water",
  "emoji": "💧",
  "sol": "dolamire"
 },
 {
  "id": "milk",
  "cat": "food",
  "say": "milk",
  "emoji": "🥛",
  "sol": "dosiredo"
 },
 {
  "id": "juice",
  "cat": "food",
  "say": "juice",
  "emoji": "🧃",
  "sol": "dosidola"
 },
 {
  "id": "bread",
  "cat": "food",
  "say": "bread",
  "emoji": "🍞",
  "sol": "dolafala"
 },
 {
  "id": "fruit",
  "cat": "food",
  "say": "fruit",
  "emoji": "🍎",
  "sol": "dosiresi"
 },
 {
  "id": "meat",
  "cat": "food",
  "say": "meat",
  "emoji": "🍖",
  "sol": "dolasoldo"
 },
 {
  "id": "cheese",
  "cat": "food",
  "say": "cheese",
  "emoji": "🧀",
  "sol": "dosirefa"
 },
 {
  "id": "egg",
  "cat": "food",
  "say": "egg",
  "emoji": "🥚",
  "sol": "dosidosi"
 },
 {
  "id": "soup",
  "cat": "food",
  "say": "soup",
  "emoji": "🍲",
  "sol": "dolafami"
 },
 {
  "id": "cake",
  "cat": "food",
  "say": "cake",
  "emoji": "🍰",
  "sol": "dolasolla"
 },
 {
  "id": "sweet",
  "cat": "food",
  "say": "something sweet",
  "emoji": "🍯",
  "sol": "lasolmimi"
 },
 {
  "id": "meal",
  "cat": "food",
  "say": "dinner",
  "emoji": "🍝",
  "sol": "dosisolmi"
 },
 {
  "id": "head",
  "cat": "body",
  "say": "head",
  "emoji": "🗣️",
  "sol": "doredofa"
 },
 {
  "id": "belly",
  "cat": "body",
  "say": "tummy",
  "emoji": "🫃",
  "sol": "doresolfa"
 },
 {
  "id": "teeth",
  "cat": "body",
  "say": "teeth",
  "emoji": "🦷",
  "sol": "doremila"
 },
 {
  "id": "eye",
  "cat": "body",
  "say": "eye",
  "emoji": "👁️",
  "sol": "doremire"
 },
 {
  "id": "mouth",
  "cat": "body",
  "say": "mouth",
  "emoji": "👄",
  "sol": "doremisol"
 },
 {
  "id": "nose",
  "cat": "body",
  "say": "nose",
  "emoji": "👃",
  "sol": "doremifa"
 },
 {
  "id": "ear",
  "cat": "body",
  "say": "ear",
  "emoji": "👂",
  "sol": null
 },
 {
  "id": "hand",
  "cat": "body",
  "say": "hand",
  "emoji": "✋",
  "sol": "dorefasi"
 },
 {
  "id": "arm",
  "cat": "body",
  "say": "arm",
  "emoji": "💪",
  "sol": "dorefala"
 },
 {
  "id": "leg",
  "cat": "body",
  "say": "leg",
  "emoji": "🦵",
  "sol": "domidofa"
 },
 {
  "id": "foot",
  "cat": "body",
  "say": "foot",
  "emoji": "🦶",
  "sol": "domidosol"
 },
 {
  "id": "back",
  "cat": "body",
  "say": "back",
  "emoji": "🔙",
  "sol": "dorelado"
 },
 {
  "id": "home",
  "cat": "places",
  "say": "home",
  "emoji": "🏠",
  "sol": "remifala"
 },
 {
  "id": "bed",
  "cat": "places",
  "say": "bed",
  "emoji": "🛏️",
  "sol": "refaresol"
 },
 {
  "id": "bedroom",
  "cat": "places",
  "say": "my room",
  "emoji": "🚪",
  "sol": "remilado"
 },
 {
  "id": "kitchen",
  "cat": "places",
  "say": "kitchen",
  "emoji": "🍳",
  "sol": "dosisolfa"
 },
 {
  "id": "school",
  "cat": "places",
  "say": "school",
  "emoji": "🏫",
  "sol": "ladomi"
 },
 {
  "id": "car",
  "cat": "places",
  "say": "car",
  "emoji": "🚗",
  "sol": "remirefa"
 },
 {
  "id": "outside",
  "cat": "places",
  "say": "outside",
  "emoji": "🌳",
  "sol": "ladosoldo"
 },
 {
  "id": "garden",
  "cat": "places",
  "say": "garden",
  "emoji": "🌻",
  "sol": "fadosire"
 },
 {
  "id": "park",
  "cat": "places",
  "say": "park",
  "emoji": "🛝",
  "sol": "fadofami"
 },
 {
  "id": "shop",
  "cat": "places",
  "say": "shop",
  "emoji": "🛒",
  "sol": "ladomire"
 },
 {
  "id": "play",
  "cat": "do",
  "say": "play",
  "emoji": "🧸",
  "sol": "sifasire"
 },
 {
  "id": "music",
  "cat": "do",
  "say": "music",
  "emoji": "🎵",
  "sol": "solmisolre"
 },
 {
  "id": "sing",
  "cat": "do",
  "say": "sing",
  "emoji": "🎤",
  "sol": "solremifa"
 },
 {
  "id": "dance",
  "cat": "do",
  "say": "dance",
  "emoji": "💃",
  "sol": "misolsila"
 },
 {
  "id": "draw",
  "cat": "do",
  "say": "draw",
  "emoji": "🖍️",
  "sol": "lasolsi"
 },
 {
  "id": "read",
  "cat": "do",
  "say": "read",
  "emoji": "📖",
  "sol": "ladofa"
 },
 {
  "id": "book",
  "cat": "do",
  "say": "book",
  "emoji": "📚",
  "sol": "ladosol"
 },
 {
  "id": "walk",
  "cat": "do",
  "say": "walk",
  "emoji": "🚶",
  "sol": "fasido"
 },
 {
  "id": "run",
  "cat": "do",
  "say": "run",
  "emoji": "🏃",
  "sol": "solsido"
 },
 {
  "id": "swim",
  "cat": "do",
  "say": "swim",
  "emoji": "🏊",
  "sol": "falafado"
 },
 {
  "id": "toy",
  "cat": "do",
  "say": "toy",
  "emoji": "🪀",
  "sol": "lasifami"
 },
 {
  "id": "listen",
  "cat": "do",
  "say": "listen",
  "emoji": "🎧",
  "sol": "dosollado"
 },
 {
  "id": "phone",
  "cat": "do",
  "say": "phone",
  "emoji": "📱",
  "sol": "solsilami"
 },
 {
  "id": "tv",
  "cat": "do",
  "say": "TV",
  "emoji": "📺",
  "sol": null
 },
 {
  "id": "tablet",
  "cat": "do",
  "say": "tablet",
  "emoji": "📲",
  "sol": null
 },
 {
  "id": "what",
  "cat": "little",
  "say": "what?",
  "emoji": "❓",
  "sol": "fado"
 },
 {
  "id": "where",
  "cat": "little",
  "say": "where?",
  "emoji": "📍",
  "sol": "mimisoldo"
 },
 {
  "id": "when",
  "cat": "little",
  "say": "when?",
  "emoji": "🕐",
  "sol": "milalami"
 },
 {
  "id": "why",
  "cat": "little",
  "say": "why?",
  "emoji": "🤔",
  "sol": "solre"
 },
 {
  "id": "how",
  "cat": "little",
  "say": "how?",
  "emoji": "🛠️",
  "sol": "sido"
 },
 {
  "id": "this",
  "cat": "little",
  "say": "this",
  "emoji": "👇",
  "sol": "fami"
 },
 {
  "id": "that",
  "cat": "little",
  "say": "that",
  "emoji": "👉",
  "sol": "fare"
 },
 {
  "id": "here",
  "cat": "little",
  "say": "here",
  "emoji": "📌",
  "sol": "fasol"
 },
 {
  "id": "now",
  "cat": "little",
  "say": "now",
  "emoji": "⏰",
  "sol": "mimisimi"
 },
 {
  "id": "later",
  "cat": "little",
  "say": "later",
  "emoji": "⏭️",
  "sol": "dosimimi"
 },
 {
  "id": "today",
  "cat": "little",
  "say": "today",
  "emoji": "📅",
  "sol": "lare"
 },
 {
  "id": "tomorrow",
  "cat": "little",
  "say": "tomorrow",
  "emoji": "🌅",
  "sol": "lami"
 },
 {
  "id": "yesterday",
  "cat": "little",
  "say": "yesterday",
  "emoji": "🌙",
  "sol": "lado"
 },
 {
  "id": "big",
  "cat": "little",
  "say": "big",
  "emoji": "🐘",
  "sol": "lasolremi"
 },
 {
  "id": "little",
  "cat": "little",
  "say": "little",
  "emoji": "🐭",
  "sol": "sifa"
 }
];

// Maya's FIRST words — the original board, kept as it was: twenty short codes
// made by hand to be quick to tap and hard to mistake (eat and drink were
// deliberately set far apart; yes and no are si and do). These are Maya's own,
// not Sudre's: a code here may be one of his words with another meaning, so
// the board keeps them in their own tab. `c` is the notes as 0 (do) … 6 (si).
export const MAYA_FIRST_WORDS = [
 {
  "say": "want",
  "emoji": "👉",
  "c": [
   1,
   2,
   2
  ]
 },
 {
  "say": "more",
  "emoji": "🔁",
  "c": [
   5,
   2,
   5,
   1
  ]
 },
 {
  "say": "stop",
  "emoji": "✋",
  "c": [
   3,
   0
  ],
  "critical": true
 },
 {
  "say": "all done",
  "emoji": "✅",
  "c": [
   0,
   0,
   1
  ]
 },
 {
  "say": "wait",
  "emoji": "⏳",
  "c": [
   0,
   1,
   2
  ]
 },
 {
  "say": "help",
  "emoji": "🆘",
  "c": [
   0,
   6,
   0
  ],
  "critical": true
 },
 {
  "say": "hurt",
  "emoji": "🤕",
  "c": [
   2,
   1,
   6,
   3
  ],
  "critical": true
 },
 {
  "say": "eat",
  "emoji": "🍽️",
  "c": [
   0,
   5,
   2,
   6
  ],
  "critical": true
 },
 {
  "say": "drink",
  "emoji": "🥤",
  "c": [
   3,
   4,
   5
  ],
  "critical": true
 },
 {
  "say": "toilet",
  "emoji": "🚽",
  "c": [
   1,
   0,
   5,
   0
  ],
  "critical": true
 },
 {
  "say": "tired",
  "emoji": "😴",
  "c": [
   4,
   3,
   1
  ]
 },
 {
  "say": "love",
  "emoji": "❤️",
  "c": [
   2,
   1,
   0
  ]
 },
 {
  "say": "play",
  "emoji": "🧸",
  "c": [
   4,
   5,
   4,
   5
  ]
 },
 {
  "say": "happy",
  "emoji": "😊",
  "c": [
   4,
   6,
   4
  ]
 },
 {
  "say": "sad",
  "emoji": "😢",
  "c": [
   3,
   1,
   0
  ]
 },
 {
  "say": "music",
  "emoji": "🎵",
  "c": [
   4,
   3,
   2,
   1
  ]
 },
 {
  "say": "outside",
  "emoji": "🌳",
  "c": [
   2,
   4,
   6
  ]
 },
 {
  "say": "hello",
  "emoji": "👋",
  "c": [
   0,
   2,
   3
  ]
 },
 {
  "say": "mom",
  "emoji": "👩",
  "c": [
   5,
   3,
   5
  ]
 },
 {
  "say": "dad",
  "emoji": "👨",
  "c": [
   0,
   3,
   0
  ]
 }
];
