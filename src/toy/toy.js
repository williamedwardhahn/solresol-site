import { NOTES, noteByNumber, cap } from '../dictionary/notes.js';
import { noteForKey, keyForNote } from '../ui/keymap.js';
import { voiceOn } from './synth.js';

// The toy — seven keys you mash to feel them respond. No meaning, no gate,
// no score, nothing to fail. Touch, hold, sweep. It just sings back.

const LIGHT_NOTES = new Set(['re', 'mi', 'fa']);

export function mountToy(root) {
  root.classList.add('toy-surface');
  root.innerHTML = `<div class="toy-glow"></div><div class="toy-staff" aria-hidden="true"></div><div class="toy-keys"></div>`;
  const glow = root.querySelector('.toy-glow');
  const keysEl = root.querySelector('.toy-keys');

  const keyEls = {};
  for (const n of NOTES) {
    const el = document.createElement('button');
    // pale pigments (re, mi, fa) carry ink lettering; the deep ones carry paper
    el.className = 'toy-key' + (LIGHT_NOTES.has(n.name) ? ' toy-key--light' : '');
    el.setAttribute('aria-label', cap(n.name));
    el.dataset.note = n.name;
    el.style.setProperty('--c', n.color);
    // low notes bloom bigger & glow more (weight); high notes lighter
    const weight = (6 - n.step);
    el.style.setProperty('--peak', (1.05 + weight * 0.012).toFixed(3));
    el.style.setProperty('--glow', (55 + weight * 8) + 'px');
    el.style.setProperty('--brk', (n.step * 0.55) + 's');   // breathe offset
    el.innerHTML =
      `<span class="toy-label">` +
        `<span class="toy-note">${cap(n.name)}</span>` +
        `<span class="toy-num">${n.num}</span>` +
        `<span class="toy-key-hint">${(keyForNote(n.name) || '').toUpperCase()}</span>` +
      `</span>`;
    keysEl.appendChild(el);
    keyEls[n.name] = el;
  }

  // ── voices held per pointer (multi-touch) and per keyboard key ──
  const byPointer = new Map();   // pointerId → { name, voice }
  const byKey = new Map();       // note name → voice (keyboard)

  function on(name) {
    const el = keyEls[name]; const note = NOTES.find((x) => x.name === name);
    el.classList.add('toy-key--on');
    ripple(el, note);
    bleed(note);
    if (navigator.vibrate) navigator.vibrate(8 + (6 - note.step) * 3);   // heavier low notes
    return voiceOn(note);
  }
  function off(name, voice) {
    keyEls[name]?.classList.remove('toy-key--on');
    voice?.stop();
  }

  // keep a key lit if any pointer OR the keyboard still holds it
  function stillHeld(name) {
    for (const v of byPointer.values()) if (v.name === name) return true;
    return byKey.has(name);
  }

  // ── pointer / touch (with glissando by sweeping) ──
  keysEl.addEventListener('pointerdown', (e) => {
    const name = noteUnder(e);
    if (!name) return;
    keysEl.setPointerCapture(e.pointerId);
    byPointer.set(e.pointerId, { name, voice: on(name) });
    e.preventDefault();
  });
  keysEl.addEventListener('pointermove', (e) => {
    const held = byPointer.get(e.pointerId);
    if (!held) return;
    const name = noteUnder(e);
    if (name && name !== held.name) {                 // slid onto a new key → glissando
      const prev = held.name;
      held.voice?.stop();
      if (!hasOtherPointer(e.pointerId, prev)) keyEls[prev].classList.toggle('toy-key--on', stillHeldExcept(prev, e.pointerId));
      held.name = name; held.voice = on(name);
    }
  });
  const release = (e) => {
    const held = byPointer.get(e.pointerId);
    if (!held) return;
    byPointer.delete(e.pointerId);
    held.voice?.stop();
    if (!stillHeld(held.name)) keyEls[held.name].classList.remove('toy-key--on');
  };
  keysEl.addEventListener('pointerup', release);
  keysEl.addEventListener('pointercancel', release);
  keysEl.addEventListener('pointerleave', release);

  // ── home-row keyboard: A S D F  J K L (and 1–7) ──
  function onKeyDown(e) {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (isTyping(e.target)) return;
    const name = noteForKey(e.key) || (noteByNumber(e.key) || {}).name;
    if (!name || byKey.has(name)) return;
    e.preventDefault();
    byKey.set(name, on(name));
  }
  function onKeyUp(e) {
    const name = noteForKey(e.key) || (noteByNumber(e.key) || {}).name;
    if (!name) return;
    const voice = byKey.get(name);
    byKey.delete(name);
    voice?.stop();
    if (!stillHeld(name)) keyEls[name].classList.remove('toy-key--on');
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // ── juice helpers ──
  function noteUnder(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    return el && el.closest && el.closest('.toy-key')?.dataset.note || null;
  }
  function ripple(el, note) {
    const r = document.createElement('span');
    r.className = 'toy-ripple';
    r.style.setProperty('--c', note.color);
    r.style.animationDuration = (0.6 + (6 - note.step) * 0.06) + 's';   // heavy notes ripple slower
    el.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  }
  let bleedT;
  function bleed(note) {
    glow.style.background = `radial-gradient(60% 60% at 50% 60%, ${note.color}3a, transparent 70%)`;
    glow.style.opacity = '1';
    clearTimeout(bleedT);
    bleedT = setTimeout(() => { glow.style.opacity = '0'; }, 900);
  }
  function hasOtherPointer(id, name) {
    for (const [pid, v] of byPointer) if (pid !== id && v.name === name) return true;
    return false;
  }
  function stillHeldExcept(name, id) {
    if (byKey.has(name)) return true;
    return hasOtherPointer(id, name);
  }

  return {
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      for (const v of byPointer.values()) v.voice?.stop();
      for (const v of byKey.values()) v?.stop();
      byPointer.clear(); byKey.clear();
      root.textContent = '';
    },
  };
}

function isTyping(el) {
  return !!el && (/^(input|textarea|select)$/i.test(el.tagName) || el.isContentEditable);
}
