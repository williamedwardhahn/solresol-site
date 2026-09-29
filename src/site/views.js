import { mountPlayView } from '../views/play/play.view.js';
import { mountDictionaryView } from '../views/dictionary/dictionary.view.js';
import { mountTranslateView } from '../views/translate/translate.view.js';
import { mountLearnView } from '../views/learn/learn.view.js';

// The chapters of the site, in the order of the book.
//
// The contract: mount(host, ctx, route) builds the chapter into `host`
// and returns { update(route), destroy() }. `update` is called when the
// route changes but stays in this chapter (a sub-tab, a query); `destroy`
// must remove every listener and watcher the chapter added. A chapter
// talks to the rest of the site only through ctx (see src/main.js).
export const VIEWS = [
  { id: 'play',       numeral: 'I',   label: 'Play',       title: 'The Instrument', mount: mountPlayView },
  { id: 'dictionary', numeral: 'II',  label: 'Dictionary', title: 'The Dictionary', mount: mountDictionaryView },
  { id: 'translate',  numeral: 'III', label: 'Translate',  title: 'Translation',    mount: mountTranslateView },
  { id: 'learn',      numeral: 'IV',  label: 'Learn',      title: 'The School',     mount: mountLearnView },
];

// Pages that live beside the app. Dropped from the single-file build,
// which travels alone and cannot reach them.
export const ELSEWHERE = [
  { href: './maya.html', label: 'Maya', note: 'talk with colour' },
  { href: './toy.html', label: 'Toy', note: 'seven keys' },
  { href: './solresol_capstone.html', label: 'Research', note: 'the field report' },
];
