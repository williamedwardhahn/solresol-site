import { NOTES, noteByNumber, cap } from '../dictionary/notes.js';
import { noteForKey, keyForNote, isCommitKey } from './keymap.js';
import { playNote } from '../voices/index.js';

// The seven-note keyboard — an instrument and a typewriter.
//
// Click a key, or play the home row: left hand A S D F, right hand J K L
// sound do re mi fa sol la si; Space (or ; / Enter) finishes a word. It
// holds no rules and knows no meanings — it just strikes notes.

export function mountKeyboard(host, word, { onCommit } = {}) {
  host.classList.add('keyboard');
  host.textContent = '';

  const keyEls = {};
  for (const n of NOTES) {
    const key = document.createElement('button');
    key.className = 'key';
    key.style.setProperty('--key-color', n.color);
    key.innerHTML =
      `<span class="key-letter">${(keyForNote(n.name) || '').toUpperCase()}</span>` +
      `<span class="key-solfege">${cap(n.name)}</span>` +
      `<span class="key-num">${n.num}</span>`;
    key.addEventListener('click', () => strike(n.name));
    host.appendChild(key);
    keyEls[n.name] = key;
  }

  function strike(name) {
    word.add(name);
    playNote(name);
    flash(name);
  }

  function flash(name) {
    const el = keyEls[name];
    if (!el) return;
    el.classList.add('key--hit');
    setTimeout(() => el.classList.remove('key--hit'), 140);
  }

  function onKey(e) {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (isTyping(e.target)) return;                 // don't fight text fields

    const letter = noteForKey(e.key);               // home row A S D F J K L
    if (letter) { e.preventDefault(); strike(letter); return; }

    const byNum = noteByNumber(e.key);              // 1–7 still work
    if (byNum) { strike(byNum.name); return; }

    if (e.key === 'Backspace') { e.preventDefault(); word.removeLast(); }
    else if (e.key === 'Escape') { word.clear(); }
    else if (isCommitKey(e.key)) { e.preventDefault(); onCommit?.(); }
  }
  window.addEventListener('keydown', onKey);

  return {
    destroy() {
      window.removeEventListener('keydown', onKey);
      host.textContent = '';
    },
  };
}

// True when focus is in a text field, so playing notes doesn't hijack typing.
function isTyping(el) {
  return !!el && (/^(input|textarea|select)$/i.test(el.tagName) || el.isContentEditable);
}
